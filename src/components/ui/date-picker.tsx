'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    className?: string;
}

export function DatePicker({ value, onChange, className = '' }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Helper to parse YYYY-MM-DD as local date to avoid timezone shifts
    const parseLocalDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        // Handle "YYYY-MM-DD" manually to ensure local time construction
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        return new Date(dateStr);
    };

    // Parse current value or use today
    const selectedDate = value ? parseLocalDate(value) : new Date();

    // State for the calendar view (month/year)
    const [viewDate, setViewDate] = useState(new Date(selectedDate));

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update view date when value changes externally
    useEffect(() => {
        if (value) {
            setViewDate(parseLocalDate(value));
        }
    }, [value]);

    // Calendar logic
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const generateCalendarDays = () => {
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} />);
        }
        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = value === dateStr;

            // Check if today (local comparison)
            const today = new Date();
            const isToday = today.getFullYear() === currentYear &&
                today.getMonth() === currentMonth &&
                today.getDate() === day;

            days.push(
                <button
                    key={day}
                    onClick={() => {
                        onChange(dateStr);
                        setIsOpen(false);
                    }}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-all flex items-center justify-center
                        ${isSelected
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : isToday
                                ? 'bg-black/5 dark:bg-white/10 text-blue-500 font-bold'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    return (
        <div ref={containerRef} className={`relative group ${className}`}>
            <div
                className={`absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 transition-colors ${isOpen ? 'text-gray-800 dark:text-white' : 'group-hover:text-gray-800 dark:group-hover:text-white'}`}
            >
                <CalendarIcon size={16} />
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
                {value ? parseLocalDate(value).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }) : 'Select Date'}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 p-4 w-64 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); changeMonth(-1); }}
                            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-300"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-bold text-gray-800 dark:text-white">
                            {monthNames[currentMonth]} {currentYear}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); changeMonth(1); }}
                            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-300"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-[10px] font-medium text-gray-400 uppercase">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1 place-items-center">
                        {generateCalendarDays()}
                    </div>
                </div>
            )}
        </div>
    );
}
