CREATE OR REPLACE FUNCTION normalize_student_name(
    input_name TEXT,
    max_parts INTEGER DEFAULT 2
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
    SELECT string_agg(initcap(part), ' ')
    FROM (
        SELECT part
        FROM regexp_split_to_table(
            regexp_replace(btrim(input_name), '\s+', ' ', 'g'),
            ' '
        ) WITH ORDINALITY AS t(part, ord)
        WHERE ord <= max_parts
    ) s;
$$;

CREATE OR REPLACE FUNCTION validate_and_format_student_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    normalized TEXT;
BEGIN
    IF NEW.name IS NULL OR btrim(NEW.name) = '' THEN
        RAISE EXCEPTION
            'Name cannot be null or empty'
            USING ERRCODE = '22004';
    END IF;

    -- Reject control characters safely
    IF NEW.name ~ E'[\\x00-\\x1F\\x7F]' THEN
        RAISE EXCEPTION
            'Name contains invalid control characters'
            USING ERRCODE = '22021';
    END IF;

    normalized := normalize_student_name(NEW.name);

    IF NEW.name IS DISTINCT FROM normalized THEN
        NEW.name := normalized;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_student_name ON students;

CREATE TRIGGER trg_validate_student_name
BEFORE INSERT OR UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION validate_and_format_student_name();

