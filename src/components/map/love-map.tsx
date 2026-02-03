'use client';

import { Map, MapMouseEvent } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { SearchBox } from './search-box';
import { AddMemoryModal } from './add-memory-modal';
import { MemoryDetailModal } from './memory-detail-modal';
import { MemoryMarkers, Memory, User } from './memory-markers';
import { MemorySidebar } from '../ui/memory-sidebar';
import { useUser, USERS } from '../../contexts/user-context';
import { Menu, Home, Plus, Users } from 'lucide-react';

const DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 }; // Tokyo

// Sample memories with coordinates for demo - with user assignments
const SAMPLE_MEMORIES: Memory[] = [
    { id: '1', name: 'Tokyo Tower', type: 'travel', date: '2024-03-14', memo: 'Our first trip together ❤️', lat: 35.6586, lng: 139.7454, addedBy: 'melo' },
    { id: '2', name: 'Sushi Zen', type: 'food', date: '2024-03-15', memo: 'Best omakase ever!', lat: 35.6595, lng: 139.7292, addedBy: 'may' },
    { id: '3', name: 'Shibuya Crossing', type: 'adventure', date: '2024-03-16', memo: 'Got lost but found each other', lat: 35.6595, lng: 139.7004, addedBy: 'melo' },
    { id: '4', name: 'Meiji Shrine', type: 'love', date: '2024-03-17', memo: 'Made a wish together 🙏', lat: 35.6764, lng: 139.6993, addedBy: 'may' },
];

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

export default function LoveMap() {
    const { currentUser, userInfo, switchUser, otherUser } = useUser();
    const [isAddMode, setIsAddMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number; name?: string; placeId?: string } | null>(null);
    const [lastSearchedPlace, setLastSearchedPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const [memories, setMemories] = useState<Memory[]>(SAMPLE_MEMORIES);
    const [userFilter, setUserFilter] = useState<User | null>(null);
    const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

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
                onMemoryClick={(memory) => setSelectedMemory(memory)}
            />

            {/* Creation Modal */}
            {tempMarker && (
                <AddMemoryModal
                    lat={tempMarker.lat}
                    lng={tempMarker.lng}
                    placeName={tempMarker.name}
                    placeId={tempMarker.placeId}
                    onClose={() => setTempMarker(null)}
                    onSave={(data) => {
                        console.log("Saving memory:", { ...data, addedBy: currentUser });
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
                    onSave={(updates) => {
                        setMemories(prev => prev.map(m =>
                            m.id === selectedMemory.id ? { ...m, ...updates } : m
                        ));
                        setSelectedMemory(null);
                    }}
                    onDelete={(id) => {
                        setMemories(prev => prev.filter(m => m.id !== id));
                        setSelectedMemory(null);
                    }}
                />
            )}

            {/* Glass Overlay: Bottom Dock */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
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
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <Home size={20} />
                    </button>


                    {/* Add Memory Button (Primary) */}
                    <button
                        onClick={() => setIsAddMode(!isAddMode)}
                        className={`w-14 h-14 -mt-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isAddMode
                            ? 'bg-red-500 text-white rotate-45 shadow-red-500/40'
                            : 'bg-black text-white dark:bg-white dark:text-black shadow-black/30'
                            }`}
                    >
                        <Plus size={28} />
                    </button>

                    {/* User Switcher Button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="glass w-10 h-10 rounded-full flex items-center justify-center shadow-lg overflow-hidden transition-all hover:scale-105 hover:shadow-xl"
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
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${currentUser === user
                                            ? 'bg-black/10 dark:bg-white/10'
                                            : 'hover:bg-black/5 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <span
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                                            style={{ background: USERS[user].color + '20', color: USERS[user].color }}
                                        >
                                            {USERS[user].avatar}
                                        </span>
                                        <span className="text-sm font-medium">{USERS[user].name}</span>
                                        {currentUser === user && (
                                            <span className="ml-auto text-xs text-gray-400">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mode Indicator */}
            {isAddMode && (
                <div className="absolute top-24 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="glass px-4 py-2 rounded-full text-sm font-medium text-blue-600 animate-fade-in flex items-center gap-2">
                        <span style={{ color: userInfo.color }}>{userInfo.avatar}</span>
                        <span>Tap anywhere to drop a pin 📍</span>
                    </div>
                </div>
            )}
        </div>
    );
}
