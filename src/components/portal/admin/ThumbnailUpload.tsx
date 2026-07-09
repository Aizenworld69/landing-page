"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { getSupabaseClient } from "@/lib/portal/supabase-client";

interface ThumbnailUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function ThumbnailUpload({ value, onChange }: ThumbnailUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const supabase = getSupabaseClient();
      const ext = file.name.split(".").pop();
      const path = `blog-thumbnails/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("blogs")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from("blogs").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      console.error("Upload thumbnail failed:", err);
      alert("Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
          <Image src={value} alt="Thumbnail" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <span className="text-sm">Đang upload...</span>
          ) : (
            <>
              <span className="text-2xl">📷</span>
              <span className="text-sm">Click để chọn ảnh bìa</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}