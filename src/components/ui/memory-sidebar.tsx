'use client';

import { useState, useMemo } from 'react';
import { Heart, Utensils, Plane, Mountain, X, Calendar, MapPin, Filter, ChevronRight, Users, TrendingUp, Camera, Globe, BarChart3, List } from 'lucide-react';
import { Memory, User } from '../map/memory-markers';
import { USERS } from '../../contexts/user-context';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export function MemorySidebar({
    isOpen,
    onClose,
    memories,
    userFilter,
    onUserFilterChange,
    onMemoryClick
}: MemorySidebarProps) {
    const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'memories' | 'stats'>('memories');

    // Apply both type and user filters for the LIST view
    const filteredMemories = useMemo(() => memories.filter(m => {
        const matchesType = !activeTypeFilter || m.type === activeTypeFilter;
        const matchesUser = !userFilter || m.addedBy === userFilter;
        return matchesType && matchesUser;
    }), [memories, activeTypeFilter, userFilter]);

    // Calculate statistics for the STATS view (using ALL memories to show full history)
    const stats = useMemo(() => {
        if (!memories.length) return null;

        const byType = memories.reduce((acc, m) => {
            acc[m.type] = (acc[m.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byCountry = memories.reduce((acc, m) => {
            if (m.country) acc[m.country] = (acc[m.country] || 0) + 1;
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

        return {
            total: memories.length,
            byType,
            byCountry,
            byYear,
            totalPhotos,
            topCountry,
            favoriteType,
            countriesCount: Object.keys(byCountry).length,
        };
    }, [memories]);

    if (!isOpen) return null;

    return (
        <div className="absolute top-0 left-0 bottom-0 w-80 z-30 flex flex-col pointer-events-none">
            {/* Sidebar Container - enable pointer events for contents */}
            <div className="glass-card h-full m-4 mr-0 flex flex-col overflow-hidden animate-slide-up pointer-events-auto shadow-2xl">

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
                    <div className="bg-black/5 dark:bg-white/10 p-1 rounded-xl flex relative">
                        {/* Sliding Indicator */}
                        <motion.div
                            className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                            initial={false}
                            animate={{
                                x: activeTab === 'memories' ? 0 : '100%',
                                width: '50%'
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={{ top: 4, bottom: 4, left: 4 }}
                        />

                        <button
                            onClick={() => setActiveTab('memories')}
                            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-1.5 text-xs font-medium transition-colors ${activeTab === 'memories' ? 'text-black dark:text-white' : 'text-gray-500'
                                }`}
                        >
                            <List size={14} />
                            Memories
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-1.5 text-xs font-medium transition-colors ${activeTab === 'stats' ? 'text-black dark:text-white' : 'text-gray-500'
                                }`}
                        >
                            <BarChart3 size={14} />
                            Stats
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
                                <div className="px-5 py-3 border-b border-white/10 shrink-0">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                        <Users size={12} />
                                        <span>Filter by person</span>
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
                                                    onClick={() => onMemoryClick?.(memory)}
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
                                                                    <span>{new Date(memory.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
                                            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 text-center transition-colors hover:bg-black/10 dark:hover:bg-white/10">
                                                <Globe size={20} className="mx-auto mb-1.5 text-gray-500 dark:text-gray-400" />
                                                <div className="text-xl font-bold text-gray-800 dark:text-white">{stats.countriesCount}</div>
                                                <div className="text-[10px] text-gray-500 uppercase font-medium">Countries</div>
                                            </div>
                                            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 text-center transition-colors hover:bg-black/10 dark:hover:bg-white/10">
                                                <Camera size={20} className="mx-auto mb-1.5 text-gray-500 dark:text-gray-400" />
                                                <div className="text-xl font-bold text-gray-800 dark:text-white">{stats.totalPhotos}</div>
                                                <div className="text-[10px] text-gray-500 uppercase font-medium">Photos</div>
                                            </div>
                                        </div>

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
