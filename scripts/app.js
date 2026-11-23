document.addEventListener("DOMContentLoaded", () => {
  const CFG = window.MARKETPLACE_CONFIG || {};
  const L = CFG.labels || {};
  const t = (key) => L[key] ?? key;

  // Every CSV value is untrusted text: escape before it goes into HTML.
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  // Only allow http(s)/tel links from the CSV.
  const safeUrl = (u, prefix = "") => {
    const s = String(u ?? "").trim();
    if (!s) return "";
    const full = /^[a-z]+:/i.test(s) ? s : prefix + s;
    return /^(https?:|tel:)/i.test(full) ? full : "";
  };

  // ---- Branding from config -------------------------------------------------
  document.title = CFG.name || "Marketplace";
  document.documentElement.lang = CFG.lang || "en";
  const logo = document.getElementById("header-logo");
  if (CFG.logo) { logo.src = CFG.logo; logo.alt = CFG.name || ""; } else { logo.remove(); }
  const theme = CFG.theme || {};
  const root = document.documentElement.style;
  if (theme.header) root.setProperty("--header", theme.header);
  if (theme.accent) root.setProperty("--accent", theme.accent);
  if (theme.button) root.setProperty("--button", theme.button);
  if (theme.buttonHover) root.setProperty("--button-hover", theme.buttonHover);
  document.querySelectorAll("[data-label]").forEach((el) => { el.textContent = t(el.dataset.label); });
  document.querySelectorAll("[data-label-title]").forEach((el) => { el.title = t(el.dataset.labelTitle); });
  document.getElementById("search-input").placeholder = t("searchPlaceholder");
  document.getElementById("contact-email").textContent = CFG.contact?.email || "";
  document.getElementById("contact-phone").textContent = CFG.contact?.phone || "";

  // Floor buttons from config
  const floorContainer = document.getElementById("floor-buttons");
  (CFG.floors || ["0"]).forEach((f) => {
    const b = document.createElement("button");
    b.dataset.floor = f;
    b.textContent = f;
    floorContainer.appendChild(b);
  });

  // ---- DOM references -------------------------------------------------------
  const grid = document.getElementById("shop-grid");
  const modal = document.getElementById("shop-modal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = modal.querySelector(".close-btn");
  const floorButtons = document.querySelectorAll("#floor-buttons button");
  const prevPageBtn = document.getElementById("prev-page");
  const nextPageBtn = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");
  const filterModal = document.getElementById("filter-modal");
  const openFilterBtn = document.querySelector(".filter-btn");
  const closeFilterBtn = document.getElementById("close-filter");
  const applyFilterBtn = document.getElementById("apply-filter");
  const resetFilterBtn = document.getElementById("reset-filter");
  const categoryContainer = document.getElementById("category-options");
  const searchModal = document.getElementById("search-modal");
  const searchBtn = document.querySelector(".search-btn");
  const closeSearchBtn = document.getElementById("close-search");
  const searchInput = document.getElementById("search-input");
  const searchResultsContainer = document.getElementById("search-results");
  const settingsModal = document.getElementById("settings-modal");
  const settingsBtn = document.querySelector(".settings-btn");
  const closeSettingsBtn = document.getElementById("close-settings");
  const sosModal = document.getElementById("sos-modal");
  const sosBtn = document.querySelector(".sos-btn");
  const closeSosBtn = document.getElementById("close-sos");

  // ---- State ----------------------------------------------------------------
  let allShops = [];
  let filteredShops = [];
  let currentFloorIndex = 0;
  let itemsPerPage = 6;
  let currentPage = 1;
  const allCategories = new Set();

  const isOpen = (shop) => (shop.status || "").trim().toLowerCase() === "open";
  const splitList = (s) => (s || "").split(",").map((x) => x.trim()).filter(Boolean);

  // Shops without a logo get a coloured initials badge instead of a broken image.
  function shopImage(shop) {
    const src = safeUrl(shop.logo_url) || (shop.logo_url && !/^[a-z]+:/i.test(shop.logo_url) ? shop.logo_url : "");
    if (src) return src;
    const name = (shop.shop_name || "?").trim();
    const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="16" fill="hsl(${h},45%,55%)"/><text x="50%" y="54%" font-family="Inter,Arial,sans-serif" font-size="48" font-weight="600" fill="#fff" text-anchor="middle" dominant-baseline="middle">${esc(initials)}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  // ---- Data -----------------------------------------------------------------
  Papa.parse(CFG.dataUrl || "data/shops.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      allShops = results.data;
      allShops.forEach((shop) => splitList(shop.categories).forEach((c) => allCategories.add(c)));
      generateCategoryCheckboxes();
      adjustItemsPerPage();
      checkInitialHash();
    },
  });

  window.addEventListener("resize", () => {
    adjustItemsPerPage();
    renderCurrentPage();
  });

  function adjustItemsPerPage() {
    itemsPerPage = window.innerWidth < 400 ? 3 : 6;
  }

  function checkInitialHash() {
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));
    const valid = Array.from(floorButtons).map((b) => b.dataset.floor);
    setActiveFloor(valid.includes(hash) ? hash : CFG.defaultFloor ?? valid[valid.length - 1]);
  }

  function generateCategoryCheckboxes() {
    categoryContainer.innerHTML = "";
    [...allCategories].sort().forEach((cat) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "category";
      input.value = cat;
      label.append(input, " " + cat);
      categoryContainer.append(label, document.createElement("br"));
    });
  }

  function setActiveFloor(floor) {
    floorButtons.forEach((btn, index) => {
      btn.classList.toggle("active", btn.dataset.floor === floor);
      if (btn.dataset.floor === floor) currentFloorIndex = index;
    });
    filteredShops = applyAllFilters(allShops.filter((shop) => shop.floor === floor));
    currentPage = 1;
    renderCurrentPage();
    window.location.hash = "#" + encodeURIComponent(floor);
  }

  function renderCurrentPage() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    renderShops(filteredShops.slice(start, end));
    const pages = Math.max(1, Math.ceil(filteredShops.length / itemsPerPage));
    pageInfo.textContent = `${t("page")} ${currentPage} ${t("of")} ${pages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = end >= filteredShops.length;
  }

  function renderStars(rating) {
    const r = parseFloat(rating) || 0;
    const full = Math.floor(r);
    let stars = "★".repeat(full);
    if (r - full >= 0.5) stars += "½";
    return stars.padEnd(5, "☆");
  }

  function renderShops(shops) {
    grid.innerHTML = "";
    shops.forEach((shop) => {
      const open = isOpen(shop);
      const price = "$".repeat(Math.min(3, Math.max(1, parseInt(shop.price, 10) || 1)));
      const hasRating = shop.rating !== undefined && shop.rating !== "";
      const card = document.createElement("div");
      card.className = "shop-card";
      card.innerHTML = `
        <div class="shop-card-header">
          <img src="${esc(shopImage(shop))}" alt="${esc(shop.shop_name)}" class="shop-image" />
          <div class="price-icon">${price}</div>
        </div>
        <div class="shop-info">
          <h3>${esc(shop.shop_name)}</h3>
          ${hasRating ? `<div class="rating-stars">${renderStars(shop.rating)}<span class="reviews">(${esc(shop.reviews || 0)})</span></div>` : ""}
          <div class="shop-status-floor ${open ? "" : "closed"}">
            ${esc(open ? t("open") : t("closed"))} - ${esc(t("floor"))} ${esc(shop.floor)}
          </div>
          <div class="tag-container">
            ${splitList(shop.categories).map((c) => `<span class="tag">${esc(c)}</span>`).join("")}
          </div>
        </div>`;
      card.addEventListener("click", () => openModal(shop));
      grid.appendChild(card);
    });
  }

  function openModal(shop) {
    const open = isOpen(shop);
    let hours = {};
    try { hours = shop.hours ? JSON.parse(shop.hours) : {}; } catch { hours = {}; }
    const socials = splitList(shop.social).map((s) => safeUrl(s, "https://")).filter(Boolean);
    const phone = (shop.phone || "").trim();
    const ob = CFG.orderButton;
    const orderUrl = ob ? safeUrl(shop.external_url) || safeUrl(ob.fallbackUrl) : "";
    const statusText = esc(open ? t("open") : t("closed"));

    modalBody.innerHTML = `
      <div class="modal-header">
        <img src="${esc(shopImage(shop))}" alt="${esc(shop.shop_name)}" class="modal-logo" />
        <div>
          <h2>${esc(shop.shop_name)}</h2>
          <p class="modal-subtitle">
            <span class="${open ? "open" : "closed"}">${statusText}</span> • ${esc(t("floor"))} ${esc(shop.floor)}
          </p>
        </div>
      </div>
      ${Object.keys(hours).length ? `
      <div class="modal-section">
        <h4>${esc(t("hours"))}</h4>
        <ul class="hours-list">
          ${Object.entries(hours).map(([day, h]) =>
            `<li><strong>${esc(L.days?.[day] || day)}</strong><span>${esc(h)}</span></li>`).join("")}
        </ul>
      </div>` : ""}
      <div class="modal-section">
        <h4>${esc(t("categories"))}</h4>
        <div class="tag-container">
          ${splitList(shop.categories).map((c) => `<span class="tag">${esc(c)}</span>`).join("")}
        </div>
      </div>
      ${shop.description ? `<div class="modal-section"><p>${esc(shop.description)}</p></div>` : ""}
      ${orderUrl ? `
      <div class="modal-section" style="text-align: center;">
        <a href="${esc(orderUrl)}" class="direction-btn" target="_blank" rel="noopener">${esc(ob.label)}</a>
      </div>` : ""}
      <div class="modal-footer">
        ${phone ? `<a href="${esc(safeUrl(phone, "tel:"))}" class="contact-icon">📞</a>` : ""}
        ${socials.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener" class="contact-icon">🔗</a>`).join("")}
      </div>`;
    modal.classList.remove("hidden");
  }

  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

  floorButtons.forEach((btn) => btn.addEventListener("click", () => setActiveFloor(btn.dataset.floor)));

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) { currentPage--; renderCurrentPage(); }
  });
  nextPageBtn.addEventListener("click", () => {
    if (currentPage * itemsPerPage < filteredShops.length) { currentPage++; renderCurrentPage(); }
  });

  // Swipe: left/right = pages, up/down = floors
  let touchStartX = 0;
  let touchStartY = 0;
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length > 0) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
  });
  document.addEventListener("touchend", (e) => {
    if (!e.changedTouches.length || !modal.classList.contains("hidden")) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && currentPage * itemsPerPage < filteredShops.length) { currentPage++; renderCurrentPage(); }
      else if (dx > 0 && currentPage > 1) { currentPage--; renderCurrentPage(); }
    } else if (dy > 0 && currentFloorIndex > 0) {
      setActiveFloor(floorButtons[currentFloorIndex - 1].dataset.floor);
    } else if (dy < 0 && currentFloorIndex < floorButtons.length - 1) {
      setActiveFloor(floorButtons[currentFloorIndex + 1].dataset.floor);
    }
  });

  // Filters
  openFilterBtn.addEventListener("click", () => filterModal.classList.remove("hidden"));
  closeFilterBtn.addEventListener("click", () => filterModal.classList.add("hidden"));
  applyFilterBtn.addEventListener("click", () => {
    setActiveFloor(floorButtons[currentFloorIndex].dataset.floor);
    filterModal.classList.add("hidden");
  });
  resetFilterBtn.addEventListener("click", () => {
    filterModal.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach((inp) => {
      inp.checked = inp.type === "radio" ? inp.value === "all" : false;
    });
  });

  function applyAllFilters(shops) {
    const status = filterModal.querySelector('input[name="status"]:checked')?.value || "all";
    const prices = [...filterModal.querySelectorAll('input[name="price"]:checked')].map((cb) => cb.value);
    const cats = [...filterModal.querySelectorAll('input[name="category"]:checked')].map((cb) => cb.value);
    return shops.filter((shop) => {
      const statusOk = status === "all" || (status === "Open") === isOpen(shop);
      const priceOk = prices.length === 0 || prices.includes(String(shop.price).trim());
      const shopCats = splitList(shop.categories);
      const catOk = cats.length === 0 || cats.some((c) => shopCats.includes(c));
      return statusOk && priceOk && catOk;
    });
  }

  // Search
  searchBtn.addEventListener("click", () => {
    searchModal.classList.toggle("hidden");
    if (!searchModal.classList.contains("hidden")) searchInput.focus();
  });
  closeSearchBtn.addEventListener("click", () => searchModal.classList.add("hidden"));
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    searchResultsContainer.innerHTML = "";
    if (!q) return;
    const results = allShops.filter((shop) =>
      (shop.shop_name || "").toLowerCase().includes(q) || (shop.categories || "").toLowerCase().includes(q));
    if (!results.length) {
      searchResultsContainer.innerHTML = `<p>${esc(t("noResults"))}</p>`;
      return;
    }
    results.forEach((shop) => {
      const div = document.createElement("div");
      div.className = "search-result";
      div.innerHTML = `
        <img src="${esc(shopImage(shop))}" alt="${esc(shop.shop_name)}" />
        <div>
          <h4>${esc(shop.shop_name)}</h4>
          <p>${esc(isOpen(shop) ? t("open") : t("closed"))} - ${esc(t("floor"))} ${esc(shop.floor)}</p>
        </div>`;
      div.addEventListener("click", () => { searchModal.classList.add("hidden"); openModal(shop); });
      searchResultsContainer.appendChild(div);
    });
  });

  // Settings & contact
  settingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
  closeSettingsBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
  sosBtn.addEventListener("click", () => sosModal.classList.remove("hidden"));
  closeSosBtn.addEventListener("click", () => sosModal.classList.add("hidden"));
});
