// Share utilities for exporting memories as images/links
import type { Memory } from '@/components/map/memory-markers';
import { USERS } from '@/contexts/user-context';

const TYPE_COLORS: Record<string, string> = {
    love: '#ec4899',
    food: '#f97316',
    travel: '#3b82f6',
    adventure: '#22c55e',
};

const TYPE_EMOJIS: Record<string, string> = {
    love: '❤️',
    food: '🍜',
    travel: '✈️',
    adventure: '🏔️',
};

/**
 * Generate a shareable image card for a memory using Canvas API
 */
export async function generateMemoryCard(memory: Memory): Promise<Blob | null> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Card dimensions (Instagram story-like aspect ratio)
    const width = 540;
    const height = 960;
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Cover photo if available
    if (memory.coverPhotoUrl) {
        try {
            const img = await loadImage(memory.coverPhotoUrl);
            const imgHeight = 400;
            const imgY = 80;

            // Rounded corners clip
            ctx.save();
            roundRect(ctx, 30, imgY, width - 60, imgHeight, 24);
            ctx.clip();

            // Draw image with cover fit
            const scale = Math.max((width - 60) / img.width, imgHeight / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const offsetX = 30 + ((width - 60) - scaledWidth) / 2;
            const offsetY = imgY + (imgHeight - scaledHeight) / 2;
            ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
            ctx.restore();

            // Subtle border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            roundRect(ctx, 30, imgY, width - 60, imgHeight, 24);
            ctx.stroke();
        } catch {
            // Skip image on error
        }
    }

    // Type badge
    const typeColor = TYPE_COLORS[memory.type] || TYPE_COLORS.love;
    const typeEmoji = TYPE_EMOJIS[memory.type] || '📍';
    ctx.fillStyle = typeColor;
    roundRect(ctx, 30, 520, 100, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`${typeEmoji} ${memory.type.charAt(0).toUpperCase() + memory.type.slice(1)}`, 48, 547);

    // Location name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
    wrapText(ctx, memory.name, 30, 610, width - 60, 40);

    // Memo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
    wrapText(ctx, memory.memo || '', 30, 680, width - 60, 26);

    // Date and location
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    const dateStr = new Date(memory.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
    const locationStr = memory.city && memory.country ? `${memory.city}, ${memory.country}` : '';
    ctx.fillText(`📅 ${dateStr}${locationStr ? ` • 📍 ${locationStr}` : ''}`, 30, 780);

    // User attribution
    const userInfo = USERS[memory.addedBy];
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`Added by ${userInfo.avatar} ${userInfo.name}`, 30, 810);

    // Branding footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Love Map 💕', width / 2, height - 40);
    ctx.textAlign = 'left';

    // Convert to blob
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
}

/**
 * Share a memory using Web Share API or fallback to clipboard/download
 */
export async function shareMemory(memory: Memory): Promise<boolean> {
    try {
        const imageBlob = await generateMemoryCard(memory);
        if (!imageBlob) {
            console.error('Failed to generate memory card');
            return false;
        }

        const file = new File([imageBlob], `lovemap-${memory.id}.png`, { type: 'image/png' });

        // Try Web Share API first
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
                title: memory.name,
                text: memory.memo || `A special memory at ${memory.name}`,
                files: [file],
            });
            return true;
        }

        // Fallback: Download the image
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lovemap-${memory.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error sharing memory:', error);
        return false;
    }
}

// Helper functions
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}
