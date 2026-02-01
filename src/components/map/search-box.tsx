'use client';

import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

export function SearchBox() {
    const map = useMap();
    const placesLib = useMapsLibrary('places');
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!placesLib || !map || !inputRef.current) return;

        const autocomplete = new placesLib.Autocomplete(inputRef.current, {
            fields: ['geometry', 'name', 'formatted_address'],
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();

            if (place.geometry?.location) {
                // Cinematic Fly-To Animation
                const cameraOptions = {
                    center: place.geometry.location,
                    zoom: 16,
                    heading: 0,
                    tilt: 45, // 3D Tilt on arrival
                };

                // Smooth "Fly" effect
                map.moveCamera(cameraOptions);

                // Optional: Add a marker logic here later
            }
        });

    }, [placesLib, map]);

    return (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Search size={18} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Search our memories..."
                    className="glass w-full h-12 pl-12 pr-4 rounded-full text-sm outline-none placeholder:text-gray-400 text-gray-800 dark:text-gray-100 shadow-sm transition-all focus:shadow-md focus:scale-[1.02]"
                />
            </div>
        </div>
    );
}
