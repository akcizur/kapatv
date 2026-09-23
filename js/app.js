/* ============================================================
   INICIALIZACE
   ============================================================ */
(function init() {
  // Pomocné aliasy
  TV.playerPage = $("playerPage");
  TV.gridPage   = $("gridPage");
  TV.video      = $("video");

  // --- Ořez / poměr stran ---
  const savedRatio = TV.load(TV.LS.ratio);
  if (savedRatio && TV.RATIOS[savedRatio]) TV.S.ratioMode = savedRatio;
  TV.applyRatio(TV.S.ratioMode, true);

  // --- Rozlišení ---
  const savedQ = parseInt(TV.load(TV.LS.qual), 10);
  if (!isNaN(savedQ)) TV.S.qualityPref = savedQ;
  TV.renderQualityMenu();
  TV.updateQualityBadge();

  // --- Hlasitost ---
  TV.restoreVol();
  TV.updateVolUI();

  // --- Start ve stavu pauzy ---
  document.body.dataset.paused = "true";
  document.body.classList.add("paused");
  TV.S.wantsPlay = false;
  TV.updatePlayIcon();

  // --- Unmute hint po chvíli ---
  setTimeout(() => {
    if (TV.S.pendingUnmute) $("hint").classList.add("show");
  }, 1500);

  // --- Načti první kanál (bez autoplay) ---
  TV.selectChannel(0);
  TV.S.wantsPlay = false;

  // --- Idle timer ---
  TV.resetIdle();

  // --- Prvotní layout gridu ---
  TV.relayout();
})();
