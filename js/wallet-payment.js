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

    showVIPAlert(
        "Recharge information could not be found. Please start the recharge process again.",
        "error",
        "Recharge Not Found"
    );

    setTimeout(() => {

        window.location.replace("wallet.html");

    }, 1800);

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
        "pa=" +
        encodeURIComponent(UPI_ID) +
        "&pn=" +
        encodeURIComponent(UPI_NAME) +
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
        encodeURIComponent(upiLink) +
        "&size=300";


    qrImage.src =
        qrURL;


    // ==========================
    // QR ERROR FALLBACK
    // ==========================

    qrImage.onerror = () => {

        console.error(
            "QR code failed to load."
        );

        qrImage.alt =
            "QR code could not be loaded";

    };

}


// ======================================================
// COPY UPI ID
// ======================================================

copyUpi.onclick = async () => {

    try {

        await navigator.clipboard.writeText(
            UPI_ID
        );


        copyUpi.innerHTML =
            '<i class="fa-solid fa-check"></i>';


        showVIPAlert(
            "UPI ID has been copied successfully.",
            "success",
            "UPI ID Copied"
        );


        setTimeout(() => {

            copyUpi.innerHTML =
                '<i class="fa-solid fa-copy"></i>';

        }, 1500);


    } catch (error) {

        console.error(
            "Copy UPI error:",
            error
        );


        showVIPAlert(
            "UPI ID: " + UPI_ID,
            "info",
            "Copy UPI ID"
        );

    }

};


// ======================================================
// FIREBASE AUTH
// ======================================================

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

        showVIPAlert(
            "Please login to continue with your payment.",
            "warning",
            "Login Required"
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

        showVIPAlert(
            "Recharge information could not be found. Please start the recharge process again.",
            "error",
            "Recharge Not Found"
        );


        setTimeout(() => {

            window.location.replace(
                "wallet.html"
            );

        }, 1800);


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

        showVIPAlert(
            "Please enter a valid recharge amount between ₹10 and ₹10,000.",
            "warning",
            "Invalid Recharge Amount"
        );

        return;

    }


    if (
        !/^[6-9]\d{9}$/.test(mobile)
    ) {

        showVIPAlert(
            "Please enter a valid 10 digit mobile number.",
            "error",
            "Invalid Mobile Number"
        );

        return;

    }


    // ==========================
    // RECHARGE ID
    // ==========================

    const rechargeId =
        rechargeData.rechargeId;


    if (!rechargeId) {

        showVIPAlert(
            "Recharge ID is missing. Please start the recharge process again.",
            "error",
            "Recharge ID Missing"
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
        // 5. SUCCESS ALERT
        // ==================================================

        showVIPAlert(
            "Payment submitted successfully!\n\nYour balance will be added after manual verification.",
            "success",
            "Payment Submitted"
        );


        // ==================================================
        // 6. RETURN TO WALLET
        // ==================================================

        setTimeout(() => {

            window.location.replace(
                "wallet.html"
            );

        }, 2200);


    } catch (error) {


        // ==================================================
        // ERROR
        // ==================================================

        console.error(
            "Wallet Recharge Error:",
            error
        );


        // Re-enable button

        paidBtn.disabled =
            false;


        paidBtn.innerHTML =
            '<i class="fa-solid fa-check"></i> I\'ve Paid';


        showVIPAlert(
            "Something went wrong.\n\nPlease try again.",
            "error",
            "Payment Failed"
        );

    }

};


// ======================================================
// VIP COOL ALERT SYSTEM
// ======================================================

function showVIPAlert(
    message,
    type = "info",
    title = ""
) {


    // ==================================================
    // ALERT CONFIG
    // ==================================================

    const config = {

        success: {

            title: "Success",

            icon: "✓"

        },


        error: {

            title: "Something went wrong",

            icon: "!"

        },


        warning: {

            title: "Attention",

            icon: "!"

        },


        info: {

            title: "Notice",

            icon: "i"

        }

    };


    const data =
        config[type] || config.info;


    // ==================================================
    // REMOVE OLD ALERT
    // ==================================================

    const oldAlert =
        document.querySelector(
            ".vip-alert-overlay"
        );


    if (oldAlert) {

        oldAlert.remove();

    }


    // ==================================================
    // CREATE ALERT
    // ==================================================

    const overlay =
        document.createElement("div");


    overlay.className =
        "vip-alert-overlay";


    overlay.innerHTML = `

        <div class="vip-alert ${type}">

            <button
                class="vip-alert-close"
                onclick="closeVIPAlert()">

                ×

            </button>


            <div class="vip-alert-icon">

                ${data.icon}

            </div>


            <div class="vip-alert-title">

                ${title || data.title}

            </div>


            <div class="vip-alert-message">

                ${message}

            </div>


            <button
                class="vip-alert-button"
                onclick="closeVIPAlert()">

                Continue

            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    // ==================================================
    // SHOW ANIMATION
    // ==================================================

    requestAnimationFrame(() => {

        overlay.classList.add(
            "active"
        );

    });

}


// ======================================================
// CLOSE VIP ALERT
// ======================================================

function closeVIPAlert() {

    const overlay =
        document.querySelector(
            ".vip-alert-overlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.remove(
        "active"
    );


    setTimeout(() => {

        overlay.remove();

    }, 250);

}