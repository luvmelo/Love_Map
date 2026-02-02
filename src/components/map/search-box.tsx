'use client';

import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useState, useCallback } from 'react';
import { Search, MapPin } from 'lucide-react';

interface SearchBoxProps {
    onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
}

export function SearchBox({ onPlaceSelect }: SearchBoxProps) {
    const map = useMap();
    const placesLib = useMapsLibrary('places');

    // State
    const [inputValue, setInputValue] = useState('');
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
    const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

    // Initialize Services
    useEffect(() => {
        if (!placesLib || !map) return;
        setAutocompleteService(new placesLib.AutocompleteService());
        setPlacesService(new placesLib.PlacesService(map));
    }, [placesLib, map]);

    // Handle Input Change
    useEffect(() => {
        if (!autocompleteService || !inputValue) {
            setPredictions([]);
            return;
        }

        // Debounce could be added here, but Google's service is fast enough for now
        if (inputValue.length > 2) {
            setIsLoading(true);
            autocompleteService.getPlacePredictions(
                { input: inputValue },
                (results, status) => {
                    setIsLoading(false);
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        setPredictions(results);
                    } else {
                        setPredictions([]);
                    }
                }
            );
        } else {
            setPredictions([]);
        }
    }, [inputValue, autocompleteService]);

    // Handle Selection
    const handleSelect = (placeId: string) => {
        if (!placesService || !map) return;

        placesService.getDetails({ placeId }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
                // Update input to show full name
                setInputValue(place.name || '');
                setPredictions([]); // Clear dropdown

                // Fly To
                map.moveCamera({
                    center: place.geometry.location,
                    zoom: 16,
                    heading: 0,
                    tilt: 45
                });

                // Notify parent
                if (onPlaceSelect) {
                    onPlaceSelect(place);
                }
            }
        });
    };

    return (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Search size={18} />
                </div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Search our memories..."
                    className="glass w-full h-12 pl-12 pr-4 rounded-full text-sm outline-none placeholder:text-gray-400 text-gray-800 dark:text-gray-100 shadow-lg border border-white/20 focus:scale-[1.02] transition-all"
                />
            </div>

            {/* Custom Predictions Dropdown */}
            {predictions.length > 0 && (
                <ul className="mt-2 glass-card overflow-hidden rounded-2xl border border-white/20 shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200">
                    {predictions.map((prediction) => (
                        <li
                            key={prediction.place_id}
                            onClick={() => handleSelect(prediction.place_id)}
                            className="px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-none"
                        >
                            <div className="min-w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <MapPin size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {prediction.structured_formatting.main_text}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {prediction.structured_formatting.secondary_text}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
