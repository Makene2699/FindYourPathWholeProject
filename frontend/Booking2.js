import { supabase } from './supabaseClientModule.js';

let currentUserId = null;
let currentStudentName = 'A Student';

// --- TOGGLE SWITCH LOGIC ---
window.switchTab = function(tabName) {
    const btnBook = document.getElementById('btn-book');
    const btnSessions = document.getElementById('btn-sessions');
    const tabBook = document.getElementById('tab-book');
    const tabSessions = document.getElementById('tab-sessions');
    const pillToggle = document.getElementById('pillToggle');

    tabBook.classList.remove('active');
    tabSessions.classList.remove('active');
    btnBook.classList.remove('active');
    btnSessions.classList.remove('active');

    if (tabName === 'book') {
        tabBook.classList.add('active');
        btnBook.classList.add('active');
        pillToggle.classList.remove('sessions-active');
    } else if (tabName === 'sessions') {
        tabSessions.classList.add('active');
        btnSessions.classList.add('active');
        pillToggle.classList.add('sessions-active');
    }
};

// --- INIT ---
async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'Login.html';
        return;
    }
    currentUserId = user.id;
    
    const raw = localStorage.getItem('careerUser');
    if (raw) {
        currentStudentName = JSON.parse(raw).fullname || 'A Student';
    }

    loadBookingMentors();
    loadPublicSessions();
}

// --- TAB 1: LOAD MENTORS ---
async function loadBookingMentors() {
    const grid = document.getElementById('bookingGrid');
    
    try {
        const { data: connections, error } = await supabase
            .from('connections')
            .select('mentor_id')
            .eq('student_id', currentUserId)
            .eq('status', 'approved');

        if (error) throw error;

        if (!connections || connections.length === 0) {
            grid.innerHTML = `<div style="padding:20px; color:#64748b;">You are not connected to any mentors yet.</div>`;
            return;
        }

        const mentorIds = connections.map(c => c.mentor_id);

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .in('id', mentorIds);

        grid.innerHTML = profiles.map(mentor => `
            <div class="mentor-card">
                <div class="mentor-info">
                    <img src="${mentor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.full_name)}&background=e2e8f0&color=64748b&bold=true`}" alt="${mentor.full_name}">
                    <div>
                        <h3>${mentor.full_name}</h3>
                        <p>${mentor.role || 'Mentor'}</p>
                    </div>
                </div>
                <button class="open-modal-btn" onclick="openPrivateModal('${mentor.id}', '${mentor.full_name.replace(/'/g, "\\'")}')">Book</button>
            </div>
        `).join('');
        
    } catch (err) {
        console.error("Load Error:", err);
        grid.innerHTML = `<div style="padding:20px; color:#dc2626;">Failed to load: ${err.message}</div>`;
    }
}

// --- OPEN PRIVATE BOOKING MODAL ---
window.openPrivateModal = async function(mentorId, mentorName) {
    document.getElementById('modalMentorId').value = mentorId;
    document.getElementById('modalMentorName').textContent = `Book with ${mentorName}`;
    
    const select = document.getElementById('modalTimeslot');
    select.innerHTML = `<option value="">Loading available times...</option>`;
    
    document.getElementById('bookingModal').classList.add('show');

    const { data: slots } = await supabase
        .from('mentor_slots')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('capacity', 1)
        .eq('is_public', false);

    const availableSlots = slots ? slots.filter(slot => slot.booked_count < slot.capacity) : [];

    if (!availableSlots || availableSlots.length === 0) {
        select.innerHTML = `<option value="">No private slots available</option>`;
        return;
    }

    select.innerHTML = availableSlots.map(slot => {
        const dateObj = new Date(slot.slot_date);
        const dateStr = dateObj.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' });
        return `<option value="${slot.id}">${dateStr} | ${slot.start_time} - ${slot.end_time}</option>`;
    }).join('');
};

window.closeModal = function() {
    document.getElementById('bookingModal').classList.remove('show');
};

// --- SUBMIT PRIVATE BOOKING ---
window.submitBooking = async function(event) {
    event.preventDefault();
    const btn = document.getElementById('modalSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Booking...';

    const mentorId = document.getElementById('modalMentorId').value;
    const slotId = document.getElementById('modalTimeslot').value;
    const customTitle = document.getElementById('modalTitle').value.trim();
    const sessionFormat = document.getElementById('modalTopic').value;

    if (!customTitle) {
        alert('Please enter a session title.');
        btn.disabled = false;
        btn.textContent = 'Confirm';
        return;
    }

    try {
        // 1. Fetch slot details
        const { data: slotData, error: slotError } = await supabase
            .from('mentor_slots')
            .select('*')
            .eq('id', slotId)
            .single();

        if (slotError) throw new Error("Slot fetch failed: " + slotError.message);

        // 2. Fetch mentor name
        const { data: mentorProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', mentorId)
            .single();
            
        const mentorName = mentorProfile ? mentorProfile.full_name : 'Mentor';

        // 3. Insert booking
        const { error: bookingError } = await supabase.from('bookings').insert({
            student_id: currentUserId,
            mentor_id: mentorId,
            student_name: currentStudentName || 'Student',
            mentor_name: mentorName,
            session_date: slotData.slot_date,
            start_time: slotData.start_time,
            end_time: slotData.end_time,
            session_type: sessionFormat,
            student_title: customTitle,
            status: 'confirmed'
        });

        if (bookingError) throw new Error("Booking insert failed: " + bookingError.message);

        // 4. Update slot count
        const newCount = Number(slotData.booked_count) + 1;
        const { error: updateError } = await supabase
            .from('mentor_slots')
            .update({ booked_count: newCount })
            .eq('id', slotId);

        if (updateError) throw new Error("Slot update failed: " + updateError.message);

        alert('Successfully booked!');
        closeModal();
        loadBookingMentors(); 
        
    } catch (err) {
        console.error("Booking Error:", err);
        alert(err.message); // This will show you exactly what is failing
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirm';
    }
};

// --- TAB 2: LOAD PUBLIC SESSIONS ---
async function loadPublicSessions() {
    const list = document.getElementById('sessionList');
    const today = new Date().toISOString().split('T')[0];
    
    const { data: sessions, error } = await supabase
        .from('mentor_slots')
        .select(`*, profiles:mentor_id (full_name)`)
        .gte('slot_date', today)
        .gt('capacity', 1)
        .eq('is_public', true)
        .order('slot_date', { ascending: true });

    const { data: myBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', currentUserId);

    if (error || !sessions || sessions.length === 0) {
        list.innerHTML = `<div style="padding:20px; color:#64748b;">No upcoming public sessions.</div>`;
        return;
    }

    list.innerHTML = sessions.map(s => {
        const mentorName = s.profiles ? s.profiles.full_name : 'Mentor';
        const dateObj = new Date(s.slot_date);
        const dateStr = dateObj.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = `${s.start_time} - ${s.end_time}`;
        const isFull = s.booked_count >= s.capacity;

        const hasJoined = myBookings ? myBookings.find(b => 
            b.session_date === s.slot_date && 
            b.start_time === s.start_time && 
            b.mentor_id === s.mentor_id
        ) : null;

        let buttonHtml = '';
        if (hasJoined) {
            buttonHtml = `<button class="join-btn" style="background:#dc2626; border-color:#dc2626;" onclick="togglePublicSession(event, 'leave', '${s.id}', '${hasJoined.id}', ${s.booked_count})">Leave</button>`;
        } else if (isFull) {
            buttonHtml = `<button class="join-btn" disabled style="background:#94a3b8; cursor:not-allowed;">Full</button>`;
        } else {
            buttonHtml = `<button class="join-btn" onclick="togglePublicSession(event, 'join', '${s.id}', null, ${s.booked_count})">Join</button>`;
        }

        return `
        <div class="session-item">
            <div class="session-info">
                <h3>${s.title || 'Group Mentorship Session'}</h3>
                <p>Hosted by <b>${mentorName}</b></p>
                <div class="session-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${dateStr}</span>
                    <span><i class="fas fa-clock"></i> ${timeStr}</span>
                    <span><i class="fas fa-users"></i> ${s.booked_count} / ${s.capacity} joined</span>
                </div>
            </div>
            ${buttonHtml}
        </div>
        `;
    }).join('');
}

// --- JOIN / LEAVE PUBLIC SESSION LOGIC ---
window.togglePublicSession = async function(event, action, slotId, bookingId, currentBookedCount) {
    const btn = event.currentTarget;
    btn.disabled = true;
    btn.textContent = action === 'join' ? 'Joining...' : 'Leaving...';

    try {
        if (action === 'join') {
            const { data: slotData } = await supabase
                .from('mentor_slots')
                .select('*')
                .eq('id', slotId)
                .single();

            const { data: mentorProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', slotData.mentor_id)
                .single();

            const { error: joinError } = await supabase.from('bookings').insert({
                student_id: currentUserId,
                mentor_id: slotData.mentor_id,
                student_name: currentStudentName,
                mentor_name: mentorProfile.full_name,
                session_date: slotData.slot_date,
                start_time: slotData.start_time,
                end_time: slotData.end_time,
                session_type: 'Online',
                student_title: slotData.title,
                status: 'confirmed'
            });

            if (joinError) throw joinError;

            await supabase
                .from('mentor_slots')
                .update({ booked_count: currentBookedCount + 1 })
                .eq('id', slotId);

        } else {
            await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId);

            await supabase
                .from('mentor_slots')
                .update({ booked_count: Math.max(0, currentBookedCount - 1) })
                .eq('id', slotId);
        }

        loadPublicSessions(); 

    } catch (err) {
        console.error("Toggle Error:", err);
        alert("Failed to update session: " + err.message);
        btn.disabled = false;
        btn.textContent = action === 'join' ? 'Join' : 'Leave';
    }
};

// --- BOOT ---
window.addEventListener('load', () => {
    setTimeout(init, 100);
});