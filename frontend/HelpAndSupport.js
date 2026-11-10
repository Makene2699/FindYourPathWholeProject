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

// ---------- Search the FAQs ----------
(function initHelpSearch() {
    const input = document.getElementById('helpSearchInput');
    if (!input) return;

    const clearBtn = document.getElementById('helpSearchClear');
    const countEl = document.getElementById('faqResultCount');
    const noResults = document.getElementById('faqNoResults');
    const noResultsTerm = document.getElementById('faqNoResultsTerm');
    const items = Array.from(document.querySelectorAll('.faq-item'));

    // Extra words that should also find an FAQ (synonyms people might type)
    const EXTRA_KEYWORDS = [
        'mentor mentors connect connection request browse filter skill industry location',
        'book booking session schedule appointment time slot calendar meeting',
        'goal goals track tracking progress milestone dashboard',
        'community join encouragement experiences discussion peers group',
        'profile update edit avatar photo bio skills preferences settings account picture'
    ];

    // Remember original question text so highlights can be removed
    const data = items.map((item, i) => {
        const qSpan = item.querySelector('.faq-question-left span');
        const answer = item.querySelector('.faq-answer');
        return {
            item,
            qSpan,
            questionText: qSpan.textContent,
            haystack: (qSpan.textContent + ' ' + answer.textContent + ' ' + (EXTRA_KEYWORDS[i] || '')).toLowerCase()
        };
    });

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlight(text, words) {
        const safe = escapeHtml(text);
        if (!words.length) return safe;
        const pattern = new RegExp('(' + words.map(w => escapeRegex(escapeHtml(w))).join('|') + ')', 'gi');
        return safe.replace(pattern, '<mark class="search-hit">$1</mark>');
    }

    function closeAllAnswers() {
        document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
        document.querySelectorAll('.faq-chevron').forEach(c => c.classList.remove('open'));
    }

    function runSearch() {
        const raw = input.value.trim();
        const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
        clearBtn.hidden = raw === '';

        // Empty search: reset everything
        if (!words.length) {
            data.forEach(d => {
                d.item.hidden = false;
                d.qSpan.textContent = d.questionText;
            });
            countEl.hidden = true;
            noResults.hidden = true;
            return;
        }

        let matches = 0;
        let lastMatch = null;

        data.forEach(d => {
            const isMatch = words.every(w => d.haystack.includes(w));
            d.item.hidden = !isMatch;
            if (isMatch) {
                matches++;
                lastMatch = d;
                d.qSpan.innerHTML = highlight(d.questionText, words);
            } else {
                d.qSpan.textContent = d.questionText;
            }
        });

        noResults.hidden = matches !== 0;
        noResultsTerm.textContent = raw;

        countEl.hidden = matches === 0;
        countEl.textContent = matches + (matches === 1 ? ' result' : ' results') + ' for "' + raw + '"';

        // Close open answers; if there is exactly one hit, open it for the user
        closeAllAnswers();
        if (matches === 1 && lastMatch) {
            lastMatch.item.querySelector('.faq-answer').classList.add('open');
            lastMatch.item.querySelector('.faq-chevron').classList.add('open');
        }
    }

    input.addEventListener('input', runSearch);

    input.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            input.value = '';
            runSearch();
        }
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        runSearch();
        input.focus();
    });
})();