import { categories, workItems } from './portfolio.js';

document.documentElement.classList.add('js');

const grid = document.querySelector('#work-grid');
const filters = document.querySelector('#category-filters');
const searchInput = document.querySelector('#gallery-search');
const resultLabel = document.querySelector('#gallery-result');
const liveRegion = document.querySelector('#site-live');
let activeCategory = 'all';
let searchTerm = '';

const countFor = (key) => key === 'all' ? workItems.length : workItems.filter((item) => item.category === key).length;

function renderFilters() {
  filters.innerHTML = categories.map((category) => `
    <button class="filter-button" type="button" data-category="${category.key}" aria-pressed="${activeCategory === category.key}">
      ${category.label}<span class="filter-count">${countFor(category.key)}</span>
    </button>
  `).join('');
}

function workCover(item) {
  if (item.type === 'image') {
    return `<div class="work-card-media image-media">
      <button class="image-open" type="button" data-image-id="${item.id}" aria-label="تكبير الصورة: ${item.title}">
        <img src="${item.src}" alt="${item.alt}" loading="lazy" decoding="async" />
      </button><span class="image-hint" aria-hidden="true">اضغط للتكبير</span>
    </div>`;
  }
  if (item.type === 'audio') {
    return `<div class="work-card-media audio-cover" aria-hidden="true"><div class="audio-disc"><span>〰</span></div></div>`;
  }
  const glyph = item.type === 'video' ? '▶' : item.type === 'pdf' ? 'PDF' : item.type === 'presentation' ? 'P' : 'W';
  return `<div class="work-card-media"><div class="file-cover">
    <span class="file-cover-label">${item.folder}</span>
    <span class="file-cover-icon" aria-hidden="true">${glyph}</span>
    <span class="file-cover-name" dir="auto">${item.source || item.title}</span>
  </div></div>`;
}

function workCard(item) {
  const audio = item.type === 'audio' ? `<audio controls preload="none" controlslist="nodownload" aria-label="تشغيل ${item.title}"><source src="${item.src}" type="audio/mpeg" />المتصفح لا يدعم تشغيل الصوت.</audio>` : '';
  const linkLabel = item.type === 'image' ? 'فتح الصورة الأصلية في Drive' : item.type === 'video' ? 'فتح الفيديو في Drive' : item.type === 'audio' ? 'عرض الملف في Drive' : 'فتح الملف في Drive';
  const source = item.source ? `<p class="file-source" dir="auto">${item.source}</p>` : '';
  return `<article class="work-card" data-work-id="${item.id}">
    ${workCover(item)}
    <div class="work-card-body">
      <div class="work-card-meta"><span class="folder-tag">${item.folder}</span><span class="file-kind">${item.kind}</span></div>
      <h3>${item.title}</h3>
      <p class="work-card-description">${item.description}</p>
      ${source}
      ${audio}
      <a class="drive-link" href="${item.href}" target="_blank" rel="noopener noreferrer"><span>${linkLabel}</span><span aria-hidden="true">↗</span></a>
    </div>
  </article>`;
}

function visibleItems() {
  const query = searchTerm.trim().toLocaleLowerCase('ar');
  return workItems.filter((item) => {
    const inCategory = activeCategory === 'all' || item.category === activeCategory;
    const haystack = `${item.title} ${item.description} ${item.source || ''} ${item.folder}`.toLocaleLowerCase('ar');
    return inCategory && (!query || haystack.includes(query));
  });
}

function renderGallery(announce = false) {
  const items = visibleItems();
  grid.innerHTML = items.length
    ? items.map(workCard).join('')
    : '<div class="work-card-empty">لا توجد أعمال مطابقة. جرّب عبارة بحث أخرى أو اختر قسمًا مختلفًا.</div>';
  resultLabel.textContent = `عرض ${items.length} من ${workItems.length} عملًا`;
  if (announce) liveRegion.textContent = `تم عرض ${items.length} من الأعمال`;
  renderFilters();
}

filters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  activeCategory = button.dataset.category;
  renderGallery(true);
  playClickTone();
});

searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value;
  renderGallery();
});

const menuToggle = document.querySelector('#menu-toggle');
const mainNav = document.querySelector('#main-nav');
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'إغلاق قائمة التنقل' : 'فتح قائمة التنقل');
  mainNav.classList.toggle('is-open', open);
});
mainNav.addEventListener('click', (event) => {
  if (!event.target.closest('a')) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'فتح قائمة التنقل');
  mainNav.classList.remove('is-open');
});

let soundEnabled = false;
let audioContext;
const soundToggle = document.querySelector('#sound-toggle');
const soundLabel = document.querySelector('#sound-label');
const demoButton = document.querySelector('#demo-tone');

function ensureAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playSoftTone(force = false) {
  if (!force && !soundEnabled) return;
  const context = ensureAudioContext();
  if (!context) {
    liveRegion.textContent = 'لا يدعم هذا المتصفح المؤثرات الصوتية.';
    return;
  }
  const startAt = context.currentTime + .02;
  [392, 523.25].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startAt + index * .12);
    gain.gain.setValueAtTime(.0001, startAt + index * .12);
    gain.gain.exponentialRampToValueAtTime(index === 0 ? .017 : .012, startAt + index * .12 + .035);
    gain.gain.exponentialRampToValueAtTime(.0001, startAt + index * .12 + .38);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt + index * .12);
    oscillator.stop(startAt + index * .12 + .4);
  });
}

function syncSoundControl() {
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  soundToggle.setAttribute('aria-label', soundEnabled ? 'كتم المؤثرات الصوتية الاختيارية' : 'تفعيل المؤثرات الصوتية الاختيارية');
  soundLabel.textContent = soundEnabled ? 'الصوت مفعّل' : 'الصوت متوقف';
}

soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  syncSoundControl();
  if (soundEnabled) playSoftTone(true);
  liveRegion.textContent = soundEnabled ? 'تم تفعيل المؤثرات الصوتية الاختيارية.' : 'تم كتم المؤثرات الصوتية.';
});
demoButton.addEventListener('click', () => {
  playSoftTone(true);
  liveRegion.textContent = 'تم تشغيل نغمة قصيرة هادئة مرة واحدة.';
});

function playClickTone() { if (soundEnabled) playSoftTone(); }

let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motionToggle = document.querySelector('#motion-toggle');
const motionLabel = document.querySelector('#motion-label');
function syncMotionControl() {
  document.body.classList.toggle('reduce-motion', reducedMotion);
  motionToggle.setAttribute('aria-pressed', String(reducedMotion));
  motionToggle.setAttribute('aria-label', reducedMotion ? 'السماح بالحركة المعتدلة' : 'تقليل الحركة في الصفحة');
  motionLabel.textContent = reducedMotion ? 'الحركة منخفضة' : 'تقليل الحركة';
}
motionToggle.addEventListener('click', () => {
  reducedMotion = !reducedMotion;
  syncMotionControl();
  liveRegion.textContent = reducedMotion ? 'تم تقليل الحركة.' : 'تمت استعادة الحركة المعتدلة.';
  playClickTone();
});
syncMotionControl();

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reducedMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .1 });
  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

const dialog = document.querySelector('#image-dialog');
const dialogImage = document.querySelector('#dialog-image');
const dialogTitle = document.querySelector('#dialog-title');
const dialogLink = document.querySelector('#dialog-drive-link');
const dialogCount = document.querySelector('#dialog-count');
const imageItems = workItems.filter((item) => item.type === 'image');
let currentImageIndex = 0;
let returnFocusTo = null;

function openImage(id, trigger) {
  currentImageIndex = Math.max(0, imageItems.findIndex((item) => item.id === id));
  returnFocusTo = trigger;
  updateDialogImage();
  dialog.showModal();
  playClickTone();
}
function updateDialogImage() {
  const item = imageItems[currentImageIndex];
  dialogImage.src = item.src;
  dialogImage.alt = item.alt;
  dialogTitle.textContent = item.title;
  dialogLink.href = item.href;
  dialogCount.textContent = `${currentImageIndex + 1} / ${imageItems.length}`;
}
function moveDialog(step) {
  currentImageIndex = (currentImageIndex + step + imageItems.length) % imageItems.length;
  updateDialogImage();
  playClickTone();
}
grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-image-id]');
  if (button) openImage(button.dataset.imageId, button);
});
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#dialog-prev').addEventListener('click', () => moveDialog(-1));
document.querySelector('#dialog-next').addEventListener('click', () => moveDialog(1));
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  if (returnFocusTo?.isConnected) returnFocusTo.focus();
  returnFocusTo = null;
  playClickTone();
});
dialog.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveDialog(1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); moveDialog(-1); }
});

renderGallery();
