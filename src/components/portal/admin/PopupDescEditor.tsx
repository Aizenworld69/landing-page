'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';

interface PopupDescEditorProps {
  content: string;
  onChange: (html: string) => void;
}

// Bảng màu nhanh cho popup description
const QUICK_COLORS = [
  { label: 'Vàng', hex: '#fbbf24' },
  { label: 'Xanh ngọc', hex: '#34d399' },
  { label: 'Xanh dương', hex: '#60a5fa' },
  { label: 'Đỏ hồng', hex: '#f87171' },
  { label: 'Tím', hex: '#c084fc' },
  { label: 'Trắng', hex: '#ffffff' },
];

function ToolBtn({
  active, title, onClick, children,
}: {
  active?: boolean;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`flex items-center justify-center w-7 h-7 rounded text-xs font-bold transition-all ${
        active
          ? 'bg-slate-700 text-white shadow-sm'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

export function PopupDescEditor({ content, onChange }: PopupDescEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      Highlight.configure({ multicolor: false }),
    ],
    content,
    onUpdate: ({ editor }) => { onChange(editor.getHTML()); },
    editorProps: {
      attributes: {
        class: 'min-h-[120px] px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none leading-relaxed',
      },
    },
  });

  // Sync content khi load data từ DB
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  // Màu đang được áp dụng tại vị trí con trỏ
  const currentColor = editor.getAttributes('textStyle').color as string | undefined;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
        {/* Định dạng chữ */}
        <ToolBtn
          title="Đậm (Ctrl+B)"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolBtn>
        <ToolBtn
          title="Nghiêng (Ctrl+I)"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolBtn>
        <ToolBtn
          title="Gạch chân"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </ToolBtn>
        <ToolBtn
          title="Nổi bật (highlight)"
          active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          ✨
        </ToolBtn>

        {/* Separator */}
        <span className="w-px self-stretch bg-slate-200 mx-0.5" />

        {/* Màu chữ nhanh */}
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mr-0.5">
          Màu:
        </span>
        {QUICK_COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            title={c.label}
            onMouseDown={(e) => {
              e.preventDefault();
              // Toggle: nếu đang dùng màu này thì bỏ màu, không thì áp dụng
              if (currentColor === c.hex) {
                editor.chain().focus().unsetColor().run();
              } else {
                editor.chain().focus().setColor(c.hex).run();
              }
            }}
            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
              currentColor === c.hex
                ? 'border-indigo-500 scale-125 shadow-md'
                : 'border-slate-300'
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}

        {/* Color picker tùy chọn */}
        <label
          title="Chọn màu khác"
          className="flex items-center justify-center w-6 h-6 rounded border border-slate-300 cursor-pointer hover:border-indigo-400 transition overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f)' }}
        >
          <input
            type="color"
            className="opacity-0 absolute w-0 h-0"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>

        {/* Bỏ màu */}
        {currentColor && (
          <button
            type="button"
            title="Bỏ màu chữ"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }}
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 font-semibold transition"
          >
            ✕ màu
          </button>
        )}

        {/* Separator */}
        <span className="w-px self-stretch bg-slate-200 mx-0.5" />

        {/* Undo / Redo */}
        <ToolBtn title="Hoàn tác (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
          ↩
        </ToolBtn>
        <ToolBtn title="Làm lại (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>
          ↪
        </ToolBtn>
      </div>

      {/* ── Editor content (WYSIWYG) ── */}
      <div className="bg-white [&_.ProseMirror]:min-h-[110px]">
        <EditorContent editor={editor} />
      </div>

      {/* ── Hint ── */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400">
        💡 Bôi đen đoạn chữ rồi bấm màu để đổi màu tức thì · Enter để xuống dòng
      </div>
    </div>
  );
}
