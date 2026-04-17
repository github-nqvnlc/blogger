"use client";

import { Node } from "@tiptap/core";

export const EmbeddedMedia = Node.create({
  name: "embeddedMedia",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: "",
      },
      provider: {
        default: "file",
      },
      kind: {
        default: "embed",
      },
      title: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-blog-media]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as {
      src?: string;
      provider?: string;
      kind?: string;
      title?: string;
    };

    if (attrs.kind === "file") {
      return [
        "figure",
        { "data-blog-media": "", "data-provider": attrs.provider ?? "file" },
        [
          "video",
          {
            src: attrs.src,
            controls: "true",
            playsinline: "true",
            preload: "metadata",
            class: "w-full rounded-xl",
          },
        ],
      ];
    }

    return [
      "figure",
      { "data-blog-media": "", "data-provider": attrs.provider ?? "embed" },
      [
        "iframe",
        {
          src: attrs.src,
          title: attrs.title || "Embedded video",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowfullscreen: "true",
          class: "aspect-video w-full rounded-xl border-0",
        },
      ],
    ];
  },
});
