/* =====================================================================
   student-layout.js
   Shared top navigation bar + sidebar for all student pages
   (FindYourPath).

   USAGE (in every student page):

     <head>
       ...
       <link rel="stylesheet" href="student-layout.css">
       <link rel="stylesheet" href="YourPageStyleSheet.css">
       <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
       <script src="student-layout.js"></script>
     </head>
     <body>
       <student-header active-page="home"></student-header>

       <div class="main-layout">
         <student-sidebar active="dashboard"></student-sidebar>
       </div>

       ...page specific content...

       <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
       <script src="supabaseClient.js"></script>
       <script src="bookings.js"></script>
       ...
     </body>

   <student-header> attributes
     active-page = home | mentor | encouragement | resources   (top links)
     no-search                                                 (hides the search box)

   <student-sidebar> attributes
     active = dashboard | messages | booking | mentors | encouragement |
              experiences | settings | help

   Everything (dropdown, logout, sidebar links, name/role/avatar) wires
   itself up. If the page has an element with id="welcomeTitle" it is
   filled with "Welcome back, <first name>!".
   ===================================================================== */

(function () {
    'use strict';

    const LOGIN_PAGE = 'Register.html';
    const LOGOUT_REDIRECT = 'Home.html';
    const HOME_PAGE = 'Dashboard.html';

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
        { key: 'experiences', icon: 'fas fa-folder-open', label: 'Experiences', href: 'ExperianceWall.html' },
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

    function avatarFor(user, fullName) {
        if (user && user.avatar) return user.avatar;
        return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName) +
            '&background=e2e8f0&color=64748b';
    }

    async function handleLogout() {
        if (!confirm('Are you sure you want to log out?')) return;

        try {
            if (typeof sb !== 'undefined') await sb.auth.signOut();
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
                                <span class="badge" id="notificationBadge">3</span>
                            </div>
                            <div class="icon-btn" id="messageBtn">
                                <i class="far fa-comment-dots"></i>
                                <span class="badge" id="messageBadge" style="display: none;">0</span>
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

            this.initBadges();

            this.bindLogo();
            this.bindDropdown();
            this.bindLogout();
            this.fillUser();
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

        fillUser() {
            const user = getStoredUser();
            if (!user) {
                window.location.href = LOGIN_PAGE;
                return;
            }

            const fullName = user.fullname || 'Student';
            this.querySelector('#profileName').textContent = fullName;
            this.querySelector('#profileRole').textContent = user.role || 'Student';
            this.querySelector('#profileAvatar').src = avatarFor(user, fullName);
        }

        async initBadges() {
            if (typeof window.sb === 'undefined') {
                setTimeout(() => this.initBadges(), 500);
                return;
            }

            const { data: { user } } = await window.sb.auth.getUser();
            if (!user) return;

            const msgBadge = this.querySelector('#messageBadge');
            const notifBadge = this.querySelector('#notificationBadge');

            // Hide them initially
            if (msgBadge) msgBadge.style.display = 'none';
            if (notifBadge) notifBadge.style.display = 'none';

            // --- 1. COUNT UNREAD MESSAGES ---
            const { data: myConvs } = await window.sb
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', user.id);

            const convIds = (myConvs || []).map(c => c.conversation_id);
            let unreadCount = 0;

            if (convIds.length > 0) {
                const { data: unreadMsgs } = await window.sb
                    .from('messages')
                    .select('id')
                    .in('conversation_id', convIds)
                    .neq('sender_id', user.id);

                if (unreadMsgs && unreadMsgs.length > 0) {
                    const { data: reads } = await window.sb
                        .from('message_reads')
                        .select('message_id')
                        .eq('user_id', user.id);

                    const readIds = new Set((reads || []).map(r => r.message_id));
                    unreadCount = unreadMsgs.filter(m => !readIds.has(m.id)).length;
                }
            }

            // Show the message badge
            if (msgBadge && unreadCount > 0) {
                msgBadge.textContent = unreadCount;
                msgBadge.style.display = 'inline-block';
            }

            // --- 2. COUNT NOTIFICATIONS (APPROVED MENTORS) ---
            const myProfile = JSON.parse(localStorage.getItem('careerUser') || '{}');
            if (myProfile.role?.toLowerCase() === 'youth') {
                const { data: notifs } = await window.sb
                    .from('connections')
                    .select('id')
                    .eq('student_id', user.id)
                    .in('status', ['approved', 'rejected', 'declined']);

                if (notifs && notifs.length > 0) {
                    const seenNotifs = JSON.parse(localStorage.getItem(`seenNotifs_${user.id}`) || '[]');
                    const unreadNotifs = notifs.filter(n => !seenNotifs.includes(n.id));

                    if (notifBadge && unreadNotifs.length > 0) {
                        notifBadge.textContent = unreadNotifs.length;
                        notifBadge.style.display = 'inline-block';
                    }
                }
            }
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

    customElements.define('student-header', StudentHeader);
    customElements.define('student-sidebar', StudentSidebar);

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
})();