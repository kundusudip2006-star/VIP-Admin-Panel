// ==========================
// Profile
// ==========================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("userName").innerText =
        user.displayName || "VIP Admin";

    document.getElementById("userEmail").innerText =
        user.email;

});

// ==========================
// Logout
// ==========================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        if (confirm("Are you sure you want to logout?")) {

            firebase.auth().signOut().then(() => {

                window.location.href = "login.html";

            });

        }

    });

}

// ==========================
// Update Button
// ==========================

const saveProfile = document.getElementById("saveProfile");

if (saveProfile) {

    saveProfile.addEventListener("click", () => {

        alert("Profile Update feature will be added in the next update.");

    });

}