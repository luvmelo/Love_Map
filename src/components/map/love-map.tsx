'use client';

import { Map } from '@vis.gl/react-google-maps';
import { mapStyles } from './map-styles';
import { useState } from 'react';

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 }; // San Francisco
const DEFAULT_ZOOM = 13;

export default function LoveMap() {
    const [center, setCenter] = useState(DEFAULT_CENTER);

    return (
        <div className="relative w-full h-screen">
            <Map
                defaultCenter={DEFAULT_CENTER}
                defaultZoom={DEFAULT_ZOOM}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                styles={mapStyles}
                className="w-full h-full"
                mapId="love-map-id" // Required for advanced markers if we add them
            />

            {/* Glass Overlay: Top Search Bar Placeholder */}
            <div className="absolute top-6 left-0 right-0 flex justify-center z-10 px-4">
                <div className="glass h-12 w-full max-w-md rounded-full flex items-center px-4 text-gray-500 shadow-sm border-white/40">
                    Search places...
                </div>
            </div>

            {/* Glass Overlay: Bottom Dock Placeholder */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
                <div className="glass h-16 px-6 rounded-2xl flex items-center gap-4 shadow-xl border-white/40">
                    <div className="w-10 h-10 bg-black/5 rounded-full" />
                    <div className="w-10 h-10 bg-black/5 rounded-full" />
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full border border-blue-500/20" />
                </div>
            </div>
        </div>
    );
}
