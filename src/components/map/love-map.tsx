'use client';

import { Map, MapMouseEvent } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { SearchBox } from './search-box';
import { AddMemoryModal } from './add-memory-modal';
import { MemorySidebar } from '../ui/memory-sidebar';
import { Menu, Home, Plus, User } from 'lucide-react';

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 }; // San Francisco
const DEFAULT_ZOOM = 12;

export default function LoveMap() {
    const [center, setCenter] = useState(DEFAULT_CENTER);
    const [isAddMode, setIsAddMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number; name?: string } | null>(null);
    const [lastSearchedPlace, setLastSearchedPlace] = useState<google.maps.places.PlaceResult | null>(null);

    const handleMapClick = (event: MapMouseEvent) => {
        if (isAddMode && event.detail.latLng) {
            const lat = event.detail.latLng.lat;
            const lng = event.detail.latLng.lng;
            const name = lastSearchedPlace ? lastSearchedPlace.name : undefined;
            setTempMarker({ lat, lng, name });
        }
    };

    return (
        <div className="relative w-full h-screen bg-[#0a0a1a] overflow-hidden">
            {/* Space Background - Stars */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a1a]" />
                {/* Animated stars layer */}
                <div className="stars-layer absolute inset-0 opacity-60" />
            </div>

            <Map
                defaultCenter={DEFAULT_CENTER}
                defaultZoom={2.5}
                defaultTilt={0}
                defaultHeading={0}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
                renderingType="VECTOR"
                className="w-full h-full relative z-10"
                onClick={handleMapClick}
                minZoom={2} // Prevent zooming out too far (avoids tile repeat)
                restriction={{
                    latLngBounds: {
                        north: 85,
                        south: -85,
                        west: -180,
                        east: 180,
                    },
                    strictBounds: true,
                }}
            />

            {/* Glass Overlay: Top Search Bar */}
            <SearchBox onPlaceSelect={(place) => setLastSearchedPlace(place)} />

            {/* Memory Sidebar */}
            <MemorySidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onMemoryClick={(memory) => {
                    console.log("Navigate to memory:", memory);
                    // TODO: Fly to memory location
                }}
            />

            {/* Creation Modal */}
            {tempMarker && (
                <AddMemoryModal
                    lat={tempMarker.lat}
                    lng={tempMarker.lng}
                    placeName={tempMarker.name}
                    onClose={() => setTempMarker(null)}
                    onSave={(data) => {
                        console.log("Saving memory:", data);
                        setTempMarker(null);
                        setIsAddMode(false);
                        setLastSearchedPlace(null);
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
                        onClick={() => {
                            // Reset to globe view
                        }}
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

                    {/* Profile Button */}
                    <button className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-300 to-blue-300 border-2 border-white shadow-sm overflow-hidden">
                        {/* Could show user avatar here */}
                    </button>
                </div>
            </div>

            {/* Mode Indicator */}
            {isAddMode && (
                <div className="absolute top-24 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="glass px-4 py-2 rounded-full text-sm font-medium text-blue-600 animate-fade-in">
                        Tap anywhere to drop a pin 📍
                    </div>
                </div>
            )}
        </div>
    );
}

