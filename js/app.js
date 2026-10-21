/* Choongum — site logic. Edit the data lists below to add albums, mixes, press files or paintings. */

const ALBUMS = [
  // title, year, Bandcamp slug, Bandcamp album id (for the embedded player)
  ['Graffio', 2023, 'graffio', 229738914],
  ['So Far So Good', 2023, 'so-far-so-good', 3283736266],
  ['Biomorphism', 2021, 'biomorphism', 454398523],
  ['Decomposition', 2021, 'decomposition', 1664609594],
  ['Empty Club', 2020, 'empty-club', 398605062],
  ['Choongum Type Beat', 2020, 'choongum-type-beat', 3287839297],
  ['Peace Fixation', 2019, 'peace-fixation', 4267616731],
  ['Cityscapes', 2019, 'cityscapes', 3648764675],
  ['Nature Documentary', 2015, 'nature-documentary', 3556120362],
  ['Pure Spirit', 2013, 'pure-spirit', 3319696995],
  ['Timefog', 2012, 'timefog', 1757474812],
].map(([title, year, slug, id]) => ({ title, year, slug, id }));

const MIXES = [
  // title, subtitle, year, YouTube id, duration in seconds
  ['Dark, tribal & groovy prog mix', 'Studio mix', 2026, 'XMhA7a1Tu8k', 4735],
  ['Live @ Woodburnia Festival', 'Australia', 2025, 'l4V5-zA74wo', 7235],
  ['Late Night Synth Mix', 'Floating slowly out of your body', 2024, 'mPAFA3cMD2g', 5007],
  ['Beatless Ambient Mix', 'No drums, just synths', 2024, 'WYAQY03Q3-8', 5878],
  ['DJ set @ Japan Club', 'Mexico City', 2023, 'xQfNf-Zj058', 5397],
].map(([title, sub, year, id, secs]) => ({ title, sub, year, id, secs }));

const PRESS = [
  // Put files in /press and set href, e.g. 'press/choongum-epk.pdf'. Entries without href show as "Soon".
  { title: 'Electronic press kit', meta: 'PDF', href: null, icon: 'doc' },
  { title: 'Press photos, hi-res', meta: 'ZIP', href: null, icon: 'photo' },
];

const PAINTINGS = [
  // main image first, then details (files live in paintings/thumb and paintings/large)
  ['extranos', 'extranos2', 'extranos3', 'extranos4'],
  ['wall', 'wall2', 'wall3', 'wall4'],
  ['slime', 'slime2', 'slime3', 'slime4', 'slime5'],
  ['stitch', 'stitch2', 'stitch3', 'stitch4'],
  ['cdmx', 'cdmx2', 'cdmx3', 'cdmx4', 'cdmx5'],
  ['colors'],
  ['greenspray'],
  ['who'],
  ['eternalnow'],
  ['bluemagic', 'redmagic'],
  ['orange', 'orange2', 'orange3', 'orange4', 'orange5'],
  ['green', 'green2', 'green3', 'green4', 'green5'],
  ['bluefabric', 'bluefabric2', 'bluefabric3', 'bluefabric4', 'bluefabric5'],
  ['choonface', 'choonface2', 'choonface3'],
];

const ICONS = {
  doc: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>',
};

const TABS = ['music', 'mixes', 'bio', 'press', 'paintings'];
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};
const isMobile = () => matchMedia('(max-width: 860px)').matches;
// Bandcamp's large player has its own progress bar and prev/next; the page can't start it, so visitors press its play button.
const bandcampEmbed = (a) => `https://bandcamp.com/EmbeddedPlayer/album=${a.id}/size=large/bgcol=0e1828/linkcol=7fd0ff/tracklist=false/artwork=small/transparent=true/`;

const content = $('content');
const deck = $('deck');
const visFloat = $('visFloat');
const visSlot = $('visSlot');

let tab = 'music';
let selAlbum = 0;
let selMix = 0;
let yt = null;
let ytStarted = false;
let playing = false;

/* ── Tabs (hash routing) ─────────────────────────────── */

function showTab(name) {
  tab = TABS.includes(name) ? name : 'music';
  document.querySelectorAll('[data-panel]').forEach((p) => p.classList.toggle('active', p.dataset.panel === tab));
  document.querySelectorAll('.tabs a').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  content.scrollTop = 0;
  placeVis();
}
window.addEventListener('hashchange', () => showTab(location.hash.slice(1)));

/* ── Music ───────────────────────────────────────────── */

function renderAlbums() {
  $('albumCount').textContent = `${ALBUMS.length} ALBUMS`;
  $('albumGrid').innerHTML = ALBUMS.map((a, i) => `
    <button class="cover-card" type="button" data-i="${i}" aria-pressed="${i === selAlbum}">
      <img src="img/covers/${a.slug}.jpg" alt="" loading="lazy" width="132" height="132">
      <span class="t">${esc(a.title)}</span>
      <span class="y mono">${a.year}</span>
    </button>`).join('');
  $('albumGrid').addEventListener('click', (e) => {
    const b = e.target.closest('.cover-card');
    if (!b) return;
    selectAlbum(+b.dataset.i, true);
    loadAlbumInDeck(+b.dataset.i, true);
  });
}

function selectAlbum(i, fromGrid) {
  selAlbum = i;
  const a = ALBUMS[i];
  $('heroCover').src = `img/covers/${a.slug}.jpg`;
  $('heroCover').alt = `${a.title} cover`;
  $('heroTitle').textContent = a.title;
  $('heroMeta').textContent = `ALBUM · ${a.year}`;
  $('heroLabel').textContent = i === 0 ? 'Latest release' : 'Selected album';
  document.querySelectorAll('.cover-card').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.i === i));
  if (fromGrid && isMobile()) content.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadAlbumInDeck(i, flash) {
  stopMix();
  const a = ALBUMS[i];
  $('bcPlayer').src = bandcampEmbed(a);
  $('bcPlayer').title = `Bandcamp player: ${a.title}`;
  deck.dataset.mode = 'album';
  if (flash) {
    deck.classList.remove('flash');
    void deck.offsetWidth;
    deck.classList.add('flash');
  }
}

/* ── Mixes ───────────────────────────────────────────── */

function renderMixes() {
  const total = MIXES.reduce((s, m) => s + m.secs, 0);
  $('mixTotal').textContent = `${MIXES.length} MIXES · ${fmt(total)}`;
  $('mixList').innerHTML = MIXES.map((m, i) => `
    <li><button type="button" data-i="${i}">
      <img src="img/mixes/${m.id}.jpg" alt="" loading="lazy">
      <span class="n">${i + 1}.</span>
      <span class="body"><span>${esc(m.title)}</span><span class="sub">${esc(m.sub)} · ${m.year}<span class="m-only"> · ${fmt(m.secs)}</span></span></span>
      <span class="d">${fmt(m.secs)}</span>
    </button></li>`).join('');
  $('mixList').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    selectMix(+b.dataset.i);
    playMix();
    if (isMobile()) content.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function selectMix(i) {
  selMix = (i + MIXES.length) % MIXES.length;
  const m = MIXES[selMix];
  $('visError').hidden = true;
  $('visPoster').src = `img/mixes/${m.id}.jpg`;
  $('visPoster').alt = m.title;
  $('visPlay').setAttribute('aria-label', `Play ${m.title}`);
  $('visDur').textContent = fmt(m.secs);
  $('mixTitle').textContent = m.title;
  $('mixMeta').textContent = `${m.sub} · ${m.year} · ${fmt(m.secs)}`;
  $('mixYT').href = `https://youtu.be/${m.id}`;
  $('deckImg').src = `img/mixes/${m.id}.jpg`;
  $('deckTitle').textContent = `CHOONGUM — ${m.title.toUpperCase()}`;
  $('deckTime').textContent = `0:00 / ${fmt(m.secs)}`;
  $('deckProgFill').style.width = '0';
  document.querySelectorAll('#mixList button').forEach((b) => b.setAttribute('aria-current', +b.dataset.i === selMix));
}

function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  return new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = resolve;
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
}

async function playMix() {
  const m = MIXES[selMix];
  // Album and mix never play at once: clearing the Bandcamp frame stops it.
  $('bcPlayer').src = 'about:blank';
  deck.dataset.mode = 'mix';
  ytStarted = true;
  placeVis();
  if (yt) {
    if (yt.getVideoData && yt.getVideoData().video_id === m.id) yt.playVideo();
    else yt.loadVideoById(m.id);
    return;
  }
  // YouTube refuses to play (error 153) without a real web origin, e.g. index.html opened from Finder.
  if (location.protocol === 'file:') {
    showVisError('YouTube won’t play from a file opened directly. Preview the site through a local server (see README) or on choongum.com.');
    return;
  }
  await loadYouTubeApi();
  yt = new YT.Player('yt', {
    videoId: m.id,
    playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, origin: location.origin },
    events: {
      onReady: (e) => e.target.playVideo(),
      onError: () => showVisError('This mix can’t play here.'),
      onStateChange: (e) => {
        setPlaying(e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.BUFFERING);
        if (e.data === YT.PlayerState.ENDED) { selectMix(selMix + 1); playMix(); }
      },
    },
  });
}

function showVisError(text) {
  ytStarted = false;
  setPlaying(false);
  placeVis();
  $('visError').hidden = false;
  $('visErrorText').textContent = text;
  $('visErrorLink').href = `https://youtu.be/${MIXES[selMix].id}`;
}

function stopMix() {
  if (yt && yt.pauseVideo) yt.pauseVideo();
  ytStarted = false;
  setPlaying(false);
  placeVis();
}

function setPlaying(on) {
  playing = on;
  deck.classList.toggle('playing', on);
  $('tpPlay').setAttribute('aria-label', on ? 'Pause' : 'Play');
}

// Keep the deck clock and progress bar in step with YouTube.
setInterval(() => {
  if (!yt || !yt.getCurrentTime || deck.dataset.mode !== 'mix') return;
  const t = yt.getCurrentTime() || 0;
  const d = yt.getDuration() || MIXES[selMix].secs;
  $('deckTime').textContent = `${fmt(t)} / ${fmt(d)}`;
  const pct = d ? (t / d) * 100 : 0;
  $('deckProgFill').style.width = `${pct}%`;
  $('deckProg').setAttribute('aria-valuenow', Math.round(pct));
}, 500);

function seekBy(frac) {
  if (!yt || !yt.getDuration) return;
  yt.seekTo(Math.max(0, Math.min(1, frac)) * yt.getDuration(), true);
}

/*
 * The YouTube iframe lives in one fixed element so it never reloads.
 * On the Mixes tab it sits exactly over the visualization screen; elsewhere it
 * shrinks to a mini window above the deck so the mix keeps playing while browsing.
 */
function placeVis() {
  if (!ytStarted) { visFloat.hidden = true; return; }
  visFloat.hidden = false;
  const st = visFloat.style;
  if (tab === 'mixes') {
    visFloat.classList.remove('mini');
    const r = visSlot.getBoundingClientRect();
    const c = content.getBoundingClientRect();
    st.left = `${r.left}px`; st.top = `${r.top}px`; st.width = `${r.width}px`; st.height = `${r.height}px`;
    st.right = st.bottom = 'auto';
    const clipTop = Math.max(0, c.top - r.top), clipBottom = Math.max(0, r.bottom - c.bottom);
    st.clipPath = `inset(${clipTop}px 0 ${clipBottom}px 0)`;
    st.visibility = clipTop + clipBottom >= r.height ? 'hidden' : 'visible';
  } else {
    visFloat.classList.add('mini');
    const w = $('win').getBoundingClientRect();
    const d = deck.getBoundingClientRect();
    st.left = st.top = 'auto'; st.width = st.height = '';
    st.right = `${Math.max(12, innerWidth - w.right + 16)}px`;
    st.bottom = `${innerHeight - d.top + 12}px`;
    st.clipPath = 'none';
    st.visibility = 'visible';
  }
}
content.addEventListener('scroll', placeVis, { passive: true });
window.addEventListener('resize', placeVis);
new ResizeObserver(placeVis).observe(visSlot);

/* ── Press ───────────────────────────────────────────── */

function renderPress() {
  $('pressList').innerHTML = PRESS.map((p) => `
    <li>
      <svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[p.icon]}</svg>
      <span class="body"><strong>${esc(p.title)}</strong><span class="mono">${esc(p.meta)}</span></span>
      ${p.href
        ? `<a class="btn btn-silver btn-sm" href="${esc(p.href)}" download>Download</a>`
        : '<span class="btn btn-silver btn-sm" aria-disabled="true">Soon</span>'}
    </li>`).join('');
}

function copyButton(btn, text) {
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text());
      btn.textContent = 'Copied!';
    } catch {
      btn.textContent = 'Press ⌘C';
    }
    setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
  });
}

// GitHub Pages has no backend, so the form opens a pre-filled email.
$('inquiry').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const subject = `Booking inquiry${f.get('event') ? ` — ${f.get('event')}` : ''}`;
  const body = [
    `Name: ${f.get('name') || ''}`,
    `Email: ${f.get('email') || ''}`,
    `Event, city & date: ${f.get('event') || ''}`,
    '',
    f.get('message') || '',
  ].join('\n');
  location.href = `mailto:choongum@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

/* ── Paintings ───────────────────────────────────────── */

let viewerWork = 0;
let viewerDetail = 0;
let viewerReturnFocus = null;

function renderPaintings() {
  $('paintCount').textContent = `${PAINTINGS.length} WORKS · TAP TO OPEN`;
  $('paintGrid').innerHTML = PAINTINGS.map((p, i) => `
    <button class="paint" type="button" data-i="${i}" aria-label="Open painting ${i + 1} of ${PAINTINGS.length}">
      <img src="paintings/thumb/${p[0]}.jpg" alt="" loading="lazy" width="300" height="300">
    </button>`).join('');
  $('paintGrid').addEventListener('click', (e) => {
    const b = e.target.closest('.paint');
    if (b) openViewer(+b.dataset.i);
  });
}

function openViewer(i) {
  viewerReturnFocus = document.activeElement;
  $('viewer').hidden = false;
  showWork(i, 0);
  $('viewerClose').focus();
}

function closeViewer() {
  $('viewer').hidden = true;
  if (viewerReturnFocus) viewerReturnFocus.focus();
}

function showWork(i, d) {
  viewerWork = (i + PAINTINGS.length) % PAINTINGS.length;
  viewerDetail = d;
  const p = PAINTINGS[viewerWork];
  $('viewerImg').src = `paintings/large/${p[d]}.jpg`;
  $('viewerImg').alt = `Painting ${viewerWork + 1}${d ? `, detail ${d}` : ''}`;
  $('viewerCount').textContent = `${String(viewerWork + 1).padStart(2, '0')} / ${PAINTINGS.length}`;
  $('viewerStrip').hidden = p.length < 2;
  $('viewerStrip').innerHTML = p.map((name, j) => `
    <button type="button" data-d="${j}" aria-current="${j === d}" aria-label="${j ? `Detail ${j}` : 'Full painting'}">
      <img src="paintings/thumb/${name}.jpg" alt="">
    </button>`).join('');
}

$('viewerStrip').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) showWork(viewerWork, +b.dataset.d);
});
$('viewerPrev').addEventListener('click', () => showWork(viewerWork - 1, 0));
$('viewerNext').addEventListener('click', () => showWork(viewerWork + 1, 0));
$('viewerClose').addEventListener('click', closeViewer);
$('viewer').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeViewer(); });
document.addEventListener('keydown', (e) => {
  if ($('viewer').hidden) return;
  if (e.key === 'Escape') closeViewer();
  if (e.key === 'ArrowLeft') showWork(viewerWork - 1, 0);
  if (e.key === 'ArrowRight') showWork(viewerWork + 1, 0);
});

/* ── Wiring ──────────────────────────────────────────── */

$('visPlay').addEventListener('click', playMix);
$('tpPlay').addEventListener('click', () => {
  if (!ytStarted) playMix();
  else if (playing) yt.pauseVideo();
  else yt.playVideo();
});
$('tpPrev').addEventListener('click', () => { selectMix(selMix - 1); playMix(); });
$('tpNext').addEventListener('click', () => { selectMix(selMix + 1); playMix(); });
$('deckAlbum').addEventListener('click', () => loadAlbumInDeck(selAlbum, true));
$('visClose').addEventListener('click', () => loadAlbumInDeck(selAlbum, false));
$('visExpand').addEventListener('click', () => { location.hash = 'mixes'; });
$('deckProg').addEventListener('click', (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  seekBy((e.clientX - r.left) / r.width);
});
$('deckProg').addEventListener('keydown', (e) => {
  if (!yt || !yt.getCurrentTime) return;
  if (e.key === 'ArrowRight') yt.seekTo(yt.getCurrentTime() + 30, true);
  if (e.key === 'ArrowLeft') yt.seekTo(Math.max(0, yt.getCurrentTime() - 30), true);
});
copyButton($('copyEmail'), () => 'choongum@gmail.com');
copyButton($('copyBio'), () => $('shortBio').textContent.trim());

renderAlbums();
renderMixes();
renderPress();
renderPaintings();
selectAlbum(0);
selectMix(0);
loadAlbumInDeck(0, false);
showTab(location.hash.slice(1));
