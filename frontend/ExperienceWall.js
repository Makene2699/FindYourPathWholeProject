document.addEventListener("DOMContentLoaded", () => {
  loadMentorExperiences();
});

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

      const card =
          document.createElement("article");

      card.className = "feed-card";

      card.innerHTML = `
                <div class="feed-header">

                    <img
                        src="${
          mentor.avatar_url ||
          'https://ui-avatars.com/api/?name=' +
          encodeURIComponent(mentor.full_name)
      }"
                        class="feed-avatar"
                        alt="${mentor.full_name}"
                    >

                    <div class="feed-user-info">
                        <h4>${mentor.full_name}</h4>

                        <p>
                            ${mentor.work || "Mentor"}
                            ${mentor.location
          ? " | " + mentor.location
          : ""}
                        </p>
                    </div>

                </div>

                <div class="feed-body">
                    ${mentor.experience}
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
