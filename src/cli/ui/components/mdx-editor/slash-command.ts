import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import tippy, { type Instance } from "tippy.js";
import {
  SlashCommandList,
  type SlashCommandItem,
} from "./slash-command-list";
import { useMediaStore } from "@/stores/media-store";

const COMMANDS: SlashCommandItem[] = [
  {
    title: "Heading 1",
    description: "Large heading",
    command: (editor: any, range: any) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium heading",
    command: (editor: any, range: any) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small heading",
    command: (editor: any, range: any) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    command: (editor: any, range: any) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Ordered List",
    description: "Numbered list",
    command: (editor: any, range: any) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Blockquote",
    description: "Quote block",
    command: (editor: any, range: any) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    description: "Code with syntax highlight",
    command: (editor: any, range: any) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    command: (editor: any, range: any) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHorizontalRule()
        .run(),
  },
  {
    title: "Mermaid Diagram",
    description: "Flowchart, sequence, or graph",
    command: (editor: any, range: any) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "mermaidBlock", content: [] })
        .run(),
  },
  {
    title: "Image",
    description: "Insert an image from media",
    command: (editor: any, range: any) => {
      editor.chain().focus().deleteRange(range).run();
      useMediaStore.getState().openPicker("image", (url, name) => {
        editor.chain().focus().setImage({ src: url, alt: name }).run();
      });
    },
  },
  {
    title: "Video",
    description: "Insert a video from media",
    command: (editor: any, range: any) => {
      editor.chain().focus().deleteRange(range).run();
      useMediaStore.getState().openPicker("video", (url, name) => {
        editor.chain().focus().setImage({ src: url, alt: name }).run();
      });
    },
  },
  {
    title: "Audio",
    description: "Insert an audio file from media",
    command: (editor: any, range: any) => {
      editor.chain().focus().deleteRange(range).run();
      useMediaStore.getState().openPicker("audio", (url, name) => {
        editor.chain().focus().setImage({ src: url, alt: name }).run();
      });
    },
  },
];

function filterCommands(query: string): SlashCommandItem[] {
  return COMMANDS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  );
}

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: any;
          range: any;
          props: any;
        }) => {
          props.command(editor, range);
        },
        render: () => {
          let component: ReactRenderer;
          let popup: Instance[];

          return {
            onStart(props: any) {
              component = new ReactRenderer(SlashCommandList, {
                props: {
                  items: filterCommands(props.query),
                  onSelect: (item: SlashCommandItem) => props.command(item),
                },
                editor: props.editor,
              });

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              }) as Instance[];
            },

            onUpdate(props: any) {
              component.updateProps({
                items: filterCommands(props.query),
                onSelect: (item: SlashCommandItem) => props.command(item),
              });
              popup[0]?.setProps({ getReferenceClientRect: props.clientRect });
            },

            onKeyDown(props: any) {
              if (props.event.key === "Escape") {
                popup[0]?.hide();
                return true;
              }
              return (component.ref as any)?.onKeyDown(props) ?? false;
            },

            onExit() {
              popup[0]?.destroy();
              component.destroy();
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
