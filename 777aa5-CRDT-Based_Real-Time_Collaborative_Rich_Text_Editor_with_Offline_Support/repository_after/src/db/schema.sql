-- CRDT Collaborative Editor Database Schema
-- Designed for efficient CRDT state storage and operation replay

-- Documents table: stores document metadata
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Store full CRDT state as JSONB for efficient diffs
    -- Structure: { chars: CRDTChar[], head: string | null, vectorClock: Record<string, number> }
    crdt_state JSONB NOT NULL DEFAULT '{"chars": [], "head": null, "vectorClock": {}}'::jsonb,
    -- Track minimum observed version for tombstone GC
    min_observed_version JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Operations table: stores CRDT operation history for replay
CREATE TABLE IF NOT EXISTS operations (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    -- Unique constraint ensures idempotence (no duplicate operations)
    site_id VARCHAR(36) NOT NULL,
    counter BIGINT NOT NULL,
    operation_type VARCHAR(10) NOT NULL CHECK (operation_type IN ('insert', 'delete')),
    -- Store full operation as JSONB
    operation_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Unique constraint for idempotence
    UNIQUE(document_id, site_id, counter)
);

-- Index for efficient operation retrieval by document
CREATE INDEX IF NOT EXISTS idx_operations_document_id ON operations(document_id);
-- Index for efficient operation ordering
CREATE INDEX IF NOT EXISTS idx_operations_document_counter ON operations(document_id, counter);
-- Index for vector clock queries
CREATE INDEX IF NOT EXISTS idx_operations_site_counter ON operations(document_id, site_id, counter);

-- Snapshots table: periodic full document state for optimization
CREATE TABLE IF NOT EXISTS snapshots (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    -- Snapshot after every N operations (e.g., 100)
    operation_count BIGINT NOT NULL,
    -- Full CRDT state at this point
    crdt_state JSONB NOT NULL,
    -- Vector clock at snapshot time
    vector_clock JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for finding latest snapshot
CREATE INDEX IF NOT EXISTS idx_snapshots_document_id ON snapshots(document_id, operation_count DESC);

-- Client sessions table: track connected clients for tombstone GC
CREATE TABLE IF NOT EXISTS client_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    site_id VARCHAR(36) NOT NULL,
    -- Client's current vector clock (updated on each operation)
    vector_clock JSONB NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    connected BOOLEAN DEFAULT TRUE
);

-- Index for finding active sessions per document
CREATE INDEX IF NOT EXISTS idx_client_sessions_document ON client_sessions(document_id, connected);

-- Function to update document updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE documents SET updated_at = NOW() WHERE id = NEW.document_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update document timestamp on new operation
CREATE TRIGGER trigger_update_document_timestamp
AFTER INSERT ON operations
FOR EACH ROW
EXECUTE FUNCTION update_document_timestamp();
