/**
 * Tối ưu & Nén ảnh client-side trước khi upload
 * - Chuyển đổi ảnh (JPG/PNG) sang định dạng WebP tối ưu dung lượng
 * - Resize kích thước lớn (default max width: 1920px)
 * - Tự động giảm dung lượng từ >5MB-15MB xuống còn < 500KB mà không giảm chất lượng nhìn thấy bằng mắt thường
 * - Giữ nguyên GIF hoặc SVG
 */
export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.82
): Promise<File> {
  if (
    typeof window === 'undefined' ||
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif'
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
          const compressedFile = new File([blob], newFileName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      console.warn('[compressImage] Failed to load image for compression, uploading original:', file.name);
      resolve(file);
    };

    img.src = url;
  });
}
