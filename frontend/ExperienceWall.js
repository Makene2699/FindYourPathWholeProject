document.addEventListener("DOMContentLoaded", () => {
    loadMentorExperiences();
});

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

async function loadMentorExperiences() {

    const container =
        document.getElementById("experiencePosts");

    try {

        const { data, error } = await sb
            .from("profiles")
            .select(`
                id,
                full_name,
                avatar_url,
                work,
                location,
                experience,
                role,
                approval_status
            `)
            .eq("role", "Mentor")
            .eq("approval_status", "approved")
            .not("experience", "is", null);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML =
                "<p>No mentor experiences found.</p>";
            return;
        }

        container.innerHTML = "";

        data.forEach(mentor => {

            const name = mentor.full_name || "Mentor";
            const fallbackAvatar =
                "https://ui-avatars.com/api/?name=" + encodeURIComponent(name);
            const avatar = mentor.avatar_url || fallbackAvatar;

            const card =
                document.createElement("article");

            card.className = "feed-card";

            card.innerHTML = `
                <div class="feed-header">

                    <img
                        src="${escapeHtml(avatar)}"
                        class="feed-avatar"
                        alt="${escapeHtml(name)}"
                        onerror="this.onerror=null;this.src='${escapeHtml(fallbackAvatar)}'"
                    >

                    <div class="feed-user-info">
                        <h4>${escapeHtml(name)}</h4>

                        <p>
                            ${escapeHtml(mentor.work || "Mentor")}
                            ${mentor.location
                ? " | " + escapeHtml(mentor.location)
                : ""}
                        </p>
                    </div>

                </div>

                <div class="feed-body">
                    ${escapeHtml(mentor.experience)}
                </div>
            `;

            container.appendChild(card);
        });

    } catch (err) {

        console.error(
            "Failed to load mentor experiences:",
            err
        );

        container.innerHTML =
            "<p>Unable to load experiences.</p>";
    }
}