"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import slugify from "slugify";
import dynamic from "next/dynamic";
import { ThumbnailUpload } from "./ThumbnailUpload";
import { BlogImageLibrary } from "./BlogImageLibrary";

const TiptapEditor = dynamic(
  () => import("./TiptapEditor").then((m) => m.TiptapEditor),
  { ssr: false }
);
import type { Blog } from "@aizen/types";

const schema = z.object({
  title:         z.string().min(1, "Bắt buộc").max(255),
  slug:          z.string().min(1, "Bắt buộc").max(255).regex(/^[a-z0-9-]+$/, "Chỉ dùng chữ thường, số, dấu -"),
  excerpt:       z.string().optional(),
  body_html:     z.string().optional(),
  thumbnail_url: z.string().optional(),
  category:      z.enum(["blog", "news"]),
  author:        z.string().optional(),
  status:        z.enum(["draft", "published", "archived"]),
});

export type BlogFormValues = z.infer<typeof schema>;

interface BlogFormProps {
  defaultValues?: Partial<BlogFormValues>;
  onSubmit: (values: BlogFormValues) => Promise<void>;
  submitLabel?: string;
}

export function BlogForm({ defaultValues, onSubmit, submitLabel = "Lưu bài viết" }: BlogFormProps) {
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      body_html: "",
      thumbnail_url: "",
      category: "blog",
      author: "Aizen",
      status: "draft",
      ...defaultValues,
    },
  });

  const title = watch("title");

  // Auto-generate slug from title
  useEffect(() => {
    if (slugTouched) return;
    if (!title) return;
    const generated = slugify(title, { lower: true, locale: "vi", strict: true });
    setValue("slug", generated, { shouldValidate: true });
  }, [title, slugTouched, setValue]);

  async function submit(values: BlogFormValues) {
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: main content */}
      <div className="lg:col-span-2 space-y-5">
        {/* General info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
          <h2 className="font-semibold text-slate-700 border-b border-slate-50 pb-3">Thông tin chung</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Tiêu đề <span className="text-red-500">*</span></label>
            <input
              {...register("title")}
              placeholder="Ví dụ: 5 lý do bạn nên học AI ngay hôm nay"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Slug <span className="text-red-500">*</span></label>
            <input
              {...register("slug")}
              placeholder="5-ly-do-ban-nen-hoc-ai"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              onChange={(e) => { setSlugTouched(true); register("slug").onChange(e); }}
            />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Tóm tắt</label>
            <textarea
              {...register("excerpt")}
              placeholder="Mô tả ngắn khoảng 1-2 câu..."
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>

        {/* Body */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-3">
          <label className="text-sm font-medium text-slate-600">Nội dung bài viết</label>
          <Controller
            name="body_html"
            control={control}
            render={({ field }) => (
              <TiptapEditor content={field.value ?? ""} onChange={field.onChange} />
            )}
          />
        </div>
      </div>

      {/* Right: settings */}
      <div className="space-y-5">
        {/* Publish settings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
          <h2 className="font-semibold text-slate-700 border-b border-slate-50 pb-3">Cài đặt</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Category</label>
            <select
              {...register("category")}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="blog">Blog</option>
              <option value="news">Tin tức</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Tác giả</label>
            <input
              {...register("author")}
              placeholder="Aizen"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Trạng thái</label>
            <select
              {...register("status")}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="draft">Nháp</option>
              <option value="published">Đăng công khai</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Đang lưu..." : submitLabel}
          </button>
        </div>

        {/* Thumbnail */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3">
          <h2 className="font-semibold text-slate-700 border-b border-slate-50 pb-3">Ảnh bìa</h2>
          <Controller
            name="thumbnail_url"
            control={control}
            render={({ field }) => (
              <ThumbnailUpload value={field.value ?? ""} onChange={field.onChange} />
            )}
          />
        </div>

        {/* Ảnh phụ — thư viện ảnh để kéo thả vào nội dung */}
        <BlogImageLibrary />
      </div>
    </form>
  );
}
