/* ===== Helpers ===== */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* ===== Sticky + Active Nav + Smooth Scroll ===== */
const header    = $('.site-header');
const nav       = $('#primary-nav');
const navLinks  = $$('.nav-link');
const navToggle = $('.nav-toggle');

/* Dynamic header offset -> used by CSS (scroll-margin-top) and by probe logic */
function applyHeaderOffset() {
  const h = header?.offsetHeight || 0;
  const cushion = 12; // small visual breathing room
  document.documentElement.style.setProperty('--header-offset', `${h + cushion}px`);
}
applyHeaderOffset();
window.addEventListener('resize', applyHeaderOffset);

/* Mobile nav toggle */
navToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

/* Build section list from nav hrefs (#ids) */
const sectionIds = navLinks
  .map(a => a.getAttribute('href'))
  .filter(href => href && href.startsWith('#'));
const sections = sectionIds.map(id => $(id)).filter(Boolean);

function setActiveLinkById(currentId) {
  navLinks.forEach(a => {
    const match = a.getAttribute('href') === currentId;
    a.classList.toggle('active', !!match);
    a.setAttribute('aria-current', match ? 'location' : 'false');
  });
}

function computeCurrentSectionId() {
  const probe = (header?.offsetHeight || 0) + 12;
  for (const sec of sections) {
    const r = sec.getBoundingClientRect();
    if (r.top <= probe && r.bottom >= probe) {
      return `#${sec.id}`;
    }
  }
  return null;
}

function onScroll() {
  // Sticky state visual
  header.classList.toggle('is-sticky', window.scrollY > 10);

  // Back-to-top visibility
  const backBtn = $('#backToTop');
  if (backBtn) backBtn.classList.toggle('visible', window.scrollY > 320);

  // Active section highlight
  const currentId = computeCurrentSectionId();
  setActiveLinkById(currentId);
}

function onResize() {
  setActiveLinkById(computeCurrentSectionId());
}

document.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('load', () => {
  onScroll();
  if (location.hash) setActiveLinkById(location.hash);
});
window.addEventListener('resize', onResize);

/* Smooth scroll for nav links (and close mobile) */
navLinks.forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id || !id.startsWith('#')) return;
    e.preventDefault();
    const target = $(id);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Close mobile nav
    nav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');

    // Update URL hash
    history.pushState(null, '', id);
  });
});

/* ===== Sticky Fallback: convert to fixed if sticky fails in this context ===== */
const sentinel = $('#sticky-sentinel');
if (sentinel) {
  const obs = new IntersectionObserver(
    ([entry]) => {
      // When the sentinel scrolls out of view, ensure header is fixed
      header.classList.toggle('is-fixed', !entry.isIntersecting);
      // Add padding-top to avoid layout jump when fixed
      if (header.classList.contains('is-fixed')) {
        document.body.style.paddingTop = `${header.offsetHeight}px`;
      } else {
        document.body.style.paddingTop = '';
      }
    },
    { rootMargin: '-1px 0px 0px 0px', threshold: 0 }
  );
  obs.observe(sentinel);
}

/* ===== Dynamic greeting ===== */
const greetings = [
  "👋 Hey there! Thanks for stopping by.",
  "🚀 Ready to build something great together?",
  "💡 Turning ideas into delightful experiences."
];
const greetingEl = $('#dynamic-greeting');
if (greetingEl) greetingEl.textContent = greetings[Math.floor(Math.random() * greetings.length)];

/* ===== Experience: slide-in animation on scroll ===== */
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.2 });
$$('[data-io]').forEach(el => io.observe(el));

/* ===== Responsibilities: custom tooltips ===== */
let tooltipEl = null;
function showTooltip(e, text) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    document.body.appendChild(tooltipEl);
  }
  tooltipEl.textContent = text;
  tooltipEl.style.left = `${e.clientX}px`;
  tooltipEl.style.top  = `${e.clientY - 12}px`;
  tooltipEl.style.display = 'block';
}
function hideTooltip() { if (tooltipEl) tooltipEl.style.display = 'none'; }
$$('.has-tip').forEach(el => {
  el.addEventListener('mouseenter', (e) => showTooltip(e, el.dataset.tip || ''));
  el.addEventListener('mousemove',  (e) => showTooltip(e, el.dataset.tip || ''));
  el.addEventListener('mouseleave', hideTooltip);
});

/* ===== Education: sort by GPA ===== */
const sortBtn = $('#sortGPA');
let gpaAsc = false;
sortBtn?.addEventListener('click', () => {
  const tbody = $('#eduBody');
  const rows  = $$('#eduBody tr');
  rows.sort((a, b) => {
    const g1 = parseFloat($('[data-gpa]', a).dataset.gpa);
    const g2 = parseFloat($('[data-gpa]', b).dataset.gpa);
    return gpaAsc ? g1 - g2 : g2 - g1;
  });
  rows.forEach(r => tbody.appendChild(r));
  gpaAsc = !gpaAsc;
  sortBtn.textContent = gpaAsc ? 'Sort by GPA (Low → High)' : 'Sort by GPA (High → Low)';
});

/* ===== Skills: animate progress/meter on load + filter by level ===== */
function animateSkill(el){
  const target = Number(el.dataset.target || el.getAttribute('value') || 0);
  const step   = Math.max(1, Math.round(target / 40));
  let curr = 0;
  const id = setInterval(() => {
    curr += step;
    if (curr >= target) { curr = target; clearInterval(id); }
    el.value = curr;
    const valueEl = el.closest('.skill')?.querySelector('.skill-value');
    if (valueEl) valueEl.textContent = `${curr}%`;
  }, 15);
}
window.addEventListener('load', () => {
  $$('progress, meter').forEach(animateSkill);
});

const skillChips = $$('.skills-toggle .chip');
skillChips.forEach(chip => {
  chip.addEventListener('click', () => {
    skillChips.forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    const level = chip.dataset.skillLevel;
    $$('.skill-group').forEach(group => {
      if (level === 'all' || group.dataset.level === level) {
        group.style.display = '';
      } else {
        group.style.display = 'none';
      }
    });
  });
});

/* ===== Projects: filter by technology + flip on click/keyboard ===== */
const techChips = $$('.project-filters .chip');
const projects  = $$('.project');
techChips.forEach(chip => {
  chip.addEventListener('click', () => {
    techChips.forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    const tech = chip.dataset.tech;
    projects.forEach(p => {
      const tags = (p.dataset.tech || '').split(/\s+/);
      p.style.display = (tech === 'all' || tags.includes(tech)) ? '' : 'none';
    });
  });
});

$$('.flip-card').forEach(card => {
  card.setAttribute('tabindex', '0');
  card.addEventListener('click', () => card.classList.toggle('is-flipped'));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.classList.toggle('is-flipped');
    }
  });
});

/* ===== Interests: modal popup ===== */
const modal      = $('#modal');
const modalTitle = $('#modal-title');
const modalImg   = $('#modal-img');
const modalText  = $('#modal-text');

$$('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    modalTitle.textContent = item.dataset.modalTitle || '';
    modalText.textContent  = item.dataset.modalText  || '';
    modalImg.src           = item.dataset.modalImg   || '';
    modalImg.alt           = item.dataset.modalTitle || '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  });
});

$$('[data-close]').forEach(el => {
  el.addEventListener('click', () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('open')) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
});

/* ===== Back to top ===== */
$('#backToTop')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ===== Theme switcher with localStorage (with smooth CSS transitions across surfaces) ===== */
const THEME_KEY = 'resume-theme';
const themeBtn  = $('#themeToggle');

function setTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  themeBtn?.setAttribute('aria-pressed', String(theme === 'dark'));
}

(function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  setTheme(saved || (prefersDark ? 'dark' : 'light'));
})();

themeBtn?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'light' ? 'dark' : 'light');
});

/* ===== Footer fade-in when visible ===== */
const footer = $('.site-footer');
if (footer) {
  const footIO = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) footer.classList.add('visible'); }),
    { threshold: 0.15 }
  );
  footIO.observe(footer);
}
