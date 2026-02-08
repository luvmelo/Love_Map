'use client';

import { useState, useMemo } from 'react';
import { Heart, Utensils, Plane, Mountain, X, Calendar, MapPin, Filter, ChevronRight, Users, TrendingUp, Camera, Globe, BarChart3, List, ChevronDown, ChevronUp } from 'lucide-react';
import { DatePicker } from '../ui/date-picker';
import { formatDateDisplay } from '@/lib/date-utils';
import { Memory, User } from '../map/memory-markers';
import { USERS } from '../../contexts/user-context';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeLocation } from '@/lib/location-normalization';
import { useIsMobile } from '@/hooks/use-mobile';

const FLAG_CONFIG = {
    love: { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Love' },
    food: { icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Food' },
    travel: { icon: Plane, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Travel' },
    adventure: { icon: Mountain, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Adventure' },
};

// Config for stats visuals
const TYPE_CONFIG = {
    love: { icon: Heart, color: '#ec4899', label: 'Love' },
    food: { icon: Utensils, color: '#f97316', label: 'Food' },
    travel: { icon: Plane, color: '#3b82f6', label: 'Travel' },
    adventure: { icon: Mountain, color: '#22c55e', label: 'Adventure' },
};

interface MemorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    memories: Memory[];
    userFilter: User | null;
    onUserFilterChange: (user: User | null) => void;
    onMemoryClick?: (memory: Memory) => void;
    onLocationClick?: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

export function MemorySidebar({
    isOpen,
    onClose,
    memories,
    userFilter,
    onUserFilterChange,
    onMemoryClick,
    onLocationClick
}: MemorySidebarProps) {
    const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'memories' | 'stats'>('memories');
    // Sorting state
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'created-desc' | 'location'>('date-desc');

    // State for collapsible stats sections
    const [expandedStats, setExpandedStats] = useState<{ countries: boolean; cities: boolean }>({
        countries: true,
        cities: false
    });
    const isMobile = useIsMobile();

    // Apply both type and user filters for the LIST view
    const filteredMemories = useMemo(() => {
        let result = memories.filter(m => {
            const matchesType = !activeTypeFilter || m.type === activeTypeFilter;
            const matchesUser = !userFilter || m.addedBy === userFilter;
            return matchesType && matchesUser;
        });

        // Apply sorting
        return result.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                case 'date-asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'created-desc':
                    // Fallback to date if createdAt missing
                    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return tB - tA;
                case 'location':
                    const locA = (a.country || '') + (a.city || '') + a.name;
                    const locB = (b.country || '') + (b.city || '') + b.name;
                    return locA.localeCompare(locB);
                default:
                    return 0;
            }
        });
    }, [memories, activeTypeFilter, userFilter, sortBy]);

    // Calculate statistics for the STATS view (using ALL memories to show full history)
    const stats = useMemo(() => {
        if (!memories.length) return null;

        const byType = memories.reduce((acc, m) => {
            acc[m.type] = (acc[m.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byCountry = memories.reduce((acc, m) => {
            if (m.country) {
                const countryName = normalizeLocation(m.country, 'country');
                acc[countryName] = (acc[countryName] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        // Ensure we have some data even if fields are missing (for demo)
        // If real data has no 'country' property, this will be empty.
        // Let's assume the memory object has these fields or we might need to update the type.
        // Checking Memory type... it has `country` and `city` optional fields.

        const byCity = memories.reduce((acc, m) => {
            if (m.city) {
                const cityName = normalizeLocation(m.city, 'city');
                acc[cityName] = (acc[cityName] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const byYear = memories.reduce((acc, m) => {
            const year = new Date(m.date).getFullYear();
            acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const totalPhotos = memories.reduce((acc, m) => {
            let count = m.coverPhotoUrl ? 1 : 0;
            count += m.photos?.length || 0;
            return acc + count;
        }, 0);

        const topCountry = Object.entries(byCountry).sort((a, b) => b[1] - a[1])[0];
        const favoriteType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];

        // Prepare sorted lists for display
        const countriesList = Object.entries(byCountry)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

        const citiesList = Object.entries(byCity)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

        return {
            total: memories.length,
            byType,
            byCountry,
            byCity,
            byYear,
            totalPhotos,
            topCountry,
            favoriteType,
            countriesCount: Object.keys(byCountry).length,
            citiesCount: Object.keys(byCity).length,
            countriesList,
            citiesList
        };
    }, [memories]);

    const toggleSection = (section: 'countries' | 'cities') => {
        setExpandedStats(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleLocationClick = (type: 'country' | 'city', name: string) => {
        if (!onLocationClick) return;

        // Filter memories that match this location (using normalization)
        const locationMemories = memories.filter(m => {
            if (type === 'country') {
                return normalizeLocation(m.country || '', 'country') === name;
            } else {
                return normalizeLocation(m.city || '', 'city') === name;
            }
        });

        if (locationMemories.length === 0) return;

        // Calculate bounds
        let north = -90;
        let south = 90;
        let east = -180;
        let west = 180;

        locationMemories.forEach(m => {
            if (m.lat > north) north = m.lat;
            if (m.lat < south) south = m.lat;
            if (m.lng > east) east = m.lng;
            if (m.lng < west) west = m.lng;
        });

        // Just verify if we have a single point
        if (north === south && east === west) {
            // It's a single point
            // Let's create a small buffer around it (e.g. 0.01 deg ~= 1km)
            const padding = 0.01;
            onLocationClick({
                north: north + padding,
                south: south - padding,
                east: east + padding,
                west: west - padding
            });
        } else {
            onLocationClick({ north, south, east, west });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute top-0 left-0 bottom-0 w-full sm:w-80 z-30 flex flex-col pointer-events-none p-3 sm:p-0">
            {/* Sidebar Container - enable pointer events for contents */}
            <div className="glass-card h-full flex flex-col overflow-hidden animate-slide-up pointer-events-auto shadow-2xl rounded-2xl sm:m-4 sm:mr-0 border border-white/20">

                {/* Header */}
                <div className="p-5 border-b border-white/10 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2
                            className="text-lg font-bold"
                            style={{
                                background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb7185 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >Our Journey</h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Segmented Control */}
                    <div className="bg-black/5 dark:bg-white/10 p-1 rounded-full flex relative overflow-hidden backdrop-blur-sm border border-white/10 shadow-inner">
                        {/* Sliding Indicator */}
                        <motion.div
                            className="absolute bg-white dark:bg-gray-800 rounded-full shadow-md"
                            initial={false}
                            animate={{
                                x: activeTab === 'memories' ? 0 : '100%',
                            }}
                            // Use width: 50% minus padding for perfect fit
                            style={{
                                width: 'calc(50% - 4px)',
                                top: 4,
                                bottom: 4,
                                left: 4,
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />

                        <button
                            onClick={() => setActiveTab('memories')}
                            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all duration-300 rounded-full ${activeTab === 'memories'
                                ? 'text-black dark:text-white'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <List size={16} className={`transition-transform duration-300 ${activeTab === 'memories' ? 'scale-110' : 'scale-100'}`} />
                            <span className="truncate">Memories</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all duration-300 rounded-full ${activeTab === 'stats'
                                ? 'text-black dark:text-white'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <BarChart3 size={16} className={`transition-transform duration-300 ${activeTab === 'stats' ? 'scale-110' : 'scale-100'}`} />
                            <span className="truncate">Stats</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {activeTab === 'memories' ? (
                            <motion.div
                                key="memories"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 flex flex-col"
                            >
                                {/* FILTERS & LIST (Existing Layout) */}
                                <div className="px-5 py-3 border-b border-white/10 shrink-0 space-y-3">
                                    {/* Link to sort/filter controls */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Users size={12} />
                                            <span>Filter by person</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value as any)}
                                                className="bg-black/5 dark:bg-white/5 text-xs rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-pink-500/50 border-none text-gray-700 dark:text-gray-300"
                                            >
                                                <option value="date-desc">Newest Date</option>
                                                <option value="date-asc">Oldest Date</option>
                                                <option value="created-desc">Created (Newest)</option>
                                                <option value="location">Location (A-Z)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onUserFilterChange(null)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${userFilter === null
                                                ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800'
                                                : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            All
                                        </button>
                                        {(['melo', 'may'] as User[]).map((user) => {
                                            const isActive = userFilter === user;
                                            return (
                                                <button
                                                    key={user}
                                                    onClick={() => onUserFilterChange(isActive ? null : user)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${isActive
                                                        ? 'ring-1 ring-current'
                                                        : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10'
                                                        }`}
                                                    style={isActive ? {
                                                        background: USERS[user].color + '15',
                                                        color: USERS[user].color
                                                    } : {}}
                                                >
                                                    <span>{USERS[user].avatar}</span>
                                                    {USERS[user].name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="px-5 py-3 border-b border-white/10 shrink-0">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                        <Filter size={12} />
                                        <span>Filter by vibe</span>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.entries(FLAG_CONFIG).map(([key, config]) => {
                                            const Icon = config.icon;
                                            const isActive = activeTypeFilter === key;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => setActiveTypeFilter(isActive ? null : key)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${isActive
                                                        ? `${config.bg} ${config.color} ring-1 ring-current`
                                                        : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10'
                                                        }`}
                                                >
                                                    <Icon size={12} className={isActive ? 'fill-current' : ''} />
                                                    {config.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
                                    <div className="space-y-2">
                                        {filteredMemories.map((memory) => {
                                            const config = FLAG_CONFIG[memory.type as keyof typeof FLAG_CONFIG];
                                            const Icon = config.icon;
                                            const userInfo = USERS[memory.addedBy];
                                            return (
                                                <button
                                                    key={memory.id}
                                                    onClick={() => {
                                                        onMemoryClick?.(memory);
                                                        if (isMobile) onClose();
                                                    }}
                                                    className="w-full text-left p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all group"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center ${config.color} shrink-0 relative`}>
                                                            <Icon size={18} className="fill-current" />
                                                            <span
                                                                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center border-2 border-white dark:border-gray-800"
                                                                style={{ background: userInfo.color, color: 'white' }}
                                                            >
                                                                {memory.addedBy[0].toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h3 className="font-medium text-sm text-gray-800 dark:text-white truncate">{memory.name}</h3>
                                                                <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{memory.memo}</p>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                                    <Calendar size={10} />
                                                                    <span>{formatDateDisplay(memory.date)}</span>
                                                                </div>
                                                                <span
                                                                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                                                                    style={{ background: userInfo.color + '15', color: userInfo.color }}
                                                                >
                                                                    {userInfo.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {filteredMemories.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            <MapPin size={24} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No memories found</p>
                                            <p className="text-xs mt-1">Try adjusting your filters</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="stats"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 overflow-y-auto scrollbar-thin p-4 space-y-5"
                            >
                                {/* EMBEDDED STATS VIEW */}
                                {stats && (
                                    <>
                                        {/* Big Summary Card */}
                                        <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-md shadow-sm">
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <Heart className="text-pink-500 fill-pink-500 animate-pulse" size={16} />
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total Memories</span>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-5xl font-bold text-gray-800 dark:text-white mb-1">
                                                    {stats.total}
                                                </div>
                                                <div className="text-xs text-gray-400 font-medium">moments treasured</div>
                                            </div>
                                        </div>

                                        {/* Grid Stats */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div
                                                onClick={() => toggleSection('countries')}
                                                className="bg-black/5 dark:bg-white/5 rounded-xl p-3 text-center transition-colors hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                                            >
                                                <Globe size={20} className="mx-auto mb-1.5 text-gray-500 dark:text-gray-400" />
                                                <div className="text-xl font-bold text-gray-800 dark:text-white">{stats.countriesCount}</div>
                                                <div className="text-[10px] text-gray-500 uppercase font-medium flex items-center justify-center gap-1">
                                                    Countries
                                                    {expandedStats.countries ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => toggleSection('cities')}
                                                className="bg-black/5 dark:bg-white/5 rounded-xl p-3 text-center transition-colors hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                                            >
                                                <MapPin size={20} className="mx-auto mb-1.5 text-gray-500 dark:text-gray-400" />
                                                <div className="text-xl font-bold text-gray-800 dark:text-white">{stats.citiesCount}</div>
                                                <div className="text-[10px] text-gray-500 uppercase font-medium flex items-center justify-center gap-1">
                                                    Cities
                                                    {expandedStats.cities ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Countries List */}
                                        {expandedStats.countries && stats.countriesList.length > 0 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="bg-black/5 dark:bg-white/5 rounded-xl p-3 overflow-hidden"
                                            >
                                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pl-1">Countries</h3>
                                                <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin pr-1">
                                                    {stats.countriesList.map((item) => (
                                                        <div
                                                            key={item.name}
                                                            onClick={() => handleLocationClick('country', item.name)}
                                                            className="flex justify-between items-center text-xs py-1 px-2 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer group"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <MapPin size={10} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[120px]">{item.name}</span>
                                                            </div>
                                                            <span className="bg-white/20 dark:bg-black/20 px-1.5 py-0.5 rounded text-[10px] text-gray-500">{item.count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Cities List */}
                                        {expandedStats.cities && stats.citiesList.length > 0 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="bg-black/5 dark:bg-white/5 rounded-xl p-3 overflow-hidden"
                                            >
                                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pl-1">Cities</h3>
                                                <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin pr-1">
                                                    {stats.citiesList.map((item) => (
                                                        <div
                                                            key={item.name}
                                                            onClick={() => handleLocationClick('city', item.name)}
                                                            className="flex justify-between items-center text-xs py-1 px-2 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer group"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <MapPin size={10} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[120px]">{item.name}</span>
                                                            </div>
                                                            <span className="bg-white/20 dark:bg-black/20 px-1.5 py-0.5 rounded text-[10px] text-gray-500">{item.count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Type Breakdown */}
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 pl-1">Vibe Check</h3>
                                            <div className="space-y-3">
                                                {Object.entries(stats.byType).map(([type, count]) => {
                                                    const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
                                                    const Icon = config.icon;
                                                    const percentage = (count / stats.total) * 100;
                                                    return (
                                                        <div key={type} className="flex items-center gap-3 group">
                                                            <div
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                                                                style={{ backgroundColor: `${config.color}15` }}
                                                            >
                                                                <Icon size={14} style={{ color: config.color }} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between text-xs mb-1.5">
                                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{config.label}</span>
                                                                    <span className="text-gray-500 font-mono">{count}</span>
                                                                </div>
                                                                <div className="h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${percentage}%` }}
                                                                        transition={{ delay: 0.1, duration: 0.5 }}
                                                                        className="h-full rounded-full"
                                                                        style={{ backgroundColor: config.color }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Top Destination */}
                                        {stats.topCountry && (
                                            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 border border-white/5 transition-colors hover:bg-black/10 dark:hover:bg-white/10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                                        <TrendingUp size={20} className="text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Top Destination</div>
                                                        <div className="text-base font-bold text-gray-800 dark:text-white">{stats.topCountry[0]}</div>
                                                        <div className="text-xs text-blue-500 font-medium">{stats.topCountry[1]} memories</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Quote */}
                <div className="p-4 border-t border-white/10 text-center shrink-0">
                    <p className="text-xs text-gray-400 italic">"Every place tells our story"</p>
                </div>
            </div>
        </div>
    );
}
