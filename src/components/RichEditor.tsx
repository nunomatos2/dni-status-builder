import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  borderColor?: string;
}

export default function RichEditor({ content, onChange, placeholder, readOnly, borderColor = '#b5000b' }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  if (!editor) return null;

  return (
    <div className="bg-surface-lowest" style={{ borderLeft: `4px solid ${borderColor}` }}>
      {!readOnly && (
        <div className="flex items-center gap-1 px-4 pt-3 pb-1 border-b border-zinc-100">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-sm text-xs transition-colors ${editor.isActive('bold') ? 'bg-primary-container/20 text-primary' : 'text-zinc-400 hover:text-on-surface hover:bg-surface-low'}`}
            title="Negrito"
          >
            <span className="material-symbols-outlined text-base">format_bold</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-sm text-xs transition-colors ${editor.isActive('italic') ? 'bg-primary-container/20 text-primary' : 'text-zinc-400 hover:text-on-surface hover:bg-surface-low'}`}
            title="Itálico"
          >
            <span className="material-symbols-outlined text-base">format_italic</span>
          </button>
          <div className="w-px h-4 bg-zinc-200 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-sm text-xs transition-colors ${editor.isActive('bulletList') ? 'bg-primary-container/20 text-primary' : 'text-zinc-400 hover:text-on-surface hover:bg-surface-low'}`}
            title="Lista com marcadores"
          >
            <span className="material-symbols-outlined text-base">format_list_bulleted</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-sm text-xs transition-colors ${editor.isActive('orderedList') ? 'bg-primary-container/20 text-primary' : 'text-zinc-400 hover:text-on-surface hover:bg-surface-low'}`}
            title="Lista numerada"
          >
            <span className="material-symbols-outlined text-base">format_list_numbered</span>
          </button>
          <div className="w-px h-4 bg-zinc-200 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-sm text-xs transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-primary-container/20 text-primary' : 'text-zinc-400 hover:text-on-surface hover:bg-surface-low'}`}
            title="Subtítulo"
          >
            <span className="material-symbols-outlined text-base">title</span>
          </button>
        </div>
      )}
      <EditorContent
        editor={editor}
        className="rich-editor p-6 text-sm leading-relaxed focus:outline-none"
      />
    </div>
  );
}
