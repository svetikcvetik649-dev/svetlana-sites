/* Настройки сайта: всё, что нужно поменять, лежит здесь. */
const CONFIG = {
  telegram: "https://t.me/Svetadan75",
  phone: "79614871383", // номер телефона цифрами: включает кнопки «Позвонить», WhatsApp и строку с номером
  telegramChannel: "", // ссылка на Telegram-канал; пока канала нет, кнопки ведут на личный Telegram
  webhook: "https://script.google.com/macros/s/AKfycbwan3bIMm3-wpxq0BQjVRjpiNuglQeolxW9MkRGnnFy9OfsFCzW3bY1ZlHuS_cxPFg/exec" // приёмник заявок: Google Apps Script, кладёт строку в таблицу "Заявки с сайта"
};

/* Кнопки связи: появляются, когда в настройках заполнен номер */
(function contacts() {
  const digits = String(CONFIG.phone || "").replace(/\D/g, "");
  const show = (selector, href, text) => document.querySelectorAll(selector).forEach((el) => {
    el.hidden = false;
    if (href) { el.href = href; el.target = "_blank"; el.rel = "noopener"; }
    if (text) el.textContent = text;
  });
  if (digits) {
    const nice = "+" + digits.replace(/^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3-$4-$5");
    show("[data-wa]", "https://wa.me/" + digits);
    show("[data-phone]", "tel:+" + digits);
    show("[data-phone-text]", null, "Телефон: " + nice);
    show("[data-phone-note]");
    show("[data-fab-phone]", "tel:+" + digits);
    show("[data-fab-wa]", "https://wa.me/" + digits);
  }
})();

/* Плавающая кнопка «Связаться»: все способы связи в одном месте */
(function fab() {
  const btn = document.getElementById("fab-btn");
  const menu = document.getElementById("fab-menu");
  if (!btn || !menu) return;
  const set = (open) => { menu.hidden = !open; btn.setAttribute("aria-expanded", String(open)); btn.classList.toggle("is-open", open); };
  btn.addEventListener("click", () => set(menu.hidden));
  document.addEventListener("click", (e) => { if (!e.target.closest("#fab")) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
})();

/* Работы: данные лежат в works-data.js (генерируется из папки мокапы-все). Тут только показ: бегущая лента, вкладки ниш, фильтр по формату, карусель, примеры в ценах, крупный просмотр */
(function showcase() {
  if (typeof WORKS === "undefined" || !WORKS.length) return;
  const rub = (n) => "от " + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const niches = typeof TABS !== "undefined" ? TABS : [...new Set(WORKS.map((w) => w.niche))];
  const FORMATS = ["Лайт", "Продающий", "Кино-эффект", "Свой дизайн"];
  const priceOf = (f) => (WORKS.find((w) => w.kind === f) || {}).price;

  /* числа в первом экране */
  document.querySelectorAll("[data-count]").forEach((el) => {
    if (el.dataset.count === "works") el.textContent = WORKS.length;
  });

  /* бегущая лента мокапов: две строки, по кругу */
  const mixed = [];
  const byNiche = niches.map((n) => WORKS.filter((w) => w.niche === n));
  for (let i = 0; byNiche.some((l) => i < l.length); i++) byNiche.forEach((l) => { if (l[i]) mixed.push(l[i]); });
  const row = (list) => { const html = list.map((w) => `<img src="img/works/${w.id}-s.webp" width="760" height="507" alt="">`).join(""); return html + html; };
  const r1 = document.getElementById("mq-1"), r2 = document.getElementById("mq-2");
  if (r1 && r2) { r1.innerHTML = row(mixed.filter((_, i) => i % 2 === 0)); r2.innerHTML = row(mixed.filter((_, i) => i % 2 === 1)); }

  /* вкладки, фильтр формата, карусель */
  const tabs = document.getElementById("tabs");
  const fmts = document.getElementById("fmts");
  const track = document.getElementById("track");
  const bar = document.getElementById("bar");
  const count = document.getElementById("car-count");
  const prev = document.getElementById("prev");
  const next = document.getElementById("next");
  const dialog = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCap = document.getElementById("lb-cap");
  let niche = "Все", fmt = "Все";

  const nCount = (n) => (n === "Все" ? WORKS.length : WORKS.filter((w) => w.niche === n).length);
  tabs.innerHTML = ["Все", ...niches].map((n) => `<button type="button" class="tab" data-n="${esc(n)}" aria-pressed="${n === "Все"}">${esc(n === "Все" ? "Все ниши" : n)} <small>${nCount(n)}</small></button>`).join("");
  fmts.innerHTML = `<span class="fmts-label">Формат и цена:</span>` + ["Все", ...FORMATS].map((f) => `<button type="button" class="tab tab-fmt" data-f="${esc(f)}" aria-pressed="${f === "Все"}">${f === "Все" ? "Все форматы" : esc(f) + " <small>" + rub(priceOf(f)) + "</small>"}</button>`).join("");

  function cardHtml(w) {
    return `<article class="card"><button type="button" class="card-img" data-id="${w.id}" aria-label="Открыть крупно: ${esc(w.title)}">
      <img src="img/works/${w.id}-s.webp" width="760" height="507" alt="${esc(w.title)}: ноутбук и телефон" loading="lazy" draggable="false">
      <span class="card-pal" title="Палитра сайта"><i style="--c:${w.pal[0]}"></i><i style="--c:${w.pal[1]}"></i></span></button>
      <div class="card-body"><h3>${esc(w.title)}</h3><div class="card-meta"><span class="pill">${esc(w.kind)}</span><span class="price">${rub(w.price)}</span></div></div></article>`;
  }

  function sync() {
    const max = track.scrollWidth - track.clientWidth;
    const w = track.scrollWidth ? Math.min(100, (track.clientWidth / track.scrollWidth) * 100) : 100;
    bar.style.width = w + "%";
    bar.style.marginLeft = max > 0 ? (track.scrollLeft / track.scrollWidth) * 100 + "%" : "0";
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = track.scrollLeft >= max - 4;
  }

  function render() {
    const list = WORKS.filter((w) => (niche === "Все" || w.niche === niche) && (fmt === "Все" || w.kind === fmt));
    tabs.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.n === niche)));
    fmts.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.f === fmt)));
    track.innerHTML = list.length ? list.map(cardHtml).join("") : `<p class="empty">В этой нише пока нет работ такого формата. Выберите другой формат или «Все ниши».</p>`;
    track.scrollLeft = 0;
    count.textContent = (niche === "Все" ? "Все ниши" : niche) + (fmt === "Все" ? "" : ", " + fmt) + ": " + list.length;
    sync();
  }

  tabs.addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) { niche = t.dataset.n; render(); } });
  fmts.addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) { fmt = t.dataset.f; render(); } });
  const step = () => { const c = track.querySelector(".card"); return c ? c.offsetWidth + 20 : 300; };
  prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
  track.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
  });

  /* перетаскивание мышью (на телефоне работает обычная прокрутка пальцем) */
  let down = false, moved = false, sx = 0, sl = 0;
  track.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; });
  window.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 5) { moved = true; track.classList.add("is-drag"); }
    if (moved) track.scrollLeft = sl - dx;
  });
  window.addEventListener("pointerup", () => { down = false; track.classList.remove("is-drag"); });

  /* крупный просмотр */
  function openBig(id) {
    const w = WORKS.find((x) => x.id === id);
    if (!w) return;
    lbImg.src = "img/works/" + w.id + ".webp";
    lbImg.alt = w.title;
    lbCap.textContent = w.title + " · " + w.kind + " · " + rub(w.price);
    if (typeof dialog.showModal === "function") dialog.showModal();
  }
  track.addEventListener("click", (e) => {
    if (moved) { moved = false; return; }
    const b = e.target.closest(".card-img");
    if (b) openBig(b.dataset.id);
  });
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  /* примеры под каждым тарифом: три мокапа этого формата и ссылка «все примеры» */
  document.querySelectorAll(".pr-ex[data-fmt]").forEach((box) => {
    const f = box.dataset.fmt;
    const list = WORKS.filter((w) => w.kind === f);
    const pick = [list[0], list[Math.floor(list.length / 2)], list[list.length - 1]].filter((w, i, a) => w && a.indexOf(w) === i);
    box.innerHTML = `<p class="pr-ex-title">Примеры этого формата (${list.length}):</p><div class="pr-ex-row">` +
      pick.map((w) => `<button type="button" class="pr-ex-img" data-id="${w.id}" aria-label="Открыть крупно: ${esc(w.title)}"><img src="img/works/${w.id}-s.webp" width="760" height="507" alt="${esc(w.title)}" loading="lazy"></button>`).join("") +
      `<button type="button" class="pr-all" data-f="${esc(f)}">Показать все ${list.length} в работах</button></div>`;
  });
  document.addEventListener("click", (e) => {
    const im = e.target.closest(".pr-ex-img");
    if (im) { openBig(im.dataset.id); return; }
    const all = e.target.closest(".pr-all");
    if (all) { fmt = all.dataset.f; niche = "Все"; render(); document.getElementById("works").scrollIntoView({ behavior: "smooth" }); }
  });

  render();
})();

/* Подставляем ссылки из настроек во все кнопки с data-атрибутами */
(function fillLinks() {
  const map = [
    ["[data-tg]", CONFIG.telegram],
    ["[data-tg-channel]", CONFIG.telegramChannel || CONFIG.telegram]
  ];
  map.forEach(([selector, url]) => {
    if (!url) return;
    document.querySelectorAll(selector).forEach((a) => {
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
    });
  });
})();

/* Форма заявки */
(function leadForm() {
  const form = document.getElementById("lead-form");
  if (!form) return;
  const status = form.querySelector(".form-status");

  function say(text, cls) {
    status.className = "form-status " + (cls || "");
    status.textContent = text;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    form.querySelectorAll(".field").forEach((f) => f.classList.remove("has-error"));

    const data = Object.fromEntries(new FormData(form).entries());
    if (data.website) return; // сработала ловушка для ботов
    if (data.site && data.site.trim()) { data.task = ((data.task || "").trim() + " | Текущий сайт: " + data.site.trim()).trim(); }
    delete data.site;

    const missing = ["name", "contact"].filter((k) => !String(data[k] || "").trim());
    if (missing.length) {
      missing.forEach((k) => form.elements[k].closest(".field").classList.add("has-error"));
      say("Заполните имя и Telegram или телефон, чтобы я могла ответить.", "is-error");
      form.elements[missing[0]].focus();
      return;
    }
    if (!form.elements.agree.checked) {
      say("Отметьте согласие на обработку данных, иначе я не смогу принять заявку.", "is-error");
      return;
    }

    if (!CONFIG.webhook) {
      const link = CONFIG.telegram
        ? ' <a href="' + CONFIG.telegram + '" target="_blank" rel="noopener">Написать в Telegram</a>'
        : "";
      status.className = "form-status is-error";
      status.innerHTML = "Форма пока не подключена, заявка никуда не ушла." + link;
      return;
    }

    say("Отправляю...");
    try {
      const res = await fetch(CONFIG.webhook, {
        method: "POST",
        // text/plain, а не application/json: так браузер не делает предзапрос, который Google не понимает
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ ...data, page: location.href, at: new Date().toISOString() })
      });
      const answer = await res.json();
      if (!answer.ok) throw new Error(answer.error || res.status);
      form.reset();
      say("Заявка отправлена. Отвечу в течение дня.", "is-ok");
    } catch (err) {
      say("Не получилось отправить. Напишите мне в Telegram, я отвечу там.", "is-error");
    }
  });
})();
