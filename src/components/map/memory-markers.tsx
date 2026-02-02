'use client';

import { useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';

// Memory type matching your MOCK_MEMORIES structure
export interface Memory {
    id: string;
    name: string;
    type: 'love' | 'food' | 'travel' | 'adventure';
    date: string;
    memo: string;
    lat: number;
    lng: number;
}

// Pin colors matching your design system
const PIN_COLORS = {
    love: '#ec4899',      // Pink
    food: '#f97316',      // Orange
    travel: '#3b82f6',    // Blue
    adventure: '#22c55e', // Green
};

interface MemoryMarkersProps {
    memories: Memory[];
    onMemoryClick?: (memory: Memory) => void;
}

// Create a custom pin element
function createPinElement(memory: Memory): HTMLElement {
    const color = PIN_COLORS[memory.type];
    const div = document.createElement('div');
    div.style.cssText = `
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 2px solid ${color};
        border-radius: 50%;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15), 0 0 0 3px ${color}20;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
    `;

    // Inner dot
    const dot = document.createElement('div');
    dot.style.cssText = `
        width: 14px;
        height: 14px;
        background: ${color};
        border-radius: 50%;
    `;
    div.appendChild(dot);

    // Bottom pointer
    const pointer = document.createElement('div');
    pointer.style.cssText = `
        position: absolute;
        bottom: -7px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-top: 7px solid ${color};
    `;
    div.appendChild(pointer);

    // Hover effects
    div.addEventListener('mouseenter', () => {
        div.style.transform = 'scale(1.15)';
        div.style.zIndex = '100';
    });
    div.addEventListener('mouseleave', () => {
        div.style.transform = 'scale(1)';
        div.style.zIndex = '';
    });

    return div;
}

// Create cluster element with glassy bubble design
function createClusterElement(count: number): HTMLElement {
    const size = Math.min(56, 38 + count * 2);
    const div = document.createElement('div');
    div.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 2px solid rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18), 0 0 0 4px rgba(225, 29, 72, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: ${count > 99 ? '13px' : '15px'};
        color: #e11d48;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        font-family: system-ui, -apple-system, sans-serif;
    `;

    // Count text
    div.textContent = count > 99 ? '99+' : String(count);

    // Bottom pointer (message bubble style)
    const pointer = document.createElement('div');
    pointer.style.cssText = `
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 9px solid transparent;
        border-right: 9px solid transparent;
        border-top: 9px solid rgba(255, 255, 255, 0.9);
    `;
    div.appendChild(pointer);

    // Hover effects
    div.addEventListener('mouseenter', () => {
        div.style.transform = 'scale(1.1)';
        div.style.zIndex = '100';
    });
    div.addEventListener('mouseleave', () => {
        div.style.transform = 'scale(1)';
        div.style.zIndex = '';
    });

    return div;
}

export function MemoryMarkers({ memories, onMemoryClick }: MemoryMarkersProps) {
    const map = useMap();
    // Load the marker library explicitly
    const markerLib = useMapsLibrary('marker');
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

    // Create markers when map, marker library, and memories are ready
    useEffect(() => {
        if (!map || !markerLib) return;

        // Clean up old markers
        markersRef.current.forEach(marker => {
            marker.map = null;
        });
        markersRef.current = [];

        // Create new markers using the loaded library
        const markers = memories.map(memory => {
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

        // Initialize or update clusterer
        if (!clustererRef.current) {
            clustererRef.current = new MarkerClusterer({
                map,
                markers,
                algorithm: new SuperClusterAlgorithm({
                    radius: 100,
                    maxZoom: 16,
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
        } else {
            clustererRef.current.clearMarkers();
            clustererRef.current.addMarkers(markers);
        }

        // Cleanup
        return () => {
            if (clustererRef.current) {
                clustererRef.current.clearMarkers();
            }
            markersRef.current.forEach(marker => {
                marker.map = null;
            });
            markersRef.current = [];
        };
    }, [map, markerLib, memories, onMemoryClick]);

    // This component doesn't render anything - markers are managed via Google Maps API
    return null;
}
