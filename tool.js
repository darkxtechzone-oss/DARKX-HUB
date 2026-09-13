document.getElementById("nav-slot").outerHTML = renderNav("");
document.getElementById("footer-slot").outerHTML = renderFooter();

const id = location.pathname.split("/tool/")[1];

async function load() {
  const el = document.getElementById("content");
  try {
    const { tool: t } = await DX.req("/api/tools/" + id);
    DX.req("/api/tools/" + id + "/view", { method: "POST" }).catch(() => {});

    document.title = t.name + " — DARKX HUB";

    const cover = t.coverImage
      ? `<img src="${DX.escapeHtml(t.coverImage)}" alt="">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk';font-weight:700;font-size:2.4rem;color:var(--text-2)">${DX.toolInitial(t.name)}</div>`;

    const shots = (t.screenshots || [])
      .map((s) => `<img src="${DX.escapeHtml(s)}" alt="screenshot">`)
      .join("");

    el.innerHTML = `
      <div class="detail-head">
        <div class="detail-cover">${cover}</div>
        <div class="detail-info">
          <div class="tool-cat">${DX.escapeHtml(t.category)}</div>
          <h1>${DX.escapeHtml(t.name)}</h1>
          <p class="text-muted mt-8">Imewekwa na ${DX.escapeHtml(t.uploaderName || "Mtumiaji")} · ${DX.timeAgo(t.createdAt)}</p>
          <div class="detail-actions">
            <button class="btn btn-primary" id="btn-download">⬇ Pakua</button>
            <a href="${DX.escapeHtml(t.previewLink)}" target="_blank" class="btn btn-ghost">🔍 Preview</a>
            <a href="https://wa.me/${DX.escapeHtml((t.number || "").replace(/[^0-9]/g, ""))}" target="_blank" class="btn btn-outline">💬 Wasiliana</a>
          </div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box"><div class="k">Size</div><div class="v">${DX.escapeHtml(t.size)}</div></div>
        <div class="info-box"><div class="k">Version</div><div class="v">v${DX.escapeHtml(t.version)}</div></div>
        <div class="info-box"><div class="k">Downloads</div><div class="v">${t.downloads || 0}</div></div>
        <div class="info-box"><div class="k">Views</div><div class="v">${t.views || 0}</div></div>
      </div>

      <h3 class="mt-24">Maelezo</h3>
      <p class="mt-8" style="color:var(--text-1); white-space:pre-wrap;">${DX.escapeHtml(t.description || "Hakuna maelezo zaidi.")}</p>

      ${
        shots
          ? `<h3 class="mt-32">Picha / Links za Ziada</h3><div class="shot-row mt-16">${shots}</div>`
          : ""
      }
    `;

    document.getElementById("btn-download").onclick = async () => {
      const r = await DX.req("/api/tools/" + id + "/download", { method: "POST" });
      window.open(r.downloadLink, "_blank");
    };
  } catch (e) {
    el.innerHTML = `<div class="empty-state"><h3>Tool haipatikani</h3><p>${e.message}</p><a href="/" class="btn btn-ghost mt-16">Rudi Nyumbani</a></div>`;
  }
}
load();
