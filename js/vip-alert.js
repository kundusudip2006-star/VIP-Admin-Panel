// ======================================================
// VIP CUSTOM ALERT SYSTEM
// Replaces browser alert()
// ======================================================

(function () {

    // Create alert HTML automatically
    const alertHTML = `
        <div id="vipAlertOverlay" class="vip-alert-overlay">

            <div id="vipAlertBox" class="vip-alert info">

                <button
                    id="vipAlertClose"
                    class="vip-alert-close"
                    type="button">
                    ×
                </button>

                <div id="vipAlertIcon" class="vip-alert-icon">
                    <i class="fa-solid fa-circle-info"></i>
                </div>

                <div
                    id="vipAlertTitle"
                    class="vip-alert-title">
                    Notice
                </div>

                <div
                    id="vipAlertMessage"
                    class="vip-alert-message">
                </div>

                <button
                    id="vipAlertButton"
                    class="vip-alert-button"
                    type="button">
                    OK
                </button>

            </div>

        </div>
    `;

    function createAlert() {

        if (document.getElementById("vipAlertOverlay")) {
            return;
        }

        document.body.insertAdjacentHTML(
            "beforeend",
            alertHTML
        );

    }

    function getType(message) {

        const text = String(message).toLowerCase();

        if (
            text.includes("insufficient") ||
            text.includes("invalid") ||
            text.includes("error") ||
            text.includes("failed") ||
            text.includes("wrong")
        ) {
            return "error";
        }

        if (
            text.includes("success") ||
            text.includes("successfully") ||
            text.includes("completed")
        ) {
            return "success";
        }

        if (
            text.includes("warning") ||
            text.includes("please")
        ) {
            return "warning";
        }

        return "info";
    }

    function getTitle(type) {

        if (type === "success") {
            return "Success";
        }

        if (type === "error") {
            return "Something went wrong";
        }

        if (type === "warning") {
            return "Attention";
        }

        return "Notice";
    }

    function getIcon(type) {

        if (type === "success") {
            return "fa-solid fa-circle-check";
        }

        if (type === "error") {
            return "fa-solid fa-circle-xmark";
        }

        if (type === "warning") {
            return "fa-solid fa-triangle-exclamation";
        }

        return "fa-solid fa-circle-info";
    }

    function showVipAlert(message) {

        createAlert();

        const overlay =
            document.getElementById("vipAlertOverlay");

        const box =
            document.getElementById("vipAlertBox");

        const icon =
            document.getElementById("vipAlertIcon");

        const title =
            document.getElementById("vipAlertTitle");

        const messageBox =
            document.getElementById("vipAlertMessage");

        const close =
            document.getElementById("vipAlertClose");

        const button =
            document.getElementById("vipAlertButton");

        const type = getType(message);

        // Reset classes
        box.className = "vip-alert " + type;

        // Content
        icon.innerHTML =
            `<i class="${getIcon(type)}"></i>`;

        title.innerText =
            getTitle(type);

        messageBox.innerText =
            String(message);

        // Show
        overlay.classList.add("active");

        // Close function
        const closeAlert = () => {

            overlay.classList.remove("active");

        };

        close.onclick = closeAlert;
        button.onclick = closeAlert;

        // Click outside
        overlay.onclick = function (e) {

            if (e.target === overlay) {
                closeAlert();
            }

        };

        // ESC
        document.onkeydown = function (e) {

            if (e.key === "Escape") {
                closeAlert();
            }

        };

    }

    // Replace browser alert()
    window.alert = showVipAlert;

    // Make function globally available
    window.showVipAlert = showVipAlert;

    // Create after DOM ready
    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            createAlert
        );

    } else {

        createAlert();

    }

})();