'use client';

import { useState, useMemo } from 'react';
import { X, MapPin, ChevronLeft, ChevronRight, Trash2, Check, Camera, Filter, User, Globe, Calendar } from 'lucide-react';
import { Memory, User as UserType } from '../map/memory-markers';
import { USERS } from '../../contexts/user-context';

interface GalleryViewProps {
    memories: Memory[];
    isOpen: boolean;
    onClose: () => void;
    onNavigateToMemory: (memory: Memory) => void;
    onDeletePhoto?: (memoryId: string, photoUrl: string) => void;
}

// Get all photos from a memory (cover + additional photos)
function getMemoryPhotos(memory: Memory): { url: string; memory: Memory; isCover: boolean }[] {
    const photos: { url: string; memory: Memory; isCover: boolean }[] = [];

    if (memory.coverPhotoUrl) {
        photos.push({ url: memory.coverPhotoUrl, memory, isCover: true });
    }

    if (memory.photos) {
        memory.photos.forEach(url => {
            photos.push({ url, memory, isCover: false });
        });
    }

    return photos;
}

export function GalleryView({ memories, isOpen, onClose, onNavigateToMemory, onDeletePhoto }: GalleryViewProps) {
    const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; memory: Memory; isCover: boolean } | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [personFilter, setPersonFilter] = useState<UserType | null>(null);
    const [countryFilter, setCountryFilter] = useState<string | null>(null);
    const [yearFilter, setYearFilter] = useState<string | null>(null);

    if (!isOpen) return null;

    // Get unique countries and years from memories
    const countries = useMemo(() => {
        const set = new Set<string>();
        memories.forEach(m => m.country && set.add(m.country));
        return Array.from(set).sort();
    }, [memories]);

    const years = useMemo(() => {
        const set = new Set<string>();
        memories.forEach(m => {
            const year = new Date(m.date).getFullYear().toString();
            set.add(year);
        });
        return Array.from(set).sort().reverse();
    }, [memories]);

    // Filter memories based on selected filters
    const filteredMemories = useMemo(() => {
        return memories.filter(m => {
            if (personFilter && m.addedBy !== personFilter) return false;
            if (countryFilter && m.country !== countryFilter) return false;
            if (yearFilter && new Date(m.date).getFullYear().toString() !== yearFilter) return false;
            return true;
        });
    }, [memories, personFilter, countryFilter, yearFilter]);

    // Collect all photos from filtered memories
    const allPhotos = filteredMemories.flatMap(getMemoryPhotos);

    const hasActiveFilters = personFilter || countryFilter || yearFilter;

    const clearFilters = () => {
        setPersonFilter(null);
        setCountryFilter(null);
        setYearFilter(null);
    };

    // Handle navigation in lightbox
    const handlePrev = () => {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : allPhotos.length - 1;
        setCurrentIndex(newIndex);
        setSelectedPhoto(allPhotos[newIndex]);
    };

    const handleNext = () => {
        const newIndex = currentIndex < allPhotos.length - 1 ? currentIndex + 1 : 0;
        setCurrentIndex(newIndex);
        setSelectedPhoto(allPhotos[newIndex]);
    };

    const handlePhotoClick = (photo: { url: string; memory: Memory; isCover: boolean }, index: number) => {
        if (isSelectMode) {
            // Toggle selection
            const key = `${photo.memory.id}-${photo.url}`;
            const newSelected = new Set(selectedPhotos);
            if (newSelected.has(key)) {
                newSelected.delete(key);
            } else {
                newSelected.add(key);
            }
            setSelectedPhotos(newSelected);
        } else {
            setSelectedPhoto(photo);
            setCurrentIndex(index);
        }
    };

    const handleGoToFlag = () => {
        if (selectedPhoto) {
            onClose();
            onNavigateToMemory(selectedPhoto.memory);
        }
    };

    const handleDeleteSelected = () => {
        if (onDeletePhoto && selectedPhotos.size > 0) {
            // Parse and delete each selected photo
            selectedPhotos.forEach(key => {
                const [memoryId, ...urlParts] = key.split('-');
                const photoUrl = urlParts.join('-'); // Rejoin in case URL had dashes
                onDeletePhoto(memoryId, photoUrl);
            });
            setSelectedPhotos(new Set());
            setIsSelectMode(false);
        }
    };

    const handleDeleteCurrent = () => {
        if (onDeletePhoto && selectedPhoto) {
            onDeletePhoto(selectedPhoto.memory.id, selectedPhoto.url);
            setSelectedPhoto(null);
        }
    };

    const exitSelectMode = () => {
        setIsSelectMode(false);
        setSelectedPhotos(new Set());
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            />

            {/* Gallery Dialog Panel */}
            <div className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[90vw] md:max-w-4xl z-50 animate-slide-up">
                <div className="glass-card h-full flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <div>
                            <h2 className="text-lg font-semibold">Gallery</h2>
                            <p className="text-xs text-gray-500">
                                {allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''}
                                {hasActiveFilters && ` (filtered)`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showFilters || hasActiveFilters
                                        ? 'bg-blue-500/10 text-blue-500'
                                        : 'hover:bg-black/10 dark:hover:bg-white/10 text-gray-500'
                                    }`}
                            >
                                <Filter size={16} />
                            </button>
                            {/* Select Mode Toggle */}
                            {allPhotos.length > 0 && (
                                isSelectMode ? (
                                    <>
                                        <button
                                            onClick={exitSelectMode}
                                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        {selectedPhotos.size > 0 && (
                                            <button
                                                onClick={handleDeleteSelected}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors"
                                            >
                                                <Trash2 size={14} />
                                                Delete ({selectedPhotos.size})
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsSelectMode(true)}
                                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                    >
                                        Select
                                    </button>
                                )
                            )}
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="px-5 py-3 border-b border-white/10 bg-black/5 dark:bg-white/5 space-y-3">
                            {/* Person Filter */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-500 w-14">Person</span>
                                <button
                                    onClick={() => setPersonFilter(null)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!personFilter ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800' : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    All
                                </button>
                                {(['melo', 'may'] as UserType[]).map(user => (
                                    <button
                                        key={user}
                                        onClick={() => setPersonFilter(personFilter === user ? null : user)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${personFilter === user
                                                ? 'ring-1 ring-current'
                                                : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400'
                                            }`}
                                        style={personFilter === user ? { background: USERS[user].color + '20', color: USERS[user].color } : {}}
                                    >
                                        <span>{USERS[user].avatar}</span>
                                        {USERS[user].name}
                                    </button>
                                ))}
                            </div>

                            {/* Country Filter */}
                            {countries.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-gray-500 w-14">Country</span>
                                    <button
                                        onClick={() => setCountryFilter(null)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!countryFilter ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800' : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        All
                                    </button>
                                    {countries.map(country => (
                                        <button
                                            key={country}
                                            onClick={() => setCountryFilter(countryFilter === country ? null : country)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${countryFilter === country
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-black/30'
                                                }`}
                                        >
                                            {country}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Year Filter */}
                            {years.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-gray-500 w-14">Year</span>
                                    <button
                                        onClick={() => setYearFilter(null)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!yearFilter ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800' : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        All
                                    </button>
                                    {years.map(year => (
                                        <button
                                            key={year}
                                            onClick={() => setYearFilter(yearFilter === year ? null : year)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${yearFilter === year
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-black/30'
                                                }`}
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                        {allPhotos.length === 0 ? (
                            /* Empty State */
                            <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                    <Camera size={28} className="text-gray-400" />
                                </div>
                                <h3 className="text-base font-medium mb-1">No photos yet</h3>
                                <p className="text-sm text-gray-500">
                                    Add photos to your memories to see them here
                                </p>
                            </div>
                        ) : (
                            /* Photo Grid */
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                {allPhotos.map((photo, index) => {
                                    const key = `${photo.memory.id}-${photo.url}`;
                                    const isSelected = selectedPhotos.has(key);

                                    return (
                                        <div
                                            key={`${photo.memory.id}-${index}`}
                                            className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-neutral-100 dark:bg-neutral-800 ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
                                                }`}
                                            onClick={() => handlePhotoClick(photo, index)}
                                        >
                                            <img
                                                src={photo.url}
                                                alt={photo.memory.name}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                loading="lazy"
                                            />

                                            {/* Selection checkbox */}
                                            {isSelectMode && (
                                                <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white/80 dark:bg-black/50 border border-gray-300 dark:border-gray-600'
                                                    }`}>
                                                    {isSelected && <Check size={14} />}
                                                </div>
                                            )}

                                            {/* Hover overlay (only when not in select mode) */}
                                            {!isSelectMode && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                            )}

                                            {/* Location and user info on hover */}
                                            {!isSelectMode && (
                                                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <div className="flex items-center gap-1.5">
                                                        <div
                                                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0"
                                                            style={{ background: USERS[photo.memory.addedBy].color }}
                                                        >
                                                            {USERS[photo.memory.addedBy].avatar}
                                                        </div>
                                                        <span className="text-white text-xs font-medium truncate">
                                                            {photo.memory.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox - Simplified */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center animate-fade-in"
                    onClick={() => setSelectedPhoto(null)}
                >
                    {/* Navigation arrows */}
                    {allPhotos.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                                <ChevronLeft size={22} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                                <ChevronRight size={22} />
                            </button>
                        </>
                    )}

                    {/* Image */}
                    <img
                        src={selectedPhoto.url}
                        alt={selectedPhoto.memory.name}
                        className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Top bar with counter and close */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <div className="bg-black/50 px-3 py-1.5 rounded-full text-white text-sm">
                            {currentIndex + 1} / {allPhotos.length}
                        </div>
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Bottom action bar */}
                    <div
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleGoToFlag}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors backdrop-blur-sm"
                        >
                            <MapPin size={16} />
                            View on Map
                        </button>
                        {onDeletePhoto && (
                            <button
                                onClick={handleDeleteCurrent}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-sm font-medium transition-colors"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
