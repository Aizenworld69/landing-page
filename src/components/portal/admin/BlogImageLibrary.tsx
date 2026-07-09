"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadImage, BLOG_IMAGE_DRAG_TYPE } from "./TiptapEditor";

interface LibImage {
  id: string;
  url: string;
  name: string;
}

/**
 * Khung "Ảnh phụ": upload nhiều ảnh lên trước (lưu ngay lên Supabase),
 * hiện thành thumbnail. Bấm giữ và kéo 1 thumbnail thả vào vị trí bất kỳ
 * trong nội dung bài viết (TiptapEditor) để chèn ảnh tại đúng vị trí đó.
 */
export function BlogImageLibrary() {
  const [images, setImages]     = useState<LibImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) return;

    setUploading(true);
    try {
      for (const file of imageFiles) {
        const url = await uploadImage(file);
        setImages((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, url, name: file.name },
        ]);
      }
    } catch (err) {
      console.error("Upload ảnh phụ thất bại:", err);
      alert("Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  function onDragStart(e: React.DragEvent, img: LibImage) {
    e.dataTransfer.setData(BLOG_IMAGE_DRAG_TYPE, JSON.stringify({ url: img.url, alt: img.name }));
    // fallback cho các trường hợp đọc dataTransfer khác
    e.dataTransfer.setData("text/uri-list", img.url);
    e.dataTransfer.setData("text/plain", img.url);
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3">
      <h2 className="font-semibold text-slate-700 border-b border-slate-50 pb-3">Ảnh phụ</h2>
      <p className="text-xs text-slate-400 leading-relaxed">
        Tải ảnh lên trước, sau đó <span className="font-medium text-slate-500">kéo thả</span> vào
        đúng vị trí bạn muốn trong nội dung bài viết.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2.5 rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
      >
        {uploading ? "Đang upload..." : "+ Tải ảnh từ máy"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { void handleFiles(e.target.files); e.target.value = ""; }}
      />

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {images.map((img) => (
            <div
              key={img.id}
              draggable
              onDragStart={(e) => onDragStart(e, img)}
              title="Giữ và kéo ảnh này vào bài viết"
              className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50 cursor-grab active:cursor-grabbing group"
            >
              <Image src={img.url} alt={img.name} fill className="object-cover pointer-events-none" />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                title="Xoá khỏi danh sách"
                className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <p className="text-center text-xs text-slate-300 py-2">Chưa có ảnh phụ nào</p>
      )}
    </div>
  );
}
