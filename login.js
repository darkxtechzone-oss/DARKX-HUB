document.getElementById("nav-slot").outerHTML = renderNav("");
document.getElementById("footer-slot").outerHTML = renderFooter();

if (DX.userToken) location.href = "/my-tools";

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");

tabLogin.onclick = () => {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
};
tabRegister.onclick = () => {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
};

function showAlert(msg, ok = false) {
  document.getElementById("form-alert").innerHTML = `<div class="alert ${ok ? "alert-ok" : "alert-error"}">${msg}</div>`;
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await DX.req("/api/auth/login", {
      method: "POST",
      body: {
        number: document.getElementById("l-number").value.trim(),
        password: document.getElementById("l-password").value,
      },
    });
    DX.setSession(data.token, data.user);
    location.href = "/my-tools";
  } catch (err) {
    showAlert(err.message);
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await DX.req("/api/auth/register", {
      method: "POST",
      body: {
        name: document.getElementById("r-name").value.trim(),
        number: document.getElementById("r-number").value.trim(),
        password: document.getElementById("r-password").value,
      },
    });
    DX.setSession(data.token, data.user);
    location.href = "/my-tools";
  } catch (err) {
    showAlert(err.message);
  }
});
