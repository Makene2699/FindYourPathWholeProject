/* =====================================================
   FindYourPath — suggestedMentors.js  (for Dashboard.html)
   Fills the "Suggested Mentors" card with people who
   registered as mentors. Load it AFTER bookings.js so it
   replaces the old initSuggestedMentors().
   ===================================================== */
(function () {
  const VIEW = 'mentors_public';            // same view Mentors.js uses
  const COLUMNS = 'id, full_name';          // add job_title, company once they are in the view
  const HOW_MANY = 3;

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const avatar = (name) => 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=e8f5e9&color=2e7d32';

  window.initSuggestedMentors = async function () {
    const box = document.querySelector('.suggested-mentors');
    if (!box) return;
    box.querySelectorAll('.mentor-item, .mentor-empty').forEach((el) => el.remove());

    const client = window.sb || (typeof sb !== 'undefined' ? sb : null);
    const note = (text) => box.insertAdjacentHTML('beforeend', `<p class="mentor-empty" style="padding:16px;color:#5b6e8c;font-size:.85rem;">${text}</p>`);
    if (!client) { note('Mentors are unavailable right now.'); return; }

    const { data, error } = await client.from(VIEW).select(COLUMNS);
    if (error) { console.error('Suggested mentors failed:', error); note('Could not load mentors.'); return; }

    let me = null;
    try { me = JSON.parse(localStorage.getItem('careerUser') || 'null'); } catch { /* ignore */ }

    const list = (data || [])
      .filter((m) => !me || String(m.id) !== String(me.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, HOW_MANY);

    if (!list.length) { note('No mentors have registered yet.'); return; }

    box.insertAdjacentHTML('beforeend', list.map((m) => {
      const name = m.full_name || 'Mentor';
      const title = [m.job_title, m.company].filter(Boolean).join(' | ') || 'Mentor';
      return `<div class="mentor-item">
        <img src="${esc(avatar(name))}" alt="">
        <div class="mentor-info"><h4>${esc(name)}</h4><p>${esc(title)}</p></div>
        <a href="MentorProfileView.html?id=${encodeURIComponent(m.id)}" class="connect-btn">Connect</a>
      </div>`;
    }).join(''));
  };
})();