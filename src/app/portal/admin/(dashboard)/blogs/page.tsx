"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { adminGetBlogs, adminDeleteBlog, adminUpdateBlog, type PaginatedBlogs } from "@/lib/portal/api/admin-blogs.api";
import type { Blog } from "@aizen/types";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  published: { label: "Đã đăng", cls: "bg-green-100 text-green-700" },
  draft:     { label: "Nháp",    cls: "bg-yellow-100 text-yellow-700" },
  archived:  { label: "Lưu trữ", cls: "bg-slate-100 text-slate-500" },
};

export default function AdminBlogsPage() {
  const [result, setResult] = useState<PaginatedBlogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetBlogs({ page, limit: 20 });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(blog: Blog) {
    if (!confirm(`Xóa bài viết "${blog.title}"?`)) return;
    try {
      await adminDeleteBlog(blog.id);
      load();
    } catch {
      alert("Xóa thất bại.");
    }
  }

  async function handleToggleStatus(blog: Blog) {
    const next = blog.status === "published" ? "draft" : "published";
    try {
      await adminUpdateBlog(blog.id, { status: next });
      load();
    } catch {
      alert("Cập nhật thất bại.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Blog</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {result ? `${result.pagination.total} bài viết` : ""}
          </p>
        </div>
        <Link
          href="/portal/admin/blogs/moi"
          className="inline-flex items-center gap-2 bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          + Tạo bài mới
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Đang tải...</div>
      ) : !result?.items.length ? (
        <div className="py-20 text-center text-slate-400">Chưa có bài viết nào.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4 w-16">Ảnh</th>
                <th className="py-3 px-4">Tiêu đề</th>
                <th className="py-3 px-4 w-28">Category</th>
                <th className="py-3 px-4 w-28">Trạng thái</th>
                <th className="py-3 px-4 w-56 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {result.items.map((blog) => {
                const st = STATUS_LABEL[blog.status] ?? STATUS_LABEL.draft;
                return (
                  <tr key={blog.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      {blog.thumbnail_url ? (
                        <div className="relative w-12 h-10 rounded-md overflow-hidden bg-slate-100">
                          <Image src={blog.thumbnail_url} alt="" fill className="object-cover" sizes="48px" />
                        </div>
                      ) : (
                        <div className="w-12 h-10 rounded-md bg-slate-100 flex items-center justify-center text-lg">📝</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-[420px] xl:max-w-[560px]">
                        <p className="font-medium text-slate-800 line-clamp-1">{blog.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">/blogs/{blog.slug}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium text-slate-500 capitalize">{blog.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(blog)}
                          title={blog.status === "published" ? "Chuyển thành Nháp" : "Đăng công khai"}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            blog.status === "published"
                              ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                              : "border-sky-100 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700"
                          }`}
                        >
                          {blog.status === "published" ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              </svg>
                              Ẩn
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Đăng
                            </>
                          )}
                        </button>

                        <Link
                          href={`/admin/blogs/${blog.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                          Sửa
                        </Link>

                        <button
                          onClick={() => handleDelete(blog)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-100 bg-red-50/40 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Pagination */}
          {result.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-slate-100">
              {Array.from({ length: result.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-md ${p === page ? "bg-slate-800 text-white" : "hover:bg-slate-100 text-slate-600"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}