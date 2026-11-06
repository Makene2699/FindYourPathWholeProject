document.addEventListener("DOMContentLoaded", () => {
    const user = LocalProfile.getCurrentUser();

    const status = document.getElementById("settingsStatus");

    if (!user) {
        if (status) {
            status.textContent =
                "No demo profile is signed in. Please register or log in.";
        }
        return;
    }

    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const location = document.getElementById("location");
    const bio = document.getElementById("bio");

    const profileInitials =
        document.getElementById("profileInitials");

    const profileImage =
        document.getElementById("profileImage");

    const pictureInput =
        document.getElementById("profilePictureInput");

    const pictureButton =
        document.getElementById("changePictureBtn");

    const pictureStatus =
        document.getElementById("pictureStatus");

    const saveBtn = document.getElementById("saveBtn");

    // Automatically fill the form
    if (fullName) fullName.value = user.fullname || "";
    if (email) email.value = user.email || "";
    if (phone) phone.value = user.cell || "";
    if (location) {
        location.disabled = false;
        location.value = user.location || "";
    }

    if (bio) {
        bio.disabled = false;
        bio.value = user.bio || "";
    }

    if (email) email.readOnly = false;

    function updatePicture(profile) {
        if (profileInitials) {
            profileInitials.textContent =
                LocalProfile.getInitials(profile.fullname);

            profileInitials.style.display =
                profile.picture ? "none" : "";
        }

        if (profileImage) {
            if (profile.picture) {
                profileImage.src = profile.picture;
                profileImage.style.display = "block";
            } else {
                profileImage.removeAttribute("src");
                profileImage.style.display = "none";
            }
        }

        LocalProfile.updateNavbar();
    }

    updatePicture(user);

    if (status) {
        status.textContent = "Profile loaded successfully.";
    }

    // Change picture
    if (pictureButton && pictureInput) {
        pictureButton.addEventListener("click", () => {
            pictureInput.click();
        });

        pictureInput.addEventListener("change", () => {
            const file = pictureInput.files[0];
            if (!file) return;

            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                alert("Please choose a JPG, PNG or WebP image.");
                return;
            }

            if (file.size > 1024 * 1024) {
                alert("Please choose an image smaller than 1 MB.");
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                try {
                    const updated = LocalProfile.saveProfile({
                        picture: reader.result
                    });

                    updatePicture(updated);

                    if (pictureStatus) {
                        pictureStatus.textContent =
                            "Profile picture updated successfully.";
                    }
                } catch (error) {
                    alert("Picture could not be saved: " + error.message);
                }
            };

            reader.readAsDataURL(file);
        });
    }

    // Save profile changes
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const nameValue = fullName.value.trim();
            const emailValue = email.value.trim();

            if (!nameValue || !emailValue) {
                alert("Full name and email cannot be empty.");
                return;
            }

            try {
                const updated = LocalProfile.saveProfile({
                    fullname: nameValue,
                    email: emailValue,
                    cell: phone.value.trim(),
                    location: location.value.trim(),
                    bio: bio.value.trim()
                });

                updatePicture(updated);

                if (status) {
                    status.textContent =
                        "Your profile changes have been saved successfully.";
                }

                alert("Profile updated successfully!");

            } catch (error) {
                alert(error.message);
            }
        });
    }

    // Profile dropdown
    const profileBtn = document.getElementById("profileBtn");
    const dropdown = document.getElementById("dropdownMenu");

    if (profileBtn && dropdown) {
        profileBtn.addEventListener("click", () => {
            dropdown.classList.toggle("show");
        });
    }

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            LocalProfile.logout();
        });
    }
});