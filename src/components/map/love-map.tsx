'use client';

import { Map, MapMouseEvent } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { SearchBox } from './search-box';
import { AddMemoryModal } from './add-memory-modal';
import { MemoryMarkers, Memory } from './memory-markers';
import { MemorySidebar } from '../ui/memory-sidebar';
import { Menu, Home, Plus } from 'lucide-react';

const DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 }; // Tokyo

// Sample memories with coordinates for demo - clustered in Tokyo area
const SAMPLE_MEMORIES: Memory[] = [
    { id: '1', name: 'Tokyo Tower', type: 'travel', date: '2024-03-14', memo: 'Our first trip together ❤️', lat: 35.6586, lng: 139.7454 },
    { id: '2', name: 'Sushi Zen', type: 'food', date: '2024-03-15', memo: 'Best omakase ever!', lat: 35.6595, lng: 139.7292 },
    { id: '3', name: 'Shibuya Crossing', type: 'adventure', date: '2024-03-16', memo: 'Got lost but found each other', lat: 35.6595, lng: 139.7004 },
    { id: '4', name: 'Meiji Shrine', type: 'love', date: '2024-03-17', memo: 'Made a wish together 🙏', lat: 35.6764, lng: 139.6993 },
];

export default function LoveMap() {
    const [isAddMode, setIsAddMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number; name?: string } | null>(null);
    const [lastSearchedPlace, setLastSearchedPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const [memories] = useState<Memory[]>(SAMPLE_MEMORIES);

    const handleMapClick = (event: MapMouseEvent) => {
        if (isAddMode && event.detail.latLng) {
            const lat = event.detail.latLng.lat;
            const lng = event.detail.latLng.lng;
            const name = lastSearchedPlace ? lastSearchedPlace.name : undefined;
            setTempMarker({ lat, lng, name });
        }
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            <Map
                defaultCenter={DEFAULT_CENTER}
                defaultZoom={3}
                minZoom={2}
                defaultTilt={0}
                defaultHeading={0}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
                renderingType="VECTOR"
                className="w-full h-full"
                onClick={handleMapClick}
            >
                {/* Memory markers with clustering */}
                <MemoryMarkers
                    memories={memories}
                    onMemoryClick={(memory) => {
                        console.log("Clicked memory:", memory);
                        // TODO: Show memory detail modal
                    }}
                />
            </Map>

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
