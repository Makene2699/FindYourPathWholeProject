(function () {
    async function initStudentBookingNotifications() {
        const bell = document.getElementById('notificationBtn');
        if (!bell || typeof sb === 'undefined') return;

        const badge = bell.querySelector('.badge');
        if (badge) badge.style.display = 'none';   // remove the hard-coded "3"

        /* ---------- styles (so every student page looks the same) ---------- */
        if (!document.getElementById('studentNotifStyles')) {
            const st = document.createElement('style');
            st.id = 'studentNotifStyles';
            st.textContent = `
                .notif-panel{position:fixed;z-index:1000;width:340px;max-height:420px;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.15);display:none;}
                .notif-panel.show{display:block;}
                .notif-head{padding:14px 16px;font-weight:700;border-bottom:1px solid #e2e8f0;color:#0f172a;}
                .notif-empty{padding:24px 16px;color:#64748b;font-size:.85rem;text-align:center;}
                .notif-item{display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:left;}
                .notif-item.unread{background:#f0f9f1;}
                .notif-item img{width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;}
                .notif-body p{font-size:.85rem;margin:0 0 4px;color:#0f172a;line-height:1.4;}
                .notif-time{font-size:.75rem;color:#94a3b8;display:block;margin-bottom:6px;}
                .notif-view{display:inline-block;padding:6px 14px;border:none;border-radius:40px;background:#2e7d32;color:#fff;font-size:.75rem;font-weight:700;cursor:pointer;}
                .notif-view:hover{background:#256528;}
            `;
            document.head.appendChild(st);
        }

        const { data: auth } = await sb.auth.getUser();
        if (!auth || !auth.user) return;
        const userId = auth.user.id;
        const SEEN_KEY = 'seenBookingNotifs:' + userId;

        function getSeen() {
            try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); }
            catch (e) { return []; }
        }
        function markSeen(id) {
            const seen = getSeen();
            if (!seen.includes(id)) {
                seen.push(id);
                try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) { /* ignore */ }
            }
        }

        let items = [];

        const panel = document.createElement('div');
        panel.className = 'notif-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(panel);

        bell.setAttribute('aria-haspopup', 'true');
        bell.setAttribute('aria-expanded', 'false');

        function make(tag, cls) {
            const e = document.createElement(tag);
            if (cls) e.className = cls;
            return e;
        }

        function unreadCount() {
            const seen = getSeen();
            return items.filter(b => !seen.includes(b.id)).length;
        }

        function updateBadge() {
            const n = unreadCount();
            if (badge) {
                badge.textContent = n > 9 ? '9+' : String(n);
                badge.style.display = n ? '' : 'none';
            }
            bell.setAttribute('aria-label', n ? 'Notifications (' + n + ' new)' : 'Notifications');
        }

        function slotText(b) {
            const d = new Date(b.session_date + 'T00:00');
            const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
            return day + ', ' + to12h(b.start_time);
        }

        function buildItem(b) {
            const unread = !getSeen().includes(b.id);
            const row = make('div', 'notif-item' + (unread ? ' unread' : ''));

            const img = make('img');
            img.src = initialsAvatar(b.mentor_name);
            img.alt = '';
            mentorPhotoUrl(b.mentor_id).then(url => { if (url) img.src = url; });

            const body = make('div', 'notif-body');
            const text = make('p');
            const who = make('strong');
            who.textContent = b.mentor_name;
            text.append(who, ' has confirmed your booking for ' + slotText(b) + '. To view the booking, click the button below.');

            const time = make('span', 'notif-time');
            time.textContent = timeAgo(b.updated_at || b.created_at);

            const btn = make('button', 'notif-view');
            btn.type = 'button';
            btn.textContent = 'View booking';
            btn.addEventListener('click', () => {
                markSeen(b.id);
                items = items.filter(x => x.id !== b.id);
                updateBadge();
                window.location.href = 'details.html?id=' + encodeURIComponent(b.id);
            });

            body.append(text, time, btn);
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
                empty.textContent = 'You are all caught up. When a mentor confirms a booking it will show up here.';
                panel.appendChild(empty);
                return;
            }
            items.forEach(b => panel.appendChild(buildItem(b)));
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
                const today = localToday();
                const nowTime = new Date().toTimeString().slice(0, 8);
                const seen = getSeen();
                const { data, error } = await sb.from('bookings')
                    .select('*')
                    .eq('student_id', userId)
                    .eq('status', 'confirmed')
                    .gte('session_date', today)
                    .order('session_date', { ascending: true })
                    .order('start_time', { ascending: true });
                if (error) throw error;

                items = (data || []).filter(b =>
                    !seen.includes(b.id) &&
                    (b.session_date > today || (b.end_time && b.end_time > nowTime)));

                updateBadge();
                if (panel.classList.contains('show')) render();
            } catch (e) {
                console.error('Could not load notifications:', e);
            }
        }

        await load();

        sb.channel('student-booking-notifs')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'bookings', filter: 'student_id=eq.' + userId },
                load)
            .subscribe();

        window.addEventListener('focus', load);
        setInterval(load, 30000);
    }

    initStudentBookingNotifications();
})();