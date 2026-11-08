/* =========================================================
   HelpAndSupport.js
   ========================================================= */

function toggleFaq(questionEl) {
    const item = questionEl.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const chevron = item.querySelector('.faq-chevron');
    const isOpen = answer.classList.contains('open');

    // Close all other answers
    document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.faq-chevron').forEach(c => c.classList.remove('open'));

    if (!isOpen) {
        answer.classList.add('open');
        chevron.classList.add('open');
    }
}

function getLoggedInName() {
    try {
        const user = JSON.parse(localStorage.getItem('careerUser') || 'null');
        if (user && user.fullname) return user.fullname;
    } catch (e) { /* ignore */ }
    return 'Guest';
}

// ---------- Contact Support (saves to Supabase) ----------
document.getElementById('supBtn')?.addEventListener('click', async () => {
    const typeEl = document.getElementById('issueType');
    const msgEl = document.getElementById('issueMessage');
    const status = document.getElementById('supStatus');
    const btn = document.getElementById('supBtn');

    const subject = typeEl.value;
    const message = msgEl.value.trim();

    if (!subject) {
        status.style.color = '#c53030';
        status.textContent = 'Please select an issue type.';
        return;
    }
    if (!message) {
        status.style.color = '#c53030';
        status.textContent = 'Please describe your issue.';
        return;
    }

    btn.disabled = true;
    status.style.color = '#718096';
    status.textContent = 'Sending...';

    try {
        const { error } = await window.sb
            .from('support_requests')
            .insert({ name: getLoggedInName(), subject, message });

        if (error) throw error;

        status.style.color = '#2e7d32';
        status.textContent = 'Thanks! Your request was sent.';
        typeEl.selectedIndex = 0;
        msgEl.value = '';
    } catch (err) {
        console.error('Could not send support request:', err);
        status.style.color = '#c53030';
        status.textContent = 'Something went wrong: ' + (err.message || 'Please try again.');
    } finally {
        btn.disabled = false;
    }
});

// ---------- Contact Expert (scrolls to the form) ----------
document.getElementById('contactExpertBtn')?.addEventListener('click', () => {
    const form = document.getElementById('reportCard');
    if (!form) return;

    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    form.classList.add('flash');
    setTimeout(() => form.classList.remove('flash'), 1500);

    setTimeout(() => document.getElementById('issueType')?.focus(), 400);
});