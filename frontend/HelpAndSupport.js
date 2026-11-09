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

// ---------- Search (only filters the FAQs that exist on the page) ----------
(function initHelpSearch() {
    const input = document.getElementById('helpSearch');
    const clearBtn = document.getElementById('helpSearchClear');
    const noResults = document.getElementById('faqNoResults');
    const noResultsTerm = document.getElementById('faqNoResultsTerm');
    if (!input) return;

    const items = Array.from(document.querySelectorAll('.faq-item'));
    // Remember original question text so highlights can be removed cleanly
    items.forEach(item => {
        item.dataset.question = item.querySelector('.faq-question-left span').textContent;
    });

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }
    function escapeRegex(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function runSearch() {
        const raw = input.value.trim();
        const terms = raw.toLowerCase().split(/\s+/).filter(Boolean);
        clearBtn.hidden = raw === '';
        let visible = 0;

        items.forEach(item => {
            const qEl = item.querySelector('.faq-question-left span');
            const answerEl = item.querySelector('.faq-answer');
            const chevron = item.querySelector('.faq-chevron');
            const question = item.dataset.question;
            const haystack = (question + ' ' + answerEl.textContent).toLowerCase();
            const match = terms.every(t => haystack.includes(t));

            item.style.display = match ? '' : 'none';
            if (match) visible++;

            // Highlight matches in the question
            if (terms.length) {
                const re = new RegExp('(' + terms.map(escapeRegex).join('|') + ')', 'gi');
                qEl.innerHTML = escapeHtml(question).replace(re, '<mark class="search-hit">$1</mark>');
            } else {
                qEl.textContent = question;
            }

            // Open matching answers while searching, close everything when cleared
            const open = terms.length > 0 && match;
            answerEl.classList.toggle('open', open);
            chevron.classList.toggle('open', open);
        });

        noResults.hidden = !(terms.length > 0 && visible === 0);
        noResultsTerm.textContent = raw;
    }

    input.addEventListener('input', runSearch);
    input.addEventListener('keydown', e => {
        if (e.key === 'Escape') { input.value = ''; runSearch(); }
    });
    clearBtn.addEventListener('click', () => {
        input.value = '';
        runSearch();
        input.focus();
    });
})();