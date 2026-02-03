// Memory Service - CRUD operations for Supabase
import { supabase, isSupabaseConfigured } from './supabase';
import type { MemoryRow, MemoryInsert, MemoryUpdate, UserId } from '@/types/database';
import type { Memory } from '@/components/map/memory-markers';

// Convert DB row to frontend Memory type
function rowToMemory(row: MemoryRow): Memory {
    return {
        id: row.id,
        name: row.name,
        type: row.type,
        date: row.date,
        memo: row.memo,
        lat: row.lat,
        lng: row.lng,
        addedBy: row.added_by,
        coverPhotoUrl: row.cover_photo_url || undefined,
    };
}

// Fetch all memories, optionally filtered by user
export async function getMemories(userFilter?: UserId | null): Promise<Memory[]> {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase not configured, returning empty array');
        return [];
    }

    let query = supabase.from('memories').select('*').order('created_at', { ascending: false });

    if (userFilter) {
        query = query.eq('added_by', userFilter);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching memories:', error);
        return [];
    }

    return (data || []).map(rowToMemory);
}

// Create a new memory
export async function createMemory(memory: MemoryInsert): Promise<Memory | null> {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase not configured, cannot create memory');
        return null;
    }

    const { data, error } = await supabase!
        .from('memories')
        .insert(memory)
        .select()
        .single();

    if (error) {
        console.error('Error creating memory:', error);
        return null;
    }

    return rowToMemory(data);
}

// Update an existing memory
export async function updateMemory(id: string, updates: MemoryUpdate): Promise<Memory | null> {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase not configured, cannot update memory');
        return null;
    }

    const { data, error } = await supabase!
        .from('memories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating memory:', error);
        return null;
    }

    return rowToMemory(data);
}

// Delete a memory
export async function deleteMemory(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase not configured, cannot delete memory');
        return false;
    }

    const { error } = await supabase.from('memories').delete().eq('id', id);

    if (error) {
        console.error('Error deleting memory:', error);
        return false;
    }

    return true;
}

// Upload cover photo to Supabase Storage
export async function uploadCoverPhoto(file: File, memoryId: string): Promise<string | null> {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase not configured, cannot upload photo');
        return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${memoryId}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('memory-photos')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading cover photo:', uploadError);
        return null;
    }

    // Get public URL
    const { data } = supabase.storage.from('memory-photos').getPublicUrl(filePath);
    return data.publicUrl;
}

// Create memory with optional cover photo upload
export async function createMemoryWithPhoto(
    memory: MemoryInsert,
    coverPhoto?: File | null
): Promise<Memory | null> {
    // First create the memory
    const created = await createMemory(memory);
    if (!created) return null;

    // If there's a cover photo, upload it and update the memory
    if (coverPhoto) {
        const photoUrl = await uploadCoverPhoto(coverPhoto, created.id);
        if (photoUrl) {
            return await updateMemory(created.id, { cover_photo_url: photoUrl });
        }
    }

    return created;
}
