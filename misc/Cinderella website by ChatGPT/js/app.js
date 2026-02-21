/* Ella After Midnight — shared site JS */
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

function setActiveNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  const current = path === '' ? 'index.html' : path;
  $$('.navlink').forEach(a => {
    const href = a.getAttribute('href');
    const name = (href || '').split('/').pop();
    a.setAttribute('aria-current', name === current ? 'page' : 'false');
  });
}

function nextMidnightDate(now=new Date()){
  const d = new Date(now);
  d.setHours(24,0,0,0);
  return d;
}
function fmtHMS(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const hh = String(Math.floor(s/3600)).padStart(2,'0');
  const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
  const ss = String(s%60).padStart(2,'0');
  return `${hh}:${mm}:${ss}`;
}
function updateCountdown(){
  const now = new Date();
  const nm = nextMidnightDate(now);
  const diff = nm - now;
  const out = fmtHMS(diff);
  const top = $('#topCountdown');
  if(top) top.textContent = out;

  const cd = $('#countdown');
  if(cd) cd.textContent = out;

  const nmEl = $('#nextMidnight');
  if(nmEl) nmEl.textContent = nm.toLocaleString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

  const meta = $('#countdownMeta');
  if(meta) meta.textContent = `(${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
}

// Clock hands (story)
function updateClockHands(){
  const now = new Date();
  const sec = now.getSeconds();
  const min = now.getMinutes() + sec/60;
  const hr = (now.getHours()%12) + min/60;
  const s = $('#sHand'), m = $('#mHand'), h = $('#hHand');
  if(s) s.style.transform = `translate(-50%,-90%) rotate(${sec*6}deg)`;
  if(m) m.style.transform = `translate(-50%,-90%) rotate(${min*6}deg)`;
  if(h) h.style.transform = `translate(-50%,-90%) rotate(${hr*30}deg)`;
}

// Audio tick
let audioCtx = null;
let tickInterval = null;
function ensureAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}
function tick(){
  if(!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(900, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.07);
}
function initClockHover(){
  const clockCard = $('#clockCard');
  if(!clockCard) return;
  clockCard.addEventListener('mouseenter', () => {
    if(document.body.classList.contains('panic')) return;
    ensureAudio();
    audioCtx.resume?.();
    tick();
    tickInterval = setInterval(tick, 750);
    document.body.style.transition = 'filter .18s ease';
    document.body.style.filter = 'brightness(.92)';
  });
  clockCard.addEventListener('mouseleave', () => {
    clearInterval(tickInterval);
    tickInterval = null;
    document.body.style.filter = '';
  });
}

// Lightbox
function initLightbox(){
  const lightbox = $('#lightbox');
  if(!lightbox) return;
  const close = $('#lbClose');
  function closeLb(){ lightbox.classList.remove('open'); }
  close?.addEventListener('click', closeLb);
  lightbox.addEventListener('click', (e) => { if(e.target === lightbox) closeLb(); });
  window.addEventListener('keydown', (e) => { if(e.key==='Escape' && lightbox.classList.contains('open')) closeLb(); });
}
function openLightbox({title, caption, src}){
  const lightbox = $('#lightbox');
  if(!lightbox) return;
  $('#lbTitle').textContent = title || '—';
  $('#lbCaption').textContent = caption || '';
  const imgWrap = $('#lbImage');
  imgWrap.innerHTML = '';
  const img = new Image();
  img.alt = title || '';
  img.src = src;
  imgWrap.appendChild(img);
  lightbox.classList.add('open');
  lightbox.focus?.();
}

// Gallery
const galleryItems = [
  { id:'g1', title:'Gown: shimmer close-up', tag:'gown', src:'assets/gown-shimmer.png', caption:'I did not know you could breathe in a corset. Still not sure I did.' },
  { id:'g2', title:'Glass slipper: reflections', tag:'footwear', src:'assets/slipper-reflections.png', caption:'Beautiful. Impractical. A lawsuit waiting to happen.' },
  { id:'g3', title:'Palace: chandelier bloom', tag:'palace', src:'assets/chandelier-bloom.png', caption:'Everything is either glittering or judging you. Sometimes both.' },
  { id:'g4', title:'Midnight: clock anxiety', tag:'midnight', src:'assets/clock-anxiety.png', caption:'11:59 energy, served neat, no ice.' },
  { id:'g5', title:'Palace: ballroom sweep', tag:'palace', src:'assets/ballroom-sweep.png', caption:'I swear it was real. The echo in here agrees with me.' },
  { id:'g6', title:'Gown: hem + starlight', tag:'gown', src:'assets/hem-starlight.png', caption:'Sewing dreams into seams. Then pretending it’s normal.' },
  { id:'g7', title:'Footwear: the other shoe', tag:'footwear', src:'assets/other-shoe.png', caption:'If you find this shoe, no you didn’t.' },
  { id:'g8', title:'Midnight: carriage fade', tag:'midnight', src:'assets/carriage-fade.png', caption:'Pumpkin coach was a vibe until it wasn’t.' },
  { id:'g9', title:'Gown: silhouette', tag:'gown', src:'assets/gown-silhouette.png', caption:'Apparently I have a “royal silhouette.” I have chores. Same thing.' },
];

function renderGallery(filter='all'){
  const grid = $('#galleryGrid');
  if(!grid) return;
  grid.innerHTML = '';
  const items = galleryItems.filter(it => filter==='all' ? true : it.tag===filter);
  items.forEach(it => {
    const div = document.createElement('div');
    div.className = 'tile';
    div.tabIndex = 0;
    div.setAttribute('role','button');
    div.setAttribute('aria-label', `${it.title}. Open image viewer.`);
    div.innerHTML = `
      <img src="${it.src}" alt="${it.title}" loading="lazy" />
      <div class="label">${it.title}</div>
      <div class="tag">${it.tag}</div>
    `;
    div.addEventListener('click', () => openLightbox(it));
    div.addEventListener('keydown', (e) => { if(e.key==='Enter' || e.key===' ') { e.preventDefault(); openLightbox(it); } });
    grid.appendChild(div);
  });
}

function initGalleryFilters(){
  const chips = $$('.chip');
  if(!chips.length) return;
  chips.forEach(ch => {
    ch.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      ch.classList.add('active');
      renderGallery(ch.dataset.filter);
    });
  });
  renderGallery('all');
}

// Before/After slider
function setBA(percent){
  const p = Math.min(100, Math.max(0, percent));
  const divider = $('#baDivider');
  const handle = $('#baHandle');
  const after = $('#baAfter');
  if(divider) divider.style.left = p + '%';
  if(handle) handle.style.left = p + '%';
  if(after) after.style.clipPath = `inset(0 0 0 ${p}%)`;
}
function initBeforeAfter(){
  const before = $('#baBefore');
  const after = $('#baAfter');
  const range = $('#baRange');
  if(!before || !after || !range) return;
  before.innerHTML = `<img src="assets/before-chores.png" alt="Before: chores mode" />`;
  after.innerHTML = `<img src="assets/after-gown.png" alt="After: gown + deadline" />`;
  setBA(Number(range.value || 50));
  range.addEventListener('input', (e) => setBA(Number(e.target.value)));
}

// Claim form
function initClaimForm(){
  const f = $('#claimForm');
  if(!f) return;
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = ($('#name')?.value || '').trim() || 'Anonymous';
    const proof = ($('#proof')?.value || '').trim();
    const out = $('#claimResult');
    if(!proof || proof.length < 10){
      if(out) out.textContent = 'Need a bit more proof. Try again.';
      return;
    }
    if(out) out.textContent = `Logged, ${name}. If a royal messenger appears, I deny everything.`;
    f.reset();
  });
}

// Sparkles + easter egg
function initSparkles(){
  const layer = $('#sparkleLayer');
  if(!layer) return;

  function spawnSparkle(x,y){
    if(document.body.classList.contains('panic')) return;
    const s = document.createElement('div');
    s.className = 'sparkle';
    const size = 10 + Math.random()*16;
    const rot = Math.random()*360;
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="rgba(255,255,255,.9)" d="M12 1.8l1.6 6.1 6.1 1.6-6.1 1.6L12 17.2l-1.6-6.1-6.1-1.6 6.1-1.6L12 1.8z"/>
      </svg>
    `;
    layer.appendChild(s);
    const dx = (Math.random()-0.5)*220;
    const dy = (Math.random()-0.7)*220;
    const dur = 700 + Math.random()*600;
    s.animate([
      { opacity: 0, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(.7)` },
      { opacity: 1, transform: `translate(calc(-50% + ${dx*.35}px), calc(-50% + ${dy*.35}px)) rotate(${rot+80}deg) scale(1)` , offset: 0.25 },
      { opacity: 0, transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot+220}deg) scale(.6)` }
    ], { duration: dur, easing: 'cubic-bezier(.2,.8,.2,1)' });
    setTimeout(() => s.remove(), dur + 50);
  }

  window.addEventListener('pointerdown', (e) => spawnSparkle(e.clientX, e.clientY));

  // Easter egg
  const egg = 'bibbidibobbidi';
  let buffer = '';
  function setWandCursor(on){
    if(on){
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <rect x="6" y="20" width="22" height="3" rx="1.5" fill="white" transform="rotate(-35 6 20)" opacity="0.9"/>
          <circle cx="9" cy="9" r="4" fill="white" opacity="0.9"/>
          <path d="M9 2 L10.5 6 L15 7.5 L10.5 9 L9 13 L7.5 9 L3 7.5 L7.5 6 Z" fill="white" opacity="0.9"/>
        </svg>
      `.trim();
      document.body.style.cursor = `url('data:image/svg+xml,${encodeURIComponent(svg)}') 6 6, auto`;
    } else {
      document.body.style.cursor = '';
    }
  }
  function sparkleBurst(){
    if(document.body.classList.contains('panic')) return;
    const cx = Math.round(window.innerWidth * 0.5);
    const cy = Math.round(window.innerHeight * 0.28);
    for(let i=0;i<28;i++) spawnSparkle(cx + (Math.random()-0.5)*40, cy + (Math.random()-0.5)*40);
    ensureAudio(); audioCtx.resume?.();
    const t = audioCtx.currentTime;
    [880, 1175, 1568].forEach((f, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + idx*0.02);
      gain.gain.setValueAtTime(0.0001, t + idx*0.02);
      gain.gain.exponentialRampToValueAtTime(0.08, t + idx*0.02 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx*0.02 + 0.20);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t + idx*0.02);
      osc.stop(t + idx*0.02 + 0.22);
    });
    setWandCursor(true);
    setTimeout(() => setWandCursor(false), 6500);
  }
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if(tag === 'input' || tag === 'textarea') return;
    buffer = (buffer + e.key.toLowerCase()).slice(-egg.length);
    if(buffer === egg){
      sparkleBurst();
      buffer = '';
    }
  });
}

// Panic mode
function initPanicMode(){
  const btn = $('#panicBtn');
  if(!btn) return;
  btn.addEventListener('click', () => {
    const on = !document.body.classList.contains('panic');
    document.body.classList.toggle('panic', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Panic mode: ON' : 'Panic mode';
    if(on){
      clearInterval(tickInterval);
      tickInterval = null;
      document.body.style.filter = '';
    }
  });
}

function initPhotoStrip(){
  $$('.thumb').forEach(t => {
    const title = t.dataset.open || 'Photo';
    const src = t.dataset.src || t.querySelector('img')?.getAttribute('src');
    const item = { title, caption: 'One of the receipts. Also: yes, I was there.', src };
    t.tabIndex = 0;
    t.setAttribute('role','button');
    t.setAttribute('aria-label', `${title}. Open image viewer.`);
    t.addEventListener('click', () => openLightbox(item));
    t.addEventListener('keydown', (e) => { if(e.key==='Enter' || e.key===' ') { e.preventDefault(); openLightbox(item); } });
  });
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  updateCountdown();
  updateClockHands();
  setInterval(() => { updateCountdown(); updateClockHands(); }, 250);

  initPanicMode();
  initClockHover();
  initLightbox();
  initSparkles();

  initGalleryFilters();
  initBeforeAfter();
  initClaimForm();
  initPhotoStrip();
});