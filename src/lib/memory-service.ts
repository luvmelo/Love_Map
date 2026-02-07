// Memory Service - CRUD operations for Supabase
import { supabase, isSupabaseConfigured } from './supabase';
import type { MemoryRow, MemoryInsert, MemoryUpdate, UserId, ReactionRow, ReactionInsert } from '@/types/database';
import type { Memory } from '@/components/map/memory-markers';

// Reverse geocode coordinates to get country and city
export async function reverseGeocode(lat: number, lng: number): Promise<{ country?: string; city?: string }> {
    try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.warn('Google Maps API key not configured');
            return {};
        }

        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&result_type=locality|country&language=en`
        );

        if (!response.ok) {
            console.error('Geocode request failed:', response.status);
            return {};
        }

        const data = await response.json();

        if (data.status !== 'OK' || !data.results?.length) {
            return {};
        }

        if (data.status !== 'OK' || !data.results?.length) {
            return {};
        }

        let country: string | undefined;
        let city: string | undefined;

        // Iterate through results to find the most specific components
        // Results are usually ordered by specific to general, but we should look at types carefully

        // Find country first
        for (const result of data.results) {
            const countryComp = result.address_components.find((c: any) => c.types.includes('country'));
            if (countryComp) {
                country = countryComp.long_name;
                break;
            }
        }

        // Find city - prioritize locality > sublocality > administrative_area_level_2 (county)
        // We avoid administrative_area_level_1 (State/Province) as it's too broad for "City"
        for (const result of data.results) {
            const locality = result.address_components.find((c: any) => c.types.includes('locality'));
            const sublocality = result.address_components.find((c: any) => c.types.includes('sublocality') || c.types.includes('sublocality_level_1'));
            const town = result.address_components.find((c: any) => c.types.includes('postal_town'));

            if (locality) {
                city = locality.long_name;
                break;
            }
            if (sublocality && !city) {
                city = sublocality.long_name;
                // Don't break yet, keep looking for locality in other results just in case, 
                // but usually first result is best. Actually, let's break if we find a good candidate.
                break;
            }
            if (town && !city) {
                city = town.long_name;
                break;
            }
        }

        if (country && city) {
            console.log('📍 Geocoded:', city, country);
        } else {
            console.warn('⚠️ Geocoding incomplete:', { city, country, results: data.results?.[0]?.formatted_address });
        }

        return { country, city };
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return {};
    }
}

// Convert DB row to frontend Memory type
function rowToMemory(row: MemoryRow): Memory {
    return {
        id: row.id,
        name: row.name,
        type: row.type,
        date: row.date,
        time: row.time || undefined,
        memo: row.memo,
        lat: row.lat,
        lng: row.lng,
        addedBy: row.added_by,
        country: row.country || undefined,
        city: row.city || undefined,
        coverPhotoUrl: row.cover_photo_url || undefined,
        photos: row.photos || undefined,
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
        console.error('Error creating memory:', error.message, error.code, error.details);
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
        console.error('Error deleting memory:', error.message, error.code, error.details);
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

    // Sanitize filename to avoid issues with special characters
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${memoryId}_${sanitizedName}`;
    const filePath = `covers/${fileName}`;

    console.log(`Uploading cover photo: ${filePath}, Type: ${file.type}, Size: ${file.size}`);

    const { error: uploadError } = await supabase.storage
        .from('memory-photos')
        .upload(filePath, file, {
            upsert: false, // Changed to false to rely solely on INSERT policy
            contentType: file.type
        });

    if (uploadError) {
        console.error('Error uploading cover photo:', uploadError);
        return null;
    }

    // Get public URL
    const { data } = supabase.storage.from('memory-photos').getPublicUrl(filePath);
    return data.publicUrl;
}

// Upload multiple photos to Supabase Storage
export async function uploadPhotos(files: File[], memoryId: string): Promise<string[]> {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase not configured, cannot upload photos');
        return [];
    }

    const uploadPromises = files.map(async (file, index) => {
        // Sanitize filename
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${memoryId}_${index}_${timestamp}_${sanitizedName}`;
        const filePath = `photos/${fileName}`;

        console.log(`Uploading photo ${index}: ${filePath}, Type: ${file.type}, Size: ${file.size}`);

        const { error: uploadError } = await supabase!.storage
            .from('memory-photos')
            .upload(filePath, file, {
                upsert: false,
                contentType: file.type // Explicitly set content type
            });

        if (uploadError) {
            console.error(`Error uploading photo ${index}:`, uploadError);
            return null;
        }

        const { data } = supabase!.storage.from('memory-photos').getPublicUrl(filePath);
        return data.publicUrl;
    });

    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
}

// Create memory with optional photos upload (supports single or multiple)
export async function createMemoryWithPhoto(
    memory: MemoryInsert,
    coverPhoto?: File | null,
    additionalPhotos?: File[] | null
): Promise<Memory | null> {
    // Reverse geocode to get country and city
    if (!memory.country || !memory.city) {
        const geoData = await reverseGeocode(memory.lat, memory.lng);
        if (geoData.country) memory.country = geoData.country;
        if (geoData.city) memory.city = geoData.city;
    }

    // First create the memory
    const created = await createMemory(memory);
    if (!created) return null;

    const updates: MemoryUpdate = {};

    // Upload cover photo
    if (coverPhoto) {
        const photoUrl = await uploadCoverPhoto(coverPhoto, created.id);
        if (photoUrl) {
            updates.cover_photo_url = photoUrl;
        }
    }

    // Upload additional photos
    if (additionalPhotos && additionalPhotos.length > 0) {
        const photoUrls = await uploadPhotos(additionalPhotos, created.id);
        if (photoUrls.length > 0) {
            updates.photos = photoUrls;
        }
    }

    // Update memory with photo URLs if any were uploaded
    if (Object.keys(updates).length > 0) {
        return await updateMemory(created.id, updates);
    }

    return created;
}

// ============================================
// REACTIONS
// ============================================

// Get all reactions for a memory
export async function getReactions(memoryId: string): Promise<{ emoji: string; userId: UserId }[]> {
    if (!isSupabaseConfigured() || !supabase) {
        return [];
    }

    const { data, error } = await supabase
        .from('reactions')
        .select('emoji, user_id')
        .eq('memory_id', memoryId);

    if (error) {
        console.error('Error fetching reactions:', error);
        return [];
    }

    return (data || []).map(r => ({ emoji: r.emoji, userId: r.user_id as UserId }));
}

// Add or update a reaction (upsert - one reaction per user per memory)
export async function addReaction(memoryId: string, emoji: string, userId: UserId): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase not configured, cannot add reaction');
        return false;
    }

    const { error } = await supabase
        .from('reactions')
        .upsert(
            { memory_id: memoryId, emoji, user_id: userId },
            { onConflict: 'memory_id,user_id,emoji', ignoreDuplicates: true }
        );

    if (error) {
        console.error('Error adding reaction:', error.message, error.code);
        return false;
    }

    console.log('✅ Reaction added:', emoji, 'by', userId);
    return true;
}

// Remove a reaction
export async function removeReaction(memoryId: string, userId: UserId): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) {
        return false;
    }

    const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('memory_id', memoryId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error removing reaction:', error);
        return false;
    }

    return true;
}
