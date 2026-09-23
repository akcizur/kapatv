/* ============================================================
   PLAYER PAGE — video, HLS, play/pause, volume, ratio, quality
   ============================================================ */
const video       = $("video");
const playerPage  = $("playerPage");
const playBtn     = $("playBtn");
const volume      = $("volume");
const muteBtn     = $("muteBtn");
const volIcon     = $("volIcon");
const volSlider   = $("volSlider");
const volValue    = $("volValue");
const fsBtn       = $("fsBtn");
const channelInfo = $("channelInfo");
const channelName = $("channelName");
const channelLogo = $("channelLogo");
const sideLogo    = $("sideLogo");
const channelLogoSide = $("channelLogoSide");
const ratioBtn    = $("ratioBtn");
const qualityBtn  = $("qualityBtn");
const ratioMenu   = $("ratioMenu");
const qualityMenu = $("qualityMenu");
const qualityBadge = $("qualityBadge");

TV.video = video;

/* Ripple na tlačítkách */
[playBtn, muteBtn, fsBtn, ratioBtn, qualityBtn].forEach(TV.ripple);

/* ============================================================
   VOLUME
   ============================================================ */
function volIconHTML() {
  if (video.muted || video.volume === 0) {
    return '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>' +
           '<line x1="23" y1="9" x2="17" y2="15"></line>' +
           '<line x1="17" y1="9" x2="23" y2="15"></line>';
  }
  return '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>' +
         '<path d="M19 5C21 7 22 9.5 22 12C22 14.5 21 17 19 19"></path>' +
         '<path d="M15.5 8C16.8 9.2 17.5 10.5 17.5 12C17.5 13.5 16.8 14.8 15.5 16"></path>';
}

TV.updateVolUI = () => {
  const v = video.muted ? 0 : Math.round((video.volume || 0) * 100);
  volSlider.style.setProperty("--fill", v + "%");
  volValue.textContent = v;
  volIcon.innerHTML = volIconHTML();
};

TV.persistVol = () => TV.save(TV.LS.vol, String(video.muted ? 0 : video.volume));

TV.restoreVol = () => {
  const saved = parseFloat(TV.load(TV.LS.vol));
  if (!isNaN(saved) && saved >= 0 && saved <= 1) {
    video.volume = saved;
    volSlider.value = Math.round(saved * 100);
    if (saved === 0) { video.muted = true; TV.S.pendingUnmute = false; }
  } else {
    video.volume = 1;
    volSlider.value = 100;
  }
};

let volCloseTimer;
function openVolume() {
  volume.classList.add("open");
  clearTimeout(volCloseTimer);
  volCloseTimer = setTimeout(() => {
    if (!volume.matches(":hover")) volume.classList.remove("open");
  }, 1200);
}

TV.changeVol = (delta) => {
  TV.S.pendingUnmute = false;
  video.muted = false;
  const next = Math.min(1, Math.max(0, (video.volume || 0) + delta));
  video.volume = next;
  if (next === 0) video.muted = true;
  volSlider.value = Math.round(next * 100);
  TV.updateVolUI();
  TV.persistVol();
  openVolume();
};

TV.toggleMute = () => {
  TV.S.pendingUnmute = false;
  if (video.muted || video.volume === 0) {
    video.muted = false;
    if (video.volume === 0) video.volume = 1;
    volSlider.value = Math.round(video.volume * 100);
  } else {
    video.muted = true;
    volSlider.value = 0;
  }
  TV.updateVolUI();
  TV.persistVol();
  openVolume();
  TV.resetIdle();
};

volume.addEventListener("mouseenter", () => {
  clearTimeout(volCloseTimer);
  volume.classList.add("open");
  TV.resetIdle();
});
volume.addEventListener("mouseleave", () => {
  clearTimeout(volCloseTimer);
  volCloseTimer = setTimeout(() => {
    if (!volume.matches(":hover")) volume.classList.remove("open");
  }, 400);
});
muteBtn.addEventListener("click", e => { e.stopPropagation(); TV.toggleMute(); });
volSlider.addEventListener("input", () => {
  TV.S.pendingUnmute = false;
  const v = +volSlider.value;
  video.volume = v / 100;
  video.muted = v === 0;
  TV.updateVolUI();
  TV.persistVol();
  openVolume();
  TV.resetIdle();
});
video.addEventListener("volumechange", TV.updateVolUI);

/* ============================================================
   RATIO
   ============================================================ */
TV.applyRatio = (mode, silent) => {
  TV.S.ratioMode = TV.RATIOS[mode] ? mode : "cover";
  const r = TV.RATIOS[TV.S.ratioMode];
  video.style.setProperty("--vfit", r.fit);
  video.style.setProperty("--vscale", String(r.scale));
  ratioMenu.querySelectorAll(".MenuItem").forEach(el => {
    el.classList.toggle("active", el.dataset.ratio === TV.S.ratioMode);
  });
  TV.save(TV.LS.ratio, TV.S.ratioMode);
  if (!silent) TV.toast$("Ořez: " + r.label);
};

TV.cycleRatio = () => {
  const i = TV.RATIO_ORDER.indexOf(TV.S.ratioMode);
  TV.applyRatio(TV.RATIO_ORDER[(i + 1) % TV.RATIO_ORDER.length]);
  TV.resetIdle();
};

/* ============================================================
   QUALITY
   ============================================================ */
function findLevel(h, height) {
  let best = -1, br = -1;
  (h.levels || []).forEach((l, i) => {
    if (l.height === height && (l.bitrate || 0) > br) {
      br = l.bitrate || 0; best = i;
    }
  });
  return best;
}

TV.applyQuality = (h) => {
  h = h || TV.S.hls;
  if (!h || !h.levels?.length) return;
  if (TV.S.qualityPref === -1) { try { h.currentLevel = -1; } catch(_){} return; }
  const idx = findLevel(h, TV.S.qualityPref);
  try { h.currentLevel = idx >= 0 ? idx : -1; } catch(_){}
};

TV.renderQualityMenu = () => {
  const rows = [`<div class="MenuTitle">Rozlišení</div>`];
  rows.push(
    `<div class="MenuItem ${TV.S.qualityPref === -1 ? "active":""}" data-q="-1">` +
    `<span>Automaticky</span>` +
    `<svg class="check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>`
  );
  const seen = new Set();
  TV.S.levels
    .slice()
    .sort((a,b) => (b.height - a.height) || (b.bitrate - a.bitrate))
    .forEach(l => {
      if (!l.height || seen.has(l.height)) return;
      seen.add(l.height);
      const mbps = l.bitrate ? (l.bitrate / 1e6).toFixed(1) + " Mb/s" : "";
      rows.push(
        `<div class="MenuItem ${TV.S.qualityPref === l.height ? "active":""}" data-q="${l.height}">` +
        `<span>${l.height}p</span><span class="meta">${mbps}</span>` +
        `<svg class="check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>`
      );
    });
  qualityMenu.innerHTML = rows.join("");
};

TV.updateQualityBadge = () => {
  qualityBadge.textContent = TV.S.qualityPref === -1 ? "AUTO" : TV.S.qualityPref + "P";
};

TV.setQuality = (q) => {
  TV.S.qualityPref = isNaN(q) ? -1 : q;
  TV.save(TV.LS.qual, String(TV.S.qualityPref));
  TV.applyQuality();
  TV.renderQualityMenu();
  TV.updateQualityBadge();
  TV.toast$("Rozlišení: " + (TV.S.qualityPref === -1 ? "Automaticky" : TV.S.qualityPref + "p"));
  TV.resetIdle();
};

/* ============================================================
   HLS — načítání streamu
   ============================================================ */
function destroyHls() {
  if (TV.S.hls) {
    try { TV.S.hls.destroy(); } catch(_){}
    TV.S.hls = null;
  }
}

function tryPlay() {
  if (!TV.S.wantsPlay) return;
  const p = video.play();
  if (p?.catch) p.catch(() => {});
}

TV.loadStream = (url, name, autoplay) => {
  const id = ++TV.S.loadId;
  TV.S.retry = 0;
  TV.S.wantsPlay = !!autoplay;
  TV.S.ready = false;
  TV.setLoading(true);
  destroyHls();

  video.pause();
  video.removeAttribute("src");
  video.load();

  const hasHls = !!window.Hls && Hls.isSupported();
  const native = video.canPlayType("application/vnd.apple.mpegurl") !== "";

  if (hasHls) {
    const h = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30,
      maxBufferLength: 30,
      maxBufferHole: 0.5,
    });
    TV.S.hls = h;

    h.attachMedia(video);
    h.on(Hls.Events.MEDIA_ATTACHED, () => {
      if (id === TV.S.loadId) h.loadSource(url);
    });

    h.on(Hls.Events.MANIFEST_PARSED, () => {
      if (id !== TV.S.loadId) return;
      TV.S.ready = true;
      TV.S.hasManifest = true;
      TV.S.levels = (h.levels || [])
        .map(l => ({ height: +l.height || 0, bitrate: +l.bitrate || 0 }))
        .filter(l => l.height > 0);
      TV.S.currentHeight = 0;
      TV.applyQuality(h);
      TV.renderQualityMenu();
      TV.setLoading(false);
      tryPlay();
    });

    h.on(Hls.Events.LEVEL_SWITCHED, (_, d) => {
      if (id !== TV.S.loadId) return;
      TV.S.currentHeight = +(h.levels?.[d.level]?.height || 0);
    });

    h.on(Hls.Events.ERROR, (_, d) => {
      if (id !== TV.S.loadId || !d?.fatal) return;
      if (TV.S.retry < 2) {
        TV.S.retry++;
        if (d.type === Hls.ErrorTypes.NETWORK_ERROR) {
          try { h.startLoad(); return; } catch(_){}
        }
        if (d.type === Hls.ErrorTypes.MEDIA_ERROR) {
          try { h.recoverMediaError(); return; } catch(_){}
        }
      }
      TV.S.ready = false;
      TV.setLoading(false);
      TV.toast$(`Kanál „${name}“ se nepodařilo načíst`, true);
    });
    return;
  }

  if (native) {
    video.src = url;
    video.load();
    TV.S.ready = true;
    TV.S.hasManifest = true;
    TV.S.levels = [];
    TV.S.currentHeight = 0;
    TV.renderQualityMenu();
    TV.setLoading(false);
    tryPlay();
    return;
  }

  TV.setLoading(false);
  TV.toast$("HLS přehrávání není v tomto prohlížeči podporováno", true);
};

/* ============================================================
   VÝBĚR KANÁLU
   ============================================================ */
TV.selectChannel = (index) => {
  if (typeof index !== "number" || isNaN(index)) return;
  index = ((index % TV.streams.length) + TV.streams.length) % TV.streams.length;

  const wasPlaying = TV.S.playing || (!video.paused && !video.ended) || TV.S.wantsPlay;
  const changed = index !== TV.S.activeIndex;

  TV.S.activeIndex = index;
  TV.S.hoverIndex = index;
  TV.S.wantsPlay = wasPlaying;

  if (changed) {
    channelInfo.classList.add("switching");
    channelLogoSide.classList.add("switching");
    video.classList.add("switching");
    setTimeout(() => {
      if (index !== TV.S.activeIndex) return;
      channelLogo.src = TV.streams[index].logo;
      sideLogo.src = TV.streams[index].logo;
      channelName.textContent = TV.streams[index].name;
      channelInfo.classList.remove("switching");
      channelLogoSide.classList.remove("switching");
    }, 200);
  } else {
    channelLogo.src = TV.streams[index].logo;
    sideLogo.src = TV.streams[index].logo;
    channelName.textContent = TV.streams[index].name;
  }

  TV.tiles.forEach((t, i) => {
    t.classList.toggle("active", i === index);
    t.classList.toggle("hovered", i === index);
  });

  TV.loadStream(TV.streams[index].url, TV.streams[index].name, wasPlaying);
  TV.resetIdle();
};

/* ============================================================
   PLAY / PAUSE
   ============================================================ */
TV.updatePlayIcon = () => {
  const svg = playBtn.querySelector("svg.playIcon");
  svg.innerHTML = TV.S.playing
    ? '<rect x="6" y="4" width="4" height="16" rx="1"></rect>' +
      '<rect x="14" y="4" width="4" height="16" rx="1"></rect>'
    : '<polygon points="6 3.5 19.5 12 6 20.5 6 3.5"></polygon>';
};

TV.togglePlay = () => {
  if (video.paused) {
    TV.S.wantsPlay = true;
    if (TV.S.ready || video.src) tryPlay();
    else TV.loadStream(
      TV.streams[TV.S.activeIndex].url,
      TV.streams[TV.S.activeIndex].name,
      true
    );
  } else {
    TV.S.wantsPlay = false;
    video.pause();
  }
  TV.resetIdle();
};

video.addEventListener("play", () => {
  TV.S.playing = true;
  document.body.dataset.paused = "false";
  document.body.classList.remove("paused");
  TV.updatePlayIcon();
});
video.addEventListener("pause", () => {
  TV.S.playing = false;
  document.body.dataset.paused = "true";
  document.body.classList.add("paused");
  TV.updatePlayIcon();
});
video.addEventListener("playing", () => {
  TV.S.ready = true;
  TV.setLoading(false);
  video.classList.remove("switching");
});
video.addEventListener("canplay", () => {
  TV.S.ready = true;
  TV.setLoading(false);
  if (TV.S.wantsPlay && video.paused) tryPlay();
});
video.addEventListener("waiting", () => {
  if (TV.S.wantsPlay) TV.setLoading(true);
});
video.addEventListener("error", () => {
  if (TV.S.hls) return;
  TV.setLoading(false);
  TV.toast$("Chyba přehrávání streamu", true);
});

/* ============================================================
   FULLSCREEN
   ============================================================ */
TV.toggleFs = () => {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (!fsEl) {
    const req = document.documentElement.requestFullscreen
             || document.documentElement.webkitRequestFullscreen;
    if (req) {
      const p = req.call(document.documentElement);
      if (p?.catch) p.catch(() => {});
    }
  } else {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) {
      const p = exit.call(document);
      if (p?.catch) p.catch(() => {});
    }
  }
};

fsBtn.addEventListener("click", e => {
  e.stopPropagation();
  TV.toggleFs();
});
