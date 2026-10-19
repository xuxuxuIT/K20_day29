if (!isLoggedIn()) {
  window.location.replace("login.html");
}

renderNav();

const FIELD_LABELS = {
  username: "Username",
  email: "Email",
  bio: "Giới thiệu",
  country: "Quốc gia",
  created_at: "Ngày tạo",
  role: "Vai trò",
};

const HIDDEN_FIELDS = [
  "id",
  "display_name",
  "avatar_url",
  "avatar",
  "image_url",
  "password",
];

async function loadProfile() {
  const box = document.getElementById("content");

  try {
    const response = await callApi("/api/users/me");

    let user = response;
    if (response.data) {
      user = response.data;
    } else if (response.user) {
      user = response.user;
    }

    localStorage.setItem("user", JSON.stringify(user));

    const avatar = user.avatar_url || user.avatar || user.image_url || "";
    const name =
      user.display_name || user.username || user.name || "Người dùng";

    let avatarHtml = '<div class="ph"></div>';
    if (avatar !== "") {
      avatarHtml = '<img src="' + escapeHtml(avatar) + '" alt="Avatar">';
    }

    let rowsHtml = "";
    const entries = Object.entries(user);

    for (let i = 0; i < entries.length; i++) {
      const key = entries[i][0];
      const value = entries[i][1];

      if (HIDDEN_FIELDS.includes(key)) continue;
      if (value === null || value === "") continue;
      if (typeof value === "object") continue;

      const label = FIELD_LABELS[key] || key;
      rowsHtml +=
        "<div><span>" +
        escapeHtml(label) +
        "</span><span>" +
        escapeHtml(value) +
        "</span></div>";
    }

    box.innerHTML =
      '<div class="profile">' +
      avatarHtml +
      "<div><h1>" +
      escapeHtml(name) +
      '</h1><small style="color:var(--mute)">' +
      escapeHtml(user.email || "") +
      "</small></div>" +
      "</div>" +
      '<div class="info">' +
      rowsHtml +
      "</div>";
  } catch (error) {
    box.innerHTML =
      '<div class="alert">Không tải được thông tin: ' +
      escapeHtml(error.message) +
      "</div>";
  }
}

loadProfile();
