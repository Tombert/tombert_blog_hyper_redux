import type { ThemeRegistrationRaw } from "shiki"

// Approximation of the classic Emacs "wombat" theme for Shiki.
// Palette mirrors Kristoffer Grönlund's wombat-theme.el.
export const wombatTheme: ThemeRegistrationRaw = {
  name: "wombat",
  type: "dark",
  colors: {
    "editor.background": "#242424",
    "editor.foreground": "#f6f3e8",
    "editor.selectionBackground": "#444444",
    "editor.lineHighlightBackground": "#2d2d2d",
    "editorLineNumber.foreground": "#857f78",
    "editorCursor.foreground": "#656565",
  },
  settings: [
    {
      scope: ["comment", "punctuation.definition.comment", "string.comment"],
      settings: { foreground: "#99968b", fontStyle: "italic" },
    },
    {
      scope: [
        "string",
        "string.quoted",
        "constant.other.symbol",
        "meta.embedded.assembly",
      ],
      settings: { foreground: "#95e454" },
    },
    {
      scope: ["constant.character.escape", "constant.other.placeholder"],
      settings: { foreground: "#cae682" },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.character",
        "constant.other",
      ],
      settings: { foreground: "#e5786d" },
    },
    {
      scope: [
        "keyword",
        "keyword.control",
        "keyword.operator.new",
        "storage",
        "storage.type",
        "storage.modifier",
      ],
      settings: { foreground: "#8ac6f2", fontStyle: "bold" },
    },
    {
      scope: ["keyword.operator"],
      settings: { foreground: "#8ac6f2" },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call entity.name.function",
        "meta.function entity.name.function",
      ],
      settings: { foreground: "#cae682" },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "entity.other.inherited-class",
        "support.class",
        "support.type",
      ],
      settings: { foreground: "#cae682", fontStyle: "bold" },
    },
    {
      scope: ["variable", "variable.other", "variable.parameter"],
      settings: { foreground: "#cae682" },
    },
    {
      scope: ["variable.language", "variable.other.constant"],
      settings: { foreground: "#e5786d" },
    },
    {
      scope: ["support.variable", "support.constant"],
      settings: { foreground: "#e5786d" },
    },
    {
      scope: ["entity.name.tag"],
      settings: { foreground: "#8ac6f2", fontStyle: "bold" },
    },
    {
      scope: ["entity.other.attribute-name"],
      settings: { foreground: "#cae682" },
    },
    {
      scope: ["punctuation.definition.tag", "meta.tag"],
      settings: { foreground: "#99968b" },
    },
    {
      scope: ["markup.heading", "markup.heading entity.name"],
      settings: { foreground: "#cae682", fontStyle: "bold" },
    },
    {
      scope: ["markup.italic"],
      settings: { foreground: "#f6f3e8", fontStyle: "italic" },
    },
    {
      scope: ["markup.bold"],
      settings: { foreground: "#f6f3e8", fontStyle: "bold" },
    },
    {
      scope: ["markup.quote"],
      settings: { foreground: "#99968b", fontStyle: "italic" },
    },
    {
      scope: ["markup.inline.raw", "markup.raw"],
      settings: { foreground: "#95e454" },
    },
    {
      scope: ["markup.inserted"],
      settings: { foreground: "#95e454" },
    },
    {
      scope: ["markup.deleted"],
      settings: { foreground: "#e5786d" },
    },
    {
      scope: ["markup.changed"],
      settings: { foreground: "#cae682" },
    },
    {
      scope: ["markup.underline.link", "string.other.link"],
      settings: { foreground: "#8ac6f2", fontStyle: "underline" },
    },
    {
      scope: ["invalid", "invalid.illegal"],
      settings: { foreground: "#ffffff", background: "#e5786d" },
    },
  ],
}
