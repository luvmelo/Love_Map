'use client';

import { useState, useRef, useMemo } from 'react';
import { Camera, Heart, Utensils, Plane, Mountain, X, Edit3, Trash2, Calendar, MapPin, Check, ImagePlus, Clock, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Memory, User } from './memory-markers';
import { USERS } from '../../contexts/user-context';
import { shareMemory } from '@/lib/share-utils';
import { TimePicker } from '../ui/time-picker';
import { DatePicker } from '../ui/date-picker';
import { formatDateDisplay } from '@/lib/date-utils';
import { processImageFile } from '@/lib/image-utils';
import { motion, AnimatePresence, wrap } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

const FLAGS = [
    { id: 'love', label: 'Love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/20', fill: 'fill-pink-500' },
    { id: 'food', label: 'Yum', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', fill: 'fill-orange-500' },
    { id: 'travel', label: 'Trip', icon: Plane, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', fill: 'fill-blue-500' },
    { id: 'adventure', label: 'Fun', icon: Mountain, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20', fill: 'fill-green-500' },
];

const REACTION_EMOJIS = ['❤️', '😍', '🥰', '✨', '🔥', '💕', '🎉', '😊'];

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
};

interface MemoryDetailModalProps {
    memory: Memory;
    currentUser: User;
    onClose: () => void;
    onSave?: (data: Partial<Memory> & { coverPhotoFile?: File }) => void;
    onDelete?: (id: string) => void;
    onReaction?: (memoryId: string, emoji: string) => void;
}

export function MemoryDetailModal({ memory, currentUser, onClose, onSave, onDelete, onReaction }: MemoryDetailModalProps) {
    const isMobile = useIsMobile();
    const [isEditing, setIsEditing] = useState(false);
    const [editedMemo, setEditedMemo] = useState(memory.memo);
    const [editedType, setEditedType] = useState(memory.type);
    const [editedDate, setEditedDate] = useState(memory.date.split('T')[0]);
    const [editedTime, setEditedTime] = useState(memory.time || '');
    const [editedPhoto, setEditedPhoto] = useState<File | null>(null);
    const [editedPhotoPreview, setEditedPhotoPreview] = useState<string | null>(memory.coverPhotoUrl || null);
    const [isSharing, setIsSharing] = useState(false);

    // Carousel state
    const [[page, direction], setPage] = useState([0, 0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const config = FLAGS.find(f => f.id === memory.type) || FLAGS[0];
    const editingConfig = FLAGS.find(f => f.id === editedType) || FLAGS[0];
    const userInfo = USERS[memory.addedBy];
    const Icon = config.icon;

    // Determine all photos to show
    const allPhotos = useMemo(() => {
        const photos = [];
        // If editing and have new preview, show that
        if (isEditing && editedPhotoPreview) {
            photos.push(editedPhotoPreview);
        }
        // Otherwise show existing photos
        else {
            if (memory.coverPhotoUrl) photos.push(memory.coverPhotoUrl);
            if (memory.photos && memory.photos.length > 0) photos.push(...memory.photos);
        }
        return photos;
    }, [memory.coverPhotoUrl, memory.photos, isEditing, editedPhotoPreview]);

    const currentPhotoIndex = wrap(0, allPhotos.length, page);

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    // Handle photo selection
    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const processedFile = await processImageFile(file);
            setEditedPhoto(processedFile);

            const reader = new FileReader();
            reader.onloadend = () => {
                setEditedPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(processedFile);
        } catch (err: any) {
            console.error('Photo processing failed:', err);
            alert(err.message || 'Could not assign photo');
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
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                // Mobile: fixed height 85dvh for consistency
                // Desktop: auto height based on content
                className={`fixed bottom-0 sm:bottom-auto sm:top-1/2 left-0 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[28rem] bg-white dark:bg-black/90 backdrop-blur-xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border-t sm:border border-white/20 z-50 flex flex-col ${isMobile ? 'h-[85dvh]' : 'max-h-[90dvh]'}`}
            >

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    className="hidden"
                />

                <div
                    className={`h-64 bg-black relative group overflow-hidden ${isEditing ? 'cursor-pointer' : ''}`}
                    onClick={isEditing ? () => fileInputRef.current?.click() : undefined}
                >
                    <AnimatePresence initial={false} mode="popLayout">
                        {allPhotos.length > 0 ? (
                            <motion.div
                                key={currentPhotoIndex}
                                className="absolute inset-0 flex items-center justify-center bg-black"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                drag={!isEditing && allPhotos.length > 1 ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(e, { offset, velocity }) => {
                                    const swipe = swipePower(offset.x, velocity.x);
                                    if (swipe < -swipeConfidenceThreshold) {
                                        paginate(1);
                                    } else if (swipe > swipeConfidenceThreshold) {
                                        paginate(-1);
                                    }
                                }}
                            >
                                <img
                                    src={allPhotos[currentPhotoIndex]}
                                    alt={`Photo ${currentPhotoIndex + 1}`}
                                    className="w-full h-full object-contain"
                                    draggable="false"
                                />
                            </motion.div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center relative">
                                {/* Abstract pattern background */}
                                <div className="absolute inset-0 opacity-30">
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            background: `radial-gradient(circle at 30% 70%, ${config.color.includes('pink') ? '#ec489940' : config.color.includes('orange') ? '#f9731640' : config.color.includes('blue') ? '#3b82f640' : '#22c55e40'} 0%, transparent 50%)`,
                                        }}
                                    />
                                </div>
                                <div className={`w-16 h-16 rounded-2xl ${config.bg} border flex items-center justify-center ${config.color} relative z-10`}>
                                    <Icon size={32} className="fill-current" />
                                </div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Gradient Overlay for Text Visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                    {isEditing && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                            <div className="text-white text-center">
                                <ImagePlus size={24} className="mx-auto mb-1" />
                                <span className="text-xs font-medium">Change Cover</span>
                            </div>
                        </div>
                    )}

                    {/* Navigation Arrows */}
                    {!isEditing && allPhotos.length > 1 && (
                        <>
                            <button
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/80 transition-all opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm"
                                onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/80 transition-all opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm"
                                onClick={(e) => { e.stopPropagation(); paginate(1); }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}

                    {/* Dots Indicator */}
                    {!isEditing && allPhotos.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                            {allPhotos.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setPage([idx, idx > currentPhotoIndex ? 1 : -1]); }}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentPhotoIndex ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/60'}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Close button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full glass hover:bg-black/5 dark:hover:bg-white/10 text-white transition-colors z-30"
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
                                <div className="flex items-center gap-3 w-full">
                                    <DatePicker
                                        value={editedDate}
                                        onChange={(date) => setEditedDate(date)}
                                        className="flex-1"
                                    />
                                    <TimePicker
                                        value={editedTime}
                                        onChange={(time) => setEditedTime(time)}
                                        className="w-32"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-full">
                                    <Calendar size={12} />
                                    <span>{formatDateDisplay(memory.date)}</span>
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
                            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 h-32 overflow-y-auto scrollbar-thin">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
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
            </motion.div>
        </div >
    );
}
