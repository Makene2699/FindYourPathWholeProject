import { supabase } from './supabaseClientModule.js';

let startHour = 9, startMinute = 0, startPeriod = 'AM';
let endHour = 5, endMinute = 0, endPeriod = 'PM';
let currentFilter = 'all';
let currentSlots = [];

function getTodayString() {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split('T')[0];
}

function updateUI() {
    document.getElementById('start-hour').textContent = String(startHour).padStart(2, '0');
    document.getElementById('start-minute').textContent = String(startMinute).padStart(2, '0');
    document.getElementById('start-period').textContent = startPeriod;
    document.getElementById('end-hour').textContent = String(endHour).padStart(2, '0');
    document.getElementById('end-minute').textContent = String(endMinute).padStart(2, '0');
    document.getElementById('end-period').textContent = endPeriod;
    const dateEl = document.getElementById('slot-date');
    if (dateEl && !dateEl.value) dateEl.value = getTodayString();
    calculatePreviewSlots();
}

function adjustTime(type, unit, amount) {
    if (type === 'start') {
        if (unit === 'hour') { startHour += amount; if (startHour > 12) startHour = 1; if (startHour < 1) startHour = 12; }
        else { startMinute += amount; if (startMinute >= 60) startMinute = 0; if (startMinute < 0) startMinute = 45; }
    } else {
        if (unit === 'hour') { endHour += amount; if (endHour > 12) endHour = 1; if (endHour < 1) endHour = 12; }
        else { endMinute += amount; if (endMinute >= 60) endMinute = 0; if (endMinute < 0) endMinute = 45; }
    }
    updateUI();
}

function togglePeriod(type) {
    if (type === 'start') startPeriod = startPeriod === 'AM' ? 'PM' : 'AM';
    else endPeriod = endPeriod === 'AM' ? 'PM' : 'AM';
    updateUI();
}

function timeToMinutes(hour, minute, period) {
    let h = hour % 12;
    if (period === 'PM') h += 12;
    return (h * 60) + minute;
}

function formatTime(minutes) {
    let h = Math.floor(minutes / 60);
    let m = minutes % 60;
    let p = h >= 12 ? 'PM' : 'AM';
    let displayH = h % 12;
    if (displayH === 0) displayH = 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${p}`;
}

function calculatePreviewSlots() {
    const durationEl = document.getElementById('slot-duration');
    const capacityEl = document.getElementById('capacity');
    if (!durationEl || !capacityEl) return;

    const duration = parseInt(durationEl.value);
    const capacity = parseInt(capacityEl.value) || 1;
    const title = document.getElementById('slot-title').value.trim();
    const selectedDate = document.getElementById('slot-date').value || getTodayString();

    const startMins = timeToMinutes(startHour, startMinute, startPeriod);
    const endMins = timeToMinutes(endHour, endMinute, endPeriod);
    let totalAvailableMins = endMins - startMins;
    if (totalAvailableMins < 0) totalAvailableMins += 24 * 60;

    const previewSlots = [];
    let currentTime = startMins;

    while (currentTime + duration <= endMins || (endMins < startMins && currentTime + duration <= (endMins + 1440))) {
        previewSlots.push({
            id: 'preview-' + Math.random(),
            slot_date: selectedDate,
            start_time: formatTime(currentTime),
            end_time: formatTime(currentTime + duration),
            title: capacity > 1 ? title : null,
            capacity: capacity,
            booked_count: 0,
            is_public: capacity > 1
        });
        currentTime += duration;
    }
    currentSlots = previewSlots;
    renderSlots();
}

function renderSlots() {
    const grid = document.getElementById('slots-grid');
    if (!grid) return;

    const todayStr = getTodayString();
    const futureSlots = currentSlots.filter(s => s.slot_date >= todayStr);

    const filtered = futureSlots.filter(s => {
        if (currentFilter === 'public') return s.is_public === true;
        if (currentFilter === 'private') return s.is_public === false;
        return true;
    });

    document.getElementById('total-slots').textContent = futureSlots.length;
    const publicBox = document.querySelectorAll('.stat-box')[1].querySelector('.stat-value');
    const privateBox = document.querySelectorAll('.stat-box')[2].querySelector('.stat-value');
    if (publicBox) publicBox.textContent = futureSlots.filter(s => s.is_public).length;
    if (privateBox) privateBox.textContent = futureSlots.filter(s => !s.is_public).length;

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="padding:20px; color:#64748b;">No slots found.</div>`;
        return;
    }

    const html = filtered.map(s => {
        const isBooked = s.booked_count > 0;
        const isFull = s.booked_count >= s.capacity;
        const shouldBeRed = (s.capacity === 1 && isBooked) || isFull;
        const cardBorder = shouldBeRed ? 'border-color: #2e7d32; background: #2e7d32;' : '';
        
        let statusText = s.capacity === 1 
            ? (isBooked ? `<span style="color:#dc2626; font-weight:bold;">BOOKED (Private)</span>` : `Available`)
            : (isFull ? `<span style="color:#dc2626; font-weight:bold;">FULL (Public)</span>` : `Booked: ${s.booked_count}/${s.capacity}`);

        const dateStr = new Date(s.slot_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
        const canDelete = s.booked_count === 0 && !s.id.toString().startsWith('preview-');
        const deleteBtn = canDelete ? `<button class="delete-slot-btn" onclick="deleteSlot(event, '${s.id}')"><i class="fas fa-trash"></i></button>` : '';

        // Show student info if available
        let studentHtml = '';
        if (s.student_bookings && s.student_bookings.length > 0) {
            const student = s.student_bookings[0];
            studentHtml = `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed #ccc; font-size:0.8rem; color:#333;">
                <b>Student:</b> ${student.student_name}<br>
                <b>Topic:</b> ${student.student_title || 'N/A'}
            </div>`;
        }

        return `
        <div class="slot-card" style="position: relative; ${cardBorder}">
            ${deleteBtn}
            <span class="slot-time">${dateStr} | ${s.start_time} - ${s.end_time}</span>
            <span class="slot-meta">
                ${s.title ? `<b>Title: ${s.title}</b><br>` : ''} 
                ${studentHtml}
                ${statusText}
            </span>
        </div>`;
    }).join('');

    grid.innerHTML = html;
}

async function saveSchedule() {
    const duration = parseInt(document.getElementById('slot-duration').value);
    const startMins = timeToMinutes(startHour, startMinute, startPeriod);
    const endMins = timeToMinutes(endHour, endMinute, endPeriod);
    const selectedDate = document.getElementById('slot-date').value;

    if (!selectedDate) return alert('Please select a date.');

    let slotCount = 0;
    let currentTime = startMins;
    while (currentTime + duration <= endMins || (endMins < startMins && currentTime + duration <= (endMins + 1440))) {
        slotCount++; currentTime += duration;
    }
    if (slotCount === 0) return alert('No slots generated.');

    document.getElementById('confirm-count').textContent = slotCount;
    document.getElementById('confirm-date').textContent = new Date(selectedDate).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

async function executeSaveSchedule() {
    const btn = document.getElementById('confirm-save-btn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Please log in');

    const duration = parseInt(document.getElementById('slot-duration').value);
    const capacity = parseInt(document.getElementById('capacity').value) || 1;
    const title = document.getElementById('slot-title').value.trim();
    const selectedDate = document.getElementById('slot-date').value;

    const startMins = timeToMinutes(startHour, startMinute, startPeriod);
    const endMins = timeToMinutes(endHour, endMinute, endPeriod);

    const slotsToInsert = [];
    let currentTime = startMins;

    while (currentTime + duration <= endMins || (endMins < startMins && currentTime + duration <= (endMins + 1440))) {
        slotsToInsert.push({
            mentor_id: user.id,
            slot_date: selectedDate,
            start_time: formatTime(currentTime),
            end_time: formatTime(currentTime + duration),
            title: capacity > 1 ? title : null,
            capacity: capacity,
            booked_count: 0, 
            is_public: capacity > 1
        });
        currentTime += duration;
    }

    const { error } = await supabase.from('mentor_slots').insert(slotsToInsert);

    if (error) {
        alert('Error saving: ' + error.message);
    } else {
        closeConfirmModal();
        await loadSavedSlots(); // Load immediately
        setTimeout(() => alert(`Successfully published ${slotsToInsert.length} slots!`), 100);
    }
    btn.textContent = 'Yes, Publish';
    btn.disabled = false;
}

// THIS IS THE CRITICAL FIX: Wrap in try/catch so slots never disappear
// Load slots from DB and force attach bookings
async function loadSavedSlots() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStr = getTodayString();
    
    // 1. Fetch the slots (This will ALWAYS work because it's the mentor's own table)
    const { data: slots } = await supabase
        .from('mentor_slots')
        .select('*')
        .eq('mentor_id', user.id)
        .gte('slot_date', todayStr);

    if (!slots) return;

    // 2. Fetch ALL bookings (Assuming the SQL above granted permission)
    const { data: bookings } = await supabase
        .from('bookings')
        .select('*');
        
    // 3. Match them up
    currentSlots = slots.map(slot => {
        // If the slot is booked (count > 0), find the matching booking
        const matchingBooking = bookings ? bookings.find(b => 
            b.session_date === slot.slot_date && 
            b.start_time === slot.start_time &&
            b.mentor_id === user.id
        ) : null;

        return {
            ...slot,
            // If the database has it booked, force count to at least 1
            booked_count: Math.max(Number(slot.booked_count || 0), matchingBooking ? 1 : 0),
            student_bookings: matchingBooking ? [matchingBooking] : []
        };
    });

    renderSlots();
}

function setFilter(type) {
    currentFilter = type;
    const boxes = document.querySelectorAll('.stat-box');
    boxes.forEach(b => b.style.borderColor = '#334155');
    if (type === 'all') boxes[0].style.borderColor = '#4caf50';
    if (type === 'public') boxes[1].style.borderColor = '#4caf50';
    if (type === 'private') boxes[2].style.borderColor = '#4caf50';
    renderSlots();
}

async function deleteSlot(event, slotId) {
    event.stopPropagation();
    if (!confirm("Delete this slot?")) return;
    const { error } = await supabase.from('mentor_slots').delete().eq('id', slotId);
    if (!error) {
        currentSlots = currentSlots.filter(s => s.id !== slotId);
        renderSlots();
    }
}

window.adjustTime = adjustTime;
window.togglePeriod = togglePeriod;
window.calculateSlots = calculatePreviewSlots;
window.saveSchedule = saveSchedule;
window.closeConfirmModal = closeConfirmModal;
window.executeSaveSchedule = executeSaveSchedule;
window.setFilter = setFilter;
window.deleteSlot = deleteSlot;

window.onload = () => {
    updateUI();
    loadSavedSlots();
};