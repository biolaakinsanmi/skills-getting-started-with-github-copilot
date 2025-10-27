document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
  const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (pretty list with delete icons)
        const participantsTitle = document.createElement("div");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = "Participants";

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = p;

            // Delete icon/button
            const delBtn = document.createElement("button");
            delBtn.className = "remove-participant";
            delBtn.title = `Remove ${p}`;
            delBtn.setAttribute("data-email", p);
            delBtn.setAttribute("data-activity", name);
            delBtn.innerHTML = "&times;"; // simple × icon

            // Click handler to remove participant
            delBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              const email = delBtn.getAttribute("data-email");
              const activityName = delBtn.getAttribute("data-activity");

              if (!confirm(`Remove ${email} from ${activityName}?`)) return;

              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );

                const resJson = await resp.json();
                if (resp.ok) {
                  showMessage(resJson.message, "success");
                  await fetchActivities();
                } else {
                  showMessage(resJson.detail || "Could not remove participant", "error");
                }
              } catch (err) {
                console.error("Error removing participant:", err);
                showMessage("Failed to remove participant. Try again.", "error");
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(delBtn);
            participantsList.appendChild(li);
          });
        } else {
          const noParticipants = document.createElement("li");
          noParticipants.className = "no-participants";
          noParticipants.textContent = "No participants yet.";
          participantsList.appendChild(noParticipants);
        }

        activityCard.appendChild(participantsTitle);
        activityCard.appendChild(participantsList);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        // Refresh the activity list to show new participant immediately
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
