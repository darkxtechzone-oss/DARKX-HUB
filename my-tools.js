document.getElementById("nav-slot").outerHTML = renderNav("my-tools");
document.getElementById("footer-slot").outerHTML = renderFooter();

if (!DX.userToken) location.href = "/login";

const badgeMap = {
  pending: '<span class="badge badge-pending">Inasubiri</span>',
  approved: '<span class="badge badge-approved">Imeidhinishwa</span>',
  rejected: '<span class="badge badge-rejected">Imekataliwa</span>',
};

async function load() {
  const list = document.getElementById("list");
  try {
    const { tools } = await DX.req("/api/my-tools", { auth: true });
    if (!tools.length) {
      list.innerHTML = `<div class="empty-state"><h3>Bado hujaweka tool yoyote</h3><p>Bofya "Weka Tool Mpya" kuanza.</p></div>`;
      return;
    }
    list.innerHTML = `<table><thead><tr><th>Tool</th><th>Status</th><th>Downloads</th><th>Tarehe</th><th>Actions</th></tr></thead><tbody>
      ${tools
        .map(
          (t) => `<tr>
            <td><a href="/tool/${t.id}">${DX.escapeHtml(t.name)}</a></td>
            <td>${badgeMap[t.status] || t.status}</td>
            <td>${t.downloads || 0}</td>
            <td>${DX.timeAgo(t.createdAt)}</td>
            <td class="row-actions">
              <button class="btn btn-danger btn-sm" onclick="removeTool('${t.id}')">Futa</button>
            </td>
          </tr>`
        )
        .join("")}
    </tbody></table>`;
  } catch (e) {
    list.innerHTML = `<div class="empty-state"><h3>Imeshindikana</h3><p>${e.message}</p></div>`;
  }
}

async function removeTool(id) {
  if (!confirm("Una uhakika unataka kufuta tool hii?")) return;
  try {
    await DX.req("/api/my-tools/" + id, { method: "DELETE", auth: true });
    load();
  } catch (e) {
    alert(e.message);
  }
}

load();
