// components.js

// 1. Function to generate the Top Navigation Bar
function renderTopNav(activePage) {
    return `
    <div class="top-nav">
        <div class="logo-area" onclick="window.location.reload()">
            <img src="PROJECT.png" alt="logo" class="logo-img" onerror="this.src='https://via.placeholder.com/38x38?text=FP'">
            <div class="logo-text">Find<span class="green">Your</span>Path</div>
        </div>

        <div class="nav-middle">
            <a href="Dashboard.html" class="${activePage === 'home' ? 'active' : ''}" data-page="home">Home</a>
            <a href="Mentors.html" class="${activePage === 'mentor' ? 'active' : ''}" data-page="mentor">Find Mentor</a>
            <a href="EncouragementWall.html" class="${activePage === 'encouragement' ? 'active' : ''}" data-page="encouragement">Encouragement</a>
            <a href="InformationTechnology.html" class="${activePage === 'resources' ? 'active' : ''}" data-page="resources">Resources</a>
        </div>

        <div style="display: flex; gap: 16px; align-items: center;">
            <input type="text" class="search-input" id="searchInput" placeholder="Search mentor by name or role...">
            <div class="right-actions">
                <div class="icon-group">
                    <div class="icon-btn" id="notificationBtn" style="position:relative; cursor:pointer;">
                        <i class="far fa-bell"></i>
                        <span class="badge" id="notificationBadge" style="display:none;">0</span>
                    </div>
                    <div class="icon-btn" id="messageBtn" style="position:relative; cursor:pointer;">
                        <i class="far fa-comment-dots"></i>
                        <span class="badge" id="messageBadge" style="display:none;">0</span>
                    </div>
                </div>
                <div class="divider-vertical"></div>
                <div class="profile-preview" id="profileBtn">
                    <img id="profileAvatar" src="https://via.placeholder.com/40" alt="profile">
                    <div class="info">
                        <div class="name" id="profileName">User</div>
                        <div class="role" id="profileRole">...</div>
                    </div>
                    <span class="arrow-down"><i class="fas fa-chevron-down"></i></span>
                </div>
                <div class="dropdown-menu" id="dropdownMenu">
                    <a href="Settings.html"><i class="fas fa-user"></i> My Profile</a>
                    <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Log out</a>
                </div>
            </div>
        </div>

        <!-- CUSTOM NOTIFICATION POPUP -->
        <div id="customNotifPanel" style="display:none; position:absolute; top:70px; right:250px; width:340px; background:white; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); z-index:1000; border:1px solid #e2e8f0; overflow:hidden;">
            <div style="padding:16px; border-bottom:1px solid #f1f5f9; font-weight:700; color:#0f172a; font-size:0.95rem;">Notifications</div>
            <div id="customNotifList" style="max-height:300px; overflow-y:auto;">
                <!-- Populated via JS -->
            </div>
        </div>
    </div>
    `;
}

// 2. Function to generate the Sidebar
function renderSidebar(activePage) {
    return `
    <div class="sidebar">
        <ul>
            <li class="${activePage === 'dashboard' ? 'active' : ''}" data-nav="dashboard"><i class="fas fa-tachometer-alt"></i> Dashboard</li>
            <li class="${activePage === 'messages' ? 'active' : ''}" data-nav="messages"><i class="far fa-envelope"></i> Messages</li>
            <li class="${activePage === 'booking' ? 'active' : ''}" data-nav="booking"><i class="far fa-calendar-alt"></i> Booking</li>
            <li class="${activePage === 'mentors' ? 'active' : ''}" data-nav="mentors"><i class="fas fa-users"></i> Mentors</li>
            <li class="${activePage === 'encouragement' ? 'active' : ''}" data-nav="encouragement"><i class="fas fa-globe"></i> Encouragement Cards</li>
            <li class="${activePage === 'experiences' ? 'active' : ''}" data-nav="experiences"><i class="fas fa-folder-open"></i> Experiences</li>
            <li class="${activePage === 'settings' ? 'active' : ''}" data-nav="settings"><i class="fas fa-cog"></i> Settings</li>
            <li class="${activePage === 'help' ? 'active' : ''}" data-nav="help"><i class="far fa-question-circle"></i> Help & Support</li>
            <li data-nav="logout"><i class="fas fa-sign-out-alt"></i> Log out</li>
        </ul>

        <div class="sidebar-footer" id="aboutFooter">
            <div class="promo-card">
                <div><img src="PROJECT 3 LOGO.png" alt="Profile" class="promo-img" onerror="this.src='https://via.placeholder.com/120x120?text=FP'"></div>
                <div class="promo-text">
                    Real guidance.<br>Local mentors.<br>Brighter futures.
                </div>
            </div>
        </div>
    </div>
    `;
}

// 3. Helper to generate initials avatar
function getInitialsAvatar(name) {
    const safeName = encodeURIComponent(name || 'User');
    return `https://ui-avatars.com/api/?name=${safeName}&background=e2e8f0&color=64748b&bold=true&size=42`;
}

// 4. Function to inject and initialize the UI
function loadLayout(activePage) {
    // Inject HTML
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) headerPlaceholder.innerHTML = renderTopNav(activePage);

    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    if (sidebarPlaceholder) sidebarPlaceholder.innerHTML = renderSidebar(activePage);

    // Load User Data (Add a slight delay to ensure localStorage is ready)
    setTimeout(() => {
        const raw = localStorage.getItem('careerUser');
        if (raw) {
            try {
                const user = JSON.parse(raw);
                const fullName = user.fullname || 'Student';
                
                if (document.getElementById('profileName')) document.getElementById('profileName').textContent = fullName;
                if (document.getElementById('profileRole')) document.getElementById('profileRole').textContent = user.role || 'Student';
                
                if (document.getElementById('profileAvatar')) {
                    const avatarUrl = user.avatar && user.avatar.trim() !== '' 
                        ? user.avatar 
                        : getInitialsAvatar(fullName);
                        
                    document.getElementById('profileAvatar').src = avatarUrl;
                }
            } catch (e) { 
                console.error("Error loading user data", e); 
            }
        }
    }, 100); // 100ms delay to let the DOM settle

    // Initialize Dropdown Logic
    const profileBtn = document.getElementById('profileBtn');
    const dropdown = document.getElementById('dropdownMenu');
    if (profileBtn && dropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => dropdown.classList.remove('show'));
    }

    // Initialize Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('careerUser');
                window.location.href = 'Home.html';
            }
        });
    }

    // Initialize Sidebar Navigation
    document.querySelectorAll('.sidebar li').forEach(item => {
        item.addEventListener('click', () => {
            const navItem = item.dataset.nav;
            const pages = {
                dashboard: 'Dashboard.html', mentors: 'Mentors.html', messages: 'Messages.html',
                booking: 'Booking.html', encouragement: 'EncouragementWall.html',
                experiences: 'ExperianceWall.html', settings: 'Settings.html', help: 'HelpAndSupport.html'
            };
            if (navItem === 'logout') {
                if (confirm('Are you sure you want to log out?')) {
                    localStorage.removeItem('careerUser');
                    window.location.href = 'Home.html';
                }
            } else if (pages[navItem]) {
                window.location.href = pages[navItem];
            }
        });
    });

    // --- INITIALIZE ICONS IMMEDIATELY ---
    const messageBtn = document.getElementById('messageBtn');
    if (messageBtn) messageBtn.addEventListener('click', () => window.location.href = 'Messages.html');

    const notificationBtn = document.getElementById('notificationBtn');
    const notifPanel = document.getElementById('customNotifPanel');
    
    if (notificationBtn && notifPanel) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifPanel.style.display = notifPanel.style.display === 'none' ? 'block' : 'none';
            
            const badge = document.getElementById('notificationBadge');
            if (badge) badge.style.display = 'none';
        });
        
        document.addEventListener('click', () => {
            notifPanel.style.display = 'none';
        });
        notifPanel.addEventListener('click', (e) => e.stopPropagation());
    }

    // Fetch counts from database (with a small delay to allow Supabase to initialize)
    setTimeout(fetchNavData, 500);
}

// 5. Fetch Counts and Populate Notification Panel
    // --- 2. FETCH UNREAD MESSAGES ---
    const { data: myConvs } = await window.sb
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);
    
    const convIds = (myConvs || []).map(c => c.conversation_id);
    let unreadCount = 0;

    if (convIds.length > 0) {
        // Step A: Get all messages sent by the OTHER person in these conversations
        const { data: unreadMsgs } = await window.sb
            .from('messages')
            .select('id')
            .in('conversation_id', convIds)
            .neq('sender_id', user.id); // Exclude my own messages
        
        if (unreadMsgs && unreadMsgs.length > 0) {
            // Step B: Get all the messages I have already read
            const { data: reads } = await window.sb
                .from('message_reads')
                .select('message_id')
                .eq('user_id', user.id);

            const readIds = new Set((reads || []).map(r => r.message_id));
            
            // Step C: Filter out the ones I've read. The remainder is unread.
            unreadCount = unreadMsgs.filter(m => !readIds.has(m.id)).length;
        }
    }

    const msgBadge = document.getElementById('messageBadge');
    if (msgBadge) {
        if (unreadCount > 0) {
            msgBadge.textContent = unreadCount;
            msgBadge.style.display = 'inline-block';
        } else {
            msgBadge.style.display = 'none';
        }
    }

window.refreshNavBadges = fetchNavData;