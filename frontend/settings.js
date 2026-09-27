document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveBtn');
    
    saveBtn.addEventListener('click', () => {
        // Collect data
        const profileData = {
            name: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            location: document.getElementById('location').value
        };

        // Visual feedback
        saveBtn.innerText = "Saving...";
        saveBtn.classList.replace('bg-green-600', 'bg-green-800');

        setTimeout(() => {
            alert(`Profile for ${profileData.name} updated successfully!`);
            saveBtn.innerText = "Save Changes";
            saveBtn.classList.replace('bg-green-800', 'bg-green-600');
        }, 800);
    });
});document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveBtn');
    
    saveBtn.addEventListener('click', () => {
        // Collect data
        const profileData = {
            name: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            location: document.getElementById('location').value
        };

        // Visual feedback
        saveBtn.innerText = "Saving...";
        saveBtn.classList.replace('bg-green-600', 'bg-green-800');

        setTimeout(() => {
            alert(`Profile for ${profileData.name} updated successfully!`);
            saveBtn.innerText = "Save Changes";
            saveBtn.classList.replace('bg-green-800', 'bg-green-600');
        }, 800);
    });
});