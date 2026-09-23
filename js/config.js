/* ============================================================
   KONFIGURACE — data kanálů, konstanty, sdílený stav
   ============================================================ */
const TV = {};

TV.streams = [
  { name:"ČT1",            url:"http://88.212.15.47/live/test_ct1_25p/playlist.m3u8" },
  { name:"ČT2",            url:"http://88.212.15.47/live/test_ct2_25p/playlist.m3u8" },
  { name:"ČT24",           url:"http://88.212.15.47/live/ct24_avc_25p/playlist.m3u8" },
  { name:"ČT Sport",       url:"http://88.212.15.47/live/test_ct_sport_hevc_25p/playlist.m3u8" },
  { name:"TV Nova",        url:"http://88.212.15.47/live/nova_avc_25p/playlist.m3u8" },
  { name:"Nova Cinema",    url:"http://88.212.15.47/live/nova_cinema_avc_25p/playlist.m3u8" },
  { name:"Nova Fun",       url:"http://88.212.15.47/live/nova_fun_avc_25p/playlist.m3u8" },
  { name:"Nova Action",    url:"http://88.212.15.47/live/nova_action_avc_25p/playlist.m3u8" },
  { name:"Nova Gold",      url:"http://88.212.15.47/live/nova_gold_avc_25p/playlist.m3u8" },
  { name:"Nova Lady",      url:"http://88.212.15.47/live/test_nova_lady_hevc_25p/playlist.m3u8" },
  { name:"Prima",          url:"http://88.212.15.47/live/prima_avc_25p/playlist.m3u8" },
  { name:"Prima COOL",     url:"http://88.212.15.47/live/prima_cool_cz_hevc/index.m3u8" },
  { name:"Prima KRIMI",    url:"http://88.212.15.47/live/test_prima_krimi_hevc/playlist.m3u8" },
  { name:"Prima LOVE",     url:"http://88.212.15.47/live/test_prima_love_hevc/playlist.m3u8" },
  { name:"Prima ZOOM",     url:"http://88.212.15.47/live/test_prima_zoom_hevc/playlist.m3u8" },
  { name:"Prima Show",     url:"http://88.212.15.47/live/prima_show_25p/playlist.m3u8" },
  { name:"CNN Prima News", url:"http://88.212.15.47/live/test_cnn_pirma_news/playlist.m3u8" },
  { name:"AMC",            url:"http://88.212.15.47/live/test_amc_25p/playlist.m3u8" },
  { name:"AXN",            url:"http://88.212.15.47/live/test_axn/playlist.m3u8" },
  { name:"Cinemax",        url:"http://88.212.15.47/live/test_cinemax_hd_hevc/playlist.m3u8" },
  { name:"Cinemax 2",      url:"http://88.212.15.47/live/test_cinemax2_hd_hevc/playlist.m3u8" },
  { name:"Film+",          url:"http://88.212.15.47/live/test_film_plus_25p/playlist.m3u8" },
  { name:"Filmbox",        url:"http://88.212.15.47/live/test_filmbox/playlist.m3u8" },
  { name:"HBO",            url:"http://88.212.15.47/live/test_hbo_hd_hevc/playlist.m3u8" },
  { name:"HBO 2",          url:"http://88.212.15.47/live/test_hbo2_hd_hevc/playlist.m3u8" },
  { name:"HBO 3",          url:"http://88.212.15.47/live/test_hbo3_hd_hevc/playlist.m3u8" },
];

TV.LOGOS = {
  "ČT1":"ct1","ČT2":"ct2","ČT24":"ct24","ČT Sport":"ctsport",
  "TV Nova":"nova","Nova Cinema":"novacinema","Nova Fun":"novafun",
  "Nova Action":"novaaction","Nova Gold":"novagold","Nova Lady":"novalady",
  "Prima":"prima","Prima COOL":"primacool","Prima KRIMI":"primakrimi",
  "Prima LOVE":"primalove","Prima ZOOM":"primazoom","Prima Show":"primashow",
  "CNN Prima News":"cnnprimanews","AMC":"amc","AXN":"axn","Cinemax":"cinemax",
  "Cinemax 2":"cinemax2","Film+":"filmplus","Filmbox":"filmbox",
  "HBO":"hbo","HBO 2":"hbo2","HBO 3":"hbo3"
};

/* přidání loga ke každému streamu + prefetch */
TV.streams.forEach(s => {
  const slug = TV.LOGOS[s.name];
  s.logo = `https://raw.githubusercontent.com/MarhyCZ/picons/refs/heads/master/640/${slug}.png`;
  const i = new Image(); i.src = s.logo;
});

TV.RATIOS = {
  cover:   { fit:"cover",   scale:1,    label:"Vyplnit (ořez)" },
  contain: { fit:"contain", scale:1,    label:"Celé video" },
  fill:    { fit:"fill",    scale:1,    label:"Roztáhnout" },
  zoom:    { fit:"cover",   scale:1.25, label:"Přiblížit 125 %" },
};
TV.RATIO_ORDER = ["cover","contain","fill","zoom"];

TV.LS = { vol: "tv_vol", ratio: "tv_ratio", qual: "tv_qual" };

/* ============================================================
   SDÍLENÝ STAV
   ============================================================ */
TV.S = {
  page: "player",
  activeIndex: 0,
  hoverIndex: 0,
  hls: null,
  idleTimer: null,
  errorTimer: null,
  clickTimer: null,
  playing: false,
  loading: false,
  retry: 0,
  loadId: 0,
  pendingUnmute: true,
  wantsPlay: false,
  ready: false,
  qualityPref: -1,
  levels: [],
  currentHeight: 0,
  hasManifest: false,
  ratioMode: "cover",
};

window.TV = TV;
