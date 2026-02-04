'use client';

import { useState, useRef } from 'react';
import { Camera, Heart, Utensils, Plane, Mountain, X, Edit3, Trash2, Calendar, MapPin, Check, ImagePlus, Clock, Share2 } from 'lucide-react';
import { Memory, User } from './memory-markers';
import { USERS } from '../../contexts/user-context';
import { shareMemory } from '@/lib/share-utils';

const FLAGS = [
    { id: 'love', label: 'Love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/20', fill: 'fill-pink-500' },
    { id: 'food', label: 'Yum', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', fill: 'fill-orange-500' },
    { id: 'travel', label: 'Trip', icon: Plane, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', fill: 'fill-blue-500' },
    { id: 'adventure', label: 'Fun', icon: Mountain, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20', fill: 'fill-green-500' },
];

const REACTION_EMOJIS = ['❤️', '😍', '🥰', '✨', '🔥', '💕', '🎉', '😊'];

interface MemoryDetailModalProps {
    memory: Memory;
    currentUser: User;
    onClose: () => void;
    onSave?: (data: Partial<Memory> & { coverPhotoFile?: File }) => void;
    onDelete?: (id: string) => void;
    onReaction?: (memoryId: string, emoji: string) => void;
}

export function MemoryDetailModal({ memory, currentUser, onClose, onSave, onDelete, onReaction }: MemoryDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedMemo, setEditedMemo] = useState(memory.memo);
    const [editedType, setEditedType] = useState(memory.type);
    const [editedDate, setEditedDate] = useState(memory.date.split('T')[0]);
    const [editedTime, setEditedTime] = useState(memory.time || '');
    const [editedPhoto, setEditedPhoto] = useState<File | null>(null);
    const [editedPhotoPreview, setEditedPhotoPreview] = useState<string | null>(memory.coverPhotoUrl || null);
    const [isSharing, setIsSharing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const config = FLAGS.find(f => f.id === memory.type) || FLAGS[0];
    const editingConfig = FLAGS.find(f => f.id === editedType) || FLAGS[0];
    const userInfo = USERS[memory.addedBy];
    const Icon = config.icon;

    // Handle photo selection
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditedPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditedPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onSave?.({
            memo: editedMemo,
            type: editedType,
            date: editedDate,
            time: editedTime || undefined,
            coverPhotoFile: editedPhoto || undefined,
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedMemo(memory.memo);
        setEditedType(memory.type);
        setEditedDate(memory.date.split('T')[0]);
        setEditedTime(memory.time || '');
        setEditedPhoto(null);
        setEditedPhotoPreview(memory.coverPhotoUrl || null);
        setIsEditing(false);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl ring-1 ring-white/20">

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    className="hidden"
                />

                {/* Header Photo Area - now shows cover photo if available */}
                <div
                    onClick={isEditing ? () => fileInputRef.current?.click() : undefined}
                    className={`h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center relative overflow-hidden ${isEditing ? 'cursor-pointer group' : ''}`}
                >
                    {/* Show cover photo if available */}
                    {editedPhotoPreview ? (
                        <>
                            <img
                                src={editedPhotoPreview}
                                alt="Cover"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="text-white text-center">
                                        <ImagePlus size={24} className="mx-auto mb-1" />
                                        <span className="text-xs font-medium">Change Photo</span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Abstract pattern background */}
                            <div className="absolute inset-0 opacity-30">
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: `radial-gradient(circle at 30% 70%, ${config.color.includes('pink') ? '#ec489940' : config.color.includes('orange') ? '#f9731640' : config.color.includes('blue') ? '#3b82f640' : '#22c55e40'} 0%, transparent 50%)`,
                                    }}
                                />
                            </div>
                            {/* Category Icon or Add Photo prompt */}
                            {isEditing ? (
                                <div className="relative z-10 text-gray-400 text-center group-hover:scale-110 transition-transform">
                                    <Camera size={32} className="mx-auto" />
                                    <span className="text-xs mt-1 block">Add Cover Photo</span>
                                </div>
                            ) : (
                                <div className={`w-16 h-16 rounded-2xl ${config.bg} border flex items-center justify-center ${config.color} relative z-10`}>
                                    <Icon size={32} className="fill-current" />
                                </div>
                            )}
                        </>
                    )}
                    {/* Close button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full glass hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors z-20"
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

                    {/* Date, Time & User */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {isEditing ? (
                            <>
                                <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-full flex-1">
                                    <Calendar size={12} className="text-gray-400" />
                                    <input
                                        type="date"
                                        value={editedDate}
                                        onChange={(e) => setEditedDate(e.target.value)}
                                        className="bg-transparent text-xs text-gray-700 dark:text-gray-300 outline-none w-full"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-full">
                                    <Clock size={12} className="text-gray-400" />
                                    <input
                                        type="time"
                                        value={editedTime}
                                        onChange={(e) => setEditedTime(e.target.value)}
                                        className="bg-transparent text-xs text-gray-700 dark:text-gray-300 outline-none w-16"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-full">
                                    <Calendar size={12} />
                                    <span>{new Date(memory.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                {memory.time && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-full">
                                        <Clock size={12} />
                                        <span>{memory.time}</span>
                                    </div>
                                )}
                            </>
                        )}
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
                                <div className="flex gap-3 pb-2">
                                    {FLAGS.map((flag) => {
                                        const FlagIcon = flag.icon;
                                        const isSelected = editedType === flag.id;
                                        return (
                                            <button
                                                key={flag.id}
                                                onClick={() => setEditedType(flag.id as Memory['type'])}
                                                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${isSelected
                                                    ? `${flag.color} bg-current/10`
                                                    : 'text-gray-400 hover:text-gray-500'
                                                    }`}
                                            >
                                                <FlagIcon size={22} className={isSelected ? 'fill-current' : ''} />
                                                <span className={`text-[9px] font-medium mt-0.5 ${isSelected ? flag.color : ''}`}>{flag.label}</span>
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

                    {/* Reactions - Glassy emoji picker */}
                    {!isEditing && (
                        <div className="space-y-2">
                            {/* Existing reactions display */}
                            {memory.reactions && memory.reactions.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {memory.reactions.map((r, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-full text-sm shadow-sm border border-white/40 dark:border-white/20"
                                        >
                                            <span>{r.emoji}</span>
                                            <span className="text-xs text-gray-500">{USERS[r.userId].avatar}</span>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Emoji picker */}
                            <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-hide">
                                {REACTION_EMOJIS.map((emoji) => {
                                    const hasReacted = memory.reactions?.some(
                                        r => r.emoji === emoji && r.userId === currentUser
                                    );
                                    return (
                                        <button
                                            key={emoji}
                                            onClick={() => onReaction?.(memory.id, emoji)}
                                            className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${hasReacted
                                                ? 'bg-pink-500/20 ring-2 ring-pink-500/40'
                                                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20'
                                                }`}
                                        >
                                            <span className="text-lg">{emoji}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

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
                                    onClick={async () => {
                                        setIsSharing(true);
                                        await shareMemory(memory);
                                        setIsSharing(false);
                                    }}
                                    disabled={isSharing}
                                    className="p-2.5 rounded-xl hover:bg-blue-500/10 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                                    title="Share memory"
                                >
                                    <Share2 size={18} className={isSharing ? 'animate-pulse' : ''} />
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
