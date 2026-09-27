
//Register
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        const role = document.getElementById('role').value;
        const cell = document.getElementById('cell').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (!fullname || !role || !cell || !email || !password || !confirm) {
            alert('Please fill all fields');
            return;
        }
        if (password !== confirm) {
            alert('Passwords do not match!');
            return;
        }
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        const { data: authData, error: authError } = await sb.auth.signUp({
            email,
            password,
        });

        if (authError) {
            alert(authError.message);
            return;
        }

        if (!authData.user) {
            alert('Check your email to confirm your account before logging in.');
            return;
        }

        const { error: profileError } = await sb.from('profiles').insert({
            id: authData.user.id,
            full_name: fullname,
            role: role,
            cell_number: cell,
            email: email,
        });

        if (profileError) {
            alert('Profile save failed: ' + profileError.message);
            return;
        }

        if (role === 'Mentor') {
            window.location.href = 'MentorDashboard.html';
        } else {
            window.location.href = 'Dashboard.html';
        }
    });
}

// Login
const loginForm = document.getElementById('loginForm');
const loginLink = document.getElementById('toggle-login-link');
const modal = document.getElementById('login-modal');
const closeBtn = document.querySelector('.close');

if (loginLink && modal) {
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
    });
}

if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        const { data, error } = await sb.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert('Invalid email or password');
            return;
        }

        const { data: profile, error: profileError } = await sb
            .from('profiles')
            .select('full_name, role, cell_number, email')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            alert('Profile not found');
            return;
        }

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem(
            'careerUser',
            JSON.stringify({
                fullname: profile.full_name,
                role: profile.role,
                cell: profile.cell_number,
                email: profile.email,
                id: data.user.id,
            })
        );

        if (profile.role === 'Mentor') {
            window.location.href = 'MentorDashboard.html';
        } else {
            window.location.href = 'Dashboard.html';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const careerListItems = document.querySelectorAll('.career-nav ul li');
    const dynamicTitle = document.getElementById('dynamicTitle');
    const careerSearchInput = document.getElementById('careerFilter');
    const sidebarMenuItems = document.querySelectorAll('.side-menu li');

    // Only runs on pages that have the career list
    if (careerListItems.length && dynamicTitle) {
        careerListItems.forEach(item => {
            item.addEventListener('click', () => {
                careerListItems.forEach(li => li.classList.remove('active'));
                item.classList.add('active');
                dynamicTitle.innerText = item.innerText.toUpperCase();
            });
        });
    }

    // Only runs if search input exists
    if (careerSearchInput) {
        careerSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            careerListItems.forEach(item => {
                const text = item.innerText.toLowerCase();
                item.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }

    if (sidebarMenuItems.length) {
        sidebarMenuItems.forEach(menuItem => {
            menuItem.addEventListener('click', () => {
                if (!menuItem.classList.contains('menu-divider')) {
                    sidebarMenuItems.forEach(i => i.classList.remove('active'));
                    menuItem.classList.add('active');
                }
            });
        });
    }

    const exploreBtn = document.querySelector('.btn-industry');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            alert('Redirecting to the Industry Directory...');
        });
    }
});