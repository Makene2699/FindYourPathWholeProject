// ---------- Contact Support (saves the issue to Supabase) ----------
document.getElementById('supBtn').addEventListener('click', async () => {
    const typeEl = document.getElementById('issueType');
    const msgEl = document.getElementById('issueMessage');
    const status = document.getElementById('supStatus');
    const btn = document.getElementById('supBtn');

    const subject = typeEl.value;
    const message = msgEl.value.trim();

    if (!subject) { status.style.color = '#c53030'; status.textContent = 'Please select an issue type.'; return; }
    if (!message) { status.style.color = '#c53030'; status.textContent = 'Please describe your issue.'; return; }

    btn.disabled = true;
    status.style.color = '#718096';
    status.textContent = 'Sending...';

    const { error } = await window.sb
        .from('support_requests')
        .insert({ name: 'Angle M.', subject, message });

    btn.disabled = false;

    if (error) {
        console.error('Could not send:', error);
        status.style.color = '#c53030';
        status.textContent = 'Something went wrong: ' + error.message;
        return;
    }

    status.style.color = '#2d7a4f';
    status.textContent = 'Thanks! Your request was sent.';
    typeEl.selectedIndex = 0;
    msgEl.value = '';
});

// ---------- Contact Expert (scrolls to the form and focuses it) ----------
document.getElementById('contactExpertBtn').addEventListener('click', () => {
    const form = document.querySelector('.report-card');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Briefly highlight the form so the user sees where to write
    form.classList.add('flash');
    setTimeout(() => form.classList.remove('flash'), 1500);

    setTimeout(() => document.getElementById('issueType').focus(), 400);
});