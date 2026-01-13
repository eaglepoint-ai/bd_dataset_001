CREATE OR REPLACE FUNCTION validate_and_format_student_name()
RETURNS TRIGGER AS $$
DECLARE
    input_name TEXT := NEW.name;
    trimmed_name TEXT;
    words TEXT[];
    formatted_name TEXT;
BEGIN
    RAISE DEBUG 'Input name before processing: %', input_name;

    IF input_name IS NULL OR TRIM(input_name) = '' THEN
        RAISE EXCEPTION 'Name cannot be null or empty';
    END IF;

    trimmed_name := TRIM(input_name);

    IF trimmed_name !~ '^[A-Za-z\s]+$' THEN
        RAISE EXCEPTION 'Name can only contain alphabetic characters and spaces';
    END IF;

    words := string_to_array(trimmed_name, ' ');
    words := array_filter(words, x -> x != '');

    IF array_length(words, 1) > 2 THEN
        words := words[1:2];
    END IF;

    formatted_name :=
        string_agg(INITCAP(word), ' ')
        FROM unnest(words) AS word;

    RAISE DEBUG 'Formatted name: %', formatted_name;

    NEW.name := formatted_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_student_name
BEFORE INSERT OR UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION validate_and_format_student_name();
