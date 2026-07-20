#!/usr/bin/env node
/* keel-mcp — a zero-dependency MCP server for the whole keel toolkit.
 *
 * One stdio JSON-RPC server (newline-delimited) that lets an AI agent
 * build a keel site on its own:
 *   • DESIGN  — generate a full design system (tokens CSS + DTCG) from a
 *               color, mood and fonts; list moods/fonts.
 *   • ICONS   — search / fetch icons (get the one-line CSS rule + SVG).
 *   • SECTIONS— search / fetch copy-paste page-section markup.
 *   • PATHS   — list / fetch optional design directions (clay, brutal,
 *               liquid, maximal): the file to link and when to use it.
 *
 * Data: keel-system.mjs (design math), icons.json + patterns.json
 * + paths.json. No dependencies — plain Node ≥18.
 *
 * Add to an MCP client config:
 *   "keel": { "command": "node", "args": ["/abs/path/to/keel-mcp.mjs"] }
 */
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { deriveSystem, MOODS, FONTS, HARMONIES } from "./keel-system.mjs";

const ICONS = JSON.parse(readFileSync(new URL("../data/icons.json", import.meta.url), "utf8"));
const PATTERNS = JSON.parse(readFileSync(new URL("../data/patterns.json", import.meta.url), "utf8"));
const PATHS = JSON.parse(readFileSync(new URL("../data/paths.json", import.meta.url), "utf8"));
const PKG = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const iconByName = new Map(ICONS.icons.map((i) => [i.name, i]));
const pathById = new Map(PATHS.paths.map((p) => [p.id, p]));

const TOOLS = [
  { name: "generate_system",
    description: "Generate a keel design system from seeds. Returns the ready-to-paste @layer tokens CSS, DTCG tokens JSON, and the WCAG contrast ratios (with an AA pass flag). Link keel.css, then paste the tokens CSS after it.",
    inputSchema: { type: "object", properties: {
      color: { type: "string", description: "brand/primary color as hex, e.g. '#2b6cd7'" },
      color2: { type: "string", description: "secondary color as hex — only used when harmony is 'custom' (default '#d81b4f')" },
      color3: { type: "string", description: "third accent (--k-accent-3) as hex, always used as-picked (default '#15796f')" },
      harmony: { type: "string", description: "how the secondary color is derived from `color`, one of: " + Object.keys(HARMONIES).join(", ") + " ('custom' uses color2 as-is; default 'triad')" },
      mood: { type: "string", description: "one of: " + Object.keys(MOODS).join(", ") },
      fonts: { type: "string", description: "font pairing, one of: " + Object.keys(FONTS).join(", ") },
      contrast: { type: "number", description: "0–100 (default 50)" },
      corners: { type: "number", description: "0–100 radius (default 40)" },
      density: { type: "number", description: "0–100 spacing (default 50)" },
    } } },
  { name: "list_moods", description: "List the design-system mood presets.", inputSchema: { type: "object", properties: {} } },
  { name: "list_fonts", description: "List the design-system font pairings.", inputSchema: { type: "object", properties: {} } },

  { name: "search_icons", description: "Search icons by name or tag/concept (e.g. 'payment', 'ai', 'social'). Returns name, category, tags.",
    inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "number" } }, required: ["query"] } },
  { name: "get_icon", description: "Get one icon by name — its ready-to-paste CSS rule, raw currentColor SVG, and category.",
    inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },
  { name: "list_icon_categories", description: "List icon categories with counts.", inputSchema: { type: "object", properties: {} } },

  { name: "search_sections", description: "Search the section/pattern library by name or category (heroes, features, proof, pricing, content, cta, people, chrome).",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_section", description: "Get one page-section's copy-paste HTML by name.",
    inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },

  { name: "list_paths", description: "List keel's optional design directions ('paths'): clay, brutal, liquid, maximal. Each is one stylesheet linked after keel.css to steer the whole look. Returns id, the look, when to use it, and the file to link.",
    inputSchema: { type: "object", properties: {} } },
  { name: "get_path", description: "Get one design path by id (clay/brutal/liquid/maximal): the stylesheet filename, what it changes, when to use it, and the exact <link> tags in order.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
];

function call(name, a) {
  a = a || {};
  switch (name) {
    case "generate_system": {
      const s = deriveSystem({ color: a.color, color2: a.color2, color3: a.color3, harmony: a.harmony, mood: a.mood, fonts: a.fonts, contrast: a.contrast, corners: a.corners, density: a.density });
      const aa = { text: +s.ratios.text.toFixed(2), primary: +s.ratios.accent.toFixed(2), secondary: +s.ratios.accent2.toFixed(2), accent: +s.ratios.accent3.toFixed(2) };
      aa.pass = s.ratios.text >= 7 && s.ratios.accent >= 4.5 && s.ratios.accent2 >= 4.5 && s.ratios.accent3 >= 4.5;
      return { seeds: s.seeds, css: s.css, dtcg: JSON.parse(s.dtcg), contrast: aa, warn: s.warn,
        howToUse: "Link keel.css, then paste `css` (the @layer tokens block) after it — every derived shade follows your seeds." };
    }
    case "list_moods": return { moods: Object.keys(MOODS) };
    case "list_fonts": return { fonts: Object.keys(FONTS).map((k) => ({ id: k, display: FONTS[k].display, body: FONTS[k].body })) };

    case "search_icons": {
      const q = String(a.query || "").toLowerCase(), lim = Number(a.limit) || 25;
      const hits = ICONS.icons.filter((i) => i.name.includes(q) || (i.tags || []).some((t) => t.includes(q)))
        .slice(0, lim).map((i) => ({ name: i.name, category: i.category, tags: i.tags }));
      return { matches: hits.length, icons: hits };
    }
    case "get_icon": {
      const i = iconByName.get(String(a.name || ""));
      if (!i) return { error: `No icon "${a.name}".`, didYouMean: ICONS.icons.filter((x) => x.name.includes(String(a.name || ""))).slice(0, 8).map((x) => x.name) };
      return { name: i.name, category: i.categoryLabel, css: i.css, svg: i.svg,
        howToUse: "Link keel.css, add this CSS rule to any stylesheet, then use <span class=\"k-icon k-icon--" + i.name + "\"></span>." };
    }
    case "list_icon_categories": return { categories: ICONS.categories };

    case "search_sections": {
      const q = String(a.query || "").toLowerCase();
      const hits = PATTERNS.filter((p) => p.name.includes(q) || p.category.includes(q)).map((p) => ({ name: p.name, category: p.category }));
      return { matches: hits.length, sections: hits };
    }
    case "get_section": {
      const p = PATTERNS.find((x) => x.name === String(a.name || ""));
      if (!p) return { error: `No section "${a.name}".`, didYouMean: PATTERNS.filter((x) => x.name.includes(String(a.name || ""))).slice(0, 8).map((x) => x.name) };
      return { name: p.name, category: p.category, html: p.html, howToUse: "Paste into a keel page (needs keel.css); it renders in whatever design system is active." };
    }

    case "list_paths": return { note: PATHS.note,
      paths: PATHS.paths.map((p) => ({ id: p.id, look: p.morphism, file: p.file, whenToUse: p.whenToUse })) };
    case "get_path": {
      const p = pathById.get(String(a.id || "").toLowerCase());
      if (!p) return { error: `No path "${a.id}". Choose one of: ${PATHS.paths.map((x) => x.id).join(", ")}.` };
      return { id: p.id, look: p.morphism, file: p.file, min: p.min, summary: p.summary, changes: p.changes, whenToUse: p.whenToUse,
        link: `<link rel="stylesheet" href="keel.css">\n<link rel="stylesheet" href="${p.file}">`,
        howToUse: "Link keel.css first, then this path file after it (order matters). It restyles the whole page from the active tokens; the site's own unlayered CSS still wins. Pick one path per site." };
    }
    default: return { error: `Unknown tool "${name}".` };
  }
}

/* ---- JSON-RPC over stdio ---- */
function send(m) { process.stdout.write(JSON.stringify(m) + "\n"); }
function reply(id, result) { send({ jsonrpc: "2.0", id, result }); }
function fail(id, code, message) { send({ jsonrpc: "2.0", id, error: { code, message } }); }

function handle(req) {
  const { id, method, params } = req;
  if (method === "initialize")
    return reply(id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "keel", version: PKG.version } });
  if (method === "tools/list") return reply(id, { tools: TOOLS });
  if (method === "tools/call") return reply(id, { content: [{ type: "text", text: JSON.stringify(call(params?.name, params?.arguments), null, 2) }] });
  if (method === "ping") return reply(id, {});
  if (method && method.startsWith("notifications/")) return;
  if (id !== undefined) fail(id, -32601, `Method not found: ${method}`);
}

createInterface({ input: process.stdin }).on("line", (line) => {
  line = line.trim(); if (!line) return;
  let req; try { req = JSON.parse(line); } catch { return; }
  try { handle(req); } catch (e) { if (req && req.id !== undefined) fail(req.id, -32603, String(e && e.message || e)); }
});
