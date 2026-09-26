/* Настройки сайта: всё, что нужно поменять, лежит здесь. */
const CONFIG = {
  telegram: "https://t.me/Svetadan75",
  telegramChannel: "", // TODO Светлана: ссылка на Telegram-канал (если пусто, ведёт на личный Telegram)
  youtube: "https://www.youtube.com/@%D0%A1%D0%B2%D0%B5%D1%82%D0%BB%D0%B0%D0%BD%D0%B0%D0%94%D0%B0%D0%BD%D0%B8%D0%BB%D0%BE%D0%B2%D0%B0-%D1%811%D0%B5",
  webhook: "https://script.google.com/macros/s/AKfycbwan3bIMm3-wpxq0BQjVRjpiNuglQeolxW9MkRGnnFy9OfsFCzW3bY1ZlHuS_cxPFg/exec" // приёмник заявок: Google Apps Script, кладёт строку в таблицу "Заявки с сайта"
};

/* Подставляем ссылки из настроек во все кнопки с data-атрибутами */
(function fillLinks() {
  const map = [
    ["[data-tg]", CONFIG.telegram],
    ["[data-tg-channel]", CONFIG.telegramChannel || CONFIG.telegram],
    ["[data-yt]", CONFIG.youtube]
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

/* Конструктор в первом экране: чипы включают блоки, внизу подсказка, какой это тариф */
(function builder() {
  const chips = document.querySelectorAll(".chip[data-block]");
  const blocks = document.querySelectorAll(".blk[data-b]");
  const nameEl = document.getElementById("verdict-name");
  const priceEl = document.getElementById("verdict-price");
  if (!chips.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tierTitle = {
    card: "сайт-визитка",
    landing: "лендинг",
    apply: "лендинг с приёмом заявок"
  };

  function setBlock(key, on) {
    const chip = document.querySelector('.chip[data-block="' + key + '"]');
    const block = document.querySelector('.blk[data-b="' + key + '"]');
    if (chip) chip.setAttribute("aria-pressed", String(on));
    if (block) block.hidden = !on;
  }

  function selected() {
    return [...chips].filter((c) => c.getAttribute("aria-pressed") === "true").map((c) => c.dataset.block);
  }

  function update() {
    const on = selected();
    let tier = "card";
    if (on.includes("form") || on.includes("tg")) tier = "apply";
    else if (on.length >= 3) tier = "landing";

    nameEl.textContent = tierTitle[tier];
    const row = document.querySelector('.price-row[data-tier="' + tier + '"]');
    priceEl.textContent = row ? "от " + row.dataset.from + " ₽" : "";
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const on = chip.getAttribute("aria-pressed") !== "true";
      setBlock(chip.dataset.block, on);
      update();
    });
  });

  /* Единственное «представление» при загрузке: страница собирается блок за блоком */
  const start = ["services", "gallery", "form"];
  start.forEach((key, i) => {
    if (reduced) { setBlock(key, true); return; }
    setTimeout(() => { setBlock(key, true); update(); }, 500 + i * 450);
  });
  update();
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
