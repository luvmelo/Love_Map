'use client';

import { Map, MapMouseEvent } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { SearchBox } from './search-box';
import { AddMemoryModal } from './add-memory-modal';

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 }; // San Francisco
const DEFAULT_ZOOM = 12;

export default function LoveMap() {
    const [center, setCenter] = useState(DEFAULT_CENTER);
    const [isAddMode, setIsAddMode] = useState(false);
    const [tempMarker, setTempMarker] = useState<google.maps.LatLngLiteral | null>(null);

    const handleMapClick = (event: MapMouseEvent) => {
        if (isAddMode && event.detail.latLng) {
            const lat = event.detail.latLng.lat;
            const lng = event.detail.latLng.lng;
            setTempMarker({ lat, lng });
        }
    };

    return (
        <div className="relative w-full h-screen bg-black">
            <Map
                defaultCenter={DEFAULT_CENTER}
                defaultZoom={3} // GLOBE VIEW: Zoom out to see the sphere
                defaultTilt={0}
                defaultHeading={0}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
                renderingType="VECTOR"
                className="w-full h-full"
                onClick={handleMapClick}
            />

            {/* Glass Overlay: Top Search Bar */}
            <SearchBox />

            {/* Creation Modal */}
            {tempMarker && (
                <AddMemoryModal
                    lat={tempMarker.lat}
                    lng={tempMarker.lng}
                    onClose={() => setTempMarker(null)}
                    onSave={(data) => {
                        console.log("Saving memory:", data);
                        setTempMarker(null);
                        setIsAddMode(false);
                    }}
                />
            )}

            {/* Glass Overlay: Bottom Dock */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
                <div className="glass h-16 px-6 rounded-2xl flex items-center gap-6 shadow-2xl border-white/40 transform transition-all hover:scale-105">
                    {/* Home Button */}
                    <button
                        onClick={() => {
                            // Reset View Logic
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-black/5 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    </button>

                    {/* Add Memory Button (Primary) */}
                    <button
                        onClick={() => setIsAddMode(!isAddMode)}
                        className={`w-14 h-14 -mt-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isAddMode
                            ? 'bg-red-500 text-white rotate-45 shadow-red-500/40'
                            : 'bg-black text-white dark:bg-white dark:text-black shadow-black/30'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    </button>

                    {/* Profile Button */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-300 to-blue-300 border-2 border-white shadow-sm" />
                </div>
            </div>

            {/* Mode Indicator */}
            {isAddMode && (
                <div className="absolute top-24 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="glass px-4 py-2 rounded-full text-sm font-medium text-blue-600 animate-in fade-in slide-in-from-top-4">
                        Tap anywhere to drop a pin 📍
                    </div>
                </div>
            )}
        </div>
    );
}
