'use client';

import { useState } from 'react';
import { Heart, Utensils, Plane, Mountain, X, Calendar, MapPin, Filter, ChevronRight, Users } from 'lucide-react';
import { Memory, User } from '../map/memory-markers';
import { USERS } from '../../contexts/user-context';

const FLAG_CONFIG = {
    love: { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Love' },
    food: { icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Food' },
    travel: { icon: Plane, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Travel' },
    adventure: { icon: Mountain, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Adventure' },
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

    // Apply both type and user filters
    const filteredMemories = memories.filter(m => {
        const matchesType = !activeTypeFilter || m.type === activeTypeFilter;
        const matchesUser = !userFilter || m.addedBy === userFilter;
        return matchesType && matchesUser;
    });

    // Stats - calculate unique countries and cities from memories
    const stats = {
        total: filteredMemories.length,
        countries: new Set(filteredMemories.map(m => m.country).filter(Boolean)).size,
        cities: new Set(filteredMemories.map(m => m.city).filter(Boolean)).size,
    };

    if (!isOpen) return null;

    return (
        <div className="absolute top-0 left-0 bottom-0 w-80 z-30 flex flex-col">
            {/* Sidebar Container */}
            <div className="glass-card h-full m-4 mr-0 flex flex-col overflow-hidden animate-slide-up">

                {/* Header */}
                <div className="p-5 border-b border-white/10">
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

                    {/* Stats Row */}
                    <div className="flex gap-3">
                        <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Memories</div>
                        </div>
                        <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.countries}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Countries</div>
                        </div>
                        <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.cities}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Cities</div>
                        </div>
                    </div>
                </div>

                {/* User Filter Pills */}
                <div className="px-5 py-3 border-b border-white/10">
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

                {/* Type Filter Pills */}
                <div className="px-5 py-3 border-b border-white/10">
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

                {/* Memory List */}
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
                                            {/* User indicator */}
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

                {/* Footer Quote */}
                <div className="p-4 border-t border-white/10 text-center">
                    <p className="text-xs text-gray-400 italic">"Every place tells our story"</p>
                </div>
            </div>
        </div>
    );
}
