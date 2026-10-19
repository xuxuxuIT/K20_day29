renderNav();

if (isLoggedIn()) {
  window.location.replace("index.html");
}

const form = document.getElementById("form");
const errorBox = document.getElementById("error");
const submitBtn = document.getElementById("submit");

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

if (window.location.search.includes("expired=1")) {
  showError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
}

function validate(email, password) {
  if (email === "" || !email.includes("@")) {
    return "Email không hợp lệ";
  }
  if (password.length < 0) {
    return "Mật khẩu phải có ít nhất 8 kí tự";
  }
  return "";
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  errorBox.hidden = true;

  const email = form.elements["email"].value.trim();
  const password = form.elements["password"].value;

  const errorMessage = validate(email, password);
  if (errorMessage !== "") {
    showError(errorMessage);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Đang đăng nhập...";

  try {
    const result = await callApi("/api/auth/login", "POST", {
      email: email,
      password: password,
    });

    const saved = saveTokens(result);
    if (!saved) {
      throw new Error("Không nhận được token từ máy chủ.");
    }

    window.location.href = "index.html";
  } catch (error) {
    showError(error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "Đăng nhập";
  }
});
