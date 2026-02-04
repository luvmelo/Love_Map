'use client';

import { useMemo } from 'react';
import { X, Heart, Utensils, Plane, Mountain, Globe, Calendar, Camera, TrendingUp } from 'lucide-react';
import { Memory } from '../map/memory-markers';
import { motion, AnimatePresence } from 'framer-motion';

interface StatsViewProps {
    isOpen: boolean;
    onClose: () => void;
    memories: Memory[];
}

const TYPE_CONFIG = {
    love: { icon: Heart, color: '#ec4899', label: 'Love' },
    food: { icon: Utensils, color: '#f97316', label: 'Food' },
    travel: { icon: Plane, color: '#3b82f6', label: 'Travel' },
    adventure: { icon: Mountain, color: '#22c55e', label: 'Adventure' },
};

export function StatsView({ isOpen, onClose, memories }: StatsViewProps) {
    // Calculate statistics
    const stats = useMemo(() => {
        if (!memories.length) return null;

        // By type
        const byType = memories.reduce((acc, m) => {
            acc[m.type] = (acc[m.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // By country
        const byCountry = memories.reduce((acc, m) => {
            if (m.country) {
                acc[m.country] = (acc[m.country] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        // By year
        const byYear = memories.reduce((acc, m) => {
            const year = new Date(m.date).getFullYear();
            acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        // Total photos
        const totalPhotos = memories.reduce((acc, m) => {
            let count = m.coverPhotoUrl ? 1 : 0;
            count += m.photos?.length || 0;
            return acc + count;
        }, 0);

        // Top country
        const topCountry = Object.entries(byCountry).sort((a, b) => b[1] - a[1])[0];

        // Favorite type
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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-3xl glass-card"
                >
                    {/* Header with gradient */}
                    <div className="relative h-32 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 p-6">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <div className="absolute bottom-4 left-6">
                            <h2 className="text-2xl font-bold text-white">Your Year in Love 💕</h2>
                            <p className="text-white/80 text-sm">A look back at your memories</p>
                        </div>
                    </div>

                    {/* Stats content */}
                    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-8rem)] scrollbar-thin">
                        {!stats ? (
                            <div className="text-center py-8 text-gray-500">
                                <Camera size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No memories yet. Start creating!</p>
                            </div>
                        ) : (
                            <>
                                {/* Big number hero */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring' }}
                                    className="text-center py-4"
                                >
                                    <div className="text-6xl font-bold text-gradient mb-2">{stats.total}</div>
                                    <div className="text-gray-500">memories together</div>
                                </motion.div>

                                {/* Quick stats row */}
                                <div className="grid grid-cols-3 gap-3">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 text-center"
                                    >
                                        <Globe size={24} className="mx-auto mb-2 text-blue-500" />
                                        <div className="text-2xl font-bold">{stats.countriesCount}</div>
                                        <div className="text-xs text-gray-500">countries</div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 text-center"
                                    >
                                        <Camera size={24} className="mx-auto mb-2 text-purple-500" />
                                        <div className="text-2xl font-bold">{stats.totalPhotos}</div>
                                        <div className="text-xs text-gray-500">photos</div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 text-center"
                                    >
                                        <Calendar size={24} className="mx-auto mb-2 text-green-500" />
                                        <div className="text-2xl font-bold">{Object.keys(stats.byYear).length}</div>
                                        <div className="text-xs text-gray-500">years</div>
                                    </motion.div>
                                </div>

                                {/* By Type breakdown */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="space-y-3"
                                >
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">By Type</h3>
                                    <div className="space-y-2">
                                        {Object.entries(stats.byType).map(([type, count]) => {
                                            const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
                                            const Icon = config.icon;
                                            const percentage = (count / stats.total) * 100;
                                            return (
                                                <div key={type} className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                        style={{ backgroundColor: `${config.color}20` }}
                                                    >
                                                        <Icon size={16} style={{ color: config.color }} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span>{config.label}</span>
                                                            <span className="text-gray-500">{count}</span>
                                                        </div>
                                                        <div className="h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${percentage}%` }}
                                                                transition={{ delay: 0.8, duration: 0.5 }}
                                                                className="h-full rounded-full"
                                                                style={{ backgroundColor: config.color }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>

                                {/* Top Places */}
                                {stats.topCountry && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7 }}
                                        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                                <TrendingUp size={24} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500">Top destination</div>
                                                <div className="text-lg font-bold">{stats.topCountry[0]}</div>
                                                <div className="text-xs text-blue-500">{stats.topCountry[1]} memories</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Fun fact */}
                                {stats.favoriteType && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.9 }}
                                        className="text-center py-4 bg-pink-500/5 rounded-2xl"
                                    >
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Your favorite activity type is{' '}
                                            <span className="font-bold" style={{ color: TYPE_CONFIG[stats.favoriteType[0] as keyof typeof TYPE_CONFIG]?.color }}>
                                                {TYPE_CONFIG[stats.favoriteType[0] as keyof typeof TYPE_CONFIG]?.label}
                                            </span>
                                            ! 🎉
                                        </p>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
