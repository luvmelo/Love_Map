'use client';

import { Map, useMap, InfoWindow, MapMouseEvent } from '@vis.gl/react-google-maps';
import { useState, useCallback, useEffect, useRef } from 'react';
import { SearchBox } from './search-box';
import { AddMemoryModal } from './add-memory-modal';
import { MemoryDetailModal } from './memory-detail-modal';
import { MemoryMarkers, Memory, User } from './memory-markers';
import { MemorySidebar } from '../ui/memory-sidebar';
import { GalleryView } from '../ui/gallery-view';
import { AnniversaryBanner } from '../ui/anniversary-banner';
import { useUser, USERS } from '../../contexts/user-context';
import { Menu, Home, Plus, Users, Images, BarChart3 } from 'lucide-react';
import {
    getMemories,
    createMemoryWithPhoto,
    updateMemory,
    deleteMemory,
    uploadCoverPhoto,
    addReaction
} from '@/lib/memory-service';

const DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 }; // Tokyo

// Sample memories with coordinates for demo - with user assignments
// Sample memories empty by default
const SAMPLE_MEMORIES: Memory[] = [];

// Map boundary restriction to prevent gray areas
const MAP_RESTRICTION = {
    latLngBounds: {
        north: 85,
        south: -85,
        west: -180,
        east: 180,
    },
    strictBounds: true,
};

// MapControls - rendered inside Map to access useMap() context
interface MapControlsProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    isAddMode: boolean;
    setIsAddMode: (mode: boolean) => void;
    isUserMenuOpen: boolean;
    setIsUserMenuOpen: (open: boolean) => void;
    isGalleryOpen: boolean;
    setIsGalleryOpen: (open: boolean) => void;
    userInfo: typeof USERS[keyof typeof USERS];
    currentUser: User;
    switchUser: (user: User) => void;
}

function MapControls({
    isSidebarOpen, setIsSidebarOpen,
    isAddMode, setIsAddMode,
    isUserMenuOpen, setIsUserMenuOpen,
    isGalleryOpen, setIsGalleryOpen,
    userInfo, currentUser, switchUser
}: MapControlsProps) {
    const map = useMap();

    // Smooth animated zoom function
    const smoothZoomTo = useCallback((targetZoom: number, targetCenter: google.maps.LatLngLiteral) => {
        if (!map) return;

        const currentZoom = map.getZoom() || 3;
        const zoomDiff = targetZoom - currentZoom;
        const steps = Math.max(1, Math.abs(Math.round(zoomDiff)));
        const duration = 800; // ms total
        const stepDelay = duration / steps;

        // Pan to center first with smooth animation
        map.panTo(targetCenter);

        // Gradually adjust zoom
        let currentStep = 0;
        const zoomStep = zoomDiff / steps;

        const animateZoom = () => {
            currentStep++;
            const newZoom = currentZoom + (zoomStep * currentStep);
            map.setZoom(newZoom);

            if (currentStep < steps) {
                setTimeout(animateZoom, stepDelay);
            }
        };

        // Start zoom animation after pan begins
        setTimeout(animateZoom, 100);
    }, [map]);

    const handleHomeClick = useCallback(() => {
        if (!map) return;

        // Try to get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    smoothZoomTo(12, { lat: latitude, lng: longitude });
                },
                () => {
                    // Fallback to default center if geolocation fails
                    smoothZoomTo(3, DEFAULT_CENTER);
                }
            );
        } else {
            // Fallback if geolocation not available
            smoothZoomTo(3, DEFAULT_CENTER);
        }
    }, [map, smoothZoomTo]);

    return (
        <div className="absolute bottom-10 sm:bottom-6 left-0 right-0 flex justify-center z-10 pb-[env(safe-area-inset-bottom)]">
            <div className="glass h-16 px-5 rounded-2xl flex items-center gap-4 shadow-2xl">
                {/* Sidebar Toggle */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSidebarOpen
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                >
                    <Menu size={20} />
                </button>

                {/* Home Button */}
                <button
                    onClick={handleHomeClick}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    title="Go to your location"
                >
                    <Home size={20} />
                </button>

                {/* Add Memory Button (Primary) - Centered */}
                <button
                    onClick={() => setIsAddMode(!isAddMode)}
                    className={`w-14 h-14 -mt-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isAddMode
                        ? 'bg-red-500 text-white rotate-45 shadow-red-500/40'
                        : 'bg-black text-white dark:bg-white dark:text-black shadow-black/30'
                        }`}
                >
                    <Plus size={28} />
                </button>

                {/* Gallery Button */}
                <button
                    onClick={() => setIsGalleryOpen(true)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isGalleryOpen
                        ? 'bg-purple-500/10 text-purple-500'
                        : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                    title="Photo Gallery"
                >
                    <Images size={20} />
                </button>

                {/* User Switcher Button */}
                <div className="relative">
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden transition-all hover:bg-black/5 dark:hover:bg-white/10"
                    >
                        <span className="text-lg">{userInfo.avatar}</span>
                    </button>

                    {/* User Menu Dropdown */}
                    {isUserMenuOpen && (
                        <div className="absolute bottom-14 right-0 glass-card p-2 min-w-[140px] animate-slide-up">
                            <div className="text-xs text-gray-500 px-2 mb-1">Switch user</div>
                            {(['melo', 'may'] as User[]).map((user) => (
                                <button
                                    key={user}
                                    onClick={() => {
                                        switchUser(user);
                                        setIsUserMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${currentUser === user
                                        ? 'bg-black/5 dark:bg-white/10'
                                        : 'hover:bg-black/5 dark:hover:bg-white/10'
                                        }`}
                                >
                                    <span>{USERS[user].avatar}</span>
                                    <span className="text-sm font-medium">{USERS[user].name}</span>
                                    {currentUser === user && (
                                        <span className="ml-auto text-green-500 text-xs">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Component to handle fly-to animations from gallery
// Component to handle fly-to animations from gallery
interface MapFlyToHandlerProps {
    flyToTarget: { lat?: number; lng?: number; bounds?: google.maps.LatLngBoundsLiteral; memory?: Memory; zoom?: number } | null;
    onAnimationComplete: (memory?: Memory) => void;
    onClear: () => void;
}

function MapFlyToHandler({ flyToTarget, onAnimationComplete, onClear }: MapFlyToHandlerProps) {
    const map = useMap();

    useEffect(() => {
        if (!flyToTarget || !map) return;

        // If bounds provided, use fitBounds (simpler animation handled by Google Maps)
        if (flyToTarget.bounds) {
            map.fitBounds(flyToTarget.bounds, {
                top: 50,
                bottom: 50,
                left: 50,
                right: 350 // Account for sidebar
            });

            // Wait for partial animation then complete
            setTimeout(() => {
                onAnimationComplete(flyToTarget.memory);
                onClear();
            }, 1000);
            return;
        }

        // Existing smooth animation for point targets
        if (flyToTarget.lat === undefined || flyToTarget.lng === undefined) return;

        const targetZoom = flyToTarget.zoom || 16;
        const currentZoom = map.getZoom() || 3;
        const zoomDiff = targetZoom - currentZoom;
        const steps = Math.max(1, Math.abs(Math.round(zoomDiff)));
        const duration = 1200; // longer for dramatic effect
        const stepDelay = duration / steps;

        // Pan to center first
        map.panTo({ lat: flyToTarget.lat, lng: flyToTarget.lng });

        // Gradually zoom in
        let currentStep = 0;
        const zoomStep = zoomDiff / steps;

        const animateZoom = () => {
            currentStep++;
            const newZoom = currentZoom + (zoomStep * currentStep);
            map.setZoom(newZoom);

            if (currentStep < steps) {
                setTimeout(animateZoom, stepDelay);
            } else {
                // Animation complete, open the detail modal if memory exists
                setTimeout(() => {
                    onAnimationComplete(flyToTarget.memory);
                    onClear();
                }, 300);
            }
        };

        // Start zoom animation after pan begins
        setTimeout(animateZoom, 200);

    }, [flyToTarget, map, onAnimationComplete, onClear]);

    return null;
}

export default function LoveMap() {
    const { currentUser, userInfo, switchUser, otherUser } = useUser();
    const [isAddMode, setIsAddMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number; name?: string; placeId?: string } | null>(null);
    const [lastSearchedPlace, setLastSearchedPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const [memories, setMemories] = useState<Memory[]>([]);
    const [userFilter, setUserFilter] = useState<User | null>(null);
    const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [flyToTarget, setFlyToTarget] = useState<{ lat?: number; lng?: number; bounds?: google.maps.LatLngBoundsLiteral; memory?: Memory; zoom?: number } | null>(null);
    const [pendingMemoryDetail, setPendingMemoryDetail] = useState<Memory | null>(null);
    const [isAnniversaryDismissed, setIsAnniversaryDismissed] = useState(false);

    // Load memories from Supabase on mount
    useEffect(() => {
        async function loadMemories() {
            setIsLoading(true);
            const data = await getMemories();
            // Use fetched data, or fall back to sample if Supabase not configured
            if (data.length > 0) {
                setMemories(data);
            } else {
                // Fall back to sample memories for demo
                setMemories(SAMPLE_MEMORIES);
            }
            setIsLoading(false);
        }
        loadMemories();
    }, []);

    const handleMapClick = (event: MapMouseEvent) => {
        // Close user menu if open
        if (isUserMenuOpen) {
            setIsUserMenuOpen(false);
            return;
        }

        if (isAddMode && event.detail.latLng) {
            const lat = event.detail.latLng.lat;
            const lng = event.detail.latLng.lng;

            // Check if user clicked on a POI - extract placeId
            const clickedPlaceId = event.detail.placeId;

            // Only use searched place name if clicking near the searched location (within ~100m)
            let name: string | undefined = undefined;
            if (lastSearchedPlace?.geometry?.location) {
                const searchLat = lastSearchedPlace.geometry.location.lat();
                const searchLng = lastSearchedPlace.geometry.location.lng();
                const distance = Math.sqrt(
                    Math.pow(lat - searchLat, 2) + Math.pow(lng - searchLng, 2)
                );
                // ~0.001 degrees is roughly 100m
                if (distance < 0.001) {
                    name = lastSearchedPlace.name;
                }
            }

            setTempMarker({ lat, lng, name, placeId: clickedPlaceId ?? undefined });
            // Clear the searched place after clicking elsewhere
            if (!name) {
                setLastSearchedPlace(null);
            }
        }
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            <Map
                defaultCenter={DEFAULT_CENTER}
                defaultZoom={3}
                minZoom={3}  // Increased to prevent gray areas
                maxZoom={20}
                defaultTilt={0}
                defaultHeading={0}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
                renderingType="VECTOR"
                className="w-full h-full"
                onClick={handleMapClick}
                restriction={MAP_RESTRICTION}
            >
                {/* Memory markers with clustering */}
                <MemoryMarkers
                    memories={memories}
                    filterByUser={userFilter}
                    onMemoryClick={(memory) => setSelectedMemory(memory)}
                />
                {/* Map Controls rendered inside Map for useMap() access */}
                <MapControls
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    isAddMode={isAddMode}
                    setIsAddMode={setIsAddMode}
                    isUserMenuOpen={isUserMenuOpen}
                    setIsUserMenuOpen={setIsUserMenuOpen}
                    isGalleryOpen={isGalleryOpen}
                    setIsGalleryOpen={setIsGalleryOpen}
                    userInfo={userInfo}
                    currentUser={currentUser}
                    switchUser={switchUser}
                />
                {/* Fly-to handler for gallery navigation */}
                <MapFlyToHandler
                    flyToTarget={flyToTarget}
                    onAnimationComplete={(memory) => setSelectedMemory(memory || null)}
                    onClear={() => setFlyToTarget(null)}
                />
            </Map>

            {/* Glass Overlay: Top Search Bar */}
            <SearchBox onPlaceSelect={(place) => setLastSearchedPlace(place)} />

            {/* Memory Sidebar */}
            <MemorySidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                memories={memories}
                userFilter={userFilter}
                onUserFilterChange={setUserFilter}
                onMemoryClick={(memory) => {
                    // Trigger fly-to animation which will open the modal on completion
                    setFlyToTarget({ lat: memory.lat, lng: memory.lng, memory });
                    // Optionally close sidebar on mobile, but keep open for now as per desktop-first design
                }}
                onLocationClick={(bounds) => {
                    // Trigger fitBounds
                    setFlyToTarget({ bounds });
                }}
            />

            {/* Anniversary Banner */}
            {!isAnniversaryDismissed && (
                <AnniversaryBanner
                    memories={memories}
                    onClose={() => setIsAnniversaryDismissed(true)}
                    onMemoryClick={(memory) => {
                        setIsAnniversaryDismissed(true);
                        setSelectedMemory(memory);
                    }}
                />
            )}

            {/* Creation Modal */}
            {tempMarker && (
                <AddMemoryModal
                    lat={tempMarker.lat}
                    lng={tempMarker.lng}
                    placeName={tempMarker.name}
                    placeId={tempMarker.placeId}
                    onClose={() => setTempMarker(null)}
                    onSave={async (data) => {
                        // Create memory in Supabase
                        const newMemory = await createMemoryWithPhoto(
                            {
                                name: data.locationName || tempMarker.name || 'Unknown Location',
                                type: data.type,
                                date: data.date,
                                time: data.time,
                                memo: data.memo,
                                lat: tempMarker.lat,
                                lng: tempMarker.lng,
                                added_by: currentUser,
                            },
                            data.coverPhoto || null,
                            data.additionalPhotos || null
                        );

                        if (newMemory) {
                            setMemories(prev => [newMemory, ...prev]);
                            console.log('✅ Memory saved to Supabase:', newMemory);
                        } else {
                            // Fallback for demo mode - add locally
                            const localMemory: Memory = {
                                id: `local-${Date.now()}`,
                                name: data.locationName || tempMarker.name || 'Unknown Location',
                                type: data.type,
                                date: data.date,
                                memo: data.memo,
                                lat: tempMarker.lat,
                                lng: tempMarker.lng,
                                addedBy: currentUser,
                            };
                            setMemories(prev => [localMemory, ...prev]);
                            console.log('⚠️ Supabase not configured, added locally:', localMemory);
                        }

                        setTempMarker(null);
                        setIsAddMode(false);
                        setLastSearchedPlace(null);
                    }}
                />
            )}

            {/* Memory Detail Modal */}
            {selectedMemory && (
                <MemoryDetailModal
                    memory={selectedMemory}
                    onClose={() => setSelectedMemory(null)}
                    onSave={async (updates) => {
                        // Upload photo file if provided
                        let coverPhotoUrl = undefined;
                        if (updates.coverPhotoFile) {
                            coverPhotoUrl = await uploadCoverPhoto(updates.coverPhotoFile, selectedMemory.id);
                            if (coverPhotoUrl) {
                                console.log('✅ Cover photo uploaded:', coverPhotoUrl);
                            }
                        }

                        // Update in Supabase
                        const updated = await updateMemory(selectedMemory.id, {
                            memo: updates.memo,
                            type: updates.type,
                            date: updates.date,
                            time: updates.time,
                            ...(coverPhotoUrl && { cover_photo_url: coverPhotoUrl }),
                        });

                        if (updated) {
                            setMemories(prev => prev.map(m =>
                                m.id === selectedMemory.id ? updated : m
                            ));
                            setSelectedMemory(updated);
                            console.log('✅ Memory updated in Supabase:', updated);
                        } else {
                            // Fallback: update locally
                            setMemories(prev => prev.map(m =>
                                m.id === selectedMemory.id ? { ...m, ...updates } : m
                            ));
                            console.log('⚠️ Updated locally');
                        }
                    }}
                    onDelete={async (id) => {
                        // Delete from Supabase
                        const success = await deleteMemory(id);
                        if (success) {
                            console.log('✅ Memory deleted from Supabase');
                        } else {
                            console.log('⚠️ Deleted locally');
                        }
                        setMemories(prev => prev.filter(m => m.id !== id));
                        setSelectedMemory(null);
                    }}
                    currentUser={currentUser}
                    onReaction={async (memoryId, emoji) => {
                        const success = await addReaction(memoryId, emoji, currentUser);
                        if (success) {
                            // Update local state with new reaction
                            setMemories(prev => prev.map(m => {
                                if (m.id === memoryId) {
                                    const existingReactions = m.reactions || [];
                                    const filteredReactions = existingReactions.filter(r => r.userId !== currentUser);
                                    return { ...m, reactions: [...filteredReactions, { emoji, userId: currentUser }] };
                                }
                                return m;
                            }));
                            // Also update selectedMemory so modal reflects change
                            if (selectedMemory && selectedMemory.id === memoryId) {
                                const existingReactions = selectedMemory.reactions || [];
                                const filteredReactions = existingReactions.filter(r => r.userId !== currentUser);
                                setSelectedMemory({ ...selectedMemory, reactions: [...filteredReactions, { emoji, userId: currentUser }] });
                            }
                        }
                    }}
                />
            )}



            {/* Mode Indicator */}
            {isAddMode && (
                <div className="absolute top-24 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="glass px-4 py-2 rounded-full text-sm font-medium text-blue-600 animate-fade-in flex items-center gap-2">
                        <span style={{ color: userInfo.color }}>{userInfo.avatar}</span>
                        <span>Tap anywhere to drop a pin 📍</span>
                    </div>
                </div>
            )}

            {/* Search Result InfoWindow */}
            {lastSearchedPlace && lastSearchedPlace.geometry?.location && (
                <InfoWindow
                    position={lastSearchedPlace.geometry.location}
                    onCloseClick={() => setLastSearchedPlace(null)}
                    headerContent={
                        <div className="text-sm font-bold text-gray-900 pr-4">
                            {lastSearchedPlace.name}
                        </div>
                    }
                >
                    <div className="text-xs text-gray-600 max-w-[200px]">
                        <p>{lastSearchedPlace.formatted_address}</p>
                        <button
                            onClick={() => {
                                setTempMarker({
                                    lat: lastSearchedPlace.geometry!.location!.lat(),
                                    lng: lastSearchedPlace.geometry!.location!.lng(),
                                    name: lastSearchedPlace.name,
                                    placeId: lastSearchedPlace.place_id
                                });
                                setIsAddMode(true);
                                setLastSearchedPlace(null);
                            }}
                            className="mt-2 w-full px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Add Memory Here
                        </button>
                    </div>
                </InfoWindow>
            )}

            {/* Photo Gallery */}
            <GalleryView
                memories={memories}
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                onNavigateToMemory={(memory) => {
                    setIsGalleryOpen(false);
                    // Trigger fly-to animation instead of directly opening detail
                    setFlyToTarget({ lat: memory.lat, lng: memory.lng, memory });
                }}
                onDeletePhoto={async (memoryId, photoUrl) => {
                    // Find the memory and determine what to update
                    const memory = memories.find(m => m.id === memoryId);
                    if (!memory) return;

                    // If it's the cover photo, clear it
                    if (memory.coverPhotoUrl === photoUrl) {
                        const updated = await updateMemory(memoryId, { cover_photo_url: null });
                        if (updated) {
                            setMemories(prev => prev.map(m => m.id === memoryId ? updated : m));
                        }
                    } else if (memory.photos) {
                        // Remove from photos array
                        const newPhotos = memory.photos.filter(url => url !== photoUrl);
                        const updated = await updateMemory(memoryId, { photos: newPhotos.length > 0 ? newPhotos : null });
                        if (updated) {
                            setMemories(prev => prev.map(m => m.id === memoryId ? updated : m));
                        }
                    }
                }}
            />
        </div>
    );
}
