import { forwardRef, useImperativeHandle, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  RemoveFormatting,
} from 'lucide-react'
import { toast } from 'sonner'

export interface RichTextEditorHandle {
  insertHtml: (html: string) => void
  focus: () => void
}

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  onUploadImage?: (file: File) => Promise<string | undefined>
}

const ToolbarButton = ({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    disabled={disabled}
    onMouseDown={e => e.preventDefault()}
    onClick={onClick}
    className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
      active
        ? 'bg-primary-500 text-white shadow-sm'
        : 'text-steel-600 hover:bg-dust-100 hover:text-[#1a1a1a]'
    } disabled:pointer-events-none disabled:opacity-40`}
  >
    {children}
  </button>
)

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor({ value, onChange, onUploadImage }, ref) {
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    const uploadRef = useRef(onUploadImage)
    uploadRef.current = onUploadImage

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          link: {
            openOnClick: false,
            autolink: true,
            HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
          },
        }),
        Image.configure({ inline: false, allowBase64: true }),
      ],
      content: value || '',
      editorProps: {
        attributes: {
          class: 'focus:outline-none',
        },
      },
      onUpdate: ({ editor: e }) => {
        onChangeRef.current(e.getHTML())
      },
    })

    useImperativeHandle(ref, () => ({
      insertHtml: (html: string) => {
        if (editor) editor.chain().focus().insertContent(html).run()
      },
      focus: () => {
        editor?.commands.focus()
      },
    }))

    async function pickImage() {
      if (!editor) return
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/jpeg,image/png,image/webp'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file || !uploadRef.current) return
        try {
          const url = await uploadRef.current(file)
          if (url) editor.chain().focus().setImage({ src: url }).run()
        } catch (err) {
          toast.error('Image upload failed', {
            description: err instanceof Error ? err.message : undefined,
          })
        }
      }
      input.click()
    }

    function setLink() {
      if (!editor) return
      const previous = editor.getAttributes('link').href as string | undefined
      const href = window.prompt('Link URL', previous || 'https://')
      if (href === null) return
      if (href === '' || href === 'https://') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }

    if (!editor) return null

    const iconCls = 'h-4 w-4'

    return (
      <div className="tiptap-editor rounded-lg border border-dust-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary-500/40">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-dust-200 bg-dust-50/70 px-2 py-1.5">
          <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className={iconCls} />
          </ToolbarButton>
          <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className={iconCls} />
          </ToolbarButton>
          <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <Underline className={iconCls} />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className={iconCls} />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-dust-300" />

          <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className={iconCls} />
          </ToolbarButton>
          <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className={iconCls} />
          </ToolbarButton>
          <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className={iconCls} />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-dust-300" />

          <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className={iconCls} />
          </ToolbarButton>
          <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className={iconCls} />
          </ToolbarButton>
          <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className={iconCls} />
          </ToolbarButton>
          <ToolbarButton title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code className={iconCls} />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-dust-300" />

          <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
            <Link2 className={iconCls} />
          </ToolbarButton>
          <ToolbarButton title="Insert image" onClick={pickImage}>
            <ImagePlus className={iconCls} />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-dust-300" />

          <ToolbarButton title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
            <RemoveFormatting className={iconCls} />
          </ToolbarButton>
          <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className={iconCls} />
          </ToolbarButton>
          <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className={iconCls} />
          </ToolbarButton>
        </div>

        <EditorContent editor={editor} />
      </div>
    )
  }
)

export default RichTextEditor
