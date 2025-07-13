/**
 * Extracts the dominant colors from an image URL.
 * @param imageUrl The URL of the image (can be base64 or a web URL).
 * @param colorCount The number of dominant colors to extract.
 * @returns A promise that resolves to an array of hex color strings.
 */
export const extractDominantColors = (imageUrl: string, colorCount: number = 5): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Required for external images
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        return reject(new Error('Canvas context not available'));
      }

      // Scale down image for performance
      const scale = Math.min(100 / img.width, 100 / img.height);
      const width = img.width * scale;
      const height = img.height * scale;
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const imageData = ctx.getImageData(0, 0, width, height).data;
        const colorMap: { [key: string]: { originalColors: { r: number; g: number; b: number }[]; count: number } } = {};
        const pixelInterval = 5; // Sample every 5th pixel

        for (let i = 0; i < imageData.length; i += 4 * pixelInterval) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const alpha = imageData[i+3];

          // Ignore transparent or near-white/black/grey pixels for more vibrant palettes
          if (alpha < 128 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) {
            continue;
          }
          const sat = Math.max(r,g,b) - Math.min(r,g,b);
          if (sat < 20) continue;


          // Quantize colors by rounding to the nearest 32
          const quantize = (val: number) => Math.round(val / 32) * 32;
          const key = `${quantize(r)},${quantize(g)},${quantize(b)}`;
          
          if (!colorMap[key]) {
            colorMap[key] = { originalColors: [], count: 0 };
          }
          colorMap[key].originalColors.push({ r, g, b });
          colorMap[key].count++;
        }

        const sortedColorBuckets = Object.values(colorMap).sort((a, b) => b.count - a.count);

        const dominantColors = sortedColorBuckets.slice(0, colorCount).map(bucket => {
          const avg = bucket.originalColors.reduce((acc, color) => {
            acc.r += color.r;
            acc.g += color.g;
            acc.b += color.b;
            return acc;
          }, { r: 0, g: 0, b: 0 });
          
          avg.r = Math.round(avg.r / bucket.originalColors.length);
          avg.g = Math.round(avg.g / bucket.originalColors.length);
          avg.b = Math.round(avg.b / bucket.originalColors.length);

          const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
          return `#${toHex(avg.r)}${toHex(avg.g)}${toHex(avg.b)}`;
        });

        resolve(dominantColors);
      } catch (e) {
        reject(new Error(`Could not get image data: ${e}`));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for color extraction.'));
    };
  });
};
