/* =====================================================
   FindYourPath - Settings.js
   Loads and saves the logged-in user's profile (Supabase).

   NOTE: the header (name, photo, dropdown, logout) and the
   sidebar are handled by studentLayout.js. This file only
   handles the settings form, and refreshes the header's
   name and photo after a change.
   ===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const $ = (id) => document.getElementById(id);

    const status = $("settingsStatus");
    const pictureStatus = $("pictureStatus");

    function setStatus(msg) {
        if (status) status.textContent = msg;
    }

    // ---------- Helpers ----------
    const AVATAR_KEYS = ["avatar_url", "picture", "avatar", "profile_picture", "photo_url"];

    function fallbackAvatar(name) {
        return "https://ui-avatars.com/api/?name=" +
            encodeURIComponent(name || "Student") +
            "&background=e2e8f0&color=64748b";
    }

    function initialsOf(name) {
        const parts = (name || "").trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return "?";
        return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
    }

    function readCached() {
        try {
            return JSON.parse(localStorage.getItem("careerUser") || "null");
        } catch (e) {
            return null;
        }
    }

    function writeCached(patch) {
        const current = readCached() || {};
        localStorage.setItem("careerUser", JSON.stringify(Object.assign(current, patch)));
    }

    function pickAvatar(obj) {
        if (!obj) return "";
        for (const k of AVATAR_KEYS) {
            if (obj[k]) return obj[k];
        }
        return "";
    }

    // ---------- Header (built by studentLayout.js): refresh name, role, photo ----------
    function paintHeader(name, role, avatar) {
        const header = document.querySelector("student-header");
        if (!header) return;

        const n = header.querySelector("#profileName");
        const r = header.querySelector("#profileRole");
        const img = header.querySelector("#profileAvatar");

        if (n) n.textContent = name || "Student";
        if (r) r.textContent = role || "Student";
        if (img) {
            img.onerror = () => { img.onerror = null; img.src = fallbackAvatar(name); };
            img.src = avatar || fallbackAvatar(name);
        }
    }

    // ---------- Profile card avatar ----------
    function paintProfileAvatar(name, avatar) {
        const initials = $("profileInitials");
        const image = $("profileImage");

        if (initials) {
            initials.textContent = initialsOf(name);
            initials.style.display = avatar ? "none" : "";
        }
        if (image) {
            if (avatar) {
                image.src = avatar;
                image.style.display = "block";
            } else {
                image.removeAttribute("src");
                image.style.display = "none";
            }
        }
    }

    // ---------- Load the logged-in user from Supabase ----------
    let authUser = null;
    let profile = null;

    try {
        const { data } = await sb.auth.getUser();
        authUser = data && data.user;
    } catch (e) {
        console.error("Could not get the signed-in user:", e);
    }

    if (!authUser) {
        window.location.href = "Register.html";
        return;
    }

    try {
        const { data, error } = await sb
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();
        if (error) throw error;
        profile = data;
    } catch (e) {
        console.error("Could not load profile:", e);
        setStatus("Could not load your profile. Please refresh the page.");
        return;
    }

    const fullName = $("fullName");
    const email = $("email");
    const phone = $("phone");
    const locationInput = $("location");
    const bio = $("bio");

    const avatarKey = AVATAR_KEYS.find((k) => k in profile) || "avatar_url";
    const hasCity = "city" in profile;
    const hasBio = "bio" in profile;

    let currentAvatar = pickAvatar(profile);

    if (fullName) fullName.value = profile.full_name || "";
    if (email) {
        email.value = authUser.email || profile.email || "";
        email.readOnly = true; // email is the login identity, so it is not edited here
    }
    if (phone) phone.value = profile.cell_number || "";

    if (locationInput) {
        if (hasCity) {
            locationInput.value = profile.city || "";
        } else {
            locationInput.disabled = true;
            locationInput.placeholder = "Location is not available yet";
        }
    }

    if (bio) {
        if (hasBio) {
            bio.value = profile.bio || "";
        } else {
            bio.disabled = true;
            bio.placeholder = "Bio is not available yet";
        }
    }

    paintProfileAvatar(profile.full_name, currentAvatar);
    paintHeader(profile.full_name, profile.role, currentAvatar);

    // Keep the saved login info in step so other pages show the same name and photo
    writeCached({
        id: authUser.id,
        fullname: profile.full_name,
        full_name: profile.full_name,
        role: profile.role,
        avatar: currentAvatar
    });

    setStatus("Profile loaded successfully.");

    // ---------- Change picture ----------
    const pictureInput = $("profilePictureInput");
    const pictureButton = $("changePictureBtn");

    if (pictureButton && pictureInput) {
        pictureButton.addEventListener("click", () => pictureInput.click());

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
            reader.onload = async () => {
                const dataUrl = reader.result;
                const { error } = await sb
                    .from("profiles")
                    .update({ [avatarKey]: dataUrl })
                    .eq("id", authUser.id);

                if (error) {
                    console.error(error);
                    alert("Picture could not be saved: " + error.message);
                    return;
                }

                currentAvatar = dataUrl;
                const name = fullName ? fullName.value.trim() : profile.full_name;
                paintProfileAvatar(name, currentAvatar);
                paintHeader(name, profile.role, currentAvatar);
                writeCached({ avatar: currentAvatar });

                if (pictureStatus) pictureStatus.textContent = "Profile picture updated successfully.";
            };
            reader.readAsDataURL(file);
        });
    }

    // ---------- Save profile changes ----------
    const saveBtn = $("saveBtn");

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            const nameValue = fullName.value.trim();

            if (!nameValue) {
                alert("Full name cannot be empty.");
                return;
            }

            const updates = {
                full_name: nameValue,
                cell_number: phone.value.trim()
            };
            if (hasCity) updates.city = locationInput.value.trim();
            if (hasBio) updates.bio = bio.value.trim();

            saveBtn.disabled = true;
            const { error } = await sb
                .from("profiles")
                .update(updates)
                .eq("id", authUser.id);
            saveBtn.disabled = false;

            if (error) {
                console.error(error);
                alert("Could not save your changes: " + error.message);
                return;
            }

            profile = Object.assign(profile, updates);

            paintProfileAvatar(nameValue, currentAvatar);
            paintHeader(nameValue, profile.role, currentAvatar);
            writeCached({ fullname: nameValue, full_name: nameValue });

            setStatus("Your profile changes have been saved successfully.");
            alert("Profile updated successfully!");
        });
    }
});