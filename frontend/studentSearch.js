/* Student top-bar search: suggests mentors, opens Mentors.html?q=... */
(function () {
    const input = document.getElementById('searchInput');
    if (!input || typeof sb === 'undefined') return;
    if (document.getElementById('mentorsGrid')) return;   // Mentors page has its own search

    /* ---------- styles ---------- */
    if (!document.getElementById('studentSearchStyles')) {
        const st = document.createElement('style');
        st.id = 'studentSearchStyles';
        st.textContent = `
            .search-panel{position:fixed;z-index:1000;max-height:360px;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.15);display:none;}
            .search-panel.show{display:block;}
            .search-item{display:flex;gap:12px;align-items:center;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f1f5f9;}
            .search-item:last-child{border-bottom:none;}
            .search-item:hover,.search-item.active{background:#f0f9f1;}
            .search-item img{width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;}
            .search-item .s-name{font-size:.85rem;font-weight:700;color:#0f172a;}
            .search-item .s-sub{font-size:.75rem;color:#64748b;}
            .search-all{padding:10px 14px;font-size:.8rem;font-weight:700;color:#2e7d32;cursor:pointer;text-align:center;}
            .search-all:hover{background:#f0f9f1;}
            .search-empty{padding:16px;font-size:.85rem;color:#64748b;text-align:center;}
        `;
        document.head.appendChild(st);
    }

    /* ---------- helpers ---------- */
    function initialsAvatarLocal(name) {
        const letters = (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e8f5e9"/>' +
            '<text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" font-weight="700" fill="#2e7d32">' +
            letters.replace(/[&<>]/g, '') + '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function make(tag, cls) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        return e;
    }

    function goToMentors(term) {
        window.location.href = 'Mentors.html?q=' + encodeURIComponent(term);
    }

    /* ---------- mentor list (loaded once, filtered in the browser) ---------- */
    let mentors = null;
    let loading = null;

    function loadMentors() {
        if (mentors) return Promise.resolve(mentors);
        if (!loading) {
            loading = sb.from('mentors_public')
                .select('id, full_name, job_title, company, location, avatar_url, career_field, education, studied_at')
                .order('full_name', { ascending: true })
                .then(({ data, error }) => {
                    if (error) throw error;
                    mentors = data || [];
                    return mentors;
                })
                .catch(e => {
                    console.error('Could not load mentors for search:', e);
                    loading = null;
                    return [];
                });
        }
        return loading;
    }

    function matches(m, q) {
        return [m.full_name, m.job_title, m.company, m.location, m.career_field, m.education, m.studied_at]
            .some(t => t && String(t).toLowerCase().includes(q));
    }

    /* ---------- dropdown ---------- */
    const panel = make('div', 'search-panel');
    panel.setAttribute('role', 'listbox');
    document.body.appendChild(panel);

    let activeIndex = -1;

    function place() {
        const r = input.getBoundingClientRect();
        panel.style.top = (r.bottom + 8) + 'px';
        panel.style.left = r.left + 'px';
        panel.style.width = Math.max(r.width, 300) + 'px';
    }

    function open() { place(); panel.classList.add('show'); }
    function close() { panel.classList.remove('show'); activeIndex = -1; }

    function setActive(i) {
        const rows = panel.querySelectorAll('.search-item');
        rows.forEach(r => r.classList.remove('active'));
        activeIndex = i;
        if (rows[i]) {
            rows[i].classList.add('active');
            rows[i].scrollIntoView({ block: 'nearest' });
        }
    }

    function buildRow(m, term) {
        const row = make('div', 'search-item');
        row.setAttribute('role', 'option');

        const img = make('img');
        const fallback = typeof initialsAvatar === 'function' ? initialsAvatar(m.full_name) : initialsAvatarLocal(m.full_name);
        img.onerror = () => { img.onerror = null; img.src = fallback; };
        img.src = m.avatar_url || fallback;
        img.alt = '';

        const text = make('div');
        const name = make('div', 's-name');
        name.textContent = m.full_name;
        const sub = make('div', 's-sub');
        sub.textContent = [m.job_title, m.company].filter(Boolean).join(' | ') || 'Mentor';
        text.append(name, sub);

        row.append(img, text);
        row.addEventListener('click', () => goToMentors(m.full_name));
        return row;
    }

    async function showResults() {
        const term = input.value.trim();
        const q = term.toLowerCase();
        if (!q) { close(); return; }

        const all = await loadMentors();
        if (input.value.trim().toLowerCase() !== q) return;   // user kept typing

        const found = all.filter(m => matches(m, q));
        panel.textContent = '';

        if (!found.length) {
            const empty = make('div', 'search-empty');
            empty.textContent = 'No mentors match "' + term + '".';
            panel.appendChild(empty);
        } else {
            found.slice(0, 5).forEach(m => panel.appendChild(buildRow(m, term)));
            const more = make('div', 'search-all');
            more.textContent = 'See all results for "' + term + '"';
            more.addEventListener('click', () => goToMentors(term));
            panel.appendChild(more);
        }
        activeIndex = -1;
        open();
    }

    /* ---------- events ---------- */
    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(showResults, 200);
    });
    input.addEventListener('focus', () => { if (input.value.trim()) showResults(); });

    input.addEventListener('keydown', e => {
        const rows = panel.querySelectorAll('.search-item');
        if (e.key === 'ArrowDown' && rows.length) {
            e.preventDefault();
            setActive((activeIndex + 1) % rows.length);
        } else if (e.key === 'ArrowUp' && rows.length) {
            e.preventDefault();
            setActive((activeIndex - 1 + rows.length) % rows.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && rows[activeIndex]) rows[activeIndex].click();
            else if (input.value.trim()) goToMentors(input.value.trim());
        } else if (e.key === 'Escape') {
            close();
        }
    });

    panel.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', close);
    window.addEventListener('resize', () => { if (panel.classList.contains('show')) place(); });
})();