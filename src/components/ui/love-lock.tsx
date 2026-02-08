'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Heart, ArrowRight } from 'lucide-react';
import { DatePicker } from './date-picker';

const CORRECT_DATE = '2025-11-06'; // User should update this!

export function LoveLock() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [dateInput, setDateInput] = useState('');
    const [error, setError] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
        const auth = localStorage.getItem('love-map-auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();

        if (dateInput === CORRECT_DATE) {
            localStorage.setItem('love-map-auth', 'true');
            setIsAuthenticated(true);
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    if (!hydrated) return null;
    if (isAuthenticated) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 h-screen w-screen overflow-hidden dark"
            >
                {/* Background Ambient Glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
                </div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-sm relative z-10 flex flex-col md:items-center"
                >
                    <div className="text-center mb-10 w-full">
                        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl backdrop-blur-md ring-1 ring-white/10">
                            <Lock size={32} className="text-white/80" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
                        <p className="text-white/50 text-sm">When is the date to be together?</p>
                    </div>

                    <form onSubmit={handleUnlock} className="glass w-full p-2 rounded-2xl flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl relative group transition-all focus-within:ring-2 focus-within:ring-white/20">
                        <div className="flex-1">
                            <DatePicker
                                value={dateInput}
                                onChange={(date: string) => {
                                    setDateInput(date);
                                    if (error) setError(false);
                                }}
                                className="w-full text-white"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!dateInput}
                            className={`h-12 w-12 rounded-xl flex shrink-0 items-center justify-center transition-all duration-300 ${dateInput
                                ? 'bg-white text-black hover:scale-105 active:scale-95 shadow-lg shadow-white/10 cursor-pointer'
                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                                }`}
                        >
                            <ArrowRight size={20} />
                        </button>

                        {/* Error Overlay */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-red-500/90 backdrop-blur-sm flex items-center justify-center z-20 pointer-events-none rounded-2xl"
                            >
                                <span className="text-white font-medium text-sm flex items-center gap-2">
                                    Wrong Date <Heart size={14} className="fill-white text-white" />
                                </span>
                            </motion.div>
                        )}
                    </form>

                    <div className="text-center mt-12 opacity-30 hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white font-light tracking-[0.2em] uppercase">Secured by Love Map</p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
