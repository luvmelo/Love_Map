'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Heart, Utensils, Plane, Mountain, X, ImagePlus } from 'lucide-react';
import { useMapsLibrary, useMap } from '@vis.gl/react-google-maps';

interface AddMemoryModalProps {
    lat: number;
    lng: number;
    placeName?: string;
    placeId?: string;  // When user clicks directly on a POI marker
    onClose: () => void;
    onSave: (data: any) => void;
}

const FLAGS = [
    { id: 'love', label: 'Love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/20' },
    { id: 'food', label: 'Yum', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
    { id: 'travel', label: 'Trip', icon: Plane, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    { id: 'adventure', label: 'Fun', icon: Mountain, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
];

export function AddMemoryModal({ lat, lng, placeName, placeId, onClose, onSave }: AddMemoryModalProps) {
    const [memo, setMemo] = useState('');
    const [selectedFlag, setSelectedFlag] = useState(FLAGS[0].id);
    const [locationName, setLocationName] = useState<string>(placeName || '');
    const [isLoadingName, setIsLoadingName] = useState(!placeName);
    const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
    const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const geocodingLib = useMapsLibrary('geocoding');
    const placesLib = useMapsLibrary('places');
    const map = useMap();

    // Handle file selection for cover photo
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverPhoto(file);
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Helper function to calculate distance between two points
    const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
    };

    // Find place name - use placeId if available (exact POI click), otherwise search nearby
    useEffect(() => {
        if (placeName) {
            setLocationName(placeName);
            setIsLoadingName(false);
            return;
        }

        setIsLoadingName(true);

        // If user clicked directly on a POI, use getDetails for exact name
        if (placeId && placesLib && map) {
            const service = new placesLib.PlacesService(map);
            service.getDetails(
                { placeId, fields: ['name', 'formatted_address'] },
                (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place?.name) {
                        setLocationName(place.name);
                        setIsLoadingName(false);
                    } else {
                        // Fallback to nearby search if getDetails fails
                        searchNearby(service);
                    }
                }
            );
            return;
        }

        // No placeId - search nearby for the closest business
        if (placesLib && map) {
            const service = new placesLib.PlacesService(map);
            searchNearby(service);
        } else {
            fallbackToGeocoding();
        }

        function searchNearby(service: google.maps.places.PlacesService) {
            // Use larger radius to capture nearby places
            const request: google.maps.places.PlaceSearchRequest = {
                location: new google.maps.LatLng(lat, lng),
                radius: 100, // Search within 100m
            };

            service.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                    // Filter and sort by distance to the clicked point
                    const validPlaces = results
                        .filter(p =>
                            p.name &&
                            p.geometry?.location &&
                            // Exclude generic location types
                            !p.types?.includes('locality') &&
                            !p.types?.includes('political') &&
                            !p.types?.includes('country') &&
                            !p.types?.includes('administrative_area_level_1') &&
                            !p.types?.includes('administrative_area_level_2') &&
                            !p.types?.includes('transit_station') &&
                            !p.types?.includes('bus_station') &&
                            !p.types?.includes('parking') &&
                            !p.types?.includes('route')
                        )
                        .map(p => ({
                            ...p,
                            distance: getDistance(
                                lat, lng,
                                p.geometry!.location!.lat(),
                                p.geometry!.location!.lng()
                            )
                        }))
                        .sort((a, b) => a.distance - b.distance);

                    // Find the closest establishment/POI
                    const establishment = validPlaces.find(p =>
                        p.types?.includes('establishment') ||
                        p.types?.includes('point_of_interest') ||
                        p.types?.includes('food') ||
                        p.types?.includes('restaurant') ||
                        p.types?.includes('cafe') ||
                        p.types?.includes('museum') ||
                        p.types?.includes('store') ||
                        p.types?.includes('tourist_attraction')
                    );

                    if (establishment) {
                        setLocationName(establishment.name!);
                        setIsLoadingName(false);
                        return;
                    }

                    // Otherwise use the closest valid place
                    if (validPlaces.length > 0) {
                        setLocationName(validPlaces[0].name!);
                        setIsLoadingName(false);
                        return;
                    }
                }

                // Fallback to geocoding if no nearby places found
                fallbackToGeocoding();
            });
        }

        function fallbackToGeocoding() {
            if (!geocodingLib) {
                setLocationName('Dropped Pin');
                setIsLoadingName(false);
                return;
            }

            const geocoder = new geocodingLib.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results && results.length > 0) {
                    // Look for point of interest or establishment first
                    const poi = results.find(r =>
                        r.types.includes('point_of_interest') ||
                        r.types.includes('establishment') ||
                        r.types.includes('premise')
                    );

                    if (poi) {
                        // Use the formatted address's first part for POIs
                        const name = poi.formatted_address.split(',')[0];
                        setLocationName(name);
                        setIsLoadingName(false);
                        return;
                    }

                    // Otherwise get meaningful area name - prefer street over city
                    const route = results.find(r => r.types.includes('route'));
                    const neighborhood = results.find(r =>
                        r.types.includes('neighborhood') ||
                        r.types.includes('sublocality_level_1') ||
                        r.types.includes('sublocality')
                    );

                    // Avoid using just city name
                    if (route) {
                        const streetName = route.address_components.find(c => c.types.includes('route'));
                        if (streetName) {
                            setLocationName(streetName.long_name);
                            setIsLoadingName(false);
                            return;
                        }
                    }

                    if (neighborhood) {
                        const nhoodName = neighborhood.address_components.find(c =>
                            c.types.includes('neighborhood') || c.types.includes('sublocality_level_1')
                        );
                        if (nhoodName) {
                            setLocationName(nhoodName.long_name);
                            setIsLoadingName(false);
                            return;
                        }
                    }

                    // Last resort - use first part of address but not if it's just the city
                    const firstResult = results[0];
                    const displayName = firstResult.formatted_address.split(',')[0];
                    setLocationName(displayName);
                } else {
                    setLocationName('Dropped Pin');
                }
                setIsLoadingName(false);
            });
        }
    }, [lat, lng, placeName, placeId, geocodingLib, placesLib, map]);

    const displayTitle = isLoadingName ? 'Finding location...' : (locationName || 'Dropped Pin');


    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4">
            <div className="glass-card w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl ring-1 ring-white/20">

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    className="hidden"
                />

                {/* Cover Photo Area */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:opacity-90 transition-opacity relative group overflow-hidden"
                >
                    {coverPhotoPreview ? (
                        <>
                            <img
                                src={coverPhotoPreview}
                                alt="Cover preview"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="text-white text-center">
                                    <ImagePlus size={24} className="mx-auto mb-1" />
                                    <span className="text-xs font-medium">Change Photo</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Camera size={32} className="group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-xs mt-2 font-medium tracking-wide">Add Cover Photo</span>
                        </>
                    )}
                </div>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {displayTitle}
                            </h2>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 font-mono">
                                📍 {lat.toFixed(4)}, {lng.toFixed(4)}
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 -mr-2 -mt-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Flag Selector */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        {FLAGS.map((flag) => {
                            const Icon = flag.icon;
                            const isSelected = selectedFlag === flag.id;
                            return (
                                <button
                                    key={flag.id}
                                    onClick={() => setSelectedFlag(flag.id)}
                                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border transition-all ${isSelected
                                        ? `${flag.bg} ${flag.color} scale-105 shadow-sm`
                                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400'
                                        }`}
                                >
                                    <Icon size={20} className={isSelected ? 'fill-current' : ''} />
                                    <span className="text-[10px] font-medium mt-1">{flag.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Memo Input */}
                    <div className="mb-6">
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="Write something sweet..."
                            className="w-full h-24 bg-transparent resize-none outline-none text-sm placeholder:text-gray-400"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave({
                                lat,
                                lng,
                                memo,
                                type: selectedFlag,
                                locationName,
                                coverPhoto,
                                coverPhotoPreview
                            })}
                            className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Save Memory
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
