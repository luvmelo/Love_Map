// Supabase Database Types for Love Map

export type MemoryType = 'love' | 'food' | 'travel' | 'adventure'
export type UserId = 'melo' | 'may'

export interface MemoryRow {
    id: string
    name: string
    type: MemoryType
    date: string
    memo: string
    lat: number
    lng: number
    added_by: UserId
    cover_photo_url?: string | null
    created_at: string
    updated_at: string
}

export interface MemoryInsert {
    name: string
    type: MemoryType
    date?: string
    memo: string
    lat: number
    lng: number
    added_by: UserId
    cover_photo_url?: string | null
}

export interface MemoryUpdate {
    name?: string
    type?: MemoryType
    date?: string
    memo?: string
    cover_photo_url?: string | null
}

// Database schema type for Supabase client
export interface Database {
    public: {
        Tables: {
            memories: {
                Row: MemoryRow
                Insert: MemoryInsert
                Update: MemoryUpdate
            }
        }
    }
}

// SQL for creating the memories table in Supabase:
/*
CREATE TABLE memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('love', 'food', 'travel', 'adventure')),
    date DATE DEFAULT CURRENT_DATE,
    memo TEXT DEFAULT '',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    added_by TEXT NOT NULL CHECK (added_by IN ('melo', 'may')),
    cover_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (customize based on auth needs)
CREATE POLICY "Allow all operations" ON memories FOR ALL USING (true);

-- Index for geo queries
CREATE INDEX memories_location_idx ON memories (lat, lng);

-- Index for user filtering
CREATE INDEX memories_added_by_idx ON memories (added_by);
*/
