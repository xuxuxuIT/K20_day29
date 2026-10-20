const BASE_URL = "https://spotify.f8team.dev";

function getAccessToken() {
  return localStorage.getItem("access_token");
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

function isLoggedIn() {
  return getAccessToken() !== null;
}

function saveTokens(responseData) {
  let tokens = responseData;
  if (responseData.data) {
    tokens = responseData.data;
  }

  const accessToken = tokens.access_token || tokens.accessToken;
  const refreshToken = tokens.refresh_token || tokens.refreshToken;

  if (accessToken) {
    localStorage.setItem("access_token", accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("refresh_token", refreshToken);
  }

  return accessToken ? true : false;
}

function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

function logout() {
  clearAuth();
  window.location.href = "login.html";
}

// xin token moi
async function doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(BASE_URL + "/api/auth/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return saveTokens(data);
  } catch (error) {
    return false;
  }
}

let refreshPromise = null;

function refreshAccessToken() {
  if (refreshPromise === null) {
    refreshPromise = doRefresh().then(function (result) {
      refreshPromise = null;
      return result;
    });
  }
  return refreshPromise;
}

function formatDetail(item) {
  if (typeof item === "string") {
    return item;
  }

  const field = item.field || item.path || item.param || item.name || "";
  const msg = item.message || item.msg || item.error || item.reason || "";

  if (msg !== "") {
    if (field !== "") {
      return field + ": " + msg;
    }
    return msg;
  }

  return JSON.stringify(item);
}

function getErrorMessage(data, status) {
  let err = data;
  if (data.error && typeof data.error === "object") {
    err = data.error;
  }

  const details = err.details || err.errors;
  if (Array.isArray(details) && details.length > 0) {
    return details.map(formatDetail).join(" | ");
  }
  if (details && typeof details === "object") {
    return Object.keys(details)
      .map(function (key) {
        return key + ": " + details[key];
      })
      .join(" | ");
  }

  const message = err.message || data.message || data.error;
  if (typeof message === "string" && message !== "") {
    return message;
  }

  return "Có lỗi xảy ra (mã " + status + ")";
}

// ham goi api dung chung
async function callApi(path, method = "GET", body = null, isRetry = false) {
  const headers = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  const options = { method: method, headers: headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(BASE_URL + path, options);

  // Token hết hạn: refresh rồi gọi lại request ban đầu
  if (response.status === 401 && token && isRetry === false) {
    const refreshOk = await refreshAccessToken();

    if (refreshOk) {
      return callApi(path, method, body, true);
    }

    clearAuth();
    window.location.href = "login.html?expired=1";
    throw new Error("Phiên đăng nhập đã hết hạn");
  }

  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response.status));
  }

  return data;
}

// tien ich
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderNav() {
  const nav = document.getElementById("nav");
  nav.className = "nav";

  let buttons = "";
  if (isLoggedIn()) {
    buttons =
      '<a class="btn ghost" href="profile.html">👤 Cá nhân</a>' +
      '<button class="btn" id="logoutBtn">Đăng xuất</button>';
  } else {
    buttons =
      '<a class="btn ghost" href="login.html">Đăng nhập</a>' +
      '<a class="btn" href="register.html">Đăng ký</a>';
  }

  nav.innerHTML =
    '<a class="logo" href="index.html"><i>♪</i>Wavely</a>' +
    '<div class="nav-r">' +
    buttons +
    "</div>";

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
}
