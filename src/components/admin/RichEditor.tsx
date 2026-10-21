import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Extension } from "@tiptap/core";
import { useEffect, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  TextQuote,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { MediaItem } from "@/lib/admin-data";

/** Photos keep a left / centre / right position, saved as data-align. */
const CoveImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
        parseHTML: (el) => el.getAttribute("data-align") || "center",
        renderHTML: (attrs) => ({ "data-align": attrs.align }),
      },
    };
  },
});

/** Lets a blockquote become a large centred "pull quote". */
const PullQuote = Extension.create({
  name: "pullQuote",
  addGlobalAttributes() {
    return [
      {
        types: ["blockquote"],
        attributes: {
          pull: {
            default: false,
            parseHTML: (el) => el.classList.contains("pull"),
            renderHTML: (attrs) => (attrs.pull ? { class: "pull" } : {}),
          },
        },
      },
    ];
  },
});

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Opens the media library; resolves with the chosen photo(s). */
  pickImages?: () => Promise<MediaItem[] | null>;
  className?: string;
  minimal?: boolean;
};

export function RichEditor({
  value,
  onChange,
  placeholder = "Start writing…",
  pickImages,
  className = "",
  minimal,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      CoveImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      PullQuote,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: `prose-cove ${className}`,
        "aria-label": "Post content",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  if (!editor) return <div className="min-h-[320px] animate-pulse rounded-sm bg-muted/50" />;

  return (
    <div className="rounded-sm border border-border bg-paper">
      <Toolbar editor={editor} pickImages={pickImages} minimal={minimal} />
      <div className="px-5 py-6 sm:px-10 sm:py-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({
  editor,
  pickImages,
  minimal,
}: {
  editor: Editor;
  pickImages?: Props["pickImages"];
  minimal?: boolean;
}) {
  // re-render on selection/format changes so active states stay correct
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    editor.on("transaction", f);
    return () => {
      editor.off("transaction", f);
    };
  }, [editor]);

  const c = () => editor.chain().focus();
  const imageSelected = editor.isActive("image");

  async function insertImages() {
    if (!pickImages) return;
    const items = await pickImages();
    if (!items?.length) return;
    const content: any[] = [];
    for (const m of items) {
      content.push({
        type: "image",
        attrs: { src: m.url, alt: m.alt ?? m.caption ?? "", align: "center" },
      });
      if (m.caption)
        content.push({
          type: "paragraph",
          content: [{ type: "text", marks: [{ type: "italic" }], text: m.caption }],
        });
    }
    content.push({ type: "paragraph" });
    c().insertContent(content).run();
  }

  return (
    <div
      className="sticky top-[var(--toolbar-top,0px)] z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-paper/95 px-2 py-1.5 backdrop-blur"
      role="toolbar"
      aria-label="Formatting"
    >
      <B label="Undo (Ctrl+Z)" onClick={() => c().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 />
      </B>
      <B
        label="Redo (Ctrl+Shift+Z)"
        onClick={() => c().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 />
      </B>
      <Sep />
      {!minimal && (
        <>
          <B
            label="Normal text"
            active={editor.isActive("paragraph") && !imageSelected}
            onClick={() => c().setParagraph().run()}
          >
            <Pilcrow />
          </B>
          <B
            label="Heading"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => c().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 />
          </B>
          <B
            label="Small heading"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => c().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 />
          </B>
          <Sep />
        </>
      )}
      <B
        label="Bold (Ctrl+B)"
        active={editor.isActive("bold")}
        onClick={() => c().toggleBold().run()}
      >
        <Bold />
      </B>
      <B
        label="Italic (Ctrl+I)"
        active={editor.isActive("italic")}
        onClick={() => c().toggleItalic().run()}
      >
        <Italic />
      </B>
      <B
        label="Underline (Ctrl+U)"
        active={editor.isActive("underline")}
        onClick={() => c().toggleUnderline().run()}
      >
        <UnderlineIcon />
      </B>
      <B
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => c().toggleStrike().run()}
      >
        <Strikethrough />
      </B>
      <LinkButton editor={editor} />
      <Sep />
      <B
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => c().toggleBulletList().run()}
      >
        <List />
      </B>
      <B
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => c().toggleOrderedList().run()}
      >
        <ListOrdered />
      </B>
      {!minimal && (
        <>
          <B
            label="Quote"
            active={editor.isActive("blockquote") && !editor.getAttributes("blockquote").pull}
            onClick={() => {
              if (editor.isActive("blockquote") && editor.getAttributes("blockquote").pull)
                c().updateAttributes("blockquote", { pull: false }).run();
              else c().toggleBlockquote().run();
            }}
          >
            <Quote />
          </B>
          <B
            label="Pull quote (large, centred)"
            active={editor.isActive("blockquote", { pull: true })}
            onClick={() => {
              if (editor.isActive("blockquote"))
                c()
                  .updateAttributes("blockquote", {
                    pull: !editor.getAttributes("blockquote").pull,
                  })
                  .run();
              else c().toggleBlockquote().updateAttributes("blockquote", { pull: true }).run();
            }}
          >
            <TextQuote />
          </B>
          <B label="Divider" onClick={() => c().setHorizontalRule().run()}>
            <Minus />
          </B>
        </>
      )}
      <Sep />
      <B
        label={imageSelected ? "Photo: left" : "Align left"}
        active={
          imageSelected
            ? editor.getAttributes("image").align === "left"
            : editor.isActive({ textAlign: "left" })
        }
        onClick={() =>
          imageSelected
            ? c().updateAttributes("image", { align: "left" }).run()
            : c().setTextAlign("left").run()
        }
      >
        <AlignLeft />
      </B>
      <B
        label={imageSelected ? "Photo: centre" : "Centre"}
        active={
          imageSelected
            ? editor.getAttributes("image").align === "center"
            : editor.isActive({ textAlign: "center" })
        }
        onClick={() =>
          imageSelected
            ? c().updateAttributes("image", { align: "center" }).run()
            : c().setTextAlign("center").run()
        }
      >
        <AlignCenter />
      </B>
      <B
        label={imageSelected ? "Photo: right" : "Align right"}
        active={
          imageSelected
            ? editor.getAttributes("image").align === "right"
            : editor.isActive({ textAlign: "right" })
        }
        onClick={() =>
          imageSelected
            ? c().updateAttributes("image", { align: "right" }).run()
            : c().setTextAlign("right").run()
        }
      >
        <AlignRight />
      </B>
      {pickImages && (
        <>
          <Sep />
          <button
            type="button"
            onClick={insertImages}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-moss hover:bg-pale"
          >
            <ImagePlus className="h-4 w-4" /> Photo
          </button>
        </>
      )}
      {imageSelected && (
        <span className="ml-auto hidden pr-2 font-hand text-base text-muted-foreground sm:inline">
          photo selected — use the align buttons to move it
        </span>
      )}
    </div>
  );
}

function LinkButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const active = editor.isActive("link");
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setUrl(editor.getAttributes("link").href ?? "");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Link"
          aria-label="Link"
          className={`grid h-8 w-8 place-items-center rounded-sm [&_svg]:h-4 [&_svg]:w-4 ${active ? "bg-pale text-moss" : "text-foreground/70 hover:bg-pale hover:text-moss"}`}
        >
          <Link2 />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-paper" align="start">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const href = url.trim();
            if (!href) editor.chain().focus().extendMarkRange("link").unsetLink().run();
            else {
              const full = /^(https?:|mailto:|\/)/.test(href) ? href : `https://${href}`;
              if (editor.state.selection.empty && !active)
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: "text",
                    text: href,
                    marks: [{ type: "link", attrs: { href: full } }],
                  })
                  .run();
              else editor.chain().focus().extendMarkRange("link").setLink({ href: full }).run();
            }
            setOpen(false);
          }}
          className="space-y-2"
        >
          <label className="block text-sm">
            Link address
            <input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-sm border border-input bg-ivory px-2 py-1.5 outline-none focus:border-moss"
            />
          </label>
          <div className="flex justify-between gap-2">
            {active ? (
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                  setOpen(false);
                }}
                className="inline-flex items-center gap-1 text-sm text-destructive"
              >
                <Unlink className="h-3.5 w-3.5" /> Remove link
              </button>
            ) : (
              <span />
            )}
            <button className="rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">
              Save link
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function B({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-sm transition-colors disabled:opacity-30 [&_svg]:h-4 [&_svg]:w-4 ${active ? "bg-pale text-moss" : "text-foreground/70 hover:bg-pale hover:text-moss"}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden />;
}
