/* ============================================================
   UI — page transitions, menu, idle, klávesy, gesta
   ============================================================ */
const gridBtn = $("gridBtn");
const toast   = $("toast");
const hint    = $("hint");

TV.ripple(gridBtn);

/* ============================================================
   PAGE TRANSITION — hlavní přechody mezi obrazovkami
   ============================================================ */
TV.goToPage = (page) => {
  if (TV.S.page === page) return;
  TV.S.page = page;
  document.body.dataset.page = page;

  if (page === "grid") {
    // Player → Grid
    TV.playerPage.dataset.state = "leaving";
    setTimeout(() => {
      TV.playerPage.dataset.state = "hidden";
      TV.relayout();
      TV.gridPage.dataset.state = "active";
      TV.setHover(TV.S.activeIndex, true);
    }, 350);
    TV.resetIdle(true);
  } else {
    // Grid → Player
    TV.gridPage.dataset.state = "leaving";
    setTimeout(() => {
      TV.gridPage.dataset.state = "hidden";
      TV.playerPage.dataset.state = "active";
      TV.resetIdle();
    }, 400);
  }
};

/* ============================================================
   IDLE
   ============================================================ */
TV.resetIdle = (skip) => {
  document.body.classList.remove("idle");
  clearTimeout(TV.S.idleTimer);
  if (skip || TV.S.page === "grid") return;
  TV.S.idleTimer = setTimeout(() => {
    document.body.classList.add("idle");
    $("volume").classList.remove("open");
  }, 3000);
};

/* ============================================================
   MENU (ratio / quality)
   ============================================================ */
const ratioMenu   = $("ratioMenu");
const qualityMenu = $("qualityMenu");
const ratioBtn    = $("ratioBtn");
const qualityBtn  = $("qualityBtn");

function closeMenus() {
  ratioMenu.classList.remove("open");
  qualityMenu.classList.remove("open");
}
TV.closeMenus = closeMenus;

function toggleMenu(menu) {
  const willOpen = !menu.classList.contains("open");
  closeMenus();
  if (willOpen) menu.classList.add("open");
}
TV.toggleMenu = toggleMenu;

ratioBtn.addEventListener("click", e => {
  e.stopPropagation();
  toggleMenu(ratioMenu);
  TV.resetIdle();
});
ratioMenu.addEventListener("click", e => {
  const it = e.target.closest(".MenuItem[data-ratio]");
  if (!it) return;
  e.stopPropagation();
  TV.applyRatio(it.dataset.ratio);
  closeMenus();
  TV.resetIdle();
});

qualityBtn.addEventListener("click", e => {
  e.stopPropagation();
  TV.renderQualityMenu();
  toggleMenu(qualityMenu);
  TV.resetIdle();
});
qualityMenu.addEventListener("click", e => {
  const it = e.target.closest(".MenuItem[data-q]");
  if (!it) return;
  e.stopPropagation();
  TV.setQuality(+it.dataset.q);
  closeMenus();
  TV.resetIdle();
});

document.addEventListener("click", e => {
  if (e.target.closest(".MenuAnchor")) return;
  closeMenus();
});

/* ============================================================
   TLAČÍTKA
   ============================================================ */
$("playBtn").addEventListener("click", e => {
  e.stopPropagation();
  TV.togglePlay();
});

gridBtn.addEventListener("click", e => {
  e.stopPropagation();
  TV.goToPage("grid");
});

TV.gridScroll.addEventListener("click", e => {
  if (e.target === TV.gridScroll) TV.goToPage("player");
});

/* Klik na pozadí → play/pause */
document.addEventListener("click", e => {
  if (e.target.closest(".Center") || e.target.closest(".Menu") ||
      e.target.closest("#gridPage")) return;
  if (TV.S.clickTimer) return;
  TV.S.clickTimer = setTimeout(() => {
    TV.S.clickTimer = null;
    TV.togglePlay();
  }, 200);
});

/* Dvojklik → fullscreen */
document.addEventListener("dblclick", e => {
  if (e.target.closest(".Center") || e.target.closest("#gridPage")) return;
  clearTimeout(TV.S.clickTimer);
  TV.S.clickTimer = null;
  TV.toggleFs();
});

document.addEventListener("contextmenu", e => e.preventDefault());

/* ============================================================
   GESTA / IDLE LISTENERS
   ============================================================ */
window.addEventListener("mousemove", () => TV.resetIdle(), { passive: true });
window.addEventListener("mousedown", () => TV.resetIdle(), { passive: true });
window.addEventListener("touchstart", () => TV.resetIdle(), { passive: true });

/* Odemčení zvuku prvním gestem */
function tryUnmute(e) {
  if (!TV.S.pendingUnmute) return;
  if (e?.target && (e.target.closest("#muteBtn") ||
                    e.target.closest(".VolSlider"))) return;
  TV.S.pendingUnmute = false;
  const v = TV.video;
  v.muted = false;
  TV.updateVolUI();
  $("volSlider").value = Math.round(v.volume * 100);
  TV.persistVol();
  hint.classList.remove("show");
}
document.addEventListener("click", tryUnmute, { capture: true });
document.addEventListener("touchstart", tryUnmute, { passive: true, capture: true });
document.addEventListener("keydown", tryUnmute, { capture: true });

/* ============================================================
   KEYBOARD
   ============================================================ */
window.addEventListener("keydown", e => {
  TV.resetIdle();
  const onGrid = TV.S.page === "grid";

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    if (onGrid) {
      TV.selectChannel(TV.S.hoverIndex);
      TV.goToPage("player");
    } else {
      TV.togglePlay();
    }
    return;
  }
  if (e.key === "Escape") {
    closeMenus();
    if (onGrid) TV.goToPage("player");
    return;
  }
  if (e.key === "f" || e.key === "F") { TV.toggleFs(); return; }
  if (e.key === "m" || e.key === "M") { TV.toggleMute(); return; }
  if (e.key === "g" || e.key === "G") {
    TV.goToPage(onGrid ? "player" : "grid");
    return;
  }
  if (e.key === "a" || e.key === "A") { TV.cycleRatio(); return; }
  if (e.key === "q" || e.key === "Q") {
    TV.renderQualityMenu();
    toggleMenu(qualityMenu);
    return;
  }

  if (["ArrowRight","ArrowLeft","ArrowUp","ArrowDown"].includes(e.key)) {
    e.preventDefault();
    if (onGrid) { TV.moveFocus(e.key); return; }
    if (e.key === "ArrowRight") TV.selectChannel(TV.S.activeIndex + 1);
    else if (e.key === "ArrowLeft") TV.selectChannel(TV.S.activeIndex - 1);
    else if (e.key === "ArrowUp") TV.changeVol(0.05);
    else TV.changeVol(-0.05);
  }
});

/* Kolečko myši → hlasitost */
window.addEventListener("wheel", e => {
  TV.resetIdle();
  if (TV.S.page === "grid" || !e.deltaY) return;
  TV.changeVol(e.deltaY < 0 ? 0.03 : -0.03);
}, { passive: true });
