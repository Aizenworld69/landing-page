"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useEffect, useRef, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/portal/supabase-client";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

/* Mime type riêng dùng để kéo ảnh từ khung "Ảnh phụ" (BlogImageLibrary) vào editor */
export const BLOG_IMAGE_DRAG_TYPE = "application/x-aizen-image";

/* ─── Upload image to Supabase ───────────────────────────────────────── */
export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Not an image");
  const supabase = getSupabaseClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `blog-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("blogs")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("blogs").getPublicUrl(path);
  return data.publicUrl;
}

/* ─── UI helpers ─────────────────────────────────────────────────────── */
function Divider() {
  return <span className="w-px self-stretch bg-slate-200 mx-0.5" />;
}

function ToolBtn({
  active, title, onClick, children, disabled,
}: {
  active?: boolean;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`flex items-center justify-center w-7 h-7 rounded text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-slate-800 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Inline SVG icons ───────────────────────────────────────────────── */
const Icons = {
  Bold:        () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>,
  Italic:      () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>,
  Underline:   () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg>,
  Strike:      () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>,
  H1:          () => <span className="text-xs font-bold">H1</span>,
  H2:          () => <span className="text-xs font-bold">H2</span>,
  H3:          () => <span className="text-xs font-bold">H3</span>,
  Para:        () => <span className="text-xs font-medium">¶</span>,
  AlignLeft:   () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>,
  AlignCenter: () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>,
  AlignRight:  () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>,
  BulletList:  () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/></svg>,
  OrderedList: () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" strokeLinejoin="round"/><path d="M4 10h2" strokeLinejoin="round"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeLinejoin="round"/></svg>,
  Blockquote:  () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>,
  Code:        () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  CodeBlock:   () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>,
  Highlight:   () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>,
  Link:        () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Image:       () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>,
  Hr:          () => <span className="text-xs font-medium">—</span>,
  Undo:        () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>,
  Redo:        () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>,
};

/* ─── Main Component ─────────────────────────────────────────────────── */
export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const linkInputRef  = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef   = useRef<HTMLDivElement>(null);
  /* Luôn giữ tham chiếu MỚI NHẤT tới editor instance, để các closure được
     tạo 1 lần lúc khởi tạo (editorProps.handleDrop/handlePaste) không bao
     giờ bị "kẹt" với giá trị editor cũ (null) — tránh bug im lặng không
     upload được ảnh. */
  const editorRef = useRef<Editor | null>(null);

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl,       setLinkUrl]       = useState("");
  const [uploading,     setUploading]     = useState(false);
  const [isDragging,    setIsDragging]    = useState(false);

  /* ── Upload & insert image ──
     atPos: nếu có, chèn ảnh tại đúng vị trí đó trong document (dùng khi kéo-thả file từ máy).
     Nếu không truyền, chèn tại vị trí con trỏ hiện tại (dùng khi bấm toolbar / paste). */
  const handleImageFile = useCallback(async (file: File, atPos?: number) => {
    const ed = editorRef.current;
    if (!ed) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (typeof atPos === "number") {
        ed.chain()
          .insertContentAt(atPos, { type: "image", attrs: { src: url, alt: file.name } })
          .focus()
          .run();
      } else {
        ed.chain().focus().setImage({ src: url, alt: file.name }).run();
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  }, []);

  /* Chèn ảnh đã có sẵn URL (kéo từ khung "Ảnh phụ") tại đúng vị trí thả */
  const insertExistingImage = useCallback((url: string, alt: string, atPos: number) => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.chain()
      .insertContentAt(atPos, { type: "image", attrs: { src: url, alt } })
      .focus()
      .run();
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExt.configure({ allowBase64: false, inline: false }),
      LinkExt.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => { onChange(editor.getHTML()); },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[360px] p-5 focus:outline-none",
      },
      /* Paste ảnh từ clipboard */
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) { void handleImageFile(file); }
            return true;
          }
        }
        return false;
      },
      /* Drop ảnh vào editor — 2 trường hợp:
         1) File ảnh kéo từ ngoài máy (OS) -> upload rồi chèn.
         2) Ảnh kéo từ khung "Ảnh phụ" (đã upload sẵn, chỉ có URL) -> chèn thẳng.
         Cả 2 đều chèn đúng tại vị trí con trỏ chuột thả xuống. */
      handleDrop(view, event) {
        const dt = event.dataTransfer;
        if (!dt) return false;

        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        const dropPos = coords ? coords.pos : view.state.selection.from;

        // Trường hợp 1: file ảnh thật từ máy
        const files = dt.files;
        const imageFiles = files?.length ? Array.from(files).filter((f) => f.type.startsWith("image/")) : [];
        if (imageFiles.length) {
          event.preventDefault();
          event.stopPropagation(); // chặn bubble lên wrapper ngoài, tránh xử lý trùng
          setIsDragging(false);
          let pos = dropPos;
          imageFiles.forEach((f) => {
            void handleImageFile(f, pos);
            pos += 1; // nhiều ảnh thì chèn nối tiếp, không đè lên nhau
          });
          return true;
        }

        // Trường hợp 2: ảnh kéo từ khung "Ảnh phụ" bên sidebar
        if (dt.types.includes(BLOG_IMAGE_DRAG_TYPE)) {
          const raw = dt.getData(BLOG_IMAGE_DRAG_TYPE);
          if (raw) {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);
            try {
              const { url, alt } = JSON.parse(raw) as { url: string; alt?: string };
              insertExistingImage(url, alt ?? "", dropPos);
            } catch (err) {
              console.error("Không đọc được dữ liệu ảnh kéo thả:", err);
            }
            return true;
          }
        }

        return false;
      },
    },
  });

  /* Luôn đồng bộ ref với editor instance mới nhất */
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  /* Sync content khi edit mode load data */
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  /* ── Drag & drop trên wrapper div ──
     Chỉ dùng để hiển thị overlay hint + cho phép trình duyệt "thả" (bắt buộc
     phải preventDefault ở dragover thì mới nhận được sự kiện drop).
     Việc chèn ảnh thực tế do editorProps.handleDrop xử lý (đã stopPropagation),
     nên onDrop ở đây chỉ còn là fallback, không xử lý trùng file. */
  function onDragOver(e: React.DragEvent) {
    const hasImageFile = Array.from(e.dataTransfer.items).some((i) => i.type.startsWith("image/"));
    const hasLibraryImage = e.dataTransfer.types.includes(BLOG_IMAGE_DRAG_TYPE);
    if (hasImageFile || hasLibraryImage) {
      e.preventDefault();
      setIsDragging(true);
    }
  }
  function onDragLeave() { setIsDragging(false); }
  function onDrop(e: React.DragEvent) {
    setIsDragging(false);
    // Không xử lý file ở đây nữa — nếu thả trúng vùng nội dung, handleDrop của
    // ProseMirror đã preventDefault + stopPropagation nên sự kiện này sẽ không
    // tới đây. Chỉ còn preventDefault để trình duyệt không mở ảnh ra tab mới.
    e.preventDefault();
  }

  /* ── Link helpers ── */
  function applyLink() {
    if (!linkUrl) editor?.chain().focus().unsetLink().run();
    else editor?.chain().focus().setLink({ href: linkUrl }).run();
    setShowLinkInput(false);
    setLinkUrl("");
  }

  if (!editor) return null;

  return (
    <div
      ref={dropZoneRef}
      className={`relative border rounded-xl overflow-hidden transition-all ${
        isDragging
          ? "border-sky-400 ring-2 ring-sky-200 shadow-lg shadow-sky-100"
          : "border-slate-200"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50">

        {/* Text style */}
        <ToolBtn title="Đậm (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Icons.Bold />
        </ToolBtn>
        <ToolBtn title="Nghiêng (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Icons.Italic />
        </ToolBtn>
        <ToolBtn title="Gạch chân" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Icons.Underline />
        </ToolBtn>
        <ToolBtn title="Gạch ngang" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Icons.Strike />
        </ToolBtn>
        <ToolBtn title="Nổi bật" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Icons.Highlight />
        </ToolBtn>

        <Divider />

        {/* Heading */}
        <ToolBtn title="Tiêu đề 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Icons.H1 />
        </ToolBtn>
        <ToolBtn title="Tiêu đề 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Icons.H2 />
        </ToolBtn>
        <ToolBtn title="Tiêu đề 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Icons.H3 />
        </ToolBtn>
        <ToolBtn title="Đoạn văn" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          <Icons.Para />
        </ToolBtn>

        <Divider />

        {/* Alignment */}
        <ToolBtn title="Căn trái" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <Icons.AlignLeft />
        </ToolBtn>
        <ToolBtn title="Căn giữa" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <Icons.AlignCenter />
        </ToolBtn>
        <ToolBtn title="Căn phải" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <Icons.AlignRight />
        </ToolBtn>

        <Divider />

        {/* List & Block */}
        <ToolBtn title="Danh sách chấm" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <Icons.BulletList />
        </ToolBtn>
        <ToolBtn title="Danh sách số" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <Icons.OrderedList />
        </ToolBtn>
        <ToolBtn title="Trích dẫn" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Icons.Blockquote />
        </ToolBtn>

        <Divider />

        {/* Code */}
        <ToolBtn title="Code inline" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Icons.Code />
        </ToolBtn>
        <ToolBtn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Icons.CodeBlock />
        </ToolBtn>

        <Divider />

        {/* Link */}
        <ToolBtn
          title="Chèn link"
          active={editor.isActive("link") || showLinkInput}
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
            } else {
              const prev = editor.getAttributes("link").href as string ?? "";
              setLinkUrl(prev);
              setShowLinkInput((v) => !v);
              setTimeout(() => linkInputRef.current?.focus(), 50);
            }
          }}
        >
          <Icons.Link />
        </ToolBtn>

        {/* Image */}
        <ToolBtn
          title="Chèn ảnh (hoặc kéo thả vào editor)"
          disabled={uploading}
          onClick={() => imageInputRef.current?.click()}
        >
          {uploading
            ? <span className="text-[9px] font-semibold text-sky-500 animate-pulse">↑</span>
            : <Icons.Image />
          }
        </ToolBtn>
        {/* Hidden file input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            files.forEach((f) => { void handleImageFile(f); });
            e.target.value = "";
          }}
        />

        {/* Color */}
        <label title="Màu chữ" className="relative flex items-center justify-center w-7 h-7 rounded cursor-pointer hover:bg-slate-100 transition-colors">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 7l-6 6a2 2 0 0 0 0 2.83l3.17 3.17a2 2 0 0 0 2.83 0l6-6"/>
            <path d="M13 5l6 6"/><path d="M15 3l6 6"/>
            <line x1="4" y1="20" x2="20" y2="20" strokeWidth="3"/>
          </svg>
          <input
            type="color"
            className="absolute opacity-0 w-0 h-0"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>

        <ToolBtn title="Đường kẻ ngang" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Icons.Hr />
        </ToolBtn>

        <Divider />

        {/* Undo / Redo */}
        <ToolBtn title="Hoàn tác (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
          <Icons.Undo />
        </ToolBtn>
        <ToolBtn title="Làm lại (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>
          <Icons.Redo />
        </ToolBtn>
      </div>

      {/* ── Link input ── */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 border-b border-sky-100">
          <Icons.Link />
          <input
            ref={linkInputRef}
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); applyLink(); }
              if (e.key === "Escape") setShowLinkInput(false);
            }}
            className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
          />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); applyLink(); }}
            className="text-xs px-2.5 py-1 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors font-medium">
            Áp dụng
          </button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); setShowLinkInput(false); }}
            className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700">
            Hủy
          </button>
        </div>
      )}

      {/* ── Drag & drop overlay hint ── */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-sky-50/90 pointer-events-none rounded-xl">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 border-2 border-dashed border-sky-400 flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
          </div>
          <p className="text-sky-600 font-semibold text-sm">Thả ảnh vào đây</p>
          <p className="text-sky-400 text-xs mt-1">Ảnh sẽ được chèn tại vị trí con trỏ</p>
        </div>
      )}

      {/* ── Upload progress banner ── */}
      {uploading && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 border-b border-sky-100">
          <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-sky-600 font-medium">Đang upload ảnh lên cloud...</span>
        </div>
      )}

      {/* ── Editor content ── */}
      <div className="relative bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* ── Bottom hint ── */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400">
        <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
        Kéo thả ảnh vào bất kỳ vị trí nào trong nội dung · hoặc dán ảnh bằng Ctrl+V
      </div>
    </div>
  );
}
