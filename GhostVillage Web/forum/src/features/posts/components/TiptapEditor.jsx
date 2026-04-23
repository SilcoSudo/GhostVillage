import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
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
    const url = prompt(t("editor.linkPrompt"), previousUrl);

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
          title={t("editor.toolbar.bold")}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
          title={t("editor.toolbar.italic")}
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "is-active" : ""}
          title={t("editor.toolbar.underline")}
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "is-active" : ""}
          title={t("editor.toolbar.strikethrough")}
        >
          <Strikethrough size={16} />
        </button>

        <span className="toolbar-divider"></span>

        <div className="color-picker-wrapper">
          <label
            className="color-picker-button"
            title={t("editor.toolbar.textColor")}
          >
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
          title={t("editor.toolbar.bulletList")}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "is-active" : ""}
          title={t("editor.toolbar.numberedList")}
        >
          <ListOrdered size={16} />
        </button>

        <span className="toolbar-divider"></span>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "is-active" : ""}
          title={t("editor.toolbar.quote")}
        >
          <Quote size={16} />
        </button>

        <span className="toolbar-divider"></span>

        <button
          type="button"
          onClick={setLink}
          className={editor.isActive("link") ? "is-active" : ""}
          title={t("editor.toolbar.addLink")}
        >
          <Link2 size={16} />
        </button>

        <span className="toolbar-divider"></span>

        <button
          type="button"
          onClick={onImageUpload}
          title={t("editor.toolbar.addImage")}
        >
          <ImagePlus size={16} />
        </button>

        <button
          type="button"
          onClick={onVideoUpload}
          title={t("editor.toolbar.addVideo")}
        >
          <Video size={16} />
        </button>
        {/* Image/Video upload moved from CreatePostModal */}
      </div>

      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
};

export default TiptapEditor;
