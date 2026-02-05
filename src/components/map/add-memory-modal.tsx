'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Heart, Utensils, Plane, Mountain, X, ImagePlus, Calendar, Clock } from 'lucide-react';
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
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    // Date and time state
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState(new Date().toTimeString().slice(0, 5));
    const fileInputRef = useRef<HTMLInputElement>(null);
    const geocodingLib = useMapsLibrary('geocoding');
    const placesLib = useMapsLibrary('places');
    const map = useMap();

    // Maximum 6 photos allowed
    const MAX_PHOTOS = 6;

    // Handle file selection for photos (supports multiple)
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
        if (newFiles.length === 0) return;

        // Add to existing photos
        setPhotos(prev => [...prev, ...newFiles]);

        // Create preview URLs for new files
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    // Remove a photo
    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
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
                    multiple
                    className="hidden"
                />

                {/* Photo Grid Area */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-900">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">
                            Photos ({photoPreviews.length}/{MAX_PHOTOS})
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {/* Existing photo previews */}
                        {photoPreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                                <img
                                    src={preview}
                                    alt={`Photo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePhoto(index);
                                    }}
                                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} className="text-white" />
                                </button>
                            </div>
                        ))}
                        {/* Add more button */}
                        {photoPreviews.length < MAX_PHOTOS && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-neutral-600 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                            >
                                <ImagePlus size={20} />
                                <span className="text-[10px] mt-1 font-medium">Add</span>
                            </button>
                        )}
                    </div>
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

                    {/* Date & Time Picker */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 group-focus-within:text-gray-800 dark:group-focus-within:text-white transition-colors">
                                <Calendar size={16} />
                            </div>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus:bg-white/20 dark:focus:bg-black/20 backdrop-blur-md rounded-2xl py-3 pl-10 pr-3 text-sm font-semibold text-gray-800 dark:text-white outline-none border border-transparent focus:border-white/20 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden appearance-none min-h-[46px]"
                            />
                        </div>
                        <div className="relative w-32 group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 group-focus-within:text-gray-800 dark:group-focus-within:text-white transition-colors">
                                <Clock size={16} />
                            </div>
                            <input
                                type="time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus:bg-white/20 dark:focus:bg-black/20 backdrop-blur-md rounded-2xl py-3 pl-10 pr-3 text-sm font-semibold text-gray-800 dark:text-white outline-none border border-transparent focus:border-white/20 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden appearance-none min-h-[46px]"
                            />
                        </div>
                    </div>

                    {/* Flag Selector */}
                    <div className="flex gap-3 mb-4">
                        {FLAGS.map((flag) => {
                            const Icon = flag.icon;
                            const isSelected = selectedFlag === flag.id;
                            return (
                                <button
                                    key={flag.id}
                                    onClick={() => setSelectedFlag(flag.id)}
                                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${isSelected
                                        ? `${flag.color}`
                                        : 'text-gray-400 hover:text-gray-500'
                                        }`}
                                >
                                    <Icon size={24} className={isSelected ? 'fill-current' : ''} />
                                    <span className={`text-[10px] font-medium mt-1 ${isSelected ? flag.color : ''}`}>{flag.label}</span>
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
                                date: selectedDate,
                                time: selectedTime,
                                coverPhoto: photos[0] || null,  // First photo as cover
                                additionalPhotos: photos.slice(1),  // Rest as additional
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
