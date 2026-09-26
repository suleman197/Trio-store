/**
 * Utility to compress and resize images client-side before uploading.
 * Reduces 5MB-20MB phone/camera photos down to ~300KB-700KB without visible quality loss.
 * Prevents Vercel 4.5MB payload limits, server timeouts, and Axios "Network Error" drops.
 */

export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    maxSizeMB = 3,
  } = options;

  // If not a file or not an image, return as is
  if (!file || !(file instanceof Blob)) return file;
  if (!file.type || !file.type.startsWith('image/')) return file;

  // Don't compress animated GIFs or vector SVGs to preserve animation / vectors
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  // If already very small (e.g. < 250KB), return as is
  if (file.size < 250 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original file if canvas context is unavailable
        resolve(file);
        return;
      }

      // Fill white background in case of transparent PNG converted to JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format: keep PNG if transparent and small, else JPEG
      const outputType = 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // If compression somehow produced a larger file, keep original
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          // Generate file with .jpg extension
          const originalName = file.name || 'image.jpg';
          const newName = originalName.replace(/\.[^/.]+$/, '') + '.jpg';
          const compressedFile = new File([blob], newName, {
            type: outputType,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback to original file on decode error
      resolve(file);
    };

    img.src = url;
  });
}
