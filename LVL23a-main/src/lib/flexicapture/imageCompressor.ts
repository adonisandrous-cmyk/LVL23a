/**
 * ImageCompressor
 * Ported from flexicapture lib/app_service_image_compress.dart
 * Progressively compresses an image to stay below maxBytes.
 */

export interface CompressionResult {
  blob: Blob;
  uint8Array: Uint8Array;
  bytes: number;
  quality: number;
  width: number;
  height: number;
}

export class ImageCompressor {
  /**
   * Compresses an image blob or HTMLCanvasElement below maxSizeInBytes
   */
  static async compress(
    source: Blob | HTMLCanvasElement,
    maxSizeInBytes: number = 400 * 1024
  ): Promise<CompressionResult> {
    let canvas: HTMLCanvasElement;

    if (source instanceof HTMLCanvasElement) {
      canvas = source;
    } else {
      canvas = await this.blobToCanvas(source);
    }

    let width = canvas.width;
    let height = canvas.height;
    let quality = 0.9;
    let resultBlob: Blob | null = null;
    let resultBytes = 0;

    // First attempt at quality 0.90
    resultBlob = await this.canvasToBlob(canvas, 'image/jpeg', quality);
    resultBytes = resultBlob.size;

    // Iterative quality reduction loop matching flexicapture Dart logic
    while (resultBytes > maxSizeInBytes && quality > 0.1) {
      quality = Math.max(0.1, quality - 0.1);
      resultBlob = await this.canvasToBlob(canvas, 'image/jpeg', quality);
      resultBytes = resultBlob.size;
    }

    // If still over maxSizeInBytes, scale down dimensions
    if (resultBytes > maxSizeInBytes) {
      let scale = 0.85;
      while (resultBytes > maxSizeInBytes && scale > 0.25) {
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = Math.floor(width * scale);
        scaledCanvas.height = Math.floor(height * scale);
        const ctx = scaledCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
          resultBlob = await this.canvasToBlob(scaledCanvas, 'image/jpeg', 0.6);
          resultBytes = resultBlob.size;
          width = scaledCanvas.width;
          height = scaledCanvas.height;
        }
        scale -= 0.15;
      }
    }

    const arrayBuffer = await resultBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    return {
      blob: resultBlob,
      uint8Array,
      bytes: resultBytes,
      quality: Math.round(quality * 100),
      width,
      height
    };
  }

  private static blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  private static canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string = 'image/jpeg',
    quality: number = 0.9
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob returned null'));
        },
        type,
        quality
      );
    });
  }

  static uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
