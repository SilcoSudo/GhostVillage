import React, { useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  Link2,
  ImagePlus,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Video,
} from "lucide-react";
import "./TiptapEditor.css";

const TiptapEditor = ({
  content,
  onChange,
  placeholder,
  className,
  onImageUpload,
  onVideoUpload,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Image.configure({
        HTMLAttributes: {
          class: "tiptap-image",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "tiptap-link",
        },
      }),
      Underline,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-content",
        spellcheck: "false",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const nextContent = content || "";
    const currentContent = editor.getHTML();

    if (currentContent !== nextContent) {
      editor.commands.setContent(nextContent, false);
    }
  }, [editor, content]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = prompt("Enter URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`tiptap-editor ${className || ""}`}>
      <div className="tiptap-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "is-active" : ""}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "is-active" : ""}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>

        <span className="toolbar-divider"></span>

        <div className="color-picker-wrapper">
          <label className="color-picker-button" title="Text Color">
            <span
              style={{
                color:
                  editor.getAttributes("textStyle").color ||
                  "var(--text-primary)",
              }}
            >
              A
            </span>
            <span
              className="color-bar"
              style={{
                backgroundColor:
                  editor.getAttributes("textStyle").color || "#B5A642",
              }}
            ></span>
            <input
              type="color"
              onInput={(e) =>
                editor.chain().focus().setColor(e.target.value).run()
              }
              value={editor.getAttributes("textStyle").color || "#B5A642"}
              className="color-input-hidden"
            />
          </label>
        </div>

        <span className="toolbar-divider"></span>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "is-active" : ""}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "is-active" : ""}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>

        <span className="toolbar-divider"></span>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "is-active" : ""}
          title="Quote"
        >
          <Quote size={16} />
        </button>

        <span className="toolbar-divider"></span>

        <button
          type="button"
          onClick={setLink}
          className={editor.isActive("link") ? "is-active" : ""}
          title="Add Link"
        >
          <Link2 size={16} />
        </button>

        <span className="toolbar-divider"></span>

        <button type="button" onClick={onImageUpload} title="Add Image">
          <ImagePlus size={16} />
        </button>

        <button type="button" onClick={onVideoUpload} title="Add Video">
          <Video size={16} />
        </button>
        {/* Image/Video upload moved from CreatePostModal */}
      </div>

      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
};

export default TiptapEditor;
