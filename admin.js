const gate = document.getElementById("gate");
const dashboard = document.getElementById("dashboard");

function openDashboard() {
  gate.classList.add("hidden");
  dashboard.classList.remove("hidden");
  loadOverview();
  loadPending();
}

if (DX.adminToken) {
  // verify token still works
  DX.req("/api/admin/stats", { admin: true })
    .then(openDashboard)
    .catch(() => DX.clearAdminSession());
}

document.getElementById("gate-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pw = document.getElementById("gate-password").value;
  try {
    const { token } = await DX.req("/api/admin/login", { method: "POST", body: { password: pw } });
    DX.setAdminSession(token);
    openDashboard();
  } catch (err) {
    document.getElementById("gate-alert").innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
});

document.getElementById("admin-logout").onclick = () => {
  DX.clearAdminSession();
  location.reload();
};

// ---------- tabs ----------
document.querySelectorAll(".admin-nav-btn[data-tab]").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".admin-nav-btn[data-tab]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
    document.getElementById("tab-" + btn.dataset.tab).classList.remove("hidden");
    if (btn.dataset.tab === "tools") loadAllTools();
    if (btn.dataset.tab === "users") loadUsers();
    if (btn.dataset.tab === "pending") loadPending();
    if (btn.dataset.tab === "overview") loadOverview();
  };
});

// ---------- overview ----------
async function loadOverview() {
  const wrap = document.getElementById("admin-stats");
  try {
    const s = await DX.req("/api/admin/stats", { admin: true });
    const cards = [
      ["Tools Zote", s.totalTools],
      ["Zilizoidhinishwa", s.approved],
      ["Zinazosubiri", s.pending],
      ["Zilizokataliwa", s.rejected],
      ["Downloads", s.totalDownloads],
      ["Views", s.totalViews],
      ["Watumiaji", s.totalUsers],
    ];
    wrap.innerHTML = cards
      .map((c) => `<div class="admin-stat-card"><div class="num">${c[1]}</div><div class="lbl">${c[0]}</div></div>`)
      .join("");
  } catch (e) {}
}

// ---------- pending ----------
async function loadPending() {
  const wrap = document.getElementById("pending-list");
  wrap.innerHTML = `<div class="spinner"></div>`;
  try {
    const { tools } = await DX.req("/api/admin/tools?status=pending", { admin: true });
    if (!tools.length) {
      wrap.innerHTML = `<div class="empty-state"><h3>Hakuna kinachosubiri</h3><p>Tools zote mpya zitaonekana hapa.</p></div>`;
      return;
    }
    wrap.innerHTML = renderToolsTable(tools, true);
    bindTableActions(wrap);
  } catch (e) {
    wrap.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}

// ---------- all tools ----------
async function loadAllTools() {
  const wrap = document.getElementById("tools-list");
  wrap.innerHTML = `<div class="spinner"></div>`;
  try {
    const { tools } = await DX.req("/api/admin/tools", { admin: true });
    if (!tools.length) {
      wrap.innerHTML = `<div class="empty-state"><h3>Hakuna tools</h3></div>`;
      return;
    }
    wrap.innerHTML = renderToolsTable(tools, false);
    bindTableActions(wrap);
  } catch (e) {
    wrap.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}

const badgeMap = {
  pending: '<span class="badge badge-pending">Pending</span>',
  approved: '<span class="badge badge-approved">Approved</span>',
  rejected: '<span class="badge badge-rejected">Rejected</span>',
};

function renderToolsTable(tools, showApprove) {
  return `<table><thead><tr>
      <th>Tool</th><th>Category</th><th>Muuzaji</th><th>Status</th><th>Downloads</th><th>Actions</th>
    </tr></thead><tbody>
    ${tools
      .map(
        (t) => `<tr data-id="${t.id}">
        <td><a href="/tool/${t.id}" target="_blank">${DX.escapeHtml(t.name)}</a></td>
        <td>${DX.escapeHtml(t.category)}</td>
        <td>${DX.escapeHtml(t.uploaderName || "-")}<br><span class="text-muted">${DX.escapeHtml(t.number)}</span></td>
        <td>${badgeMap[t.status]}</td>
        <td>${t.downloads || 0}</td>
        <td class="row-actions">
          ${
            showApprove
              ? `<button class="btn btn-sm btn-primary act-approve">Idhinisha</button>
                 <button class="btn btn-sm btn-danger act-reject">Kataa</button>`
              : ""
          }
          <button class="btn btn-sm btn-ghost act-edit">Hariri</button>
          <button class="btn btn-sm btn-danger act-delete">Futa</button>
        </td>
      </tr>`
      )
      .join("")}
    </tbody></table>`;
}

function bindTableActions(wrap) {
  wrap.querySelectorAll("tr[data-id]").forEach((row) => {
    const id = row.dataset.id;
    const approve = row.querySelector(".act-approve");
    const reject = row.querySelector(".act-reject");
    const edit = row.querySelector(".act-edit");
    const del = row.querySelector(".act-delete");
    if (approve) approve.onclick = () => updateStatus(id, "approved");
    if (reject) reject.onclick = () => updateStatus(id, "rejected");
    if (edit) edit.onclick = () => openEdit(id);
    if (del) del.onclick = () => deleteTool(id);
  });
}

async function updateStatus(id, status) {
  try {
    await DX.req("/api/admin/tools/" + id, { method: "PUT", admin: true, body: { status } });
    loadPending();
    loadAllTools();
    loadOverview();
  } catch (e) {
    alert(e.message);
  }
}

async function deleteTool(id) {
  if (!confirm("Futa tool hii kabisa?")) return;
  try {
    await DX.req("/api/admin/tools/" + id, { method: "DELETE", admin: true });
    loadPending();
    loadAllTools();
    loadOverview();
  } catch (e) {
    alert(e.message);
  }
}

// ---------- edit modal ----------
const editModal = document.getElementById("edit-modal");
async function openEdit(id) {
  try {
    const { tool: t } = await DX.req("/api/tools/" + id);
    document.getElementById("e-id").value = t.id;
    document.getElementById("e-name").value = t.name;
    document.getElementById("e-category").value = t.category;
    document.getElementById("e-number").value = t.number;
    document.getElementById("e-download").value = t.downloadLink;
    document.getElementById("e-preview").value = t.previewLink;
    document.getElementById("e-cover").value = t.coverImage || "";
    document.getElementById("e-size").value = t.size;
    document.getElementById("e-version").value = t.version;
    document.getElementById("e-desc").value = t.description || "";
    document.getElementById("e-status").value = t.status;
    editModal.classList.remove("hidden");
  } catch (e) {
    alert(e.message);
  }
}
document.getElementById("edit-cancel").onclick = () => editModal.classList.add("hidden");

document.getElementById("edit-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("e-id").value;
  const body = {
    name: document.getElementById("e-name").value.trim(),
    category: document.getElementById("e-category").value.trim(),
    number: document.getElementById("e-number").value.trim(),
    downloadLink: document.getElementById("e-download").value.trim(),
    previewLink: document.getElementById("e-preview").value.trim(),
    coverImage: document.getElementById("e-cover").value.trim(),
    size: document.getElementById("e-size").value.trim(),
    version: document.getElementById("e-version").value.trim(),
    description: document.getElementById("e-desc").value.trim(),
    status: document.getElementById("e-status").value,
  };
  try {
    await DX.req("/api/admin/tools/" + id, { method: "PUT", admin: true, body });
    editModal.classList.add("hidden");
    loadPending();
    loadAllTools();
    loadOverview();
  } catch (err) {
    document.getElementById("edit-alert").innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
});

// ---------- users ----------
async function loadUsers() {
  const wrap = document.getElementById("users-list");
  wrap.innerHTML = `<div class="spinner"></div>`;
  try {
    const { users } = await DX.req("/api/admin/users", { admin: true });
    if (!users.length) {
      wrap.innerHTML = `<div class="empty-state"><h3>Hakuna watumiaji</h3></div>`;
      return;
    }
    wrap.innerHTML = `<table><thead><tr><th>Jina</th><th>Namba</th><th>Alijiunga</th><th>Actions</th></tr></thead><tbody>
      ${users
        .map(
          (u) => `<tr>
            <td>${DX.escapeHtml(u.name)}</td>
            <td>${DX.escapeHtml(u.number)}</td>
            <td>${DX.timeAgo(u.createdAt)}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">Futa</button></td>
          </tr>`
        )
        .join("")}
      </tbody></table>`;
  } catch (e) {
    wrap.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}

async function deleteUser(id) {
  if (!confirm("Futa mtumiaji huyu?")) return;
  try {
    await DX.req("/api/admin/users/" + id, { method: "DELETE", admin: true });
    loadUsers();
    loadOverview();
  } catch (e) {
    alert(e.message);
  }
}
