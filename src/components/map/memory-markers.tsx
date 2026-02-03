'use client';

import { useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';

// User type for the two-person system
export type User = 'melo' | 'may';

// Memory type with user assignment
export interface Memory {
    id: string;
    name: string;
    type: 'love' | 'food' | 'travel' | 'adventure';
    date: string;
    memo: string;
    lat: number;
    lng: number;
    addedBy: User;
    coverPhotoUrl?: string;
    photos?: string[];  // Array of photo URLs for multi-image support
}

// Pin colors matching your design system
const PIN_COLORS = {
    love: '#ec4899',      // Pink
    food: '#f97316',      // Orange
    travel: '#3b82f6',    // Blue
    adventure: '#22c55e', // Green
};

// User colors for avatar indicators
const USER_COLORS = {
    melo: '#6366f1',  // Indigo
    may: '#f472b6',   // Pink
};

// User emoji avatars for better differentiation
const USER_AVATARS = {
    melo: '🧑‍💻',
    may: '👩‍🎨',
};

// SVG icon paths for each memory type
const ICON_PATHS = {
    love: `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`,
    food: `<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>`,
    travel: `<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>`,
    adventure: `<path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/>`,
};

interface MemoryMarkersProps {
    memories: Memory[];
    onMemoryClick?: (memory: Memory) => void;
    filterByUser?: User | null;
}

// Create a custom pin element with icon
function createPinElement(memory: Memory): HTMLElement {
    const color = PIN_COLORS[memory.type];
    const userColor = USER_COLORS[memory.addedBy];
    const iconPath = ICON_PATHS[memory.type];

    const container = document.createElement('div');
    container.style.cssText = `
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
    `;

    // Main pin body
    const div = document.createElement('div');
    div.style.cssText = `
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 2.5px solid ${color};
        border-radius: 50%;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15), 0 0 0 3px ${color}20;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    `;

    // SVG Icon
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('fill', color);
    svg.innerHTML = iconPath;
    div.appendChild(svg);

    // Bottom pointer
    const pointer = document.createElement('div');
    pointer.style.cssText = `
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid ${color};
    `;
    div.appendChild(pointer);

    container.appendChild(div);

    // User indicator badge (emoji avatar at bottom-right)
    const userBadge = document.createElement('div');
    userBadge.style.cssText = `
        position: absolute;
        bottom: -4px;
        right: -4px;
        width: 20px;
        height: 20px;
        background: ${userColor};
        border: 2px solid white;
        border-radius: 50%;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    `;
    userBadge.textContent = USER_AVATARS[memory.addedBy];
    container.appendChild(userBadge);

    // Hover effects
    container.addEventListener('mouseenter', () => {
        container.style.transform = 'scale(1.15) translateY(-2px)';
        container.style.zIndex = '100';
    });
    container.addEventListener('mouseleave', () => {
        container.style.transform = 'scale(1) translateY(0)';
        container.style.zIndex = '';
    });

    return container;
}

// Create cluster element with smaller, glassy bubble design
function createClusterElement(count: number): HTMLElement {
    const size = Math.min(44, 28 + count * 2); // Smaller: 28-44px

    const container = document.createElement('div');
    container.style.cssText = `
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
    `;

    const div = document.createElement('div');
    div.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 2px solid rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        box-shadow: 0 3px 16px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(225, 29, 72, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: ${count > 99 ? '11px' : '13px'};
        color: #e11d48;
        font-family: system-ui, -apple-system, sans-serif;
    `;

    // Count text
    div.textContent = count > 99 ? '99+' : String(count);

    // Bottom pointer (message bubble style)
    const pointer = document.createElement('div');
    pointer.style.cssText = `
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-top: 7px solid rgba(255, 255, 255, 0.92);
    `;
    div.appendChild(pointer);

    container.appendChild(div);

    // Hover effects with tooltip
    container.addEventListener('mouseenter', () => {
        container.style.transform = 'scale(1.1)';
        container.style.zIndex = '100';
    });
    container.addEventListener('mouseleave', () => {
        container.style.transform = 'scale(1)';
        container.style.zIndex = '';
    });

    return container;
}

export function MemoryMarkers({ memories, onMemoryClick, filterByUser }: MemoryMarkersProps) {
    const map = useMap();
    // Load the marker library explicitly
    const markerLib = useMapsLibrary('marker');
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

    // Filter memories by user if specified
    const filteredMemories = filterByUser
        ? memories.filter(m => m.addedBy === filterByUser)
        : memories;

    // Create markers when map, marker library, and memories are ready
    useEffect(() => {
        if (!map || !markerLib) return;

        // Clean up old markers
        markersRef.current.forEach(marker => {
            marker.map = null;
        });
        markersRef.current = [];

        // Clean up old clusterer
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
            clustererRef.current.setMap(null);
            clustererRef.current = null;
        }

        // Create new markers using the loaded library
        const markers = filteredMemories.map(memory => {
            const marker = new markerLib.AdvancedMarkerElement({
                position: { lat: memory.lat, lng: memory.lng },
                content: createPinElement(memory),
                title: memory.name,
            });

            // Add click handler
            marker.addListener('click', () => {
                onMemoryClick?.(memory);
            });

            return marker;
        });

        markersRef.current = markers;

        // Initialize clusterer
        clustererRef.current = new MarkerClusterer({
            map,
            markers,
            algorithm: new SuperClusterAlgorithm({
                radius: 80,  // Slightly tighter clustering
                maxZoom: 15,
            }),
            renderer: {
                render: ({ count, position }) => {
                    return new markerLib.AdvancedMarkerElement({
                        position,
                        content: createClusterElement(count),
                        zIndex: 1000 + count,
                    });
                },
            },
        });

        // Cleanup
        return () => {
            if (clustererRef.current) {
                clustererRef.current.clearMarkers();
                clustererRef.current.setMap(null);
                clustererRef.current = null;
            }
            markersRef.current.forEach(marker => {
                marker.map = null;
            });
            markersRef.current = [];
        };
    }, [map, markerLib, filteredMemories, onMemoryClick]);

    // This component doesn't render anything - markers are managed via Google Maps API
    return null;
}
