/**
 * @context  UI editor — TipTap extension at src/cli/ui/editors/mdx-editor/slash-command.ts
 * @does     Registers the "/" trigger as a TipTap Suggestion plugin that opens the command list
 * @depends  @tiptap/core, @tiptap/suggestion, ./slash-command-list, ./editor-actions
 * @do       Customize trigger character or suggestion behavior here
 * @dont     Define actions here — action definitions belong in editor-actions.tsx
 */

import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import tippy, { type Instance } from "tippy.js";
import { SlashCommandList } from "./slash-command-list";
import { BLOCK_ACTIONS, type EditorAction } from "./editor-actions";

function filterCommands(query: string): EditorAction[] {
  const q = query.toLowerCase();
  return BLOCK_ACTIONS.filter((action) => action.title.toLowerCase().includes(q));
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
          props: EditorAction;
        }) => {
          props.slashExec(editor, range);
        },
        render: () => {
          let component: ReactRenderer;
          let popup: Instance[];

          return {
            onStart(props: any) {
              component = new ReactRenderer(SlashCommandList, {
                props: {
                  items: filterCommands(props.query),
                  onSelect: (action: EditorAction) => props.command(action),
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
                onSelect: (action: EditorAction) => props.command(action),
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
