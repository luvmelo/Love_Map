'use client';

import { useMemo } from 'react';
import { X, PartyPopper, Calendar, MapPin } from 'lucide-react';
import { Memory } from '../map/memory-markers';

interface AnniversaryBannerProps {
    memories: Memory[];
    onClose: () => void;
    onMemoryClick: (memory: Memory) => void;
}

interface UpcomingAnniversary {
    memory: Memory;
    daysUntil: number;
    yearsAgo: number;
    anniversaryDate: Date;
}

/**
 * Calculate upcoming anniversaries from a list of memories
 */
function getUpcomingAnniversaries(memories: Memory[], daysAhead: number = 30): UpcomingAnniversary[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: UpcomingAnniversary[] = [];

    for (const memory of memories) {
        const memoryDate = new Date(memory.date);
        const memoryMonth = memoryDate.getMonth();
        const memoryDay = memoryDate.getDate();

        // Calculate this year's anniversary
        const thisYearAnniversary = new Date(today.getFullYear(), memoryMonth, memoryDay);

        // If this year's anniversary has passed, use next year's
        let anniversaryDate = thisYearAnniversary;
        if (thisYearAnniversary < today) {
            anniversaryDate = new Date(today.getFullYear() + 1, memoryMonth, memoryDay);
        }

        // Calculate days until anniversary
        const diffTime = anniversaryDate.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calculate years since original memory
        const yearsAgo = anniversaryDate.getFullYear() - memoryDate.getFullYear();

        // Include if within the specified window
        if (daysUntil >= 0 && daysUntil <= daysAhead) {
            upcoming.push({
                memory,
                daysUntil,
                yearsAgo,
                anniversaryDate,
            });
        }
    }

    // Sort by days until (soonest first)
    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}

function formatRelativeDate(daysUntil: number): string {
    if (daysUntil === 0) return 'Today! 🎉';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 7) return `In ${daysUntil} days`;
    const weeks = Math.floor(daysUntil / 7);
    return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
}

export function AnniversaryBanner({ memories, onClose, onMemoryClick }: AnniversaryBannerProps) {
    const upcomingAnniversaries = useMemo(() => getUpcomingAnniversaries(memories, 30), [memories]);

    // Don't render if no upcoming anniversaries
    if (upcomingAnniversaries.length === 0) return null;

    // Get the most urgent one (today or soonest)
    const featured = upcomingAnniversaries[0];
    const isToday = featured.daysUntil === 0;

    return (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 animate-in slide-in-from-top duration-500`}>
            <div className={`relative overflow-hidden rounded-2xl shadow-lg ${isToday
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500'
                    : 'glass-card'
                }`}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${isToday
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-black/5 hover:bg-black/10 text-gray-500'
                        }`}
                >
                    <X size={16} />
                </button>

                <div
                    className="p-4 cursor-pointer"
                    onClick={() => onMemoryClick(featured.memory)}
                >
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isToday
                                ? 'bg-white/20'
                                : 'bg-pink-500/10'
                            }`}>
                            <PartyPopper size={24} className={isToday ? 'text-white' : 'text-pink-500'} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium uppercase tracking-wider mb-1 ${isToday ? 'text-white/80' : 'text-pink-500'
                                }`}>
                                {isToday ? '🎊 Anniversary Today!' : `${formatRelativeDate(featured.daysUntil)}`}
                            </div>

                            <p className={`font-semibold truncate ${isToday ? 'text-white' : ''}`}>
                                {featured.memory.name}
                            </p>

                            <div className={`flex items-center gap-3 mt-1 text-xs ${isToday ? 'text-white/70' : 'text-gray-500'
                                }`}>
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {featured.yearsAgo} year{featured.yearsAgo !== 1 ? 's' : ''} ago
                                </span>
                                {featured.memory.city && (
                                    <span className="flex items-center gap-1">
                                        <MapPin size={12} />
                                        {featured.memory.city}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* More anniversaries indicator */}
                    {upcomingAnniversaries.length > 1 && (
                        <div className={`mt-3 pt-3 border-t text-xs text-center ${isToday
                                ? 'border-white/20 text-white/60'
                                : 'border-black/5 text-gray-400'
                            }`}>
                            +{upcomingAnniversaries.length - 1} more upcoming anniversaries
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
