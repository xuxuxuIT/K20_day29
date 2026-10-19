renderNav();

const ARTISTS_URL = "/api/artists?limit=20&offset=0";
const ALBUMS_URL = "/api/albums?limit=20&offset=0";
const TRACKS_URL = "/api/tracks?limit=50&offset=0";
const PLAYLISTS_URL = "/api/playlists?limit=50&offset=0";

function getList(response) {
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  if (response.data && Array.isArray(response.data.items)) {
    return response.data.items;
  }
  if (Array.isArray(response.items)) {
    return response.items;
  }
  const keys = Object.keys(response);
  for (let i = 0; i < keys.length; i++) {
    if (Array.isArray(response[keys[i]])) {
      return response[keys[i]];
    }
  }
  if (response.data && typeof response.data === "object") {
    const innerKeys = Object.keys(response.data);
    for (let i = 0; i < innerKeys.length; i++) {
      if (Array.isArray(response.data[innerKeys[i]])) {
        return response.data[innerKeys[i]];
      }
    }
  }
  return [];
}

function getImage(item) {
  return (
    item.image_url ||
    item.cover_url ||
    item.cover_image_url ||
    item.avatar_url ||
    item.thumbnail ||
    item.image ||
    item.album_cover_image_url ||
    item.artist_image_url ||
    ""
  );
}

function getAudio(item) {
  return item.audio_url || "";
}

function getName(item) {
  return item.name || item.title || "Không có tên";
}

function getArtistName(item) {
  if (item.artist_name) {
    return item.artist_name;
  }
  if (item.artist && item.artist.name) {
    return item.artist.name;
  }
  return "";
}

function getArtistSubText(item) {
  if (Array.isArray(item.genres) && item.genres.length > 0) {
    return item.genres.join(", ");
  }
  if (typeof item.genres === "string" && item.genres !== "") {
    return item.genres;
  }
  return item.bio || "Nghệ sĩ";
}

function formatDuration(value) {
  if (!value) {
    return "";
  }
  let seconds = value;
  if (value > 10000) {
    seconds = Math.round(value / 1000);
  }
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes + ":" + String(rest).padStart(2, "0");
}

function createCard(item, subText, isRound) {
  const image = getImage(item);
  const name = getName(item);

  let imageHtml = '<div class="ph"></div>';
  if (image !== "") {
    imageHtml =
      '<img src="' +
      escapeHtml(image) +
      '" alt="' +
      escapeHtml(name) +
      '" loading="lazy">';
  }

  let cardClass = "card";
  if (isRound) {
    cardClass = "card round";
  }

  return (
    '<div class="' +
    cardClass +
    '">' +
    '<div class="thumb">' +
    imageHtml +
    '<button class="play">▶</button></div>' +
    "<b>" +
    escapeHtml(name) +
    "</b>" +
    "<small>" +
    escapeHtml(subText) +
    "</small>" +
    "</div>"
  );
}

function createTrackRow(item, index) {
  const image = getImage(item);
  const name = getName(item);
  const artist = getArtistName(item) || "Bài hát";
  const duration = formatDuration(item.duration_ms || item.duration);

  let imageHtml = '<div class="ph"></div>';
  if (image !== "") {
    imageHtml =
      '<img src="' +
      escapeHtml(image) +
      '" alt="' +
      escapeHtml(name) +
      '" loading="lazy">';
  }

  return (
    '<div class="track" data-index="' +
    index +
    '">' +
    '<span class="no">' +
    (index + 1) +
    "</span>" +
    imageHtml +
    '<div class="meta"><b>' +
    escapeHtml(name) +
    "</b><small>" +
    escapeHtml(artist) +
    "</small></div>" +
    '<span class="time">' +
    escapeHtml(duration) +
    "</span>" +
    "</div>"
  );
}

//phat nhac
let trackList = []; // danh sách bài hát để tra khi click
let currentIndex = -1; // bài đang phát

function playTrack(index) {
  const item = trackList[index];
  const url = getAudio(item);

  if (url === "") {
    alert("Bài hát này không có file nhạc.");
    return;
  }

  currentIndex = index;

  const audio = document.getElementById("audio");
  audio.src = url;
  audio.play().catch(function (error) {
    console.log("Không phát được:", error);
  });

  document.getElementById("playerName").textContent = getName(item);
  document.getElementById("playerArtist").textContent = getArtistName(item);

  const image = getImage(item);
  const playerImg = document.getElementById("playerImg");
  if (image !== "") {
    playerImg.src = image;
    playerImg.hidden = false;
  } else {
    playerImg.hidden = true;
  }

  document.getElementById("player").hidden = false;

  // Đánh dấu dòng đang phát
  const rows = document.querySelectorAll("#tracks .track");
  for (let i = 0; i < rows.length; i++) {
    rows[i].classList.toggle("playing", i === index);
  }
}

// Hết bài thì tự phát bài tiếp theo
document.getElementById("audio").addEventListener("ended", function () {
  if (currentIndex + 1 < trackList.length) {
    playTrack(currentIndex + 1);
  }
});

// File nhạc lỗi (ví dụ bài Test Song) thì báo trên thanh phát
document.getElementById("audio").addEventListener("error", function () {
  document.getElementById("playerArtist").textContent =
    "Không phát được bài này";
});

// tai bai hat
async function loadArtists() {
  const box = document.getElementById("artists");
  box.innerHTML = '<div class="spin"></div>';

  try {
    const response = await callApi(ARTISTS_URL);
    const list = getList(response);

    if (list.length === 0) {
      box.innerHTML = '<p class="msg">Chưa có nghệ sĩ nào.</p>';
      return;
    }

    let html = "";
    for (let i = 0; i < list.length; i++) {
      html += createCard(list[i], getArtistSubText(list[i]), true);
    }
    box.innerHTML = html;
  } catch (error) {
    box.innerHTML =
      '<p class="msg err">Không tải được nghệ sĩ: ' +
      escapeHtml(error.message) +
      "</p>";
  }
}

async function loadAlbums() {
  const box = document.getElementById("albums");
  box.innerHTML = '<div class="spin"></div>';

  try {
    const response = await callApi(ALBUMS_URL);
    const list = getList(response);

    if (list.length === 0) {
      box.innerHTML = '<p class="msg">Chưa có album nào.</p>';
      return;
    }

    let html = "";
    for (let i = 0; i < list.length; i++) {
      let subText = getArtistName(list[i]);
      if (subText === "") {
        subText = "Album";
      }
      html += createCard(list[i], subText, false);
    }
    box.innerHTML = html;
  } catch (error) {
    box.innerHTML =
      '<p class="msg err">Không tải được album: ' +
      escapeHtml(error.message) +
      "</p>";
  }
}

async function loadTracks() {
  const box = document.getElementById("tracks");
  box.innerHTML = '<div class="spin"></div>';

  try {
    const response = await callApi(TRACKS_URL);
    const list = getList(response);

    if (list.length === 0) {
      box.innerHTML = '<p class="msg">Chưa có bài hát nào.</p>';
      return;
    }

    let html = "";
    for (let i = 0; i < list.length; i++) {
      html += createTrackRow(list[i], i);
    }
    box.innerHTML = html;

    // Lưu danh sách và gắn sự kiện click cho từng dòng
    trackList = list;
    const rows = box.querySelectorAll(".track");
    for (let i = 0; i < rows.length; i++) {
      rows[i].addEventListener("click", function () {
        playTrack(i);
      });
    }
  } catch (error) {
    box.innerHTML =
      '<p class="msg err">Không tải được bài hát: ' +
      escapeHtml(error.message) +
      "</p>";
  }
}

async function loadPlaylists() {
  const box = document.getElementById("playlists");
  box.innerHTML = '<div class="spin"></div>';

  try {
    const response = await callApi(PLAYLISTS_URL);
    const list = getList(response);

    if (list.length === 0) {
      box.innerHTML = '<p class="msg">Chưa có playlist nào.</p>';
      return;
    }

    let html = "";
    for (let i = 0; i < list.length; i++) {
      const subText = list[i].description || "Playlist";
      html += createCard(list[i], subText, false);
    }
    box.innerHTML = html;
  } catch (error) {
    box.innerHTML =
      '<p class="msg err">Không tải được playlist: ' +
      escapeHtml(error.message) +
      "</p>";
  }
}

loadArtists();
loadAlbums();
loadTracks();
loadPlaylists();
