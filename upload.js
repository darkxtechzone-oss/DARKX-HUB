document.getElementById("nav-slot").outerHTML = renderNav("upload");
document.getElementById("footer-slot").outerHTML = renderFooter();

const MAX_LINKS = 12;
const guard = document.getElementById("auth-guard");
const form = document.getElementById("upload-form");

if (!DX.userToken) {
  guard.classList.remove("hidden");
} else {
  form.classList.remove("hidden");
}

const extraWrap = document.getElementById("extra-links");
function addLinkRow(value = "") {
  if (extraWrap.children.length >= MAX_LINKS) return;
  const row = document.createElement("div");
  row.className = "repeater-row";
  row.innerHTML = `<input type="url" placeholder="https://..." value="${DX.escapeHtml(value)}">
    <button type="button" class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">✕</button>`;
  extraWrap.appendChild(row);
}
document.getElementById("add-link").onclick = () => addLinkRow();
addLinkRow();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const alertBox = document.getElementById("form-alert");
  alertBox.innerHTML = "";

  const screenshots = [...extraWrap.querySelectorAll("input")]
    .map((i) => i.value.trim())
    .filter(Boolean)
    .slice(0, MAX_LINKS);

  const payload = {
    name: document.getElementById("f-name").value.trim(),
    number: document.getElementById("f-number").value.trim(),
    category: document.getElementById("f-category").value.trim(),
    downloadLink: document.getElementById("f-download").value.trim(),
    previewLink: document.getElementById("f-preview").value.trim(),
    coverImage: document.getElementById("f-cover").value.trim(),
    size: document.getElementById("f-size").value.trim(),
    version: document.getElementById("f-version").value.trim(),
    description: document.getElementById("f-desc").value.trim(),
    screenshots,
  };

  try {
    await DX.req("/api/tools", { method: "POST", auth: true, body: payload });
    alertBox.innerHTML = `<div class="alert alert-ok">Tool imetumwa! Inasubiri idhini ya admin.</div>`;
    form.reset();
    extraWrap.innerHTML = "";
    addLinkRow();
    setTimeout(() => (location.href = "/my-tools"), 1200);
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
});
