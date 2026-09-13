/* DARKX HUB — shared frontend helpers */
const DX = {
  userToken: localStorage.getItem("dx_token") || null,
  user: JSON.parse(localStorage.getItem("dx_user") || "null"),
  adminToken: sessionStorage.getItem("dx_admin_token") || null,

  async req(url, opts = {}) {
    const headers = opts.headers || {};
    if (opts.auth && this.userToken) headers["Authorization"] = "Bearer " + this.userToken;
    if (opts.admin && this.adminToken) headers["Authorization"] = "Bearer " + this.adminToken;
    if (opts.body) headers["Content-Type"] = "application/json";
    const res = await fetch(url, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Hitilafu imetokea.");
    return data;
  },

  setSession(token, user) {
    this.userToken = token;
    this.user = user;
    localStorage.setItem("dx_token", token);
    localStorage.setItem("dx_user", JSON.stringify(user));
  },
  clearSession() {
    this.userToken = null;
    this.user = null;
    localStorage.removeItem("dx_token");
    localStorage.removeItem("dx_user");
  },
  setAdminSession(token) {
    this.adminToken = token;
    sessionStorage.setItem("dx_admin_token", token);
  },
  clearAdminSession() {
    this.adminToken = null;
    sessionStorage.removeItem("dx_admin_token");
  },

  timeAgo(iso) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "sasa hivi";
    if (s < 3600) return Math.floor(s / 60) + " dakika zilizopita";
    if (s < 86400) return Math.floor(s / 3600) + " masaa yaliyopita";
    return Math.floor(s / 86400) + " siku zilizopita";
  },

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  },

  toolInitial(name) {
    return (name || "?").trim().charAt(0).toUpperCase();
  },
};

function renderNav(active) {
  const loggedIn = !!DX.userToken;
  return `
  <nav class="nav">
    <div class="nav-inner">
      <a href="/" class="brand">
        <span class="brand-mark">DX</span> DARKX HUB
      </a>
      <div class="nav-links">
        <a href="/" class="${active === "home" ? "active" : ""}">Tools</a>
        <a href="/upload" class="${active === "upload" ? "active" : ""}">Upload</a>
        ${loggedIn ? `<a href="/my-tools" class="${active === "my-tools" ? "active" : ""}">Tools Zangu</a>` : ""}
      </div>
      <div class="nav-spacer"></div>
      <div class="nav-cta">
        ${
          loggedIn
            ? `<span class="text-muted" style="font-size:.85rem">Hujambo, ${DX.escapeHtml(DX.user.name)}</span>
               <button class="btn btn-ghost btn-sm" onclick="DX.clearSession(); location.href='/'">Toka</button>`
            : `<a href="/login" class="btn btn-outline btn-sm">Ingia</a>
               <a href="/upload" class="btn btn-primary btn-sm">+ Weka Tool</a>`
        }
      </div>
    </div>
  </nav>`;
}

function renderFooter() {
  return `
  <footer class="footer">
    <div class="container footer-inner">
      <span>© ${new Date().getFullYear()} DARKX HUB — Ghala la Tools za DarkX. Imejengwa na MrX Dev.</span>
      <span>Iko live 24/7</span>
    </div>
  </footer>`;
}
