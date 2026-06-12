const baseMemories = [
  {
    src: "./assets/photos-web/photo-1.jpg",
    date: "自拍时刻",
    title: "靠近镜头，也靠近心动",
    text: "有些可爱不需要排练，一抬眼就已经很珍贵。"
  },
  {
    src: "./assets/photos-web/photo-2.jpg",
    date: "夜路散步",
    title: "牵着走过的街，会被记很久",
    text: "灯牌亮着，风也轻轻的，那一刻像电影里的慢镜头。"
  },
  {
    src: "./assets/photos-web/photo-3.jpg",
    date: "镜子前",
    title: "把自己拍进今天",
    text: "生活没有特意布景，可你站在那里，画面就成立了。"
  },
  {
    src: "./assets/photos-web/photo-4.jpg",
    date: "小表情",
    title: "可爱会突然出现",
    text: "那些随手拍下来的表情，后来都变成了舍不得删的证据。"
  },
  {
    src: "./assets/photos-web/photo-5.jpg",
    date: "软乎乎",
    title: "今天也很想被你逗笑",
    text: "滤镜、帽子、毛茸茸的耳朵，还有一整天的好心情。"
  },
  {
    src: "./assets/photos-web/photo-6.jpg",
    date: "生日夜",
    title: "有你在，愿望就变得具体",
    text: "那些没有说完的话，都在灯光、蛋糕和笑意里，替我们慢慢说完。"
  },
  {
    src: "./assets/photos-web/photo-7.jpg",
    date: "夜色和花",
    title: "闪光灯把想念照亮",
    text: "隔着花影和夜色看你，连模糊都显得温柔。"
  },
  {
    src: "./assets/photos-web/photo-8.jpg",
    date: "手心里",
    title: "把爱围成一个小小的形状",
    text: "两个手势凑在一起，就有了可以被看见的喜欢。"
  },
  {
    src: "./assets/photos-web/photo-9.jpg",
    date: "温柔自拍",
    title: "每一次看见你，都像重新喜欢一次",
    text: "模糊一点也没关系，记忆会替它变清楚。"
  }
].map((memory, index) => ({
  ...memory,
  id: `base-${index + 1}`,
  type: "base"
}));

const passwordHash = "c04d6e34aab689c5c0e68eb51753c843e032efa7c16427f8642ee07ab946e981";
const unlockKey = "xiaoyang-xiaoqing-site-unlocked";
const editsKey = "xiaoyang-xiaoqing-memory-edits";
const supabaseConfig = window.MEMORY_SUPABASE_CONFIG || {};
let memories = [...baseMemories];
let activeIndex = 5;
let editingIndex = -1;
let formMode = "create";
let previewUrl = "";
let filmFlowing = true;
let uploadedObjectUrls = [];
let supabaseClient = null;

const heroImage = document.querySelector(".hero-image");
const shuffleButton = document.querySelector("#shuffle-memory");
const featureImage = document.querySelector("#feature-image");
const featureKicker = document.querySelector("#feature-kicker");
const featureTitle = document.querySelector("#feature-title");
const featureCopy = document.querySelector("#feature-copy");
const timeline = document.querySelector("#timeline");
const filmTrack = document.querySelector("#film-track");
const filmPrev = document.querySelector("#film-prev");
const filmNext = document.querySelector("#film-next");
const filmPlay = document.querySelector("#film-play");
const galleryGrid = document.querySelector("#gallery-grid");
const dialog = document.querySelector("#memory-dialog");
const dialogImage = document.querySelector("#dialog-image");
const dialogDate = document.querySelector("#dialog-date");
const dialogTitle = document.querySelector("#dialog-title");
const dialogText = document.querySelector("#dialog-text");
const closeDialog = document.querySelector("#close-dialog");
const editMemoryButton = document.querySelector("#edit-memory");
const openUploadButton = document.querySelector("#open-upload");
const uploadStatus = document.querySelector("#upload-status");
const formDialog = document.querySelector("#memory-form-dialog");
const memoryForm = document.querySelector("#memory-form");
const formDialogTitle = document.querySelector("#form-dialog-title");
const fileField = document.querySelector("#file-field");
const formPhoto = document.querySelector("#form-photo");
const formPreview = document.querySelector("#form-preview");
const titleInput = document.querySelector("#form-title-input");
const dateInput = document.querySelector("#form-date-input");
const textInput = document.querySelector("#form-text-input");
const cancelForm = document.querySelector("#cancel-form");
const lockScreen = document.querySelector("#lock-screen");
const lockForm = document.querySelector("#lock-form");
const passwordInput = document.querySelector("#site-password");
const lockMessage = document.querySelector("#lock-message");

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hashBuffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function unlockSite() {
  document.body.classList.remove("locked");
  lockScreen.classList.add("unlocked");
  sessionStorage.setItem(unlockKey, "true");
}

document.body.classList.add("locked");
if (sessionStorage.getItem(unlockKey) === "true") {
  unlockSite();
}

lockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const inputHash = await sha256(passwordInput.value);
  if (inputHash === passwordHash) {
    lockMessage.textContent = "密码正确，欢迎回来。";
    unlockSite();
    return;
  }

  lockMessage.textContent = "密码不对，再试一次。";
  passwordInput.select();
});

function getLocalEdits() {
  try {
    return JSON.parse(localStorage.getItem(editsKey) || "{}");
  } catch {
    return {};
  }
}

function getSupabaseClient() {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) return null;
  if (!supabaseClient) {
    const supabaseGlobal = globalThis.supabase || (typeof supabase !== "undefined" ? supabase : null);
    if (!supabaseGlobal?.createClient) return null;
    supabaseClient = supabaseGlobal.createClient(supabaseConfig.url, supabaseConfig.anonKey);
  }
  return supabaseClient;
}

function markSupabaseStatus() {
  document.documentElement.dataset.supabaseReady = getSupabaseClient() ? "true" : "false";
}

function publicPhotoUrl(path) {
  const client = getSupabaseClient();
  if (!client) return "";
  return client.storage.from(supabaseConfig.bucket).getPublicUrl(path).data.publicUrl;
}

function safeFileName(name) {
  const baseName = name.replace(/\.[^.]+$/, "");
  return baseName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    || "memory-photo";
}

function saveLocalEdit(id, fields) {
  const edits = getLocalEdits();
  edits[id] = { ...(edits[id] || {}), ...fields };
  localStorage.setItem(editsKey, JSON.stringify(edits));
}

function applyBaseEdits() {
  const edits = getLocalEdits();
  return baseMemories.map((memory) => ({
    ...memory,
    ...(edits[memory.id] || {})
  }));
}

function openMemoryDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("xiaoyang-xiaoqing-memory-site", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("photos")) {
        db.createObjectStore("photos", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readUploadedMemories() {
  const db = await openMemoryDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("photos", "readonly");
    const request = transaction.objectStore("photos").getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => a.createdAt - b.createdAt));
    request.onerror = () => reject(request.error);
  });
}

async function readCloudMemories() {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from(supabaseConfig.table)
    .select("id,title,date,text,image_path,created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((item) => ({
    id: item.id,
    type: "cloud",
    src: publicPhotoUrl(item.image_path),
    date: item.date,
    title: item.title,
    text: item.text
  }));
}

async function saveUploadedPhoto(file, fields) {
  const db = await openMemoryDb();
  const record = {
    id: `${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2)}`,
    blob: file,
    name: file.name,
    createdAt: Date.now(),
    date: fields.date,
    title: fields.title,
    text: fields.text
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("photos", "readwrite");
    transaction.objectStore("photos").put(record);
    transaction.oncomplete = () => resolve(record);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function saveCloudPhoto(file, fields) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase 还没有配置。");

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `memories/${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2)}-${safeFileName(file.name)}.${extension}`;
  const upload = await client.storage.from(supabaseConfig.bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (upload.error) throw upload.error;

  const insert = await client.from(supabaseConfig.table).insert({
    title: fields.title,
    date: fields.date,
    text: fields.text,
    image_path: path
  });
  if (insert.error) throw insert.error;
}

async function updateUploadedPhoto(id, fields) {
  const db = await openMemoryDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("photos", "readwrite");
    const store = transaction.objectStore("photos");
    const request = store.get(id);
    request.onsuccess = () => {
      const record = request.result;
      if (!record) {
        reject(new Error("没有找到这张上传照片。"));
        return;
      }
      store.put({ ...record, ...fields });
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function updateCloudPhoto(id, fields) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase 还没有配置。");

  const { error } = await client
    .from(supabaseConfig.table)
    .update(fields)
    .eq("id", id);

  if (error) throw error;
}

async function loadMemories() {
  markSupabaseStatus();
  uploadedObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  uploadedObjectUrls = [];

  try {
    const [uploaded, cloud] = await Promise.all([
      readUploadedMemories(),
      readCloudMemories()
    ]);
    const uploadedMemories = uploaded.map((item) => {
      const src = URL.createObjectURL(item.blob);
      uploadedObjectUrls.push(src);
      return {
        id: item.id,
        type: "uploaded",
        src,
        date: item.date,
        title: item.title,
        text: item.text
      };
    });
    memories = [...applyBaseEdits(), ...uploadedMemories, ...cloud];
  } catch (error) {
    memories = applyBaseEdits();
    uploadStatus.textContent = "读取云端照片失败，已显示固定照片。请检查 Supabase 配置。";
    console.error(error);
  }
}

function setFeature(index) {
  activeIndex = Math.max(0, Math.min(index, memories.length - 1));
  const memory = memories[activeIndex];
  featureImage.src = memory.src;
  featureImage.alt = memory.title;
  featureKicker.textContent = memory.date;
  featureTitle.textContent = memory.title;
  featureCopy.textContent = memory.text;
  heroImage.src = memory.src;
  document.querySelectorAll(".timeline button").forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === activeIndex);
  });
}

function openMemory(index) {
  const memory = memories[index];
  dialog.dataset.index = index;
  dialogImage.src = memory.src;
  dialogImage.alt = memory.title;
  dialogDate.textContent = memory.date;
  dialogTitle.textContent = memory.title;
  dialogText.textContent = memory.text;
  document.body.classList.add("dialog-open");
  if (!dialog.open) dialog.showModal();
}

function renderTimeline() {
  timeline.innerHTML = memories.map((memory, index) => `
    <li>
      <button type="button" data-index="${index}">
        <img src="${memory.src}" alt="" loading="lazy" decoding="async">
        <span>
          <time>${memory.date}</time>
          <h4>${memory.title}</h4>
          <p>${memory.text}</p>
        </span>
      </button>
    </li>
  `).join("");

  timeline.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      setFeature(Number(button.dataset.index));
      document.querySelector("#story").scrollIntoView({ block: "start", behavior: "smooth" });
    });
  });
}

function renderFilm() {
  filmTrack.style.setProperty("--film-duration", `${Math.max(28, memories.length * 4.4)}s`);
  const sequence = memories.map((memory, index) => `
    <button class="film-frame" type="button" data-index="${index}">
      <img src="${memory.src}" alt="${memory.title}" loading="lazy" decoding="async">
      <span>${memory.title}</span>
    </button>
  `).join("");
  filmTrack.innerHTML = `
    <div class="film-sequence">${sequence}</div>
    <div class="film-sequence" aria-hidden="true">${sequence}</div>
  `;

  filmTrack.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => openMemory(Number(button.dataset.index)));
  });
}

function renderGallery() {
  galleryGrid.innerHTML = memories.map((memory, index) => `
    <button class="photo-tile" type="button" data-index="${index}">
      <img src="${memory.src}" alt="${memory.title}" loading="lazy" decoding="async">
      <span><b>${memory.date}</b><b>${String(index + 1).padStart(2, "0")}</b></span>
    </button>
  `).join("");

  galleryGrid.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => openMemory(Number(button.dataset.index)));
  });
}

function renderAll() {
  renderTimeline();
  renderFilm();
  renderGallery();
  setFeature(activeIndex);
  setFilmFlowState(true);
}

function resetFormPreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = "";
  formPreview.removeAttribute("src");
  formPreview.classList.remove("visible");
}

function openCreateForm() {
  formMode = "create";
  editingIndex = -1;
  memoryForm.reset();
  resetFormPreview();
  formDialog.classList.remove("editing");
  fileField.querySelector("span").textContent = "选择照片";
  formDialogTitle.textContent = "添加新的回忆";
  formPhoto.required = true;
  formDialog.showModal();
}

function openEditForm(index) {
  const memory = memories[index];
  formMode = "edit";
  editingIndex = index;
  memoryForm.reset();
  resetFormPreview();
  formDialog.classList.add("editing");
  formDialogTitle.textContent = "编辑名字和故事";
  formPhoto.required = false;
  titleInput.value = memory.title;
  dateInput.value = memory.date;
  textInput.value = memory.text;
  formPreview.src = memory.src;
  formPreview.classList.add("visible");
  formDialog.showModal();
}

function closeForm() {
  formDialog.close();
  resetFormPreview();
}

function getFormFields(file) {
  return {
    title: titleInput.value.trim() || file?.name?.replace(/\.[^.]+$/, "") || "新的回忆",
    date: dateInput.value.trim() || "新上传",
    text: textInput.value.trim() || "这一张刚刚加入相册，等以后再慢慢补上它的故事。"
  };
}

async function saveForm(event) {
  event.preventDefault();

  try {
    if (formMode === "create") {
      const file = formPhoto.files?.[0];
      if (!file) {
        uploadStatus.textContent = "先选择一张照片，再保存。";
        return;
      }
      if (getSupabaseClient()) {
        await saveCloudPhoto(file, getFormFields(file));
      } else {
        await saveUploadedPhoto(file, getFormFields(file));
      }
      await loadMemories();
      activeIndex = memories.length - 1;
      uploadStatus.textContent = getSupabaseClient()
        ? "已上传到云端，所有设备刷新后都能看到。"
        : "已添加到本机浏览器，照片墙和循环胶卷都会显示它。";
    } else {
      const memory = memories[editingIndex];
      const fields = getFormFields();
      if (memory.type === "cloud") {
        await updateCloudPhoto(memory.id, fields);
      } else if (memory.type === "uploaded") {
        await updateUploadedPhoto(memory.id, fields);
      } else {
        saveLocalEdit(memory.id, fields);
      }
      await loadMemories();
      activeIndex = editingIndex;
      uploadStatus.textContent = "已更新这张照片的名字和故事。";
    }

    renderAll();
    if (dialog.open) openMemory(activeIndex);
    closeForm();
  } catch (error) {
    uploadStatus.textContent = "保存失败，可能是浏览器存储空间不足。";
    console.error(error);
  }
}

function scrollFilm(direction) {
  const nextIndex = (activeIndex + direction + memories.length) % memories.length;
  setFeature(nextIndex);
  openMemory(nextIndex);
}

function setFilmFlowState(flowing) {
  filmFlowing = flowing;
  filmTrack.classList.toggle("paused", !filmFlowing);
  filmPlay.textContent = filmFlowing ? "暂停流动" : "继续流动";
}

function toggleFilmPlay() {
  if (filmFlowing) {
    setFilmFlowState(false);
  } else {
    setFilmFlowState(true);
  }
}

shuffleButton.addEventListener("click", () => {
  const nextIndex = Math.floor(Math.random() * memories.length);
  setFeature(nextIndex);
  document.querySelector("#story").scrollIntoView({ block: "start", behavior: "smooth" });
});

openUploadButton.addEventListener("click", openCreateForm);
cancelForm.addEventListener("click", closeForm);
memoryForm.addEventListener("submit", saveForm);
formPhoto.addEventListener("change", () => {
  resetFormPreview();
  const file = formPhoto.files?.[0];
  if (!file) return;
  previewUrl = URL.createObjectURL(file);
  formPreview.src = previewUrl;
  formPreview.classList.add("visible");
  if (!titleInput.value.trim()) titleInput.value = file.name.replace(/\.[^.]+$/, "");
});

filmPrev.addEventListener("click", () => scrollFilm(-1));
filmNext.addEventListener("click", () => scrollFilm(1));
filmPlay.addEventListener("click", toggleFilmPlay);

closeDialog.addEventListener("click", () => dialog.close());
editMemoryButton.addEventListener("click", () => openEditForm(Number(dialog.dataset.index || activeIndex)));

dialog.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (formDialog.open) closeForm();
    if (dialog.open) dialog.close();
  }
});

(async function init() {
  await loadMemories();
  renderAll();
})();
