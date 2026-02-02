'use client';

import { useState } from 'react';
import { Camera, Heart, Utensils, Plane, Mountain, X } from 'lucide-react';

interface AddMemoryModalProps {
    lat: number;
    lng: number;
    placeName?: string;
    onClose: () => void;
    onSave: (data: any) => void;
}

const FLAGS = [
    { id: 'love', label: 'Love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/20' },
    { id: 'food', label: 'Yum', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
    { id: 'travel', label: 'Trip', icon: Plane, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    { id: 'adventure', label: 'Fun', icon: Mountain, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
];

export function AddMemoryModal({ lat, lng, placeName, onClose, onSave }: AddMemoryModalProps) {
    const [memo, setMemo] = useState('');
    const [selectedFlag, setSelectedFlag] = useState(FLAGS[0].id);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4">
            <div className="glass-card w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl ring-1 ring-white/20">

                {/* Header Photo Placeholder */}
                <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:opacity-90 transition-opacity relative group">
                    <Camera size={32} className="group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs mt-2 font-medium tracking-wide">Add Cover Photo</span>
                </div>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {placeName || "New Memory"}
                            </h2>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 font-mono">
                                📍 {lat.toFixed(4)}, {lng.toFixed(4)}
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 -mr-2 -mt-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Flag Selector */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        {FLAGS.map((flag) => {
                            const Icon = flag.icon;
                            const isSelected = selectedFlag === flag.id;
                            return (
                                <button
                                    key={flag.id}
                                    onClick={() => setSelectedFlag(flag.id)}
                                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border transition-all ${isSelected
                                            ? `${flag.bg} ${flag.color} scale-105 shadow-sm`
                                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400'
                                        }`}
                                >
                                    <Icon size={20} className={isSelected ? 'fill-current' : ''} />
                                    <span className="text-[10px] font-medium mt-1">{flag.label}</span>
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
                            onClick={() => onSave({ lat, lng, memo, type: selectedFlag })}
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
