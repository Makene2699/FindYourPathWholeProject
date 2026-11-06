const LocalProfile = {

    accountsKey: "fyp_demo_accounts",
    sessionKey: "fyp_demo_session",

    // Get all registered demo accounts
    getAccounts() {
        try {
            return JSON.parse(
                localStorage.getItem(this.accountsKey) || "[]"
            );
        } catch (error) {
            return [];
        }
    },

    // Get currently signed-in user
    getCurrentUser() {
        const email = localStorage.getItem(this.sessionKey);

        if (!email) return null;

        return this.getAccounts().find(
            user => user.email.toLowerCase() === email.toLowerCase()
        ) || null;
    },

    // Register a new demo user
    register(details) {
        const accounts = this.getAccounts();
        const email = details.email.trim().toLowerCase();

        const exists = accounts.some(
            user => user.email.toLowerCase() === email
        );

        if (exists) {
            throw new Error(
                "An account with this email already exists."
            );
        }

        const user = {
            id: crypto.randomUUID(),
            fullname: details.fullname.trim(),
            role: details.role,
            cell: details.cell.trim(),
            email: email,
            careerField: details.careerField || "",
            location: details.address || "",
            bio: "",
            picture: ""
        };

        accounts.push(user);

        localStorage.setItem(
            this.accountsKey,
            JSON.stringify(accounts)
        );

        localStorage.setItem(this.sessionKey, email);

        return user;
    },

    // Demo login - email only, NOT secure authentication
    login(email) {
        const account = this.getAccounts().find(
            user =>
                user.email.toLowerCase() === email.trim().toLowerCase()
        );

        if (!account) {
            throw new Error(
                "Demo account not found. Please register first."
            );
        }

        localStorage.setItem(
            this.sessionKey,
            account.email
        );

        return account;
    },

    // Update the user's profile
    saveProfile(changes) {
        const currentUser = this.getCurrentUser();

        if (!currentUser) {
            throw new Error("No user is currently signed in.");
        }

        const accounts = this.getAccounts();

        const index = accounts.findIndex(
            user => user.id === currentUser.id
        );

        if (index === -1) {
            throw new Error("Profile not found.");
        }

        const updatedUser = {
            ...currentUser,
            ...changes,
            id: currentUser.id,
            role: currentUser.role
        };

        updatedUser.email = updatedUser.email.trim().toLowerCase();

        const emailExists = accounts.some(
            user =>
                user.id !== currentUser.id &&
                user.email.toLowerCase() === updatedUser.email
        );

        if (emailExists) {
            throw new Error(
                "This email is already used by another account."
            );
        }

        accounts[index] = updatedUser;

        localStorage.setItem(
            this.accountsKey,
            JSON.stringify(accounts)
        );

        localStorage.setItem(
            this.sessionKey,
            updatedUser.email
        );

        localStorage.setItem(
            "careerUser",
            JSON.stringify(updatedUser)
        );

        this.updateNavbar();

        return updatedUser;
    },

    // Generate initials from the user's full name
    getInitials(fullname) {
        if (!fullname || !fullname.trim()) {
            return "?";
        }

        const names = fullname.trim().split(/\s+/);

        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        }

        return (
            names[0].charAt(0) +
            names[names.length - 1].charAt(0)
        ).toUpperCase();
    },

    // Update navbar profile information
    updateNavbar() {
        const user = this.getCurrentUser();

        if (!user) return;

        const navbarName =
            document.getElementById("navbarUserName");

        const navbarRole =
            document.getElementById("navbarUserRole");

        const navbarInitials =
            document.getElementById("navbarInitials");

        const navbarImage =
            document.getElementById("navbarProfileImage");

        // Show name
        if (navbarName) {
            navbarName.textContent = user.fullname;
        }

        // Show role
        if (navbarRole) {
            navbarRole.textContent = user.role;
        }

        // Show initials if no picture exists
        if (navbarInitials) {
            navbarInitials.textContent =
                this.getInitials(user.fullname);

            navbarInitials.style.display =
                user.picture ? "none" : "block";
        }

        // Show uploaded picture
        if (navbarImage) {
            if (user.picture) {
                navbarImage.src = user.picture;
                navbarImage.style.display = "block";
            } else {
                navbarImage.removeAttribute("src");
                navbarImage.style.display = "none";
            }
        }
    },

    // Logout current user
    logout() {
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("careerUser");

        window.location.href = "Register.html";
    }

};

// Automatically load the user's navbar profile
document.addEventListener("DOMContentLoaded", () => {
    LocalProfile.updateNavbar();
});