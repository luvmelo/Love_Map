

/**
 * Processes an image file, converting HEIC/HEIF to JPEG if necessary.
 * Tries native browser decoding first (Safari), then falls back to heic2any.
 */
export async function processImageFile(file: File): Promise<File> {
    // 1. Check if it's a HEIC file
    const isHeic = file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');

    if (!isHeic) {
        return file;
    }

    console.log(`Processing HEIC file: ${file.name}`);

    // 2. Strategy A: Native Browser Decoding (Safari/Mac)
    // Canvas can convert if the browser supports drawing the format.
    try {
        const fileFromNative = await convertViaCanvas(file);
        console.log('✅ Native HEIC conversion/reading successful');
        return fileFromNative;
    } catch (nativeErr) {
        console.log('Masking native decode error (likely not supported on this browser), trying fallback...', nativeErr);
    }

    // 3. Strategy B: heic2any Library (WASM)
    try {
        console.log('Loading heic2any for conversion...');
        // Dynamic import to avoid SSR issues and ensure client-side execution
        const heic2any = (await import('heic2any')).default;

        const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
        });

        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

        const newFile = new File(
            [blob],
            file.name.replace(/\.(heic|heif)$/i, '.jpg'),
            { type: 'image/jpeg' }
        );
        console.log('✅ heic2any conversion successful');
        return newFile;

    } catch (libErr: any) {
        console.warn('❌ heic2any conversion failed, using original file:', libErr);
        // Fallback: Return the original file. 
        // This allows the upload to proceed. The image will work on iOS/Safari/Mac,
        // even if it might not display on Chrome/Windows.
        return file;
    }
}

async function convertViaCanvas(file: File): Promise<File> {
    // Attempt to load into valid image bitmap
    const bitmap = await createImageBitmap(file);

    // If we got here, the browser natively decoded the HEIC!
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.drawImage(bitmap, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                const newFile = new File(
                    [blob],
                    file.name.replace(/\.(heic|heif)$/i, '.jpg'),
                    { type: 'image/jpeg' }
                );
                resolve(newFile);
            } else {
                reject(new Error('Canvas serialization failed'));
            }
        }, 'image/jpeg', 0.8);
    });
}
