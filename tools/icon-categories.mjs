/* icon-categories.mjs — the taxonomy for keel's icon set.
   One ordered list of categories, each with its icon names. build.mjs
   turns this + the CSS into icons.json (name, category, tags, css, svg)
   — the machine-readable manifest the Icons page groups by and that an
   AI/MCP client reads to add an icon.
   Any icon in keel-icons.css not listed here lands in "misc" (build warns). */

export const CATEGORIES = [
  { id: "signature", label: "keel signature", icons: [
    "keel", "contrast", "path", "token", "derive", "light", "dark" ] },

  { id: "essentials", label: "Essentials", icons: [
    "check", "check-circle", "check-double", "x", "x-circle", "plus", "plus-circle",
    "minus", "minus-circle", "ban", "info", "warn", "help", "more-h", "more-v",
    "menu", "search", "refresh", "external", "expand", "collapse", "maximize", "minimize" ] },

  { id: "arrows", label: "Arrows & chevrons", icons: [
    "arrow-up", "arrow-down", "arrow-left", "arrow-right", "arrows-h", "arrows-v",
    "chevron-up", "chevron-down", "chevron-left", "chevron-right", "move",
    "undo", "redo", "reply" ] },

  { id: "actions", label: "Actions", icons: [
    "edit", "trash", "copy", "save", "download", "upload", "share", "link",
    "settings", "sliders", "filter", "sort", "lock", "unlock", "eye", "eye-off",
    "send", "printer", "clipboard", "scan", "crop", "rotate-cw", "rotate-ccw",
    "flip-h", "flip-v", "scissors", "wand", "eraser", "zoom-in", "zoom-out",
    "toggle-on", "toggle-off" ] },

  { id: "text", label: "Text & editor", icons: [
    "bold", "italic", "underline", "strikethrough", "heading", "h1", "h2", "h3",
    "paragraph", "quote", "list", "list-ol", "indent", "outdent",
    "align-left", "align-center", "align-right", "align-justify",
    "emdash", "bullet", "asterisk" ] },

  { id: "layout", label: "Layout & builder", icons: [
    "grid", "columns", "rows", "flex-row", "flex-column",
    "align-top", "align-middle", "align-bottom", "padding", "margin", "corner-radius",
    "layout", "sidebar", "window", "desktop", "tablet", "aperture", "layers" ] },

  { id: "media", label: "Media", icons: [
    "play", "pause", "stop", "skip-back", "skip-forward", "volume", "mute",
    "camera", "mic", "image", "video", "headphones", "waveform" ] },

  { id: "communication", label: "Communication", icons: [
    "mail", "phone", "chat", "comment", "at-sign", "inbox", "message-bot",
    "bell", "rss", "megaphone" ] },

  { id: "files", label: "Files", icons: [
    "file", "file-text", "folder", "folder-open", "archive", "paperclip",
    "book", "box", "boxes", "package" ] },

  { id: "data", label: "Data & charts", icons: [
    "bar-chart", "pie-chart", "activity", "trending-up", "trending-down",
    "database", "gauge", "radar" ] },

  { id: "commerce", label: "Commerce", icons: [
    "cart", "shopping-cart", "cart-plus", "shopping-bag", "store", "credit-card",
    "wallet", "tag", "gift", "gift-card", "receipt", "coins", "dollar-sign",
    "percent", "badge-percent", "barcode", "truck", "scale", "return-box", "money-bag" ] },

  { id: "people", label: "People & feedback", icons: [
    "user", "users", "user-plus", "smile", "hand", "thumbs-up", "thumbs-down",
    "heart", "bookmark", "star", "star-fill", "award", "crown", "gem" ] },

  { id: "medical", label: "Medical", icons: [
    "cross-medical", "stethoscope", "heart-pulse", "pill", "syringe", "ambulance",
    "hospital", "first-aid", "thermometer", "tooth", "dna", "life-buoy" ] },

  { id: "security", label: "Security", icons: [
    "shield", "shield-check", "key", "fingerprint", "badge-check" ] },

  { id: "devices", label: "Devices & tech", icons: [
    "cpu", "server", "gpu", "memory", "wifi", "bluetooth", "battery", "power",
    "plug", "cable", "qr-code", "terminal" ] },

  { id: "ai-dev", label: "AI & dev", icons: [
    "brain", "brain-circuit", "bot", "atom", "binary", "sparkles", "api", "braces",
    "brackets", "code", "command", "hash", "webhook", "function", "variable", "bug",
    "regex", "prompt", "container", "network", "workflow", "sitemap", "route", "node",
    "blocks", "component", "git-branch", "git-commit", "git-merge", "git-pull-request",
    "git-fork", "git-compare" ] },

  { id: "social", label: "Social", icons: [
    "facebook", "twitter", "instagram", "linkedin", "youtube", "github", "tiktok",
    "discord", "whatsapp", "telegram", "twitch", "pinterest", "reddit" ] },

  { id: "weather", label: "Weather & nature", icons: [
    "sun", "moon", "cloud", "cloud-upload", "cloud-download", "droplet", "leaf", "flame", "zap" ] },

  { id: "places", label: "Places & time", icons: [
    "home", "building", "map", "compass", "navigation", "pin", "globe", "flag",
    "calendar", "calendar-check", "clock", "timer", "history", "hourglass" ] },

  { id: "objects", label: "Objects & misc", icons: [
    "rocket", "lightbulb", "target", "briefcase", "briefcase-2", "graduation-cap",
    "newspaper", "presentation", "signature", "palette", "brush", "puzzle",
    "mouse-pointer", "logout", "login", "infinity", "circle", "square", "triangle", "hexagon" ] },

  { id: "filled", label: "Filled variants", icons: [
    "heart-fill", "star-fill", "bell-fill", "bookmark-fill", "circle-fill", "square-fill",
    "shield-fill", "play-fill", "pause-fill", "flag-fill", "pin-fill", "tag-fill",
    "sun-fill", "moon-fill", "droplet-fill", "cloud-fill", "user-fill", "eye-fill",
    "thumbs-up-fill", "check-circle-fill" ] }
];

/* light tag synthesis: split the name on hyphens + a few hand aliases,
   so search matches "logo" -> social, "chart" -> charts, etc. */
export const ALIASES = {
  keel: ["logo", "brand", "hull", "mark", "timber", "layers"],
  contrast: ["wcag", "aa", "guardrail", "accessibility", "duotone", "ratio"],
  path: ["direction", "fork", "branch", "paths", "route"],
  token: ["variable", "custom-property", "css-var", "design-token", "braces"],
  derive: ["seed", "shades", "color-mix", "generate", "spread"],
  light: ["sun", "day", "bright", "theme", "light-mode", "toggle"],
  dark: ["moon", "night", "theme", "dark-mode", "toggle", "auto-dark"],
  emdash: ["dash", "em-dash", "rule", "separator", "hr"],
  bullet: ["dot", "point", "disc", "list", "eyebrow"],
  asterisk: ["star", "splat", "required", "footnote", "eyebrow"],
  twitter: ["x", "tweet"], facebook: ["fb", "meta"], github: ["git", "repo"],
  "dollar-sign": ["money", "usd", "price"], "shopping-cart": ["ecommerce", "buy"],
  cart: ["ecommerce", "buy"], "credit-card": ["payment", "pay"], bot: ["ai", "robot", "chatbot"],
  brain: ["ai", "ml", "neural"], "brain-circuit": ["ai", "ml", "neural"], api: ["endpoint", "dev"],
  webhook: ["api", "dev"], braces: ["json", "code", "curly"], brackets: ["array", "code"],
  "cross-medical": ["health", "plus", "hospital"], stethoscope: ["health", "doctor"],
  gauge: ["speed", "performance", "meter"], rocket: ["launch", "startup", "ship"],
  sparkles: ["ai", "magic", "new"], shield: ["security", "safe", "guard"],
  key: ["api-key", "auth", "password"], node: ["network", "graph"], megaphone: ["announce", "marketing"],
  users: ["team", "group", "people"], "life-buoy": ["support", "help"], hash: ["hashtag", "tag", "number"]
};
