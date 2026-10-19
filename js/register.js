renderNav();

if (isLoggedIn()) {
  window.location.replace("index.html");
}

const form = document.getElementById("form");
const errorBox = document.getElementById("error");
const submitBtn = document.getElementById("submit");

// hien thi tbao loi
function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

//hàm kiểm tra dữ liệu
function validate(data) {
  if (data.username === "") {
    return "Vui lòng nhập username.";
  }

  if (data.email === "" || !data.email.includes("@")) {
    return "Email không hợp lệ.";
  }

  if (data.password.length < 8) {
    return "Mật khẩu phải có ít nhất 8 kí tự.";
  }

  if (data.display_name === "") {
    return "Vui lòng nhập tên hiển thị.";
  }
  return "";
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  errorBox.hidden = true;

  const data = {
    username: form.elements["username"].value.trim(),
    email: form.elements["email"].value.trim(),
    password: form.elements["password"].value,
    display_name: form.elements["display_name"].value.trim(),
    bio: form.elements["bio"].value.trim(),
    country: form.elements["country"].value.trim(),
  };

  // kiem tra du lieu truoc khi gui
  const errorMessage = validate(data);
  if (errorMessage !== "") {
    showError(errorMessage);
    return;
  }

  // bat trang thai loading
  submitBtn.disabled = true;
  submitBtn.textContent = "Đang tạo tài khoản...";

  try {
    const result = await callApi("/api/auth/register", "POST", data);

    //luu token tu phan hoi dang ki
    let saved = saveTokens(result);
    if (!saved) {
      const loginResult = await callApi("/api/auth/login", "POST", {
        email: data.email,
        password: data.password,
      });
      saved = saveTokens(loginResult);
    }

    if (!saved) {
      throw new Error("Đăng ký xong nhưng không nhận được token.");
    }

    window.location.href = "index.html";
  } catch (error) {
    showError(error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "Đăng ký";
  }
});
