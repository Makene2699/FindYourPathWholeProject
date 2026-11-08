/* =====================================================================
   studentLayout.js
   ONE script for every student page (FindYourPath).
   Provides: top nav bar, sidebar, profile name/photo, message and
   notification badges, logout, and the "Welcome back" title.
   It also loads studentLayout.css automatically (same folder).

   USAGE (every student page):

     <head>
       <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
       <link rel="stylesheet" href="YourPageStyleSheet.css">
       <script src="studentLayout.js"></script>
     </head>
     <body>
       <student-header active-page="home"></student-header>
       <div class="main-layout">
         <student-sidebar active="dashboard"></student-sidebar>
         ...page content...
       </div>

       <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
       <script src="supabaseClient.js"></script>
     </body>

   <student-header> attributes
     active-page = home | mentor | encouragement | resources
     no-search   (hides the search box)

   <student-sidebar> attributes
     active = dashboard | messages | booking | mentors | encouragement |
              experiences | settings | help
   ===================================================================== */

(function () {
    'use strict';

    // Guard: if this file is loaded twice, do nothing the second time
    if (window.__studentLayoutLoaded) return;
    window.__studentLayoutLoaded = true;

    const LOGIN_PAGE = 'Register.html';
    const LOGOUT_REDIRECT = 'Home.html';
    const HOME_PAGE = 'Dashboard.html';

    const AVATAR_COLUMNS = ['avatar_url', 'avatar', 'profile_picture', 'profile_image', 'photo_url', 'image_url'];

    /* ---------------------------------------------------------------
       Load the shared CSS from the same folder as this script
       --------------------------------------------------------------- */

    /* Top navigation links */
    const TOP_LINKS = [
        { key: 'home', label: 'Home', href: 'Dashboard.html' },
        { key: 'mentor', label: 'Find Mentor', href: 'Mentors.html' },
        { key: 'encouragement', label: 'Encouragement', href: 'EncouragementWall.html' },
        { key: 'resources', label: 'Resources', href: 'InformationTechnology.html' }
    ];

    /* Sidebar items. href === null means "run the logout flow". */
    const SIDE_ITEMS = [
        { key: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard', href: 'Dashboard.html' },
        { key: 'messages', icon: 'far fa-envelope', label: 'Messages', href: 'Messages.html' },
        { key: 'booking', icon: 'far fa-calendar-alt', label: 'Booking', href: 'Booking.html' },
        { key: 'mentors', icon: 'fas fa-users', label: 'Mentors', href: 'Mentors.html' },
        { key: 'encouragement', icon: 'fas fa-globe', label: 'Encouragement Cards', href: 'EncouragementWall.html' },
        { key: 'experiences', icon: 'fas fa-folder-open', label: 'Experiences', href: 'ExperienceWall.html' },
        { key: 'settings', icon: 'fas fa-cog', label: 'Settings', href: 'Settings.html' },
        { key: 'help', icon: 'far fa-question-circle', label: 'Help &amp; Support', href: 'HelpAndSupport.html' },
        { key: 'logout', icon: 'fas fa-sign-out-alt', label: 'Log out', href: null }
    ];

    /* ---------------------------------------------------------------
       Helpers
       --------------------------------------------------------------- */
    function getStoredUser() {
        try {
            return JSON.parse(localStorage.getItem('careerUser'));
        } catch (e) {
            return null;
        }
    }

    // Round placeholder picture with the person's initials (data URI)
    function initialsAvatar(name) {
        const initials = (name || '').trim().split(/\s+/).filter(Boolean)
            .map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
        const safe = initials.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const palette = ['#0f2744', '#2e7d32', '#7c3aed', '#0284c7', '#ea580c', '#be185d'];
        let h = 0;
        for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
            '<rect width="100" height="100" fill="' + palette[h % palette.length] + '"/>' +
            '<text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" ' +
            'font-size="40" font-weight="700" fill="#ffffff">' + safe + '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    // supabaseClient.js loads at the bottom of the page, so wait for it
    function whenSupabase(cb, tries) {
        if (tries === undefined) tries = 50;
        const client = (typeof sb !== 'undefined') ? sb : window.sb;
        if (client) cb(client);
        else if (tries > 0) setTimeout(() => whenSupabase(cb, tries - 1), 100);
    }

    async function handleLogout() {
        if (!confirm('Are you sure you want to log out?')) return;

        try {
            if (typeof sb !== 'undefined') await sb.auth.signOut();
            else if (window.sb) await window.sb.auth.signOut();
        } catch (e) {
            console.error('Sign out failed:', e);
        }
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('careerUser');
        window.location.href = LOGOUT_REDIRECT;
    }
    // Other scripts on the page may call handleLogout()
    window.handleLogout = handleLogout;

    /* ---------------------------------------------------------------
       HEADER (top navigation bar)
       --------------------------------------------------------------- */
    class StudentHeader extends HTMLElement {
        connectedCallback() {
            const activePage = this.getAttribute('active-page') || '';
            const showSearch = !this.hasAttribute('no-search');

            const linksHtml = TOP_LINKS.map(l =>
                `<a href="${l.href}" data-page="${l.key}"${l.key === activePage ? ' class="active"' : ''}>${l.label}</a>`
            ).join('');

            const searchHtml = showSearch
                ? '<input type="text" class="search-input" id="searchInput" placeholder="Search mentor by name or role...">'
                : '';

            this.innerHTML = `
            <div class="top-nav">
                <div class="logo-area" id="logoArea">
                    <img src="PROJECT.png" alt="logo" class="logo-img"
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/38x38?text=FP'">
                    <div class="logo-text">Find<span class="green">Your</span>Path</div>
                </div>

                <div class="nav-middle">${linksHtml}</div>

                <div style="display: flex; gap: 16px; align-items: center;">
                    ${searchHtml}
                    <div class="right-actions">
                        <div class="icon-group">
                            <div class="icon-btn" id="notificationBtn">
                                <i class="far fa-bell"></i>
                                <span class="badge" id="notificationBadge" style="display:none"></span>
                            </div>
                            <div class="icon-btn" id="messageBtn">
                                <i class="far fa-comment-dots"></i>
                                <span class="badge" id="messageBadge" style="display:none"></span>
                            </div>
                        </div>
                        <div class="divider-vertical"></div>
                        <div class="profile-preview" id="profileBtn">
                            <img id="profileAvatar" src="Polygon 1.png" alt="profile">
                            <div class="info">
                                <div class="name" id="profileName">Student</div>
                                <div class="role" id="profileRole">Student</div>
                            </div>
                            <span class="arrow-down"><i class="fas fa-chevron-down"></i></span>
                        </div>
                        <div class="dropdown-menu" id="dropdownMenu">
                            <a href="Settings.html"><i class="fas fa-user"></i> My Profile</a>
                            <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Log out</a>
                        </div>
                    </div>
                </div>
            </div>`;

            this.bindLogo();
            this.bindDropdown();
            this.bindLogout();
            this.bindIcons();
            this.fillUser();
            this.initBadges();
        }

        bindLogo() {
            this.querySelector('#logoArea').addEventListener('click', () => {
                const here = location.pathname.split('/').pop();
                if (here === HOME_PAGE) location.reload();
                else location.href = HOME_PAGE;
            });
        }

        bindDropdown() {
            const profileBtn = this.querySelector('#profileBtn');
            const dropdown = this.querySelector('#dropdownMenu');

            profileBtn.addEventListener('click', e => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });
            document.addEventListener('click', () => dropdown.classList.remove('show'));
        }

        bindLogout() {
            this.querySelector('#logoutBtn').addEventListener('click', e => {
                e.preventDefault();   // href="#" would otherwise jump to the top
                handleLogout();
            });
        }

        bindIcons() {
            // Message icon opens the Messages page
            this.querySelector('#messageBtn').addEventListener('click', () => {
                window.location.href = 'Messages.html';
            });

            // Bell: mark the current notifications as seen and hide the badge
            this.querySelector('#notificationBtn').addEventListener('click', async () => {
                const client = this._client;
                const userId = this._userId;
                const badge = this.querySelector('#notificationBadge');
                if (badge) badge.style.display = 'none';
                if (!client || !userId) return;

                try {
                    const { data } = await client
                        .from('connections')
                        .select('id')
                        .eq('student_id', userId)
                        .in('status', ['approved', 'rejected', 'declined']);
                    const key = `seenNotifs_${userId}`;
                    const seen = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
                    (data || []).forEach(n => seen.add(n.id));
                    localStorage.setItem(key, JSON.stringify([...seen]));
                } catch (e) {
                    console.error('Could not mark notifications as seen:', e);
                }
            });
        }

        fillUser() {
            const user = getStoredUser();
            if (!user) {
                window.location.href = LOGIN_PAGE;
                return;
            }

            const fullName = user.fullname || 'Student';
            const nameEl = this.querySelector('#profileName');
            const roleEl = this.querySelector('#profileRole');
            const avatarEl = this.querySelector('#profileAvatar');

            // Name, role and cached photo show straight away
            nameEl.textContent = fullName;
            roleEl.textContent = user.role || 'Student';

            const fallback = initialsAvatar(fullName);
            avatarEl.onerror = () => { avatarEl.onerror = null; avatarEl.src = fallback; };
            avatarEl.src = user.avatar || fallback;

            // Then the real photo and name come from the database
            whenSupabase(async client => {
                try {
                    const { data } = await client.auth.getUser();
                    if (!data || !data.user) return;

                    const { data: prof } = await client.from('profiles')
                        .select('*').eq('id', data.user.id).maybeSingle();
                    if (!prof) return;

                    const col = AVATAR_COLUMNS.find(c => prof[c]);
                    if (col) avatarEl.src = prof[col];
                    if (prof.full_name) nameEl.textContent = prof.full_name;
                } catch (e) {
                    console.error('Could not load profile picture:', e);
                }
            });
        }

        initBadges() {
            whenSupabase(async client => {
                try {
                    const { data: auth } = await client.auth.getUser();
                    const user = auth && auth.user;
                    if (!user) return;

                    this._client = client;
                    this._userId = user.id;

                    const msgBadge = this.querySelector('#messageBadge');
                    const notifBadge = this.querySelector('#notificationBadge');

                    // --- 1. UNREAD MESSAGES ---
                    const { data: myConvs } = await client
                        .from('conversation_participants')
                        .select('conversation_id')
                        .eq('user_id', user.id);

                    const convIds = (myConvs || []).map(c => c.conversation_id);
                    let unreadCount = 0;

                    if (convIds.length > 0) {
                        const { data: unreadMsgs } = await client
                            .from('messages')
                            .select('id')
                            .in('conversation_id', convIds)
                            .neq('sender_id', user.id);

                        if (unreadMsgs && unreadMsgs.length > 0) {
                            const { data: reads } = await client
                                .from('message_reads')
                                .select('message_id')
                                .eq('user_id', user.id);

                            const readIds = new Set((reads || []).map(r => r.message_id));
                            unreadCount = unreadMsgs.filter(m => !readIds.has(m.id)).length;
                        }
                    }

                    if (msgBadge) {
                        if (unreadCount > 0) {
                            msgBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                            msgBadge.style.display = 'inline-block';
                        } else {
                            msgBadge.style.display = 'none';
                        }
                    }

                    // --- 2. NOTIFICATIONS (connection updates not yet seen) ---
                    const myProfile = getStoredUser() || {};
                    const role = (myProfile.role || '').toLowerCase();
                    if (role === 'youth' || role === 'student') {
                        const { data: notifs } = await client
                            .from('connections')
                            .select('id')
                            .eq('student_id', user.id)
                            .in('status', ['approved', 'rejected', 'declined']);

                        const seen = JSON.parse(localStorage.getItem(`seenNotifs_${user.id}`) || '[]');
                        const unseen = (notifs || []).filter(n => !seen.includes(n.id));

                        if (notifBadge) {
                            if (unseen.length > 0) {
                                notifBadge.textContent = unseen.length > 9 ? '9+' : unseen.length;
                                notifBadge.style.display = 'inline-block';
                            } else {
                                notifBadge.style.display = 'none';
                            }
                        }
                    }
                } catch (e) {
                    console.error('Could not load badges:', e);
                }
            });
        }
    }

    /* ---------------------------------------------------------------
       SIDEBAR
       --------------------------------------------------------------- */
    class StudentSidebar extends HTMLElement {
        connectedCallback() {
            const active = this.getAttribute('active') || '';

            const itemsHtml = SIDE_ITEMS.map(item => `
                <li${item.key === active ? ' class="active"' : ''} data-nav="${item.key}">
                    <i class="${item.icon}"></i> ${item.label}
                </li>`).join('');

            this.innerHTML = `
            <div class="sidebar">
                <ul>${itemsHtml}</ul>

                <div class="sidebar-footer" id="aboutFooter">
                    <div class="promo-card">
                        <div><img src="PROJECT 3 LOGO.png" alt="Profile" class="promo-img"></div>
                        <div class="promo-text">
                            Real guidance.<br>Local mentors.<br>Brighter futures.
                        </div>
                    </div>
                </div>
            </div>`;

            this.querySelector('ul').addEventListener('click', e => {
                const li = e.target.closest('li[data-nav]');
                if (!li) return;

                const item = SIDE_ITEMS.find(i => i.key === li.dataset.nav);
                if (!item) return;

                if (item.href === null) {      // log out
                    handleLogout();
                    return;
                }
                window.location.href = item.href;
            });
        }
    }

    if (!customElements.get('student-header')) customElements.define('student-header', StudentHeader);
    if (!customElements.get('student-sidebar')) customElements.define('student-sidebar', StudentSidebar);

    /* ---------------------------------------------------------------
       "Welcome back, <name>!" for pages that have #welcomeTitle
       --------------------------------------------------------------- */
    document.addEventListener('DOMContentLoaded', () => {
        const title = document.getElementById('welcomeTitle');
        const user = getStoredUser();
        if (!title || !user) return;

        const firstName = (user.fullname || 'Student').split(' ')[0];
        title.textContent = `Welcome back, ${firstName}!`;
    });

    /* Shared helpers other scripts on the page may use */
    window.initialsAvatar = window.initialsAvatar || initialsAvatar;
})();