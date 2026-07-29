// Firebase Auth Check
firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadSettings();

});

// Load Settings
async function loadSettings() {

    const doc = await db.collection("settings")
        .doc("admin")
        .get();

    if (!doc.exists) return;

    const data = doc.data();

    document.getElementById("siteName").value = data.siteName || "";
    document.getElementById("upiId").value = data.upiId || "";
    document.getElementById("whatsapp").value = data.whatsapp || "";
    document.getElementById("telegramId").value = data.telegramId || "";
    document.getElementById("supportEmail").value = data.supportEmail || "";
    document.getElementById("qrCode").value = data.qrCode || "";

}

// Save Settings
document.getElementById("saveSettings")
.addEventListener("click", async () => {

    await db.collection("settings")
        .doc("admin")
        .set({

            siteName: document.getElementById("siteName").value,
            upiId: document.getElementById("upiId").value,
            whatsapp: document.getElementById("whatsapp").value,
            telegramId: document.getElementById("telegramId").value,
            supportEmail: document.getElementById("supportEmail").value,
            qrCode: document.getElementById("qrCode").value

        });

    alert("Settings Saved Successfully!");

});