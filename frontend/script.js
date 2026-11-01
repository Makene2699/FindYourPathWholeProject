//Register
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    // Show the extra mentor fields only when the role is Mentor
    const roleSelect = document.getElementById('role');
    const mentorFields = document.getElementById('mentorFields');
    const careerFieldInput = document.getElementById('careerField');
    const addressInput = document.getElementById('address');

    if (roleSelect && mentorFields) {
        roleSelect.addEventListener('change', () => {
            const isMentor = roleSelect.value === 'Mentor';
            mentorFields.style.display = isMentor ? 'block' : 'none';
            careerFieldInput.required = isMentor;
            addressInput.required = isMentor;
        });
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        const role = document.getElementById('role').value;
        const cell = document.getElementById('cell').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;
        const careerField = careerFieldInput ? careerFieldInput.value.trim() : '';
        const address = addressInput ? addressInput.value.trim() : '';

        if (!fullname || !role || !cell || !email || !password || !confirm) {
            alert('Please fill all fields');
            return;
        }
        if (role === 'Mentor' && (!careerField || !address)) {
            alert('Mentors must enter their career field and address');
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
            // approval_status is set by the database trigger (mentors start as 'pending')
            career_field: role === 'Mentor' ? careerField : null,
            address: role === 'Mentor' ? address : null,
        });

        if (profileError) {
            alert('Profile save failed: ' + profileError.message);
            return;
        }

        if (role === 'Mentor') {
            // Mentors wait for admin approval, so don't log them in
            await sb.auth.signOut();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('careerUser');
            alert('Thanks! Your mentor application has been submitted and is awaiting admin approval. You will be able to log in once approved.');
            registerForm.reset();
            if (mentorFields) mentorFields.style.display = 'none';
            return;
        }

        window.location.href = 'Dashboard.html';
    });
}

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
            .select('full_name, role, cell_number, email, approval_status')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            await sb.auth.signOut();
            alert('Profile not found');
            return;
        }

        // Block mentors who are not approved yet
        if (profile.role === 'Mentor' && profile.approval_status !== 'approved') {
            await sb.auth.signOut();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('careerUser');
            alert(profile.approval_status === 'rejected'
                ? 'Your mentor application was not approved.'
                : 'Your account is still awaiting admin approval. Please try again later.');
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

        if (profile.role === 'Admin') {
            window.location.href = 'AdminDashboard.html';
        } else if (profile.role === 'Mentor') {
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

    if (careerListItems.length && dynamicTitle) {
        careerListItems.forEach(item => {
            item.addEventListener('click', () => {
                careerListItems.forEach(li => li.classList.remove('active'));
                item.classList.add('active');
                dynamicTitle.innerText = item.innerText.toUpperCase();
            });
        });
    }

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