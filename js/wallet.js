// ======================================================
// WALLET PAYMENT
// MANUAL APPROVAL SYSTEM
// ======================================================

// ==========================
// CONFIG
// ==========================

const UPI_ID = "kundusudip2006@oksbi";
const UPI_NAME = "VIP Store";

// Your deployed Node.js server URL
const SERVER_URL =
    "https://vip-admin-panel-1.onrender.com";

// ==========================
// ELEMENTS
// ==========================

const paymentAmount =
    document.getElementById("paymentAmount");

const paymentMobile =
    document.getElementById("paymentMobile");

const qrImage =
    document.getElementById("qrImage");

const payNow =
    document.getElementById("payNow");

const upiId =
    document.getElementById("upiId");

const copyUpi =
    document.getElementById("copyUpi");

const paidBtn =
    document.getElementById("paidBtn");

// ======================================================
// BEAUTIFUL NOTIFICATION POPUP
// ======================================================

function showNotification(
    type,
    title,
    message,
    buttonText = "OK",
    onClose = null
) {

    // Remove existing popup
    const oldPopup =
        document.getElementById(
            "walletNotificationPopup"
        );

    if (oldPopup) {
        oldPopup.remove();
    }

    // ==========================
    // ICON
    // ==========================

    let icon = "✓";

    if (type === "error") {
        icon = "!";
    }

    if (type === "warning") {
        icon = "!";
    }

    if (type === "success") {
        icon = "✓";
    }

    // ==========================
    // STYLE
    // ==========================

    if (
        !document.getElementById(
            "walletNotificationStyle"
        )
    ) {

        const style =
            document.createElement("style");

        style.id =
            "walletNotificationStyle";

        style.innerHTML = `

        #walletNotificationPopup {

            position: fixed;

            inset: 0;

            z-index: 999999;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

            background:
                rgba(0, 0, 0, 0.72);

            backdrop-filter:
                blur(9px);

            -webkit-backdrop-filter:
                blur(9px);

            animation:
                walletPopupFade
                0.25s ease;

        }

        .wallet-notification-box {

            width: 100%;

            max-width: 380px;

            padding: 28px 22px 22px;

            border-radius: 25px;

            text-align: center;

            color: white;

            background:
                linear-gradient(
                    145deg,
                    #071b35,
                    #062c42
                );

            border:
                1px solid
                rgba(0, 210, 255, 0.28);

            box-shadow:
                0 25px 70px
                rgba(0,0,0,0.65),

                0 0 40px
                rgba(0,200,255,0.12);

            transform:
                scale(0.88);

            animation:
                walletPopupScale
                0.3s ease
                forwards;

        }

        .wallet-notification-icon {

            width: 72px;

            height: 72px;

            margin:
                0 auto 16px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 50%;

            font-size: 36px;

            font-weight: 800;

            color: white;

        }

        .wallet-notification-icon.success {

            background:
                linear-gradient(
                    135deg,
                    #00e676,
                    #00bfa5
                );

            box-shadow:
                0 0 32px
                rgba(0,230,118,0.32);

        }

        .wallet-notification-icon.error {

            background:
                linear-gradient(
                    135deg,
                    #ff1744,
                    #d50000
                );

            box-shadow:
                0 0 32px
                rgba(255,23,68,0.30);

        }

        .wallet-notification-icon.warning {

            background:
                linear-gradient(
                    135deg,
                    #ffb300,
                    #ff6f00
                );

            box-shadow:
                0 0 32px
                rgba(255,179,0,0.30);

        }

        .wallet-notification-box h2 {

            margin:
                0 0 9px;

            font-size: 23px;

            font-weight: 750;

            letter-spacing:
                0.1px;

        }

        .wallet-notification-message {

            margin:
                0 0 22px;

            color:
                rgba(255,255,255,0.72);

            font-size: 14px;

            line-height: 1.6;

            white-space:
                pre-line;

        }

        .wallet-notification-btn {

            width: 100%;

            border: none;

            outline: none;

            padding: 14px;

            border-radius: 15px;

            font-size: 15px;

            font-weight: 700;

            color: white;

            cursor: pointer;

            background:
                linear-gradient(
                    135deg,
                    #006eff,
                    #00c6ff
                );

            box-shadow:
                0 9px 27px
                rgba(0,150,255,0.25);

            transition:
                transform 0.15s ease;

        }

        .wallet-notification-btn:active {

            transform:
                scale(0.97);

        }

        @keyframes walletPopupFade {

            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }

        }

        @keyframes walletPopupScale {

            from {

                transform:
                    scale(0.88);

                opacity: 0;

            }

            to {

                transform:
                    scale(1);

                opacity: 1;

            }

        }

        `;

        document.head.appendChild(style);

    }

    // ==========================
    // CREATE POPUP
    // ==========================

    const popup =
        document.createElement("div");

    popup.id =
        "walletNotificationPopup";

    popup.innerHTML = `

        <div class="wallet-notification-box">

            <div
                class="wallet-notification-icon ${type}">
                ${icon}
            </div>

            <h2>
                ${title}
            </h2>

            <p class="wallet-notification-message">
                ${message}
            </p>

            <button
                class="wallet-notification-btn"
                id="walletNotificationBtn">

                ${buttonText}

            </button>

        </div>

    `;

    document.body.appendChild(popup);

    // ==========================
    // BUTTON
    // ==========================

    const notificationBtn =
        document.getElementById(
            "walletNotificationBtn"
        );

    notificationBtn.onclick = () => {

        popup.remove();

        if (typeof onClose === "function") {
            onClose();
        }

    };

    // ==========================
    // OUTSIDE CLICK
    // ==========================

    popup.onclick = (event) => {

        if (event.target === popup) {

            popup.remove();

            if (typeof onClose === "function") {
                onClose();
            }

        }

    };

}

// ==========================
// LOAD RECHARGE DATA
// ==========================

const recharge =
    JSON.parse(
        localStorage.getItem(
            "walletRecharge"
        )
    );

// ==========================
// CHECK RECHARGE DATA
// ==========================

if (!recharge) {

    showNotification(
        "error",
        "Recharge Not Found",
        "Recharge information could not be found.\n\nPlease try again.",
        "Go Back",
        () => {

            window.location.replace(
                "wallet.html"
            );

        }
    );

}

// ==========================
// SHOW PAYMENT DETAILS
// ==========================

if (recharge) {

    const amount =
        Number(
            recharge.amount || 0
        );

    const mobile =
        String(
            recharge.mobile || ""
        );

    paymentAmount.innerText =
        "₹" +
        amount.toFixed(2);

    paymentMobile.innerText =
        mobile;

    upiId.innerText =
        UPI_ID;

    // ==========================
    // CREATE UPI PAYMENT LINK
    // ==========================

    const upiLink =
        "upi://pay?" +
        "pa=" +
        encodeURIComponent(
            UPI_ID
        ) +
        "&pn=" +
        encodeURIComponent(
            UPI_NAME
        ) +
        "&am=" +
        encodeURIComponent(
            amount.toFixed(2)
        ) +
        "&cu=INR";

    // ==========================
    // GOOGLE PAY / UPI BUTTON
    // ==========================

    payNow.href =
        upiLink;

    payNow.target =
        "_self";

    // ==========================
    // QR CODE
    // ==========================

    const qrURL =
        "https://quickchart.io/qr?text=" +
        encodeURIComponent(
            upiLink
        ) +
        "&size=300";

    qrImage.src =
        qrURL;

    // ==========================
    // QR ERROR
    // ==========================

    qrImage.onerror = () => {

        console.error(
            "QR code failed to load."
        );

        qrImage.alt =
            "QR code could not be loaded";

    };

}

// ==========================
// COPY UPI ID
// ==========================

copyUpi.onclick = async () => {

    try {

        await navigator.clipboard.writeText(
            UPI_ID
        );

        copyUpi.innerHTML =
            '<i class="fa-solid fa-check"></i>';

        setTimeout(() => {

            copyUpi.innerHTML =
                '<i class="fa-solid fa-copy"></i>';

        }, 1500);

    } catch (error) {

        showNotification(
            "warning",
            "Copy Failed",
            "Unable to copy the UPI ID automatically.\n\nUPI ID:\n" +
            UPI_ID
        );

    }

};

// ==========================
// FIREBASE AUTH
// ==========================

firebase.auth().onAuthStateChanged(
    (user) => {

        if (!user) {

            window.location.replace(
                "login.html"
            );

            return;

        }

        console.log(
            "Wallet payment user:",
            user.email
        );

    }
);

// ======================================================
// I'VE PAID
// ======================================================

paidBtn.onclick = async () => {

    // ==========================
    // PREVENT DUPLICATE CLICKS
    // ==========================

    if (paidBtn.disabled) {
        return;
    }

    // ==========================
    // CHECK LOGIN
    // ==========================

    const user =
        firebase.auth().currentUser;

    if (!user) {

        showNotification(
            "warning",
            "Login Required",
            "Please login first."
        );

        return;

    }

    // ==========================
    // GET RECHARGE DATA
    // ==========================

    const rechargeData =
        JSON.parse(
            localStorage.getItem(
                "walletRecharge"
            )
        );

    if (!rechargeData) {

        showNotification(
            "error",
            "Recharge Not Found",
            "Recharge information could not be found.",
            "Go Back",
            () => {

                window.location.replace(
                    "wallet.html"
                );

            }
        );

        return;

    }

    // ==========================
    // VALIDATE AMOUNT
    // ==========================

    const amount =
        Number(
            rechargeData.amount || 0
        );

    // ==========================
    // VALIDATE MOBILE
    // ==========================

    const mobile =
        String(
            rechargeData.mobile || ""
        ).trim();

    if (
        !amount ||
        amount < 10 ||
        amount > 10000
    ) {

        showNotification(
            "error",
            "Invalid Amount",
            "Recharge amount must be between ₹10 and ₹10,000."
        );

        return;

    }

    if (
        !/^[6-9]\d{9}$/.test(
            mobile
        )
    ) {

        showNotification(
            "error",
            "Invalid Mobile Number",
            "Please enter a valid 10 digit Indian mobile number."
        );

        return;

    }

    // ==========================
    // RECHARGE ID
    // ==========================

    const rechargeId =
        rechargeData.rechargeId;

    if (!rechargeId) {

        showNotification(
            "error",
            "Recharge ID Missing",
            "Recharge ID is missing.\n\nPlease start the recharge again.",
            "Go Back",
            () => {

                window.location.replace(
                    "wallet.html"
                );

            }
        );

        return;

    }

    // ==========================
    // DISABLE BUTTON
    // ==========================

    paidBtn.disabled =
        true;

    paidBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    try {

        // ==================================================
        // 1. CREATE RECHARGE REQUEST
        // ==================================================

        await db
            .collection(
                "balanceRechargeRequests"
            )
            .doc(
                rechargeId
            )
            .set({

                rechargeId:
                    rechargeId,

                uid:
                    user.uid,

                email:
                    user.email || "",

                mobile:
                    mobile,

                amount:
                    amount,

                upiId:
                    UPI_ID,

                paymentMethod:
                    "UPI / Google Pay",

                status:
                    "Pending",

                balanceAdded:
                    false,

                createdAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });

        console.log(
            "Recharge request created:",
            rechargeId
        );

        // ==================================================
        // 2. CREATE TRANSACTION
        // ==================================================

        await db
            .collection(
                "balanceTransactions"
            )
            .doc(
                rechargeId
            )
            .set({

                rechargeId:
                    rechargeId,

                uid:
                    user.uid,

                email:
                    user.email || "",

                amount:
                    amount,

                type:
                    "credit",

                status:
                    "Pending",

                mobile:
                    mobile,

                createdAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });

        console.log(
            "Balance transaction created:",
            rechargeId
        );

        // ==================================================
        // 3. SEND TELEGRAM NOTIFICATION
        // ==================================================

        try {

            const telegramResponse =
                await fetch(
                    SERVER_URL +
                    "/wallet-recharge",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                rechargeId:
                                    rechargeId,

                                uid:
                                    user.uid,

                                email:
                                    user.email || "",

                                mobile:
                                    mobile,

                                amount:
                                    amount,

                                paymentMethod:
                                    "UPI / Google Pay",

                                status:
                                    "Pending"

                            })

                    }
                );

            const telegramResult =
                await telegramResponse
                    .json()
                    .catch(
                        () => null
                    );

            console.log(
                "Telegram response:",
                telegramResult
            );

            if (
                !telegramResponse.ok
            ) {

                console.error(
                    "Telegram notification failed:",
                    telegramResult
                );

            }

        } catch (
            telegramError
        ) {

            // Telegram failure should NOT
            // cancel the Firestore recharge.

            console.error(
                "Telegram notification error:",
                telegramError
            );

        }

        // ==================================================
        // 4. REMOVE TEMPORARY DATA
        // ==================================================

        localStorage.removeItem(
            "walletRecharge"
        );

        // ==================================================
        // 5. SUCCESS POPUP
        // ==================================================

        showNotification(
            "success",
            "Payment Submitted!",
            "Your payment request has been submitted successfully.\n\nYour balance will be added after manual verification.",
            "Done",
            () => {

                // ==================================================
                // 6. RETURN TO WALLET
                // ==================================================

                window.location.replace(
                    "wallet.html"
                );

            }
        );

    } catch (error) {

        console.error(
            "Wallet Recharge Error:",
            error
        );

        // ==========================
        // RE-ENABLE BUTTON
        // ==========================

        paidBtn.disabled =
            false;

        paidBtn.innerHTML =
            '<i class="fa-solid fa-check"></i> I\'ve Paid';

        // ==========================
        // ERROR POPUP
        // ==========================

        showNotification(
            "error",
            "Payment Failed",
            "Something went wrong.\n\n" +
            (
                error.message ||
                "Please try again."
            )
        );

    }

};