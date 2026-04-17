"use client";

import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      setIndent: (level: number) => ReturnType;
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const INDENT_TYPES = ["paragraph", "heading", "blockquote", "codeBlock"];
const MAX_INDENT = 5;

function clampIndent(level: number) {
  return Math.max(0, Math.min(MAX_INDENT, level));
}

export const Indent = Extension.create({
  name: "indent",

  addGlobalAttributes() {
    return [
      {
        types: INDENT_TYPES,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element: HTMLElement) =>
              Number(element.getAttribute("data-indent") ?? 0),
            renderHTML: (attributes: Record<string, number>) => {
              const indent = clampIndent(Number(attributes.indent ?? 0));

              if (!indent) {
                return {};
              }

              return {
                "data-indent": indent,
                style: `margin-left: ${indent * 2}rem;`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setIndent:
        (level: number) =>
        ({ commands }) =>
          INDENT_TYPES.every((type) =>
            commands.updateAttributes(type, { indent: clampIndent(level) }),
          ),
      indent:
        () =>
        ({ editor, commands }) => {
          const currentIndent = Number(
            editor.getAttributes("paragraph").indent ?? 0,
          );
          return INDENT_TYPES.every((type) =>
            commands.updateAttributes(type, {
              indent: clampIndent(currentIndent + 1),
            }),
          );
        },
      outdent:
        () =>
        ({ editor, commands }) => {
          const currentIndent = Number(
            editor.getAttributes("paragraph").indent ?? 0,
          );
          return INDENT_TYPES.every((type) =>
            commands.updateAttributes(type, {
              indent: clampIndent(currentIndent - 1),
            }),
          );
        },
    };
  },
});
