/* Screen layouts: Phone, Tablet and Desktop. Owner: Ken + Claude.
   The app works out what kind of device it is running on and opens in that layout.
   Settings (gear on Home or the question screen) lets you preview the other layouts this device can show:
     desktop or laptop: Desktop, Tablet, Phone
     tablet:            Tablet, Phone
     phone:             Phone only (the choice is hidden)
   The choice is remembered on this device. Load before app.js: app.js calls viewFit() and viewSettings().
   For testing, add ?device=phone, ?device=tablet or ?device=desktop to the address to act like that device. */
(function () {
  const KEY = "obView";
  const FRAMES = { phone: [406, 860], tablet: [820, 1180] };   // preview frames shown on bigger screens (CSS pixels)
  const LABEL = { phone: "Phone", tablet: "Tablet", desktop: "Desktop" };
  const ALLOWED = { desktop: ["desktop", "tablet", "phone"], tablet: ["tablet", "phone"], phone: ["phone"] };

  function detect() {
    const forced = new URLSearchParams(location.search).get("device");
    if (forced && ALLOWED[forced]) return forced;
    const touch = (navigator.maxTouchPoints || 0) > 0;
    const short = Math.min(screen.width, screen.height);
    const mouse = matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (touch && short < 600) return "phone";
    if (touch && !mouse) return "tablet";      // iPads and Android tablets (an iPad with a trackpad counts as a desktop)
    if (!touch && short < 600) return "phone";   // very small screen without touch: treat as a phone
    return "desktop";
  }

  const DEVICE = detect();
  let view = (() => { try { const v = localStorage.getItem(KEY); return ALLOWED[DEVICE].includes(v) ? v : DEVICE; } catch (e) { return DEVICE; } })();

  const root = document.documentElement;
  function apply() { root.dataset.view = view; root.dataset.device = DEVICE; }
  apply();

  // Size the app screen. Returns true so app.js's own phone-only fit is skipped.
  window.viewFit = function () {
    const phone = document.getElementById("phone"), holder = document.getElementById("holder");
    if (!phone || !holder) return false;
    const reset = () => { phone.style.transform = ""; holder.style.width = ""; holder.style.height = ""; };
    // Fill the whole screen: the layout that matches this device, a desktop, or a phone layout on a narrow window.
    const fill = view === DEVICE || view === "desktop" || (view === "phone" && window.innerWidth <= 500);
    root.toggleAttribute("data-fill", fill);
    if (fill) { reset(); return true; }
    const [w, h] = FRAMES[view];
    const s = Math.min(1, (window.innerHeight - 110) / h, (window.innerWidth - 32) / w);
    phone.style.transform = `scale(${s})`;
    holder.style.width = Math.round(w * s) + "px";
    holder.style.height = Math.round(h * s) + "px";
    return true;
  };

  // The "Screen layout" choice inside Settings. Hidden on phones, where only the phone layout is available.
  window.viewSettings = function () {
    const opts = ALLOWED[DEVICE];
    if (opts.length < 2) return "";
    const hint = { phone: "Phone-sized screen, as on a phone.", tablet: "Wider screen, as on a tablet.", desktop: "Full window, made for a computer." };
    return `<fieldset><legend>Screen layout</legend>
      ${opts.map((v) => `<button type="button" class="reason" data-act="setview" data-v="${v}" aria-pressed="${view === v}"><i aria-hidden="true"></i><span>${LABEL[v]}${v === DEVICE ? " (this device)" : ""}<small>${hint[v]}</small></span></button>`).join("")}
    </fieldset>`;
  };

  window.PAGE_ACTIONS = Object.assign(window.PAGE_ACTIONS || {}, {
    setview: (b) => {
      const v = b.dataset.v;
      if (!ALLOWED[DEVICE].includes(v) || v === view) return;
      view = v; apply();
      try { localStorage.setItem(KEY, v); } catch (e) {}
      window.viewFit();
    },
  });

  window.VIEW = { device: () => DEVICE, current: () => view };
})();
