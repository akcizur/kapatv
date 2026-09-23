/* ============================================================
   POMOCNÉ FUNKCE
   ============================================================ */
const $ = id => document.getElementById(id);
TV.$ = $;

/* Toast notifikace */
TV.toast$ = (msg, isError) => {
  const el = $("toast");
  el.textContent = msg;
  el.classList.toggle("error", !!isError);
  el.classList.add("show");
  clearTimeout(TV.S.errorTimer);
  TV.S.errorTimer = setTimeout(() => el.classList.remove("show"), isError ? 4000 : 2200);
};

/* Loading stav (spinner v PLAY tlačítku) */
TV.setLoading = on => {
  TV.S.loading = !!on;
  document.body.classList.toggle("loading", TV.S.loading);
};

/* LocalStorage */
TV.save = (k,v) => { try { localStorage.setItem(k,v); } catch(_){} };
TV.load = (k) => { try { return localStorage.getItem(k); } catch(_){ return null; } };

/* Ripple efekt */
TV.ripple = el => {
  el.addEventListener("pointerdown", e => {
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const span = document.createElement("span");
    span.className = "Ripple";
    span.style.cssText =
      `width:${size}px;height:${size}px;` +
      `left:${e.clientX - r.left - size/2}px;` +
      `top:${e.clientY - r.top - size/2}px`;
    el.appendChild(span);
    setTimeout(() => span.remove(), 650);
  });
};
