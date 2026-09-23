/* ============================================================
   GRID PAGE — generování dlaždic, hex layout, focus
   ============================================================ */
TV.hexGrid = $("hexGrid");
TV.gridPage = $("gridPage");
TV.gridScroll = $("gridScroll");
TV.tiles = [];

/* Vytvoření dlaždic */
TV.streams.forEach((s, i) => {
  const tile = document.createElement("div");
  tile.className = "Tile";
  tile.dataset.index = i;
  tile.title = s.name;
  tile.setAttribute("role", "button");
  tile.innerHTML = `<img src="${s.logo}" alt="${s.name}" draggable="false">`;

  tile.addEventListener("mouseenter", () => TV.setHover(i, false));
  tile.addEventListener("mouseleave", () => tile.classList.remove("hovered"));
  tile.addEventListener("click", e => {
    e.stopPropagation();
    TV.selectChannel(i);
    TV.goToPage("player");
  });

  TV.hexGrid.appendChild(tile);
});
TV.tiles = Array.from(TV.hexGrid.children);

/* ============================================================
   VÝPOČET SLOUPCŮ (dle šířky viewportu)
   ============================================================ */
TV.computeColumns = () => {
  const tileW = parseFloat(
    getComputedStyle(TV.hexGrid).getPropertyValue("--w")
  ) || 100;
  const padX = window.innerWidth * 0.08;
  const avail = window.innerWidth - padX - 24;
  const cols = Math.max(4, Math.min(12, Math.floor(avail / tileW)));
  TV.hexGrid.style.setProperty("--cols", cols);
};

/* ============================================================
   HONEYCOMB — odsazení lichých řádků
   ============================================================ */
TV.applyHoneycomb = () => {
  TV.tiles.forEach(t => t.classList.remove("offset"));
  const rows = [];
  let row = [], lastTop = null;
  TV.tiles.forEach(t => {
    const top = t.offsetTop;
    if (lastTop === null || Math.abs(top - lastTop) < 3) row.push(t);
    else { rows.push(row); row = [t]; }
    lastTop = top;
  });
  if (row.length) rows.push(row);
  rows.forEach((r, i) => {
    if (i % 2 === 1) r.forEach(t => t.classList.add("offset"));
  });
};

/* ============================================================
   RADIÁLNÍ STAGGER — zpoždění dle vzdálenosti od středu
   ============================================================ */
TV.computeRadialDelays = () => {
  if (!TV.tiles.length) return;
  const pos = TV.tiles.map(t => ({
    x: t.offsetLeft + t.offsetWidth / 2,
    y: t.offsetTop  + t.offsetHeight / 2,
  }));
  const xs = pos.map(p => p.x);
  const ys = pos.map(p => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const maxD = Math.hypot(Math.max(...xs) - cx, Math.max(...ys) - cy) || 1;

  TV.tiles.forEach((t, i) => {
    const d = Math.hypot(pos[i].x - cx, pos[i].y - cy);
    const delay = (d / maxD) * 420;
    t.style.setProperty("--delay", delay.toFixed(0) + "ms");
  });
};

/* Kompletní přepočet layoutu */
TV.relayout = () => {
  TV.computeColumns();
  requestAnimationFrame(() => {
    TV.applyHoneycomb();
    requestAnimationFrame(TV.computeRadialDelays);
  });
};

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(TV.relayout, 120);
});

/* ============================================================
   FOCUS / NAVIGACE
   ============================================================ */
TV.setHover = (i, scroll) => {
  if (i < 0 || i >= TV.streams.length) return;
  TV.S.hoverIndex = i;
  TV.tiles.forEach((t, idx) => t.classList.toggle("hovered", idx === i));
  if (scroll && TV.tiles[i]) {
    TV.tiles[i].scrollIntoView({ block:"nearest", behavior:"smooth" });
  }
};

TV.gridColumns = () => {
  const first = TV.tiles[0]?.offsetTop;
  let n = 0;
  for (const t of TV.tiles) {
    if (t.offsetTop === first) n++; else break;
  }
  return Math.max(1, n);
};

TV.moveFocus = (key) => {
  const cols = TV.gridColumns();
  let next = TV.S.hoverIndex;
  if (key === "ArrowRight") next++;
  else if (key === "ArrowLeft") next--;
  else if (key === "ArrowDown") next += cols;
  else if (key === "ArrowUp") next -= cols;

  if (key === "ArrowRight" && next >= TV.streams.length) next = 0;
  if (key === "ArrowLeft" && next < 0) next = TV.streams.length - 1;
  if ((key === "ArrowUp" || key === "ArrowDown") &&
      (next < 0 || next >= TV.streams.length)) next = TV.S.hoverIndex;

  TV.setHover(next, true);
};
