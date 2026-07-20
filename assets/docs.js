/* keel docs shell — on-page anchor list, active-section highlight,
   and Ctrl+K search. Site JS; the framework ships none. */
(function () {
  "use strict";

  /* site root prefix: '' on marketing pages, '../' inside /docs/ */
  var SITEROOT = location.pathname.replace(/\\/g, "/").includes("/docs/") ? "../" : "";

  /* ---- nav icons: decorate the site chrome (site JS, not framework) ---- */
  var SIDEBAR_ICONS = {
    "start.html": "home", "frameworks.html": "compass", "concepts.html": "info",
    "changelog.html": "history",
    "tokens.html": "tag", "base.html": "file", "typography.html": "edit",
    "layout.html": "grid", "components.html": "list",
    "components-actions.html": "send", "components-forms.html": "check-circle",
    "components-surfaces.html": "folder", "components-feedback.html": "bell",
    "components-overlays.html": "copy", "components-navigation.html": "menu",
    "components-identity.html": "image", "components-motion.html": "refresh",
    "components-extending.html": "code", "components-app.html": "terminal",
    "utilities.html": "filter", "icons.html": "star", "sections.html": "grid",
    "templates.html": "bookmark", "design.html": "palette", "paths.html": "route"
  };
  var GROUP_ICONS = { "getting started": "star", "reference": "file", "build": "grid" };

  function icon(name) {
    return '<span class="k-icon k-icon--' + name + ' nav-ico" aria-hidden="true"></span>';
  }
  function fileOf(href) {
    if (!href) return "";
    return href.split("#")[0].split("/").pop();
  }
  function prepend(el, html) {
    if (el.querySelector(".nav-ico")) return;
    el.insertAdjacentHTML("afterbegin", html + " ");
  }
  /* wrap a link's own text (everything but its .nav-ico) in a span, so
     the collapsible sidebar's icon-only mode (.k-sidebar--collapsible
     .is-collapsed) has something precise to hide — CSS can't target a
     bare text node. */
  function wrapLabel(a) {
    if (a.querySelector(".nav-label")) return;
    var span = document.createElement("span");
    span.className = "nav-label";
    Array.from(a.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && n.classList.contains("nav-ico")) return;
      span.appendChild(n);
    });
    a.appendChild(span);
  }

  /* top nav — by visible label so 'Documentation' and 'Docs' both map.
     Matches both the desktop list and the mobile drawer's duplicate list
     so the two stay visually in sync. */
  document.querySelectorAll(".k-nav__links a, .k-menu a").forEach(function (a) {
    var t = a.textContent.toLowerCase();
    var ico = t.indexOf("doc") > -1 ? "file"
            : t.indexOf("template") > -1 ? "bookmark"
            : t.indexOf("section") > -1 ? "grid"
            : t.indexOf("icon") > -1 ? "star"
            : t.indexOf("design") > -1 ? "palette" : null;
    if (ico) prepend(a, icon(ico));
  });

  /* sidebar links — by filename, falling back to a generic page icon:
     in the collapsed icon rail the icon is a link's only visible
     affordance, so a page missing from the map must not vanish */
  document.querySelectorAll(".docs-side a[href]").forEach(function (a) {
    var ico = SIDEBAR_ICONS[fileOf(a.getAttribute("href"))] || "file";
    prepend(a, icon(ico));
    wrapLabel(a);
  });

  /* sidebar group headers — each is a <details class="k-nav-group">'s
     <summary>, not a bare .k-uppercase paragraph */
  document.querySelectorAll(".docs-side .k-nav-group > summary").forEach(function (p) {
    var ico = GROUP_ICONS[p.textContent.trim().toLowerCase()];
    if (ico) prepend(p, icon(ico));
  });

  /* the collapsible-sidebar icon-rail toggle */
  var sidebarToggle = document.getElementById("docs-sidebar-toggle");
  var sidebar = document.getElementById("docs-sidebar");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", function () {
      var collapsed = sidebar.classList.toggle("is-collapsed");
      sidebarToggle.setAttribute("aria-pressed", String(collapsed));
      sidebarToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar to icons");
    });
  }

  /* outbound links in the footer get an external-link affordance */
  document.querySelectorAll(".k-footer a[href^='http']").forEach(function (a) {
    if (a.querySelector(".nav-ico")) return;
    a.insertAdjacentHTML("beforeend", " " + icon("external"));
  });

  /* the icon gallery lives on its own page (docs/icons.html) with a
     page-local script — not shared chrome. */

  var main = document.querySelector(".docs-main");

  var PAGE_ORDER = [
    ["start.html", "Start"], ["frameworks.html", "Framework guides"],
    ["concepts.html", "Concepts"], ["changelog.html", "Changelog"],
    ["tokens.html", "Tokens"], ["base.html", "Base"],
    ["typography.html", "Typography"],
    ["layout.html", "Layout"], ["components.html", "Components"],
    ["components-actions.html", "Actions"],
    ["components-forms.html", "Forms"],
    ["components-surfaces.html", "Surfaces & data"],
    ["components-feedback.html", "Feedback"],
    ["components-overlays.html", "Overlays"],
    ["components-navigation.html", "Navigation"],
    ["components-identity.html", "Identity & media"],
    ["components-motion.html", "Motion"],
    ["components-extending.html", "Extending"],
    ["components-app.html", "Application"],
    ["utilities.html", "Utilities"], ["icons.html", "Icons"],
    ["sections.html", "Sections"], ["paths.html", "Paths"]
  ];

  /* prev / next pagination at the bottom of every doc page */
  if (main) {
    var here = location.pathname.split("/").pop() || "index.html";
    var i = PAGE_ORDER.findIndex(function (p) { return p[0] === here; });
    if (i !== -1) {
      var pager = document.createElement("nav");
      pager.className = "docs-pager";
      pager.setAttribute("aria-label", "Documentation pages");
      var prev = PAGE_ORDER[i - 1], next = PAGE_ORDER[i + 1];
      pager.innerHTML =
        (prev ? '<a class="k-btn k-btn--ghost" href="' + prev[0] + '"><span class="k-icon k-icon--arrow-left" aria-hidden="true"></span> ' + prev[1] + "</a>" : "<span></span>") +
        (next ? '<a class="k-btn k-btn--ghost" href="' + next[0] + '">' + next[1] + ' <span class="k-icon k-icon--arrow-right" aria-hidden="true"></span></a>' : "<span></span>");
      main.appendChild(pager);
    }
  }

  /* ---- on-page anchors ----
     Wide viewports get the Tailwind-style right rail; otherwise the
     list lives in the left sidebar under the topics. */
  var anchorHost = document.getElementById("docs-anchors");
  if (main && anchorHost && matchMedia("(min-width: 1280px)").matches) {
    var shell = main.closest(".k-sidebar");
    if (shell) {
      var rail = document.createElement("aside");
      rail.className = "k-sticky docs-side docs-toc";
      rail.appendChild(anchorHost);
      shell.appendChild(rail);
      shell.classList.add("docs-3col");
    }
  }
  if (main && anchorHost) {
    /* direct sections only — demo h2s nested inside cards/examples
       must not become anchors */
    var heads = main.querySelectorAll(":scope > h2, :scope > section > h2");
    if (heads.length > 1) {
      var title = document.createElement("p");
      title.className = "k-uppercase k-text-faint";
      title.textContent = "On this page";
      anchorHost.appendChild(title);
      var ul = document.createElement("ul");
      ul.className = "k-list k-list--flush docs-anchors";
      heads.forEach(function (h) {
        if (!h.id) h.id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);
        ul.appendChild(li);
      });
      anchorHost.appendChild(ul);

      /* active-section highlight */
      var links = ul.querySelectorAll("a");
      var byId = {};
      links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            links.forEach(function (a) { a.removeAttribute("aria-current"); });
            var a = byId[en.target.id];
            if (a) a.setAttribute("aria-current", "true");
          }
        });
      }, { rootMargin: "0px 0px -70% 0px" });
      heads.forEach(function (h) { io.observe(h); });
    }
  }

  /* ---- search (Ctrl+K) ---- */
  var index = null;
  function loadIndex() {
    if (index) return Promise.resolve(index);
    return fetch(SITEROOT + "data/search-index.json")
      .then(function (r) { return r.json(); })
      .then(function (j) { index = j; return j; })
      .catch(function () { return []; });
  }

  var dlg = document.createElement("dialog");
  dlg.className = "docs-search";
  dlg.innerHTML =
    '<div class="k-field" style="margin:0">' +
    '<label class="k-visually-hidden" for="docs-q">Search the docs</label>' +
    '<input id="docs-q" type="search" placeholder="Search the docs…" autocomplete="off">' +
    "</div>" +
    '<ul class="k-list docs-search__results" id="docs-results" hidden></ul>' +
    '<p class="k-text-faint k-text-xs k-mt-2" style="margin-bottom:0">Esc to close · Enter opens the first result</p>';
  document.body.appendChild(dlg);
  var q = dlg.querySelector("#docs-q");
  var out = dlg.querySelector("#docs-results");

  function openSearch() {
    loadIndex();
    dlg.showModal();
    q.value = ""; out.hidden = true; out.innerHTML = "";
    q.focus();
  }

  function render(hits) {
    out.innerHTML = "";
    out.hidden = hits.length === 0;
    hits.slice(0, 12).forEach(function (h) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = SITEROOT + h.page + (h.anchor ? "#" + h.anchor : "");
      a.innerHTML = "<strong>" + h.title + "</strong> <small class='k-text-faint'>· " +
        h.pageTitle + "</small><br><small>" + h.text + "</small>";
      li.appendChild(a);
      out.appendChild(li);
    });
  }

  q.addEventListener("input", function () {
    var v = q.value.trim().toLowerCase();
    if (v.length < 2) { out.hidden = true; return; }
    loadIndex().then(function (ix) {
      var hits = ix.map(function (e) {
        var hay = (e.title + " " + e.text).toLowerCase();
        var score = 0;
        v.split(/\s+/).forEach(function (w) {
          if (e.title.toLowerCase().includes(w)) score += 3;
          else if (hay.includes(w)) score += 1;
        });
        return { e: e, score: score };
      }).filter(function (x) { return x.score > 0; })
        .sort(function (a, b) { return b.score - a.score; })
        .map(function (x) { return x.e; });
      render(hits);
    });
  });

  q.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      var first = out.querySelector("a");
      if (first) { location.href = first.href; dlg.close(); }
    }
  });

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      dlg.open ? dlg.close() : openSearch();
    }
  });

  /* a search affordance in the site nav — added to both the desktop list
     and the mobile drawer's duplicate list, so mobile isn't missing it */
  document.querySelectorAll(".k-nav__links, .k-menu").forEach(function (navList) {
    var li = document.createElement("li");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "docs-search-btn";
    btn.innerHTML = '<span class="k-icon k-icon--search" aria-hidden="true"></span> <kbd>Ctrl K</kbd>';
    btn.setAttribute("aria-label", "Search the docs");
    btn.addEventListener("click", openSearch);
    li.appendChild(btn);
    navList.appendChild(li);
  });
})();
