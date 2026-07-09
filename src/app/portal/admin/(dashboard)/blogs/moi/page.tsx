"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { BlogForm, type BlogFormValues } from "@/components/portal/admin/BlogForm";
import { adminCreateBlog } from "@/lib/portal/api/admin-blogs.api";

export default function CreateBlogPage() {
  const router = useRouter();

  async function handleSubmit(values: BlogFormValues) {
    const payload = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "" && v !== undefined)
    ) as typeof values;
    await adminCreateBlog(payload);
    router.push("/portal/admin/blogs");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/portal/admin/blogs" className="text-slate-400 hover:text-slate-600 transition-colors">
          ← Quay lại
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tạo bài viết mới</h1>
          <p className="text-sm text-slate-500">Điền thông tin và đăng tải bài viết lên website.</p>
        </div>
      </div>

      <BlogForm onSubmit={handleSubmit} submitLabel="Tạo bài viết" />
    </div>
  );
}