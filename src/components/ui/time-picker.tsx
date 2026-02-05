'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
    value: string;
    onChange: (time: string) => void;
    className?: string;
}

export function TimePicker({ value, onChange, className = '' }: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate time options (30 min intervals)
    const timeOptions = Array.from({ length: 48 }).map((_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        // Format as HH:MM
        const timeValue = `${hour.toString().padStart(2, '0')}:${minute}`;

        // Format for display (12-hour AM/PM)
        const date = new Date(`2000-01-01T${timeValue}`);
        const displayLabel = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        return { value: timeValue, label: displayLabel };
    });

    // Handle click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll to selected time when opening
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const selectedOption = containerRef.current.querySelector('[data-selected="true"]');
            if (selectedOption) {
                selectedOption.scrollIntoView({ block: 'center' });
            }
        }
    }, [isOpen]);

    // Find display label for current value
    const currentLabel = timeOptions.find(t => t.value === value)?.label || value;

    return (
        <div ref={containerRef} className={`relative group ${className}`}>
            <div
                className={`absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 transition-colors ${isOpen ? 'text-gray-800 dark:text-white' : 'group-hover:text-gray-800 dark:group-hover:text-white'}`}
            >
                <Clock size={16} />
            </div>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 backdrop-blur-md rounded-2xl py-3 pl-10 pr-3 text-sm font-semibold text-left outline-none border transition-all min-h-[46px] flex items-center
                    ${isOpen
                        ? 'bg-white/20 dark:bg-black/20 border-white/20 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-800 dark:text-white'
                    }`}
            >
                {value ? currentLabel : 'Select time'}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 scrollbar-hide">
                    <div className="p-1 space-y-0.5">
                        {timeOptions.map((option) => (
                            <button
                                key={option.value}
                                data-selected={option.value === value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between
                                    ${option.value === value
                                        ? 'bg-blue-500 text-white font-medium'
                                        : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'
                                    }`}
                            >
                                <span>{option.label}</span>
                                {option.value === value && <span className="text-xs opacity-70">✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
