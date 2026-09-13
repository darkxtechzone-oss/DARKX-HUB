document.getElementById("nav-slot").outerHTML = renderNav("home");
document.getElementById("footer-slot").outerHTML = renderFooter();

// insert search box into nav
(function addSearch() {
  const ctaWrap = document.querySelector(".nav-inner");
  const search = document.createElement("div");
  search.className = "nav-search";
  search.innerHTML = `<input id="search-input" placeholder="Tafuta tool..." />`;
  ctaWrap.insertBefore(search, document.querySelector(".nav-spacer"));
})();

let currentCategory = "";
let currentSearch = "";

async function loadCategories() {
  try {
    const { categories } = await DX.req("/api/tools/categories");
    const row = document.getElementById("chip-row");
    document.getElementById("stat-cats").textContent = categories.length;
    categories.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "chip";
      btn.textContent = c;
      btn.dataset.cat = c;
      btn.onclick = () => selectCategory(c, btn);
      row.appendChild(btn);
    });
    row.querySelector(".chip").onclick = () => selectCategory("", row.querySelector(".chip"));
  } catch (e) {}
}

function selectCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  loadTools();
}

function toolCard(t) {
  const cover = t.coverImage
    ? `<img src="${DX.escapeHtml(t.coverImage)}" alt="">`
    : DX.toolInitial(t.name);
  return `
  <div class="tool-card" onclick="location.href='/tool/${t.id}'">
    <div class="tool-cover">${cover}</div>
    <div class="tool-body">
      <div class="tool-name">${DX.escapeHtml(t.name)}</div>
      <div class="tool-cat">${DX.escapeHtml(t.category)}</div>
      <div class="tool-desc">${DX.escapeHtml(t.description)}</div>
      <div class="tool-meta">
        <span>⬇ ${t.downloads || 0}</span>
        <span>${DX.escapeHtml(t.size)}</span>
        <span>v${DX.escapeHtml(t.version)}</span>
      </div>
    </div>
  </div>`;
}

async function loadTools() {
  const grid = document.getElementById("tool-grid");
  grid.innerHTML = `<div class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>`;
  try {
    const params = new URLSearchParams();
    if (currentCategory) params.set("category", currentCategory);
    if (currentSearch) params.set("search", currentSearch);
    const { tools } = await DX.req("/api/tools?" + params.toString());
    document.getElementById("result-count").textContent = tools.length + " tools";
    document.getElementById("stat-tools").textContent = tools.length;
    document.getElementById("stat-downloads").textContent = tools.reduce((s, t) => s + (t.downloads || 0), 0);
    if (!tools.length) {
      grid.innerHTML = `<div class="empty-state"><h3>Hakuna tool bado</h3><p>Kuwa wa kwanza kuweka tool yako.</p></div>`;
      return;
    }
    grid.innerHTML = tools.map(toolCard).join("");
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><h3>Imeshindikana kupakia tools</h3><p>${e.message}</p></div>`;
  }
}

let searchTimer;
document.getElementById("search-input").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentSearch = e.target.value.trim();
    loadTools();
  }, 300);
});

loadCategories();
loadTools();
