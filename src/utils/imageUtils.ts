/**
 * Converts a File or Blob into a Base64 Data URL
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Loads an external image URL and converts it into a Base64 Data URL,
 * with proxy fallback to prevent CORS issues in iframe/preview environments.
 */
export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Direct fetch failed with status ${response.status}`);
    const blob = await response.blob();
    return await fileToBase64(blob);
  } catch (err) {
    // If direct fetch fails (e.g. CORS restrictions), fetch via local server proxy
    const proxyUrl = `/api/sample-image?url=${encodeURIComponent(url)}`;
    const proxyResponse = await fetch(proxyUrl);
    if (!proxyResponse.ok) {
      throw new Error(`Failed to load image via proxy: status ${proxyResponse.status}`);
    }
    const blob = await proxyResponse.blob();
    return await fileToBase64(blob);
  }
}

/**
 * Resizes an image if its dimensions exceed maxDimension (default 1600px),
 * keeping aspect ratio intact and maintaining high visual fidelity.
 */
export async function optimizeImageForUpload(
  dataUrl: string,
  maxDimension = 1600
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDimension && height <= maxDimension) {
        resolve(dataUrl);
        return;
      }

      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Default to JPEG with high quality or PNG if source was PNG
      const isPng = dataUrl.startsWith('data:image/png');
      const format = isPng ? 'image/png' : 'image/jpeg';
      const quality = isPng ? undefined : 0.92;
      resolve(canvas.toDataURL(format, quality));
    };
    img.onerror = () => reject(new Error('Failed to load image for optimization'));
    img.src = dataUrl;
  });
}

/**
 * Downloads a base64 image data URL with a specified filename
 */
export function downloadImage(dataUrl: string, filename = 'magic-photo.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copies a base64 image directly to the system clipboard
 */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    // Clipboard item must be image/png in most modern browsers
    if (blob.type === 'image/png') {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      return true;
    }

    // Convert to PNG on a canvas first if it's JPEG
    const img = new Image();
    img.src = dataUrl;
    await new Promise((r) => (img.onload = r));

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0);

    const pngBlob: Blob | null = await new Promise((r) =>
      canvas.toBlob(r, 'image/png')
    );
    if (!pngBlob) return false;

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': pngBlob,
      }),
    ]);
    return true;
  } catch (err) {
    console.warn('Clipboard write failed:', err);
    return false;
  }
}
