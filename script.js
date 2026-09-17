/* ---------- existing nav + year logic ---------- */
const toggle = document.querySelector(".menu-toggle");
const links = document.querySelector(".nav-links");

toggle?.addEventListener("click", () => links.classList.toggle("open"));
document.querySelectorAll(".nav-links a").forEach(a => {
  a.addEventListener("click", () => links.classList.remove("open"));
});
document.getElementById("year").textContent = new Date().getFullYear();

/*
 * ---------- Real, permanent photo & CV (works for every visitor) ----------
 * The edit-mode uploads below only affect the browser that uploaded them.
 * To have a photo/CV show up for EVERY visitor on the live site, add these
 * two files to your repo (in an "assets" folder next to index.html):
 *   assets/profile.jpg   -> your photo
 *   assets/cv.pdf        -> your CV
 * If they exist, they load automatically here - no password needed.
 * A local edit-mode upload (if you make one, in this same browser) takes
 * priority over these, purely as a personal preview override.
 */
function loadDefaultAssets() {
  const img = document.getElementById("profilePhoto");
  const fallback = document.getElementById("avatarFallback");
  if (img) {
    const testImg = new Image();
    testImg.onload = () => {
      // Don't clobber a local override that already applied a photo.
      if (img.style.display !== "block") {
        img.src = "assets/profile.jpg";
        img.style.display = "block";
        if (fallback) fallback.style.display = "none";
      }
    };
    testImg.onerror = () => { /* no assets/profile.jpg in the repo yet - fallback initials stay */ };
    testImg.src = "assets/profile.jpg";
  }

  const cvBtn = document.getElementById("cvDownloadBtn");
  if (cvBtn) {
    fetch("assets/cv.pdf", { method: "HEAD" })
      .then(res => {
        // Don't clobber a local override that already pointed this at an uploaded file.
        if (res.ok && cvBtn.title !== "Download CV") {
          cvBtn.href = "assets/cv.pdf";
          cvBtn.setAttribute("download", CV_DOWNLOAD_NAME);
          cvBtn.title = "Download CV";
          cvBtn.style.opacity = "1";
          cvBtn.style.pointerEvents = "auto";
        }
      })
      .catch(() => { /* no assets/cv.pdf in the repo yet, or opened via file:// - button stays disabled */ });
  }
}

/*
 * ---------- Local edit mode ----------
 * IMPORTANT: This site is static (no backend/database). Nothing typed or
 * uploaded here is sent anywhere - everything is saved to this browser's
 * localStorage only. That means:
 *   - Edits persist next time YOU open the site in THIS browser.
 *   - Edits are NOT visible to other visitors and do NOT change the files
 *     on GitHub. To make a change permanent for everyone, edit index.html
 *     (or the fields below) and push it to the repo.
 * The password below is also not real security: anyone can read it in
 * this file's source. It only prevents casual clicking, not real access.
 */
const ADMIN_PASSWORD = "00001111";
const STORAGE_KEY = "portfolio_edits_v1";
const CV_DOWNLOAD_NAME = "Md_Naim_Ferdous_CV.pdf";

const editableTextIds = [
  "heroRoleText",
  "heroIntroText",
  "aboutLead",
  "aboutPara2",
  "ctaText",
  "contactIntroText"
];

function loadEdits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveEdits(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function applyEdits() {
  const data = loadEdits();

  if (data.photo) {
    const img = document.getElementById("profilePhoto");
    const fallback = document.getElementById("avatarFallback");
    if (img) {
      img.src = data.photo;
      img.style.display = "block";
      if (fallback) fallback.style.display = "none";
    }
  }

  const cvBtn = document.getElementById("cvDownloadBtn");
  if (cvBtn) {
    if (data.cv) {
      cvBtn.href = data.cv;
      cvBtn.setAttribute("download", data.cvName || CV_DOWNLOAD_NAME);
      cvBtn.title = "Download CV";
      cvBtn.style.opacity = "1";
      cvBtn.style.pointerEvents = "auto";
    } else {
      cvBtn.href = "#";
      cvBtn.removeAttribute("download");
      cvBtn.title = "CV not uploaded yet";
      cvBtn.style.opacity = ".5";
      cvBtn.style.pointerEvents = "none";
    }
  }

  if (data.reconxUrl) {
    const el = document.getElementById("reconxLink");
    if (el) el.href = data.reconxUrl;
  }
  if (data.dreamPropertyUrl) {
    const el = document.getElementById("dreamPropertyLink");
    if (el) el.href = data.dreamPropertyUrl;
  }

  if (data.email) {
    document.querySelectorAll(".email-link").forEach(a => {
      a.href = "mailto:" + data.email;
    });
    const emailDisplay = document.getElementById("contactEmailText");
    if (emailDisplay) emailDisplay.textContent = data.email + " ↗";
  }

  editableTextIds.forEach(id => {
    if (data.text && data.text[id] !== undefined) {
      const el = document.getElementById(id);
      if (el) el.innerText = data.text[id];
    }
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- helpers for untrusted text (repo descriptions, user input) ---------- */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

/* ---------- Custom (manually added) projects ---------- */
function renderCustomProjectCard(p, index) {
  const tags = (p.tags || "")
    .split(",")
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => `<span>${escapeHtml(t)}</span>`)
    .join("");
  const link = p.link && /^https?:\/\//i.test(p.link)
    ? `<a href="${escapeHtml(p.link)}" target="_blank" rel="noreferrer" class="project-link">View project ↗</a>`
    : "";
  return `
    <article class="project-card custom-card">
      <button class="delete-project-btn" data-index="${index}" title="Delete project" type="button">×</button>
      <div class="project-top"><span class="project-type">${escapeHtml(p.type || "Project")}</span></div>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.desc || "")}</p>
      <div class="tags">${tags}</div>
      ${link}
    </article>`;
}

function renderCustomProjects() {
  const grid = document.getElementById("customProjectsGrid");
  if (!grid) return;
  const data = loadEdits();
  const list = data.customProjects || [];
  grid.innerHTML = list.length
    ? list.map((p, i) => renderCustomProjectCard(p, i)).join("")
    : `<p class="github-status">No added projects yet — use the edit panel to add one.</p>`;
}

/* ---------- Live GitHub repositories ---------- */
function renderRepoCard(repo) {
  const desc = repo.description ? escapeHtml(repo.description) : "No description provided.";
  const lang = repo.language ? `<span>${escapeHtml(repo.language)}</span>` : "";
  return `
    <article class="project-card repo-card">
      <div class="project-top">
        <span class="project-type">${repo.fork ? "Fork" : "Repository"}</span>
        <span class="repo-stats">★ ${repo.stargazers_count}</span>
      </div>
      <h3>${escapeHtml(repo.name)}</h3>
      <p>${desc}</p>
      <div class="tags">${lang}</div>
      <a href="${repo.html_url}" target="_blank" rel="noreferrer" class="project-link">View repo ↗</a>
    </article>`;
}

async function loadGithubRepos() {
  const grid = document.getElementById("githubProjectsGrid");
  const status = document.getElementById("githubProjectsStatus");
  if (!grid) return;

  const data = loadEdits();
  const username = (data.githubUsername || "Naimf").trim();

  const link = document.getElementById("viewGithubLink");
  if (link) link.href = `https://github.com/${encodeURIComponent(username)}`;

  status.style.display = "block";
  status.textContent = "Loading repositories…";
  grid.innerHTML = "";

  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`);
    if (!res.ok) throw new Error("GitHub API error " + res.status);
    const repos = await res.json();
    if (!Array.isArray(repos)) throw new Error("Unexpected response");
    const filtered = repos.filter(r => !r.fork);
    if (!filtered.length) {
      status.textContent = "No public repositories found for this username.";
      return;
    }
    status.style.display = "none";
    grid.innerHTML = filtered.map(renderRepoCard).join("");
  } catch (err) {
    status.textContent = "Couldn't load GitHub repositories right now — check the username or try again later.";
  }
}

function setEditMode(on) {
  editableTextIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute("contenteditable", on ? "true" : "false");
  });
  document.getElementById("editPanel").style.display = on ? "block" : "none";
  document.body.classList.toggle("editing", on);

  if (on) {
    const data = loadEdits();
    const reconxInput = document.getElementById("reconxUrlInput");
    const dreamInput = document.getElementById("dreamPropertyUrlInput");
    const emailInput = document.getElementById("emailInput");
    const usernameInput = document.getElementById("githubUsernameInput");
    if (reconxInput) reconxInput.value = data.reconxUrl || "";
    if (dreamInput) dreamInput.value = data.dreamPropertyUrl || "";
    if (emailInput) emailInput.value = data.email || "naimnf02@gmail.com";
    if (usernameInput) usernameInput.value = data.githubUsername || "Naimf";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDefaultAssets();
  applyEdits();
  renderCustomProjects();
  loadGithubRepos();

  const adminTrigger = document.getElementById("adminTrigger");
  const adminModal = document.getElementById("adminModal");
  const adminPasswordInput = document.getElementById("adminPasswordInput");
  const adminError = document.getElementById("adminError");
  const adminCancelBtn = document.getElementById("adminCancelBtn");
  const adminSubmitBtn = document.getElementById("adminSubmitBtn");

  adminTrigger?.addEventListener("click", () => {
    adminModal.style.display = "flex";
    adminError.style.display = "none";
    adminPasswordInput.value = "";
    adminPasswordInput.focus();
  });

  adminCancelBtn?.addEventListener("click", () => {
    adminModal.style.display = "none";
  });

  function trySubmitPassword() {
    if (adminPasswordInput.value === ADMIN_PASSWORD) {
      adminModal.style.display = "none";
      setEditMode(true);
    } else {
      adminError.style.display = "block";
    }
  }

  adminSubmitBtn?.addEventListener("click", trySubmitPassword);
  adminPasswordInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") trySubmitPassword();
  });

  document.getElementById("photoInput")?.addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const img = document.getElementById("profilePhoto");
    const fallback = document.getElementById("avatarFallback");
    img.src = dataUrl;
    img.style.display = "block";
    if (fallback) fallback.style.display = "none";
  });

  document.getElementById("cvInput")?.addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const cvBtn = document.getElementById("cvDownloadBtn");
    cvBtn.href = dataUrl;
    cvBtn.setAttribute("download", CV_DOWNLOAD_NAME);
    cvBtn.title = "Download CV";
    cvBtn.style.opacity = "1";
    cvBtn.style.pointerEvents = "auto";
    cvBtn.dataset.pendingName = CV_DOWNLOAD_NAME;
  });

  document.getElementById("addProjectBtn")?.addEventListener("click", () => {
    const title = document.getElementById("newProjTitle").value.trim();
    if (!title) {
      alert("Give the project a title first.");
      return;
    }
    const proj = {
      title,
      type: document.getElementById("newProjType").value.trim(),
      desc: document.getElementById("newProjDesc").value.trim(),
      tags: document.getElementById("newProjTags").value.trim(),
      link: document.getElementById("newProjLink").value.trim()
    };
    const data = loadEdits();
    data.customProjects = data.customProjects || [];
    data.customProjects.push(proj);
    saveEdits(data);
    renderCustomProjects();
    ["newProjTitle", "newProjType", "newProjDesc", "newProjTags", "newProjLink"].forEach(id => {
      document.getElementById(id).value = "";
    });
  });

  document.getElementById("customProjectsGrid")?.addEventListener("click", e => {
    const btn = e.target.closest(".delete-project-btn");
    if (!btn) return;
    const idx = parseInt(btn.dataset.index, 10);
    const data = loadEdits();
    data.customProjects = data.customProjects || [];
    data.customProjects.splice(idx, 1);
    saveEdits(data);
    renderCustomProjects();
  });

  document.getElementById("editSaveBtn")?.addEventListener("click", () => {
    const data = loadEdits();

    const photoImg = document.getElementById("profilePhoto");
    if (photoImg && photoImg.src && photoImg.style.display !== "none") {
      data.photo = photoImg.src;
    }

    const cvBtn = document.getElementById("cvDownloadBtn");
    if (cvBtn && cvBtn.href && cvBtn.href.startsWith("data:")) {
      data.cv = cvBtn.href;
      data.cvName = cvBtn.dataset.pendingName || data.cvName || CV_DOWNLOAD_NAME;
    }

    const reconxVal = document.getElementById("reconxUrlInput").value.trim();
    if (reconxVal) data.reconxUrl = reconxVal;

    const dreamVal = document.getElementById("dreamPropertyUrlInput").value.trim();
    if (dreamVal) data.dreamPropertyUrl = dreamVal;

    const emailVal = document.getElementById("emailInput").value.trim();
    if (emailVal) data.email = emailVal;

    const usernameVal = document.getElementById("githubUsernameInput").value.trim();
    const usernameChanged = usernameVal && usernameVal !== data.githubUsername;
    if (usernameVal) data.githubUsername = usernameVal;

    data.text = data.text || {};
    editableTextIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) data.text[id] = el.innerText;
    });

    const ok = saveEdits(data);
    applyEdits();
    if (usernameChanged) loadGithubRepos();

    const msg = document.getElementById("editSavedMsg");
    msg.textContent = ok ? "Saved to this browser." : "Could not save (storage unavailable).";
    msg.style.display = "block";
    setTimeout(() => (msg.style.display = "none"), 2500);
  });

  document.getElementById("editResetBtn")?.addEventListener("click", () => {
    if (confirm("Clear all locally saved edits (photo, CV, links, text) on this browser?")) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });

  document.getElementById("editExitBtn")?.addEventListener("click", () => {
    setEditMode(false);
  });
});