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
// IMPORTANT: Replace this with your actual Render/Railway server URL.
const SERVER_URL = "https://vip-admin-panel-1.onrender.com";
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

// ==========================
// LOAD RECHARGE DATA
// ==========================

const recharge = JSON.parse(
    localStorage.getItem("walletRecharge")
);

// ==========================
// CHECK RECHARGE DATA
// ==========================

if (!recharge) {

    alert("Recharge information not found.");

    window.location.replace("wallet.html");
}

// ==========================
// SHOW PAYMENT DETAILS
// ==========================

if (recharge) {

    const amount =
        Number(recharge.amount || 0);

    const mobile =
        String(recharge.mobile || "");

    paymentAmount.innerText =
        "₹" + amount.toFixed(2);

    paymentMobile.innerText =
        mobile;

    upiId.innerText =
        UPI_ID;

    // ==========================
    // CREATE UPI PAYMENT LINK
    // ==========================

    const upiLink =
        "upi://pay?" +
        "pa=" + encodeURIComponent(UPI_ID) +
        "&pn=" + encodeURIComponent(UPI_NAME) +
        "&am=" + encodeURIComponent(
            amount.toFixed(2)
        ) +
        "&cu=INR";

    // ==========================
    // GOOGLE PAY / UPI BUTTON
    // ==========================

    payNow.href = upiLink;

    payNow.target = "_self";

    // ==========================
    // QR CODE
    // ==========================

    const qrURL =
        "https://quickchart.io/qr?text=" +
        encodeURIComponent(upiLink) +
        "&size=300";

    qrImage.src = qrURL;

    // QR error fallback

    qrImage.onerror = () => {

        console.error("QR code failed to load.");

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

        alert(
            "UPI ID: " + UPI_ID
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

// ==========================
// I'VE PAID
// ==========================

paidBtn.onclick = async () => {

    // Prevent duplicate clicks

    if (paidBtn.disabled) {
        return;
    }

    // ==========================
    // CHECK LOGIN
    // ==========================

    const user =
        firebase.auth().currentUser;

    if (!user) {

        alert(
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

        alert(
            "Recharge information not found."
        );

        window.location.replace(
            "wallet.html"
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

        alert(
            "Invalid recharge amount."
        );

        return;
    }

    if (
        !/^[6-9]\d{9}$/.test(mobile)
    ) {

        alert(
            "Invalid mobile number."
        );

        return;
    }

    // ==========================
    // RECHARGE ID
    // ==========================

    const rechargeId =
        rechargeData.rechargeId;

    if (!rechargeId) {

        alert(
            "Recharge ID is missing."
        );

        return;
    }

    // ==========================
    // DISABLE BUTTON
    // ==========================

    paidBtn.disabled = true;

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
            .doc(rechargeId)
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
            .doc(rechargeId)
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
                await telegramResponse.json();

            console.log(
                "Telegram response:",
                telegramResult
            );

            if (!telegramResponse.ok) {

                console.error(
                    "Telegram notification failed:",
                    telegramResult
                );
            }

        } catch (telegramError) {

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
        // 5. SUCCESS
        // ==================================================

        alert(
            "Payment submitted successfully!\n\n" +
            "Your balance will be added after manual verification."
        );

        // ==================================================
        // 6. RETURN TO WALLET
        // ==================================================

        window.location.replace(
            "wallet.html"
        );

    } catch (error) {

        console.error(
            "Wallet Recharge Error:",
            error
        );

        // Re-enable button

        paidBtn.disabled = false;

        paidBtn.innerHTML =
            '<i class="fa-solid fa-check"></i> I\'ve Paid';

        alert(
            "Something went wrong.\n\nPlease try again."
        );
    }
};