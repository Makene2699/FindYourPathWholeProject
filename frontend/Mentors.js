/* =====================================================
   FindYourPath — Mentors.js
   Loads mentors from Supabase, falls back to sample data
   if the database can't be reached.
   ===================================================== */

/* ---------- CONFIG: match these to your Supabase tables ---------- */
// Mentors are the people who registered with role = mentor
const MENTORS_TABLE = 'mentors_public';   // public view over profiles (role = mentor), created in the SQL Editor
const MENTOR_ROLE_COLUMN = 'role';        // column that says who is a mentor
const MENTOR_ROLE_VALUE = '';             // empty because the view already only contains mentors
const MENTOR_COLUMNS = 'id, full_name, job_title, company, location, avatar_url, banner_url, career_field, education, studied_at';  // columns of the mentors_public view
const FOLLOWS_TABLE = 'mentor_follows';   // columns: user_id, mentor_id
/* ------------------------------------------------------------------ */

// Use whatever client supabaseClient.js created
const db =
  window.sb ||
  window.supabaseClient ||
  window.db ||
  (typeof supabase !== 'undefined' && typeof supabase.from === 'function' ? supabase : null);

const SAMPLE_MENTORS = [
  { id: 1, name: 'Mduduzi Zwane', role: 'Manager | First National Bank', location: 'Johannesburg', img: 'https://randomuser.me/api/portraits/men/32.jpg', cover: 'https://picsum.photos/id/88/400/150' },
  { id: 2, name: 'Aron Smith', role: 'HR Employee | Luno', location: 'Cape Town', img: 'https://randomuser.me/api/portraits/men/45.jpg', cover: 'https://picsum.photos/id/26/400/150' },
  { id: 3, name: 'Asiphe Dosi', role: 'Lecturer | University of KwaZulu-Natal', location: 'Durban', img: 'https://randomuser.me/api/portraits/women/50.jpg', cover: 'https://picsum.photos/id/20/400/150' },
  { id: 4, name: 'Jessica Motaung', role: 'Assistant Coach | University of the Western Cape', location: 'Cape Town', img: 'https://randomuser.me/api/portraits/women/65.jpg', cover: 'https://picsum.photos/id/133/400/150' },
  { id: 5, name: 'Klyan Shane', role: 'Software Developer', location: 'Durban', img: 'https://randomuser.me/api/portraits/men/75.jpg', cover: 'https://picsum.photos/id/106/400/150' },
  { id: 6, name: 'Angelo Author', role: 'Fashion Designer', location: 'Port Elizabeth', img: 'https://randomuser.me/api/portraits/women/22.jpg', cover: 'https://picsum.photos/id/36/400/150' }
];

const state = {
  mentors: [],
  followed: new Set(),   // mentor ids
  user: null,
  filter: 'all',
  search: '',
  location: '',
  demo: false
};

const $ = (id) => document.getElementById(id);
const grid = $('mentorsGrid');

/* ---------- helpers ---------- */

// Escape text before it goes into innerHTML (stops injected HTML/scripts from database content)
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Only allow http(s) image URLs
function safeUrl(url, fallback) {
  if (!url) return fallback;
  try {
    const u = new URL(url, location.href);
    return ['http:', 'https:'].includes(u.protocol) ? u.href : fallback;
  } catch { return fallback; }
}

// Initials avatar drawn locally (no external service, never breaks)
function avatarFor(name) {
  const letters = (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='156' height='156'><rect width='100%' height='100%' fill='#e8f5e9'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Arial,sans-serif' font-size='60' font-weight='700' fill='#2e7d32'>${esc(letters)}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Background pictures used on the cards (same ones the booking page picks from).
// Add every image file name from your booking page here, e.g. 'image 3.png'.
// Each mentor always gets the same one (chosen from their id), so it doesn't change on refresh.
const COVER_IMAGES = ['image 3.png', 'image 6.png', 'image 7.png'];

// Default cover when a mentor has none: a brand-coloured gradient picked from their name
const COVER_GRADIENTS = [
  ['#c0e0c8', '#b8d4e3'], ['#b8d4e3', '#c9d6f2'], ['#d4e8c2', '#a8d5ba'], ['#c9d6f2', '#c0e0c8'], ['#a8d5ba', '#b8d4e3']
];
function defaultCover(name) {
  const hash = [...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [c1, c2] = COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
  return `linear-gradient(130deg, ${c1}, ${c2})`;
}

function initials(name) {
  return encodeURIComponent((name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase());
}

// Accept different column names so small schema differences don't break the page
function normalise(row) {
  const name = row.name || row.full_name || 'Unnamed mentor';
  return {
    id: row.id,
    name,
    role: [row.job_title || row.title, row.company].filter(Boolean).join(' | ') || 'Mentor',
    location: row.location || row.city || '',
    field: row.career_field || '',                                        // what they mentor in
    studied: [row.education, row.studied_at].filter(Boolean).join(' · '), // what / where they studied
    img: safeUrl(row.img || row.avatar_url || row.image_url || row.photo, '') || avatarFor(name),
    fallback: avatarFor(name),
    cover: safeUrl(row.cover || row.banner_url || row.cover_url || row.cover_image, '')
  };
}

function showToast(message, isError = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (isError ? ' error' : '');
  t.setAttribute('role', 'status');
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

/* ---------- data ---------- */

async function loadUser() {
  // The register/login pages save the signed-in user in localStorage as "careerUser"
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('careerUser') || 'null'); } catch { /* ignore */ }
  if (!saved) { window.location.href = 'Register.html'; return; }

  const fullName = saved.fullname || 'Student';
  const fallbackAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName) + '&background=e2e8f0&color=64748b';
  $('profileName').textContent = fullName;
  $('profileRole').textContent = saved.role || 'Student';
  $('profileImg').src = saved.avatar ? safeUrl(saved.avatar, fallbackAvatar) : fallbackAvatar;

  // Supabase user is used to save follows in the database
  if (db && db.auth) {
    try {
      const { data } = await db.auth.getUser();
      state.user = data?.user || null;
    } catch (e) { console.warn('Could not load user', e); }
  }
}

async function loadMentors() {
  grid.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  $('demoBanner').hidden = true;
  state.demo = false;

  if (!db) {
    useSampleData('Supabase client not found. Check that supabaseClient.js loads before Mentors.js.');
    return;
  }

  try {
    let query = db.from(MENTORS_TABLE).select(MENTOR_COLUMNS);
    if (MENTOR_ROLE_VALUE) query = query.ilike(MENTOR_ROLE_COLUMN, MENTOR_ROLE_VALUE);
    const { data, error } = await query.order('full_name', { ascending: true });
    if (error) throw error;
    state.mentors = (data || []).map(normalise);
  } catch (e) {
    console.error('Mentor load failed', e);
    useSampleData('Could not load mentors from the database (see the browser console, F12, for the reason). Showing sample mentors instead.');
    return;
  }

  await loadFollows();
  buildLocationFilter();
  render();
}

function useSampleData(reason) {
  state.demo = true;
  state.mentors = SAMPLE_MENTORS.map(normalise);
  const banner = $('demoBanner');
  banner.textContent = reason;
  banner.hidden = false;
  loadFollows().then(() => { buildLocationFilter(); render(); });
}

async function loadFollows() {
  state.followed = new Set();
  // Logged in + real data: follows live in Supabase
  if (db && state.user && !state.demo) {
    try {
      const { data, error } = await db.from(FOLLOWS_TABLE).select('mentor_id').eq('user_id', state.user.id);
      if (error) throw error;
      (data || []).forEach((r) => state.followed.add(r.mentor_id));
      return;
    } catch (e) { console.warn('Could not load follows, using local copy', e); }
  }
  // Otherwise keep them in this browser
  try { JSON.parse(localStorage.getItem('following') || '[]').forEach((id) => state.followed.add(id)); } catch { /* ignore */ }
}

function saveFollowLocally(id, wasFollowing) {
  const next = new Set(state.followed);
  wasFollowing ? next.delete(id) : next.add(id);
  localStorage.setItem('following', JSON.stringify([...next]));
}

async function toggleFollow(id, button) {
  const mentor = state.mentors.find((m) => String(m.id) === String(id));
  if (!mentor) return;
  const wasFollowing = state.followed.has(id);
  button.disabled = true;

  let savedInDb = false;
  if (db && state.user && !state.demo) {
    try {
      const q = wasFollowing
        ? db.from(FOLLOWS_TABLE).delete().eq('user_id', state.user.id).eq('mentor_id', id)
        : db.from(FOLLOWS_TABLE).insert({ user_id: state.user.id, mentor_id: id });
      const { error } = await q;
      if (error) throw error;
      savedInDb = true;
    } catch (e) {
      console.warn('Could not save follow in Supabase (is the mentor_follows table created?). Saving on this device instead.', e);
    }
  }
  if (!savedInDb) {
    try { saveFollowLocally(id, wasFollowing); } catch (e) { console.warn(e); }
  }

  wasFollowing ? state.followed.delete(id) : state.followed.add(id);
  showToast(wasFollowing ? `Unfollowed ${mentor.name}` : `Following ${mentor.name} ✅`, wasFollowing);
  render();
  if (modalOpenId === id) openModal(id);
}

/* ---------- rendering ---------- */

function buildLocationFilter() {
  const select = $('locationFilter');
  const locations = [...new Set(state.mentors.map((m) => m.location).filter(Boolean))].sort();
  select.innerHTML = '<option value="">All locations</option>' +
    locations.map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join('');
  select.value = state.location;
}

function visibleMentors() {
  const q = state.search.trim().toLowerCase();
  return state.mentors.filter((m) =>
    (state.filter === 'all' || state.followed.has(m.id)) &&
    (!state.location || m.location === state.location) &&
    (!q || [m.name, m.role, m.location, m.field, m.studied].some((t) => t.toLowerCase().includes(q)))
  );
}

// "Studied" and "Mentors in" lines (only shown when the mentor has filled them in)
function metaLines(m) {
  let html = '';
  if (m.studied) html += `<div class="card-meta" title="${esc(m.studied)}"><i class="fas fa-graduation-cap"></i><span><b>Studied:</b> ${esc(m.studied)}</span></div>`;
  if (m.field) html += `<div class="card-meta"><i class="fas fa-bullseye"></i><span><b>Mentors in:</b> ${esc(m.field)}</span></div>`;
  return html ? `<div class="card-meta-wrap">${html}</div>` : '';
}

function followButton(m) {
  const on = state.followed.has(m.id);
  return `<button class="follow-button ${on ? 'following' : ''}" data-id="${esc(m.id)}" type="button" aria-pressed="${on}">${on ? 'Following ✓' : 'Follow'}</button>`;
}

function coverStyle(m) {
  const gradient = defaultCover(m.name);   // shows if the picture is missing or fails to load
  const file = m.cover || (COVER_IMAGES.length ? encodeURI(COVER_IMAGES[hashOf(m.id) % COVER_IMAGES.length]) : '');
  const bg = file ? `url('${esc(file)}'), ${gradient}` : gradient;
  return ` style="background-image:${bg}"`;
}

// <img> that swaps to the initials avatar if the picture fails to load
function avatarImg(m, lazy) {
  return `<img src="${esc(m.img)}" alt="" ${lazy ? 'loading="lazy" ' : ''}data-fallback="${esc(m.fallback)}" onerror="this.onerror=null;this.src=this.dataset.fallback">`;
}

function render() {
  const count = state.followed.size;
  $('followingTab').textContent = count ? `Following (${count})` : 'Following';

  const list = visibleMentors();
  $('resultCount').textContent = list.length ? `${list.length} mentor${list.length === 1 ? '' : 's'}` : '';

  if (!list.length) {
    const emptyFollowing = state.filter === 'following' && !state.search && !state.location;
    grid.innerHTML = `<div class="state-box"><i class="fas fa-user-friends"></i>
      <p>${emptyFollowing ? "You're not following anyone yet" : 'No mentors found'}</p>
      <p class="sub">${emptyFollowing ? 'Switch to All and follow a mentor to see them here.' : 'Try a different search or location.'}</p></div>`;
    return;
  }

  grid.innerHTML = list.map((m) => `
    <div class="card" data-mentor-id="${esc(m.id)}" tabindex="0" role="button" aria-label="View ${esc(m.name)}'s profile">
      <div class="card-cover"${coverStyle(m)}></div>
      <div class="avatar-wrapper">${avatarImg(m, true)}</div>
      <div class="card-info">
        <h3>${esc(m.name)}</h3>
        <div class="job-title">${esc(m.role)}</div>
        ${metaLines(m)}
        ${m.location ? `<div class="card-location"><i class="fas fa-location-dot"></i>${esc(m.location)}</div>` : ''}
        ${followButton(m)}
      </div>
    </div>`).join('');
}

function showLoadError() {
  grid.innerHTML = `<div class="state-box error"><i class="fas fa-triangle-exclamation"></i>
    <p>We couldn't load mentors</p><button class="retry-btn" id="retryBtn" type="button">Try again</button></div>`;
  $('retryBtn').addEventListener('click', loadMentors);
}

/* ---------- modal ---------- */

let modalOpenId = null;

function openModal(id) {
  const m = state.mentors.find((x) => String(x.id) === String(id));
  if (!m) return;
  modalOpenId = m.id;
  $('modalBody').innerHTML = `
    <button class="modal-close" id="modalClose" type="button" aria-label="Close">✕</button>
    <div class="card-cover"${coverStyle(m)}></div>
    <div class="avatar-wrapper">${avatarImg(m, false)}</div>
    <div class="card-info">
      <h3 id="modalName">${esc(m.name)}</h3>
      <div class="job-title">${esc(m.role)}</div>
      ${metaLines(m)}
      ${m.location ? `<div class="card-location"><i class="fas fa-location-dot"></i>${esc(m.location)}</div>` : ''}
      <div class="modal-actions">
        ${followButton(m)}
        <button class="book-button" id="bookBtn" type="button">Book a session</button>
      </div>
    </div>`;
  $('modalOverlay').classList.add('show');
  $('modalClose').focus();
  $('modalClose').addEventListener('click', closeModal);
  $('bookBtn').addEventListener('click', () => showToast('📅 Booking is coming soon!'));
}

function closeModal() {
  modalOpenId = null;
  $('modalOverlay').classList.remove('show');
}

/* ---------- events ---------- */

// Follow buttons + card clicks (one listener for the whole grid)
grid.addEventListener('click', (e) => {
  const btn = e.target.closest('.follow-button');
  if (btn) { e.stopPropagation(); toggleFollow(isNaN(btn.dataset.id) ? btn.dataset.id : Number(btn.dataset.id), btn); return; }
  const card = e.target.closest('.card');
  if (card) openModal(card.dataset.mentorId);
});
grid.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) {
    e.preventDefault();
    openModal(e.target.dataset.mentorId);
  }
});

$('modalBody').addEventListener('click', (e) => {
  const btn = e.target.closest('.follow-button');
  if (btn) toggleFollow(isNaN(btn.dataset.id) ? btn.dataset.id : Number(btn.dataset.id), btn);
});
$('modalOverlay').addEventListener('click', (e) => { if (e.target === $('modalOverlay')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// Search (debounced)
let searchTimer;
$('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.search = e.target.value; render(); }, 200);
});

// Tabs
function setTab(filter) {
  state.filter = filter;
  [['all', 'allTab'], ['following', 'followingTab']].forEach(([key, id]) => {
    const on = key === filter;
    $(id).classList.toggle('active', on);
    $(id).setAttribute('aria-selected', on);
  });
  render();
}
$('allTab').addEventListener('click', () => setTab('all'));
$('followingTab').addEventListener('click', () => setTab('following'));

// Location filter
$('locationFilter').addEventListener('change', (e) => { state.location = e.target.value; render(); });

// Header: dropdown, notifications, messages, logout
$('profileBtn').addEventListener('click', (e) => { e.stopPropagation(); $('dropdownMenu').classList.toggle('show'); });
document.addEventListener('click', () => $('dropdownMenu').classList.remove('show'));
$('messageBtn').addEventListener('click', () => showToast('💬 No new messages'));
$('logoArea').addEventListener('click', () => window.location.reload());
$('aboutFooter').addEventListener('click', () => showToast('✨ FindYourPath - Connecting youth with local mentors'));

async function logout(e) {
  e.preventDefault();
  if (!confirm('Are you sure you want to log out?')) return;
  try { if (db && db.auth) await db.auth.signOut(); } catch (err) { console.warn('Sign out failed', err); }
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('careerUser');
  window.location.href = 'Home.html';
}
$('logoutBtn').addEventListener('click', logout);
$('sidebarLogout').addEventListener('click', logout);

// Pages that don't exist yet
document.querySelectorAll('[data-soon]').forEach((a) => {
  a.addEventListener('click', (e) => { e.preventDefault(); showToast(`${a.dataset.soon} is coming soon!`); });
});

// Search term passed from another page (Mentors.html?q=...)
const initialQuery = new URLSearchParams(window.location.search).get('q');
if (initialQuery) {
  state.search = initialQuery;
  $('searchInput').value = initialQuery;
}
/* ---------- start ---------- */
(async function init() {
  await loadUser();
  await loadMentors();
})();