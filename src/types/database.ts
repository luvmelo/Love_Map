// Supabase Database Types for Love Map

export type MemoryType = 'love' | 'food' | 'travel' | 'adventure'
export type UserId = 'melo' | 'may'

export interface MemoryRow {
    id: string
    name: string
    type: MemoryType
    date: string
    time?: string | null
    memo: string
    lat: number
    lng: number
    added_by: UserId
    country?: string | null
    city?: string | null
    cover_photo_url?: string | null
    photos?: string[] | null  // Array of photo URLs for multi-image support
    created_at: string
    updated_at: string
}

export interface MemoryInsert {
    name: string
    type: MemoryType
    date?: string
    time?: string | null
    memo: string
    lat: number
    lng: number
    added_by: UserId
    country?: string | null
    city?: string | null
    cover_photo_url?: string | null
    photos?: string[] | null
}

export interface MemoryUpdate {
    name?: string
    type?: MemoryType
    date?: string
    time?: string | null
    memo?: string
    country?: string | null
    city?: string | null
    cover_photo_url?: string | null
    photos?: string[] | null
}

// Reaction types for memory reactions
export interface ReactionRow {
    id: string
    memory_id: string
    user_id: UserId
    emoji: string
    created_at: string
}

export interface ReactionInsert {
    memory_id: string
    user_id: UserId
    emoji: string
}

// Database schema type for Supabase client
export interface Database {
    public: {
        Tables: {
            memories: {
                Row: MemoryRow
                Insert: MemoryInsert
                Update: MemoryUpdate
                Relationships: []
            }
            reactions: {
                Row: ReactionRow
                Insert: ReactionInsert
                Update: Partial<ReactionInsert>
                Relationships: []
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: Record<string, never>
        CompositeTypes: Record<string, never>
    }
}

// SQL for creating the memories table in Supabase:
/*
CREATE TABLE memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('love', 'food', 'travel', 'adventure')),
    date DATE DEFAULT CURRENT_DATE,
    time TEXT,
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
