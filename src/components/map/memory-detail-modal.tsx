'use client';

import { useState } from 'react';
import { Camera, Heart, Utensils, Plane, Mountain, X, Edit3, Trash2, Calendar, MapPin, Check } from 'lucide-react';
import { Memory } from './memory-markers';
import { USERS } from '../../contexts/user-context';

const FLAGS = [
    { id: 'love', label: 'Love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/20', fill: 'fill-pink-500' },
    { id: 'food', label: 'Yum', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', fill: 'fill-orange-500' },
    { id: 'travel', label: 'Trip', icon: Plane, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', fill: 'fill-blue-500' },
    { id: 'adventure', label: 'Fun', icon: Mountain, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20', fill: 'fill-green-500' },
];

interface MemoryDetailModalProps {
    memory: Memory;
    onClose: () => void;
    onSave?: (data: Partial<Memory>) => void;
    onDelete?: (id: string) => void;
}

export function MemoryDetailModal({ memory, onClose, onSave, onDelete }: MemoryDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedMemo, setEditedMemo] = useState(memory.memo);
    const [editedType, setEditedType] = useState(memory.type);

    const config = FLAGS.find(f => f.id === memory.type) || FLAGS[0];
    const editingConfig = FLAGS.find(f => f.id === editedType) || FLAGS[0];
    const userInfo = USERS[memory.addedBy];
    const Icon = config.icon;

    const handleSave = () => {
        onSave?.({ memo: editedMemo, type: editedType });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedMemo(memory.memo);
        setEditedType(memory.type);
        setIsEditing(false);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl ring-1 ring-white/20">

                {/* Header Photo Placeholder - could show cover image if available */}
                <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center relative overflow-hidden">
                    {/* Abstract pattern background */}
                    <div className="absolute inset-0 opacity-30">
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `radial-gradient(circle at 30% 70%, ${config.color.includes('pink') ? '#ec489940' : config.color.includes('orange') ? '#f9731640' : config.color.includes('blue') ? '#3b82f640' : '#22c55e40'} 0%, transparent 50%)`,
                            }}
                        />
                    </div>
                    {/* Category Icon */}
                    <div className={`w-16 h-16 rounded-2xl ${config.bg} border flex items-center justify-center ${config.color} relative z-10`}>
                        <Icon size={32} className="fill-current" />
                    </div>
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 rounded-full glass hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5">
                    {/* Title & Location */}
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {memory.name}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin size={12} />
                            <span className="font-mono">{memory.lat.toFixed(4)}, {memory.lng.toFixed(4)}</span>
                        </div>
                    </div>

                    {/* Date & User */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-full">
                            <Calendar size={12} />
                            <span>{new Date(memory.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full"
                            style={{ background: userInfo.color + '15', color: userInfo.color }}
                        >
                            <span>{userInfo.avatar}</span>
                            <span className="font-medium">{userInfo.name}</span>
                        </div>
                    </div>

                    {/* Memo Content */}
                    <div className="mb-5">
                        {isEditing ? (
                            <div className="space-y-4">
                                {/* Flag Selector for Editing */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {FLAGS.map((flag) => {
                                        const FlagIcon = flag.icon;
                                        const isSelected = editedType === flag.id;
                                        return (
                                            <button
                                                key={flag.id}
                                                onClick={() => setEditedType(flag.id as Memory['type'])}
                                                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border transition-all ${isSelected
                                                    ? `${flag.bg} ${flag.color} scale-105 shadow-sm`
                                                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400'
                                                    }`}
                                            >
                                                <FlagIcon size={18} className={isSelected ? 'fill-current' : ''} />
                                                <span className="text-[9px] font-medium mt-0.5">{flag.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <textarea
                                    value={editedMemo}
                                    onChange={(e) => setEditedMemo(e.target.value)}
                                    className="w-full h-24 bg-black/5 dark:bg-white/5 rounded-xl p-3 resize-none outline-none text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="Write something sweet..."
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {memory.memo}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <Check size={16} />
                                    Save
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => onDelete?.(memory.id)}
                                    className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete memory"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit3 size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Done
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
