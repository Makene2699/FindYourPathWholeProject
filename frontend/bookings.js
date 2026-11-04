const LOGIN_PAGE = 'Home.html';

const BookingStore = {

    async requireUser() {
        const { data } = await sb.auth.getUser();
        if (!data || !data.user) {
            window.location.href = LOGIN_PAGE;
            return null;
        }
        return data.user;
    },


    async findMentorByName(name) {
        const { data, error } = await sb.from('profiles')
            .select('id, full_name')
            .eq('role', 'Mentor')
            .ilike('full_name', name)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async request({ mentor, mentorDetail, message, mentorId }) {
        const user = await this.requireUser();
        if (!user) return null;

        const { data: me, error: meErr } = await sb.from('profiles')
            .select('full_name').eq('id', user.id).single();
        if (meErr) throw meErr;

        const m = mentorId ? { id: mentorId, full_name: mentor } : await this.findMentorByName(mentor);
        if (!m) throw new Error('MENTOR_NOT_FOUND');

        const { data, error } = await sb.from('bookings').insert({
            student_id: user.id,
            mentor_id: m.id,
            student_name: me.full_name,
            mentor_name: m.full_name,
            mentor_detail: mentorDetail,
            message: message || null
        }).select().single();
        if (error) throw error;
        return data;
    },

    async myBookingStates() {
        const user = await this.requireUser();
        if (!user) return {};
        const { data, error } = await sb.from('bookings')
            .select('mentor_id, mentor_name, status, session_date, start_time, end_time')
            .eq('student_id', user.id)
            .in('status', ['pending', 'confirmed'])
            .order('created_at', { ascending: true });
        if (error) throw error;

        const n = new Date();
        const today = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');

        const states = {};
        data.forEach(b => {
            // A confirmed session that already happened no longer blocks a new booking
            if (b.status === 'confirmed' && b.session_date < today) return;
            states[b.mentor_name] = b;   // newest row wins
            states[b.mentor_id] = b;
        });
        return states;
    },

    async watchMyBookings(callback) {
        const user = await this.requireUser();
        if (!user) return;
        sb.channel('my-bookings')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'bookings', filter: 'student_id=eq.' + user.id },
                callback)
            .subscribe();
    },

    /* mentor side  */

    async forMentor() {
        const user = await this.requireUser();
        if (!user) return [];
        const { data, error } = await sb.from('bookings')
            .select('*')
            .eq('mentor_id', user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async get(id) {
        const user = await this.requireUser();
        if (!user) return null;
        const { data, error } = await sb.from('bookings')
            .select('*')
            .eq('id', id)
            .eq('mentor_id', user.id)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async update(id, changes) {
        const { data, error } = await sb.from('bookings')
            .update(changes).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async complete(id) {
        const user = await this.requireUser();
        if (!user) return null;
        const { data, error } = await sb.from('bookings')
            .update({ status: 'completed' })
            .eq('id', id)
            .eq('mentor_id', user.id)
            .eq('status', 'confirmed')
            .select()
            .single();
        if (error) throw error;
        return data;
    }

};

/* Sidebar navigation for the mentor pages. */
function initMentorNav() {
    const routes = {
        dashboard: 'MentorDashboard.html',
        booking: 'MentorBookings.html',
        calendar: 'MentorCalendar.html',
        messages: 'Messages.html',
        settings: 'MentorSettings.html',
    };
    document.querySelectorAll('.sidebar li[data-nav]').forEach(li => {
        li.addEventListener('click', () => {
            const page = routes[li.dataset.nav];
            if (page) window.location.href = page;
        });
    });
}

/* ---------- Booking page: mentor card helpers ---------- */

// Same cover pictures the Mentors page uses, so a mentor looks identical on both pages.
// Keep this list in sync with COVER_IMAGES in Mentors.js.
const BOOKING_COVER_IMAGES = ['image 3.png', 'image 6.png', 'image 7.png'];
const hashOf = (v) => [...String(v)].reduce((a, c) => a + c.charCodeAt(0), 0);

function coverFor(m) {
    if (m.banner) return m.banner;
    return encodeURI(BOOKING_COVER_IMAGES[hashOf(m.id) % BOOKING_COVER_IMAGES.length]);
}

// Builds the "Studied / Mentors in / location" block (text only, so no HTML injection)
function buildMentorMeta(m) {
    const wrap = document.createElement('div');
    wrap.className = 'card-meta-wrap';

    function line(iconClass, label, text) {
        const row = document.createElement('div');
        row.className = 'card-meta';
        const i = document.createElement('i');
        i.className = iconClass;
        const span = document.createElement('span');
        if (label) {
            const b = document.createElement('b');
            b.textContent = label + ' ';
            span.appendChild(b);
        }
        span.appendChild(document.createTextNode(text));
        row.append(i, span);
        wrap.appendChild(row);
    }

    if (m.studied) line('fas fa-graduation-cap', 'Studied:', m.studied);
    if (m.field)   line('fas fa-bullseye', 'Mentors in:', m.field);
    if (m.location) line('fas fa-location-dot', '', m.location);
    return wrap;
}

async function initStudentBookingButtons() {
    const grid = document.querySelector('.booking-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll(':scope > div[class^="bottom-card"]'));
    if (cards.length === 0) return;

    let mentors = [];          // [{ id, name, detail, location, field, studied, photo, banner }]
    let states = {};           // booking state per mentor id
    let emptyEl = null;
    let view = 'all';          // 'all' or 'booked'

    function setState(btn, mode, title) {
        const look = {
            book:      { text: 'Book',       off: false, bg: '',        color: '',      opacity: '' },
            busy:      { text: 'Sending...', off: true,  bg: '',        color: '',      opacity: '0.6' },
            requested: { text: 'Requested',  off: true,  bg: '',        color: '',      opacity: '0.6' },
            confirmed: { text: 'Confirmed',  off: true,  bg: '#4caf50', color: 'white', opacity: '' }
        }[mode];
        btn.textContent = look.text;
        btn.style.pointerEvents = look.off ? 'none' : '';
        btn.style.background = look.bg;
        btn.style.color = look.color;
        btn.style.opacity = look.opacity;
        btn.title = title || '';
    }

    function slotText(b) {
        const d = new Date(b.session_date + 'T00:00');
        const day = d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
        return day + ', ' + b.start_time.slice(0, 5) + ' - ' + b.end_time.slice(0, 5);
    }

    function wire(card) {
        const btn = card.querySelector(':scope > a');
        if (!btn || btn._wired) return;
        btn._wired = true;
        btn.addEventListener('click', async e => {
            e.preventDefault();
            const m = card._mentor;
            if (!m) return;
            setState(btn, 'busy');
            try {
                await BookingStore.request({ mentor: m.name, mentorDetail: m.detail, mentorId: m.id });
                await refresh();
            } catch (err) {
                console.error(err);
                if (err.code === '23505') {
                    await refresh();
                } else if (err.code === '42501') {
                    setState(btn, 'book');
                    alert('You need to follow this mentor before you can book a session.');
                } else {
                    setState(btn, 'book');
                    alert('Could not send your request. Please try again.');
                }
            }
        });
    }

    function paint() {
        // More mentors than cards: clone the last card
        while (cards.length < mentors.length) {
            const copy = cards[cards.length - 1].cloneNode(true);
            grid.appendChild(copy);
            cards.push(copy);
        }
        cards.forEach(wire);

        if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.style.cssText = 'grid-column:1/-1;padding:28px 12px;font-size:14px;color:#64748b;';
            grid.appendChild(emptyEl);
        }
        emptyEl.style.display = mentors.length ? 'none' : 'block';
        emptyEl.textContent = view === 'booked'
            ? 'No confirmed bookings yet. When a mentor confirms a session it will show up here.'
            : 'No mentors yet. Press Connect on a suggested mentor on your dashboard, or Follow a mentor on the Mentors page, and they will appear here.';

        cards.forEach((card, i) => {
            const m = mentors[i];
            if (!m) { card.style.display = 'none'; card._mentor = null; return; }
            card.style.display = '';
            card._mentor = m;

            const imgs = card.querySelectorAll('.imgBx > a > img');      // [banner, avatar]
            const banner = imgs[0];
            const avatar = imgs[1];

            if (banner) banner.src = coverFor(m);

            if (avatar) {
                const fallback = initialsAvatar(m.name);
                avatar.onerror = () => { avatar.onerror = null; avatar.src = fallback; };
                avatar.src = m.photo || fallback;
                avatar.alt = m.name;
            }

            const info = card.querySelector('.card-info');
            info.querySelector('h2').textContent = m.name;
            info.querySelector('p').textContent = m.detail;

            // Replace any previous meta block, then add the fresh one after the role line
            const old = info.querySelector('.card-meta-wrap');
            if (old) old.remove();
            const meta = buildMentorMeta(m);
            if (meta.children.length) info.querySelector('p').after(meta);

            const btn = card.querySelector(':scope > a');
            const b = states[m.id];
            if (!b) setState(btn, 'book');
            else if (b.status === 'confirmed') setState(btn, 'confirmed', slotText(b));
            else setState(btn, 'requested', 'Waiting for the mentor to confirm');
        });
    }

    async function loadMentors() {
        const user = await BookingStore.requireUser();
        if (!user) return;

        let ids = [];

        if (view === 'booked') {
            // Mentors who have confirmed a session that hasn't ended yet
            const { data, error } = await sb.from('bookings')
                .select('mentor_id, session_date, end_time')
                .eq('student_id', user.id)
                .eq('status', 'confirmed');
            if (error) throw error;

            const today = localToday();
            const nowTime = new Date().toTimeString().slice(0, 8);
            ids = Array.from(new Set((data || [])
                .filter(b => b.session_date > today || (b.session_date === today && b.end_time > nowTime))
                .map(b => b.mentor_id)));
        } else {
            // Approved connections + followed mentors
            const [connRes, followRes] = await Promise.all([
                sb.from('connections')
                    .select('mentor_id')
                    .eq('student_id', user.id)
                    .eq('status', 'approved'),
                sb.from('mentor_follows')
                    .select('mentor_id')
                    .eq('user_id', user.id)
            ]);
            if (connRes.error) throw connRes.error;
            if (followRes.error) console.warn('Could not load follows:', followRes.error);

            // Follows saved on this device (used when the DB save failed on the Mentors page)
            let localIds = [];
            try {
                localIds = JSON.parse(localStorage.getItem('following') || '[]')
                    .filter(id => typeof id === 'string');   // ignore numeric sample-data ids
            } catch (e) { /* ignore */ }

            ids = Array.from(new Set([
                ...(connRes.data || []).map(r => r.mentor_id),
                ...((followRes.data) || []).map(r => r.mentor_id),
                ...localIds
            ]));
        }

        // Same view and columns the Mentors page uses
        let rows = [];
        if (ids.length) {
            const r = await sb.from('mentors_public')
                .select('id, full_name, job_title, company, location, avatar_url, banner_url, career_field, education, studied_at')
                .in('id', ids);
            if (r.error) throw r.error;
            rows = r.data;
        }
        mentors = rows.map(p => ({
            id: p.id,
            name: p.full_name,
            detail: [p.job_title, p.company].filter(Boolean).join(' | ') || 'Mentor',
            location: p.location || '',
            field: p.career_field || '',
            studied: [p.education, p.studied_at].filter(Boolean).join(' · '),
            photo: p.avatar_url || null,
            banner: p.banner_url || null
        })).sort((a, b) => a.name.localeCompare(b.name));
    }

    async function refresh() {
        try {
            await loadMentors();
            states = await BookingStore.myBookingStates();
            paint();
        } catch (e) {
            console.error('Could not load your mentors:', e);
        }
    }

    /* All / Booked tabs */
    const allTab = document.getElementById('allTab');
    const bookedTab = document.getElementById('bookedTab');

    function setView(v) {
        view = v;
        if (allTab) allTab.classList.toggle('active', v === 'all');
        if (bookedTab) bookedTab.classList.toggle('active', v === 'booked');
        refresh();
    }
    if (allTab) allTab.addEventListener('click', e => { e.preventDefault(); setView('all'); });
    if (bookedTab) bookedTab.addEventListener('click', e => { e.preventDefault(); setView('booked'); });

    cards.forEach(c => { c.style.display = 'none'; });   // hide the hard-coded cards until real data arrives
    await refresh();
    BookingStore.watchMyBookings(refresh);               // a mentor confirmed or declined a booking
    ConnectionStore.watchMine(refresh);                  // a connection changed
    window.addEventListener('focus', refresh);           // fallback if Realtime is off
}

/* Student dashboard: next upcoming session */

function localToday() {
    const n = new Date();
    return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
}

function initialsOf(name) {
    return (name || '').trim().split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

// Round placeholder picture with the person's initials (returned as an image data URI)
function initialsAvatar(name) {
    const palette = ['#0f2744', '#2e7d32', '#7c3aed', '#0284c7', '#ea580c', '#be185d'];
    let h = 0;
    for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const text = initialsOf(name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
        '<rect width="100" height="100" fill="' + palette[h % palette.length] + '"/>' +
        '<text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" ' +
        'font-size="40" font-weight="700" fill="#ffffff">' + text + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function to12h(t) {
    const p = t.split(':').map(Number);
    return ((p[0] % 12) || 12) + ':' + String(p[1]).padStart(2, '0') + ' ' + (p[0] >= 12 ? 'PM' : 'AM');
}

function minutesBetween(a, b) {
    const f = t => { const p = t.split(':').map(Number); return p[0] * 60 + p[1]; };
    return f(b) - f(a);
}

async function initStudentUpcomingSession() {
    const card = document.querySelector('.top-layout');
    if (!card) return;

    const img   = card.querySelector(':scope > img');
    const title = card.querySelector(':scope > h2');
    const date  = card.querySelector(':scope > h3');
    const time  = card.querySelector(':scope > h4');
    const btn   = card.querySelector(':scope > a.btn');

    const AVATAR_COLUMNS = PROFILE_AVATAR_COLUMNS;

    function fill(el, parts) {
        el.textContent = '';
        parts.forEach(p => {
            if (p === '<br>') el.appendChild(document.createElement('br'));
            else if (typeof p === 'object') {
                const s = document.createElement('span');
                s.className = 'role';
                s.textContent = p.role;
                el.appendChild(s);
            } else el.appendChild(document.createTextNode(p));
        });
    }

    function showEmpty(message) {
        img.src = initialsAvatar('?');
        img.alt = '';
        fill(title, [message || 'No upcoming session', '<br>', { role: 'Book a mentor to get started' }]);
        fill(date, ['No date yet', { role: '' }]);
        fill(time, ['No time yet', { role: '' }]);
        btn.textContent = 'Book a Session';
        btn.href = 'Booking.html';
    }

    async function load() {
        try {
            const { data: auth } = await sb.auth.getUser();
            if (!auth || !auth.user) { showEmpty(); return; }

            const nowTime = new Date().toTimeString().slice(0, 8);
            const { data, error } = await sb.from('bookings')
                .select('*')
                .eq('student_id', auth.user.id)
                .eq('status', 'confirmed')
                .gte('session_date', localToday())
                .order('session_date', { ascending: true })
                .order('start_time', { ascending: true })
                .limit(10);
            if (error) throw error;

            const next = data.find(b => b.session_date > localToday() || b.end_time > nowTime);
            if (!next) { showEmpty(); return; }

            let photo = null;
            const { data: mentor } = await sb.from('profiles')
                .select('*').eq('id', next.mentor_id).maybeSingle();
            if (mentor) {
                const col = AVATAR_COLUMNS.find(c => mentor[c]);
                if (col) photo = mentor[col];
            }

            const name = next.mentor_name;
            const fallback = initialsAvatar(name);
            img.onerror = () => { img.onerror = null; img.src = fallback; };
            img.src = photo || fallback;
            img.alt = name;

            const d = new Date(next.session_date + 'T00:00');
            fill(title, ['Session with', '<br>', name, '<br>', { role: next.mentor_detail || '' }]);
            fill(date, [d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                { role: d.toLocaleDateString('en-US', { weekday: 'long' }) }]);
            fill(time, [to12h(next.start_time),
                { role: minutesBetween(next.start_time, next.end_time) + ' min' }]);
            btn.textContent = 'View Details';
            btn.href = 'details.html?id=' + encodeURIComponent(next.id);
        } catch (e) {
            console.error('Could not load upcoming session:', e);
            showEmpty('Could not load your session');
        }
    }

    await load();
    window.addEventListener('focus', load);
}
/*  Student dashboard: sessions completed  */

async function initStudentSessionsCompleted() {
    const countEl = document.getElementById('sessionsCompletedCount');
    const hoursEl = document.getElementById('hoursMentoredCount');
    if (!countEl && !hoursEl) return;

    function formatMentored(mins) {
        if (mins < 60) return mins + 'm';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m ? h + 'h ' + m + 'm' : h + 'h';
    }

    async function load() {
        try {
            const { data: auth } = await sb.auth.getUser();
            if (!auth || !auth.user) return;

            const { data, error } = await sb.from('bookings')
                .select('start_time, end_time')
                .eq('student_id', auth.user.id)
                .eq('status', 'completed');
            if (error) throw error;

            const mins = data.reduce((sum, b) =>
                sum + (b.start_time && b.end_time
                    ? Math.max(0, minutesBetween(b.start_time, b.end_time))
                    : 0), 0);

            if (countEl) countEl.textContent = data.length;
            if (hoursEl) hoursEl.textContent = formatMentored(mins);
        } catch (e) {
            console.error('Could not load completed sessions:', e);
        }
    }

    await load();
    window.addEventListener('focus', load);
    BookingStore.watchMyBookings(load);
}

/*  Session details (student)  */

const PROFILE_AVATAR_COLUMNS = ['avatar_url', 'avatar', 'profile_picture', 'profile_image', 'photo_url', 'image_url'];

async function mentorPhotoUrl(mentorId) {
    try {
        const { data: prof, error } = await sb.from('profiles')
            .select('*')
            .eq('id', mentorId)
            .maybeSingle();
        if (error || !prof) return null;
        const col = PROFILE_AVATAR_COLUMNS.find(c => prof[c]);
        return col ? prof[col] : null;
    } catch (e) {
        console.error('mentorPhotoUrl failed:', e);
        return null;
    }
}

BookingStore.getForStudent = async function (id) {
    const user = await this.requireUser();
    if (!user) return null;
    const { data, error } = await sb.from('bookings')
        .select('*')
        .eq('id', id)
        .eq('student_id', user.id)
        .maybeSingle();
    if (error) throw error;
    return data;
};

async function initStudentSessionDetails() {
    const $ = x => document.getElementById(x);
    const id = new URLSearchParams(window.location.search).get('id');

    function safeUrl(text) {
        try {
            const u = new URL(text);
            return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : null;
        } catch (e) {
            return null;
        }
    }

    let b = null;
    let loadError = null;
    try {
        const user = await BookingStore.requireUser();
        if (!user) return;
        b = id ? await BookingStore.getForStudent(id) : null;
    } catch (e) {
        console.error('Could not load this session:', e);
        loadError = e;
    }

    $('sdLoading').style.display = 'none';
    if (!b) {
        if (loadError) {
            $('sdNotFound').textContent = 'Something went wrong while loading this session. Press F12 and check the Console for the error.';
        }
        $('sdNotFound').style.display = 'block';
        return;
    }
    $('sdContent').style.display = 'block';

    /* mentor */
    const fallback = initialsAvatar(b.mentor_name);
    const photo = await mentorPhotoUrl(b.mentor_id);
    const avatar = $('sdAvatar');
    avatar.onerror = () => { avatar.onerror = null; avatar.src = fallback; };
    avatar.src = photo || fallback;
    avatar.alt = b.mentor_name;
    $('sdMentor').textContent = b.mentor_name;
    $('sdMentorDetail').textContent = b.mentor_detail || '';

    /* status */
    const today = localToday();
    const nowTime = new Date().toTimeString().slice(0, 8);
    const ended = b.status === 'confirmed' && b.session_date &&
        (b.session_date < today || (b.session_date === today && b.end_time <= nowTime));
    let label = { pending: 'Pending', confirmed: 'Confirmed', declined: 'Declined', completed: 'Completed' }[b.status] || b.status;
    let cls = b.status;
    if (ended) {
        label = 'Awaiting completion';
        cls = 'pending';
    }
    $('sdStatus').textContent = label;
    $('sdStatus').className = 'sd-badge ' + cls;

    /* date and time */
    if (b.session_date) {
        const d = new Date(b.session_date + 'T00:00');
        $('sdDate').textContent = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        const days = Math.round((d - new Date(today + 'T00:00')) / 86400000);
        $('sdWhen').textContent = days === 0 ? 'Today'
            : days === 1 ? 'Tomorrow'
                : days > 1 ? 'In ' + days + ' days'
                    : days === -1 ? 'Yesterday'
                        : Math.abs(days) + ' days ago';
    } else {
        $('sdDate').textContent = 'Not scheduled yet';
    }

    if (b.start_time && b.end_time) {
        $('sdTime').textContent = to12h(b.start_time) + ' - ' + to12h(b.end_time);
        $('sdDuration').textContent = minutesBetween(b.start_time, b.end_time) + ' min';
    } else {
        $('sdTime').textContent = 'Not scheduled yet';
    }

    /* type and place */
    const online = b.session_type !== 'In person';
    $('sdType').textContent = b.session_type || 'Not set yet';
    $('sdTypeIcon').className = online ? 'fas fa-video' : 'fas fa-user-friends';
    $('sdPlaceLabel').textContent = online ? 'Meeting link' : 'Venue';
    $('sdPlaceIcon').className = online ? 'fas fa-link' : 'fas fa-location-dot';

    const url = online && b.location ? safeUrl(b.location) : null;
    if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = url;
        $('sdPlace').appendChild(a);
        $('sdJoin').href = url;
        if (b.status === 'confirmed' && !ended) $('sdJoin').style.display = 'inline-flex';
    } else {
        $('sdPlace').textContent = b.location || 'Your mentor has not added this yet';
    }

    /* mentor's note */
    if (b.notes) {
        $('sdNotes').textContent = b.notes;
        $('sdNotesCard').style.display = 'block';
    }
}

async function initStudentBookedMentors() {
    const layout = document.querySelector('.bottom-layout');
    if (!layout) return;
    const cards = ['.bottom-card1', '.bottom-card2', '.bottom-card3']
        .map(sel => layout.querySelector(sel)).filter(Boolean);

    let emptyEl = null;

    function hideCards() {
        cards.forEach(c => { c.style.display = 'none'; });
    }

    function showEmpty(message) {
        hideCards();
        if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.style.cssText = 'margin:auto;align-self:center;font-size:13px;color:#64748b;text-align:center;padding:0 20px;';
            layout.appendChild(emptyEl);
        }
        emptyEl.textContent = message;
        emptyEl.style.display = 'block';
    }

    function tip(b) {
        if (b.status === 'confirmed') {
            const d = new Date(b.session_date + 'T00:00');
            return 'Confirmed: ' + d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
                ', ' + to12h(b.start_time);
        }
        return 'Request sent: waiting for ' + b.mentor_name + ' to confirm';
    }

    function fillCard(card, b, mentor) {
        const imgs = card.querySelectorAll('.imgBx > a > img');      // [banner, avatar]
        const avatar = imgs[1];
        const parts = (b.mentor_detail || '').split('|').map(s => s.trim());
        const job = (mentor && mentor.job_title) || parts[0] || '';
        const org = (mentor && (mentor.company || mentor.city)) || parts[1] || '';

        const col = mentor ? PROFILE_AVATAR_COLUMNS.find(c => mentor[c]) : null;
        const fallback = initialsAvatar(b.mentor_name);
        if (avatar) {
            avatar.onerror = () => { avatar.onerror = null; avatar.src = fallback; };
            avatar.src = col ? mentor[col] : fallback;
            avatar.alt = b.mentor_name;
        }

        card.querySelector('.imgBx h2').textContent = b.mentor_name;
        card.querySelector('.imgBx h3').textContent = job;
        card.querySelector('.imgBx h4').textContent = org;
        const h5 = card.querySelector('.imgBx h5');
        if (h5) h5.style.display = 'none';

        const btn = card.querySelector(':scope > a');
        if (btn) btn.href = 'MentorProfileView.html?id=' + encodeURIComponent(b.mentor_id);
        card.title = tip(b);
    }

    async function load() {
        try {
            const { data: auth } = await sb.auth.getUser();
            if (!auth || !auth.user) { showEmpty('Log in to see your bookings.'); return; }

            const today = localToday();
            const nowTime = new Date().toTimeString().slice(0, 8);
            const { data, error } = await sb.from('bookings')
                .select('*')
                .eq('student_id', auth.user.id)
                .in('status', ['pending', 'confirmed']);
            if (error) throw error;

            // Pending requests, plus confirmed sessions that have not ended yet
            const upcoming = data
                .filter(b => b.status === 'pending' || b.session_date > today ||
                    (b.session_date === today && b.end_time > nowTime))
                .sort((a, b) =>
                    (a.session_date || '9999').localeCompare(b.session_date || '9999') ||
                    (a.start_time || '').localeCompare(b.start_time || '') ||
                    a.created_at.localeCompare(b.created_at));

            // Same rule as the big card: the earliest confirmed upcoming session
            const featured = upcoming.find(b => b.status === 'confirmed');

            const seen = new Set();
            const shown = [];
            upcoming.forEach(b => {
                if (b === featured || seen.has(b.mentor_id)) return;
                seen.add(b.mentor_id);                     // one card per mentor
                shown.push(b);
            });
            const visible = shown.slice(0, cards.length);

            if (visible.length === 0) {
                showEmpty('No other bookings yet. Book a mentor and they will show up here.');
                return;
            }

            const { data: mentors } = await sb.from('profiles')
                .select('*')
                .in('id', visible.map(b => b.mentor_id));
            const byId = {};
            (mentors || []).forEach(m => { byId[m.id] = m; });

            if (emptyEl) emptyEl.style.display = 'none';
            cards.forEach((card, i) => {
                const b = visible[i];
                if (!b) { card.style.display = 'none'; return; }
                card.style.display = '';
                fillCard(card, b, byId[b.mentor_id]);
            });
        } catch (e) {
            console.error('Could not load booked mentors:', e);
            showEmpty('Could not load your bookings.');
        }
    }

    hideCards();
    await load();
    window.addEventListener('focus', load);
}



const ConnectionStore = {

    async request(mentorId) {
        const { data: auth } = await sb.auth.getUser();
        const user = auth && auth.user;
        if (!user) throw new Error('NOT_SIGNED_IN');

        const { data: me, error: meErr } = await sb.from('profiles')
            .select('full_name').eq('id', user.id).single();
        if (meErr) throw meErr;

        const { data, error } = await sb.from('connections').insert({
            student_id: user.id,
            mentor_id: mentorId,
            student_name: me.full_name
        }).select().single();
        if (error) throw error;
        return data;
    },

    async pendingForMentor(mentorId) {
        const { data, error } = await sb.from('connections')
            .select('*')
            .eq('mentor_id', mentorId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async respond(id, status) {
        const { data, error } = await sb.from('connections')
            .update({ status: status, responded_at: new Date().toISOString() })
            .eq('id', id)
            .eq('status', 'pending')
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async watchMine(callback) {
        const { data } = await sb.auth.getUser();
        if (!data || !data.user) return;
        sb.channel('my-connections')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'connections', filter: 'student_id=eq.' + data.user.id },
                callback)
            .subscribe();
    },

    async watchForMentor(callback) {
        const { data } = await sb.auth.getUser();
        if (!data || !data.user) return;
        sb.channel('mentor-connections')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'connections', filter: 'mentor_id=eq.' + data.user.id },
                callback)
            .subscribe();
    }
};

/* Dashboard "Suggested Mentors": Connect works like Follow (saved in mentor_follows, no approval) */
async function initSuggestedMentors() {
    const box = document.querySelector('.suggested-mentors');
    if (!box) return;
    const items = Array.from(box.querySelectorAll('.mentor-item'));
    let note = null;

    function setBtn(btn, mode) {
        const look = {
            connect:   { text: 'Connect',     off: false },
            busy:      { text: 'Sending...',  off: true },
            requested: { text: 'Following ✓', off: true }
        }[mode];
        btn.textContent = look.text;
        btn.style.pointerEvents = look.off ? 'none' : '';
        btn.style.opacity = look.off ? '0.6' : '';
    }

    function showNote(text) {
        items.forEach(i => { i.style.display = 'none'; });
        if (!note) {
            note = document.createElement('p');
            note.style.cssText = 'font-size:12px;color:#64748b;line-height:1.5;';
            box.appendChild(note);
        }
        note.textContent = text;
        note.style.display = 'block';
    }

    function fillItem(item, m) {
        const col = PROFILE_AVATAR_COLUMNS.find(c => m[c]);
        const fallback = initialsAvatar(m.full_name);
        const img = item.querySelector('img');
        img.onerror = () => { img.onerror = null; img.src = fallback; };
        img.src = col ? m[col] : fallback;
        img.alt = m.full_name;

        item.querySelector('.mentor-info h4').textContent = m.full_name;
        item.querySelector('.mentor-info p').textContent = m.job_title || 'Mentor';
        item.querySelector('.mentor-info span').textContent = m.company || m.city || '';

        const btn = item.querySelector('.connect-btn');
        setBtn(btn, 'connect');
        btn.onclick = async e => {
            e.preventDefault();
            setBtn(btn, 'busy');
            try {
                const { data: auth } = await sb.auth.getUser();
                const { error } = await sb.from('mentor_follows')
                    .insert({ user_id: auth.user.id, mentor_id: m.id });
                if (error && error.code !== '23505') throw error;   // 23505 = already following
                setBtn(btn, 'requested');
            } catch (err) {
                console.error(err);
                setBtn(btn, 'connect');
                alert('Could not follow this mentor. Please try again.');
            }
        };
    }

    async function load() {
        try {
            const { data: auth } = await sb.auth.getUser();
            if (!auth || !auth.user) { showNote('Log in to see suggested mentors.'); return; }

            const [mentorsRes, followsRes] = await Promise.all([
                sb.from('profiles').select('*').eq('role', 'Mentor'),
                sb.from('mentor_follows').select('mentor_id').eq('user_id', auth.user.id)
            ]);
            if (mentorsRes.error) throw mentorsRes.error;
            if (followsRes.error) throw followsRes.error;

            const followed = new Set((followsRes.data || []).map(r => r.mentor_id));

            const candidates = mentorsRes.data
                .filter(m => !followed.has(m.id))
                .sort((a, b) =>
                    ((!!b.job_title) - (!!a.job_title)) ||
                    a.full_name.localeCompare(b.full_name))
                .slice(0, items.length);

            if (candidates.length === 0) {
                showNote('You are following every available mentor. New mentors will show up here.');
                return;
            }
            if (note) note.style.display = 'none';
            items.forEach((item, i) => {
                const m = candidates[i];
                if (!m) { item.style.display = 'none'; return; }
                item.style.display = '';
                fillItem(item, m);
            });
        } catch (e) {
            console.error('Could not load suggested mentors:', e);
            showNote('Could not load suggested mentors.');
        }
    }

    items.forEach(i => { i.style.display = 'none'; });
    await load();
    window.addEventListener('focus', load);
}


function timeAgo(iso) {
    const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return 'Just now';
    const m = Math.round(s / 60);
    if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60);
    if (h < 24) return h + ' h ago';
    const d = Math.round(h / 24);
    return d + (d === 1 ? ' day ago' : ' days ago');
}

async function initMentorNotifications() {
    const bell = document.getElementById('notificationBtn');
    if (!bell) return;
    const badge = bell.querySelector('.badge');
    if (badge) badge.style.display = 'none';

    bell.setAttribute('aria-haspopup', 'true');
    bell.setAttribute('aria-expanded', 'false');

    const panel = document.createElement('div');
    panel.className = 'notif-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(panel);

    let items = [];

    function make(tag, cls) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        return e;
    }

    function updateBadge() {
        if (badge) {
            badge.textContent = items.length > 9 ? '9+' : String(items.length);
            badge.style.display = items.length ? '' : 'none';
        }
        bell.setAttribute('aria-label', items.length ? 'Notifications (' + items.length + ' new)' : 'Notifications');
    }

    function buildItem(n) {
        const row = make('div', 'notif-item');
        const img = make('img');
        img.src = initialsAvatar(n.student_name);
        img.alt = '';

        const body = make('div', 'notif-body');
        const text = make('p');
        const who = make('strong');
        who.textContent = n.student_name;
        text.append(who, ' wants to connect with you.');
        const time = make('span', 'notif-time');
        time.textContent = timeAgo(n.created_at);

        const actions = make('div', 'notif-actions');
        const approve = make('button', 'notif-approve');
        approve.type = 'button';
        approve.textContent = 'Approve';
        const decline = make('button', 'notif-decline');
        decline.type = 'button';
        decline.textContent = 'Decline';
        actions.append(approve, decline);

        async function respond(status) {
            approve.disabled = true;
            decline.disabled = true;
            try {
                await ConnectionStore.respond(n.id, status);
                text.textContent = status === 'approved'
                    ? 'You are now connected with ' + n.student_name + '. They can book a session with you.'
                    : 'You declined the request from ' + n.student_name + '.';
                time.remove();
                actions.remove();
                items = items.filter(x => x.id !== n.id);
                updateBadge();
                setTimeout(() => { row.remove(); if (!items.length) render(); }, 2200);
            } catch (e) {
                console.error(e);
                approve.disabled = false;
                decline.disabled = false;
                time.textContent = 'Could not save. Please try again.';
            }
        }
        approve.addEventListener('click', () => respond('approved'));
        decline.addEventListener('click', () => respond('declined'));

        body.append(text, time, actions);
        row.append(img, body);
        return row;
    }

    function render() {
        panel.textContent = '';
        const head = make('div', 'notif-head');
        head.textContent = 'Notifications';
        panel.appendChild(head);
        if (!items.length) {
            const empty = make('div', 'notif-empty');
            empty.textContent = 'You are all caught up. New connection requests will show up here.';
            panel.appendChild(empty);
            return;
        }
        items.forEach(n => panel.appendChild(buildItem(n)));
    }

    function place() {
        const r = bell.getBoundingClientRect();
        panel.style.top = (r.bottom + 10) + 'px';
        panel.style.right = Math.max(12, window.innerWidth - r.right - 12) + 'px';
    }

    function open() {
        render();
        place();
        panel.classList.add('show');
        bell.setAttribute('aria-expanded', 'true');
    }

    function close() {
        panel.classList.remove('show');
        bell.setAttribute('aria-expanded', 'false');
    }

    bell.addEventListener('click', e => {
        e.stopPropagation();
        panel.classList.contains('show') ? close() : open();
    });
    panel.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', () => { if (panel.classList.contains('show')) place(); });

    async function load() {
        try {
            const { data: auth } = await sb.auth.getUser();
            if (!auth || !auth.user) return;
            items = await ConnectionStore.pendingForMentor(auth.user.id);
            updateBadge();
            if (panel.classList.contains('show')) render();
        } catch (e) {
            console.error('Could not load notifications:', e);
        }
    }

    await load();
    ConnectionStore.watchForMentor(load);      // live: a student just pressed Connect
    window.addEventListener('focus', load);    // fallback if Realtime is off
}

async function initDashboardEncouragement() {
    const box = document.querySelector('.encouragement-wall');
    if (!box) return;
    const rows = Array.from(box.querySelectorAll(':scope > .wall-post'));
    const postBtn = box.querySelector(':scope > .post-btn');
    let note = null;

    if (postBtn) postBtn.addEventListener('click', () => { window.location.href = 'EncouragementWall.html'; });

    function ago(iso) {
        const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
        if (m < 1) return 'Just now';
        if (m < 60) return m + 'm ago';
        const h = Math.round(m / 60);
        if (h < 24) return h + 'h ago';
        return Math.round(h / 24) + 'd ago';
    }

    function showNote(text) {
        rows.forEach(r => { r.style.display = 'none'; });
        if (!note) {
            note = document.createElement('p');
            note.style.cssText = 'font-size:12px;color:#64748b;line-height:1.5;margin-bottom:15px;';
            box.insertBefore(note, postBtn || null);
        }
        note.textContent = text;
        note.style.display = 'block';
    }

    function fillRow(row, post) {
        const name = post.name || 'Anonymous';
        const fallback = initialsAvatar(name);
        const img = row.querySelector(':scope > img');
        img.onerror = () => { img.onerror = null; img.src = fallback; };
        img.src = post.poster_avatar_url || fallback;
        img.alt = name;

        row.querySelector('.post-content h4').textContent = name;
        row.querySelector('.post-content p').textContent = post.message;
        const stats = row.querySelector('.post-stats');
        if (stats) stats.style.display = 'none';
        row.querySelector('.post-time').textContent = ago(post.created_at);
        row.title = post.message;
    }

    async function load() {
        try {
            let res = await sb.from('encouragement_wall')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(rows.length);
            if (res.error) {
                res = await sb.from('encouragement_posts')
                    .select('id, name, message, created_at')
                    .order('created_at', { ascending: false })
                    .limit(rows.length);
            }
            if (res.error) throw res.error;

            const posts = res.data;
            if (posts.length === 0) {
                showNote('Nothing has been posted yet. Be the first to share some encouragement.');
                return;
            }
            if (note) note.style.display = 'none';
            rows.forEach((row, i) => {
                const post = posts[i];
                if (!post) { row.style.display = 'none'; return; }
                row.style.display = '';
                fillRow(row, post);
            });
        } catch (e) {
            console.error('Could not load the encouragement wall:', e);
            showNote('Could not load the encouragement wall.');
        }
    }

    rows.forEach(r => { r.style.display = 'none'; });
    await load();
    window.addEventListener('focus', load);
}