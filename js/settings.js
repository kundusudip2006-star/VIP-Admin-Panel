// ==========================================
// VIP ADMIN PANEL - SETTINGS
// ==========================================

// Firebase Auth Check
firebase.auth().onAuthStateChanged(async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Admin email check
    if (user.email !== "kundusudip011@gmail.com") {
        alert("Access Denied!");
        window.location.href = "dashboard.html";
        return;
    }

    await loadSettings();
});


// ==========================================
// LOAD SETTINGS
// ==========================================

async function loadSettings() {

    try {

        const doc = await db
            .collection("settings")
            .doc("admin")
            .get();

        if (!doc.exists) {
            console.log("No settings found.");
            return;
        }

        const data = doc.data();

        document.getElementById("siteName").value =
            data.siteName || "";

        document.getElementById("upiId").value =
            data.upiId || "";

        document.getElementById("whatsapp").value =
            data.whatsapp || "";

        document.getElementById("telegramId").value =
            data.telegramId || "";

        document.getElementById("supportEmail").value =
            data.supportEmail || "";

        document.getElementById("qrCode").value =
            data.qrCode || "";

    } catch (error) {

        console.error("Load Settings Error:", error);

        alert("Settings load failed!");

    }
}


// ==========================================
// SAVE SETTINGS
// ==========================================

document
    .getElementById("saveSettings")
    .addEventListener("click", async () => {

        const button =
            document.getElementById("saveSettings");

        try {

            button.disabled = true;
            button.textContent = "Saving...";

            await db
                .collection("settings")
                .doc("admin")
                .set({

                    siteName:
                        document.getElementById("siteName").value.trim(),

                    upiId:
                        document.getElementById("upiId").value.trim(),

                    whatsapp:
                        document.getElementById("whatsapp").value.trim(),

                    telegramId:
                        document.getElementById("telegramId").value.trim(),

                    supportEmail:
                        document.getElementById("supportEmail").value.trim(),

                    qrCode:
                        document.getElementById("qrCode").value.trim(),

                    updatedAt:
                        firebase.firestore.FieldValue.serverTimestamp()

                }, { merge: true });


            alert("Settings Saved Successfully!");

        } catch (error) {

            console.error("Save Settings Error:", error);

            alert("Settings save failed!");

        } finally {

            button.disabled = false;
            button.textContent = "Save Settings";

        }

    });