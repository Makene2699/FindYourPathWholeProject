/* mentorSearch.js
 * Makes the mentor top-bar search box work.
 * Needs: supabaseClient.js and bookings.js loaded first (BookingStore.forMentor()).
 * Use: call initMentorSearch() after initMentorNav().
 */
(function () {
    var PAGES = [
        { label: 'Dashboard', nav: 'dashboard', icon: 'fa-tachometer-alt', keys: 'dashboard home overview stats' },
        { label: 'Users',     nav: 'users',     icon: 'fa-users',          keys: 'users students mentees' },
        { label: 'Bookings',  nav: 'booking',   icon: 'fa-calendar-alt',   keys: 'bookings sessions requests pending' },
        { label: 'Calendar',  nav: 'calendar',  icon: 'fa-calendar-days',  keys: 'calendar schedule availability' },
        { label: 'Messages',  nav: 'messages',  icon: 'fa-comment-dots',   keys: 'messages chat inbox' },
        { label: 'Settings',  nav: 'settings',  icon: 'fa-cog',            keys: 'settings profile account' }
    ];

    function esc(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function norm(v) {
        return String(v == null ? '' : v).toLowerCase();
    }

    function goTo(nav, query) {
        try { sessionStorage.setItem('mentorSearchQuery', query || ''); } catch (e) {}
        var li = document.querySelector('[data-nav="' + nav + '"]');
        if (li) li.click();
    }

    function addStyles() {
        if (document.getElementById('mentorSearchStyles')) return;
        var css = document.createElement('style');
        css.id = 'mentorSearchStyles';
        css.textContent =
            '.ms-panel{position:absolute;top:calc(100% + 8px);left:0;right:0;min-width:320px;max-height:420px;' +
            'overflow-y:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;' +
            'box-shadow:0 10px 30px rgba(15,23,42,.12);z-index:1000;display:none;padding:6px 0;}' +
            '.ms-panel.show{display:block;}' +
            '.ms-group{padding:8px 14px 4px;font-size:11px;font-weight:600;letter-spacing:.06em;' +
            'text-transform:uppercase;color:#64748b;}' +
            '.ms-item{display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;font-size:14px;color:#0f172a;}' +
            '.ms-item:hover,.ms-item.active{background:#f1f5f9;}' +
            '.ms-item i{width:18px;text-align:center;color:#22b04b;}' +
            '.ms-main{display:flex;flex-direction:column;min-width:0;}' +
            '.ms-title{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '.ms-sub{font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '.ms-empty{padding:14px;font-size:14px;color:#64748b;}';
        document.head.appendChild(css);
    }

    window.initMentorSearch = function () {
        var input = document.querySelector('.search-input');
        if (!input) return;
        var wrap = input.closest('.search-wrap') || input.parentElement;

        addStyles();
        wrap.style.position = 'relative';

        var panel = document.createElement('div');
        panel.className = 'ms-panel';
        wrap.appendChild(panel);

        var bookings = null;
        var loading = null;
        var timer = null;

        function loadBookings() {
            if (bookings) return Promise.resolve(bookings);
            if (!loading) {
                loading = BookingStore.forMentor()
                    .then(function (d) { bookings = d || []; return bookings; })
                    .catch(function (e) {
                        console.error('Mentor search could not load bookings:', e);
                        bookings = [];
                        return bookings;
                    });
            }
            return loading;
        }

        function nice(b) {
            var bits = [];
            if (b.session_date) bits.push(b.session_date);
            if (b.start_time) bits.push(String(b.start_time).slice(0, 5));
            if (b.status) bits.push(b.status);
            return bits.join(' · ');
        }

        function search(q) {
            var out = { students: [], bookings: [], pages: [] };

            // Students (grouped from bookings)
            var seen = {};
            bookings.forEach(function (b) {
                if (!b.student_name || norm(b.student_name).indexOf(q) === -1) return;
                var key = b.student_id || b.student_name;
                if (!seen[key]) seen[key] = { name: b.student_name, count: 0 };
                seen[key].count++;
            });
            Object.keys(seen).forEach(function (k) { out.students.push(seen[k]); });

            // Bookings
            bookings.forEach(function (b) {
                var hay = [b.student_name, b.status, b.session_type, b.student_title,
                    b.session_date, b.location, b.notes].map(norm).join(' ');
                if (hay.indexOf(q) !== -1) out.bookings.push(b);
            });

            // Pages
            PAGES.forEach(function (p) {
                if (norm(p.label + ' ' + p.keys).indexOf(q) !== -1) out.pages.push(p);
            });

            out.students = out.students.slice(0, 5);
            out.bookings = out.bookings.slice(0, 5);
            return out;
        }

        function render(q, r) {
            var html = '';

            if (r.students.length) {
                html += '<div class="ms-group">Students</div>';
                r.students.forEach(function (s) {
                    html += '<div class="ms-item" data-nav="users">' +
                        '<i class="fas fa-user"></i><div class="ms-main">' +
                        '<span class="ms-title">' + esc(s.name) + '</span>' +
                        '<span class="ms-sub">' + s.count + (s.count === 1 ? ' booking' : ' bookings') + '</span>' +
                        '</div></div>';
                });
            }

            if (r.bookings.length) {
                html += '<div class="ms-group">Bookings</div>';
                r.bookings.forEach(function (b) {
                    var title = (b.student_name || 'Student') + (b.student_title ? ' - ' + b.student_title : '');
                    html += '<div class="ms-item" data-nav="booking">' +
                        '<i class="far fa-calendar-alt"></i><div class="ms-main">' +
                        '<span class="ms-title">' + esc(title) + '</span>' +
                        '<span class="ms-sub">' + esc(nice(b)) + '</span>' +
                        '</div></div>';
                });
            }

            if (r.pages.length) {
                html += '<div class="ms-group">Pages</div>';
                r.pages.forEach(function (p) {
                    html += '<div class="ms-item" data-nav="' + p.nav + '">' +
                        '<i class="fas ' + p.icon + '"></i><div class="ms-main">' +
                        '<span class="ms-title">' + esc(p.label) + '</span></div></div>';
                });
            }

            if (!html) html = '<div class="ms-empty">No results for "' + esc(q) + '"</div>';

            panel.innerHTML = html;
            panel.classList.add('show');
        }

        function run() {
            var q = norm(input.value).trim();
            if (!q) { panel.classList.remove('show'); return; }
            loadBookings().then(function () {
                // ignore if the box changed while loading
                if (norm(input.value).trim() !== q) return;
                render(q, search(q));
            });
        }

        input.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(run, 150);
        });

        input.addEventListener('focus', function () {
            if (norm(input.value).trim()) run();
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                panel.classList.remove('show');
                input.blur();
            } else if (e.key === 'Enter') {
                var first = panel.querySelector('.ms-item');
                if (first) goTo(first.getAttribute('data-nav'), input.value.trim());
            }
        });

        panel.addEventListener('click', function (e) {
            var item = e.target.closest('.ms-item');
            if (!item) return;
            goTo(item.getAttribute('data-nav'), input.value.trim());
            panel.classList.remove('show');
        });

        document.addEventListener('click', function (e) {
            if (!wrap.contains(e.target)) panel.classList.remove('show');
        });
    };
})();