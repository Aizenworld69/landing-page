"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BlogForm, type BlogFormValues } from "@/components/portal/admin/BlogForm";
import { adminGetBlogById, adminUpdateBlog } from "@/lib/portal/api/admin-blogs.api";
import type { Blog } from "@aizen/types";

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    adminGetBlogById(id).then((data) => {
      setBlog(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  async function handleSubmit(values: BlogFormValues) {
    const payload = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "" && v !== undefined)
    ) as typeof values;
    await adminUpdateBlog(id, payload);
    router.push("/portal/admin/blogs");
    router.refresh();
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Đang tải...</div>;
  if (!blog) return <div className="py-20 text-center text-slate-400">Không tìm thấy bài viết.</div>;

  const defaultValues: Partial<BlogFormValues> = {
    title:         blog.title,
    slug:          blog.slug,
    excerpt:       blog.excerpt ?? "",
    body_html:     blog.body_html ?? "",
    thumbnail_url: blog.thumbnail_url ?? "",
    category:      (blog.category as "blog" | "news") ?? "blog",
    author:        blog.author ?? "Aizen",
    status:        (blog.status as "draft" | "published" | "archived") ?? "draft",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/portal/admin/blogs" className="text-slate-400 hover:text-slate-600 transition-colors">
          ← Quay lại
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Chỉnh sửa bài viết</h1>
          <p className="text-sm text-slate-500 font-mono">/blogs/{blog.slug}</p>
        </div>
      </div>

      <BlogForm defaultValues={defaultValues} onSubmit={handleSubmit} submitLabel="Cập nhật bài viết" />
    </div>
  );
}