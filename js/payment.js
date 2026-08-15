// ======================================================
// VIP PANEL STORE
// PAYMENT PAGE
// MANUAL APPROVAL SYSTEM
// ======================================================


// ==========================
// CONFIG
// ==========================

const UPI_ID = "kundusudip2006@oksbi";

const UPI_NAME = "VIP Store";

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
// POPUP
// ======================================================

function showNotification(
    type,
    title,
    message,
    buttonText = "OK",
    onClose = null
) {

    const old =
        document.getElementById(
            "walletNotificationPopup"
        );

    if (old) {
        old.remove();
    }


    let icon = "✓";

    if (type === "error") {
        icon = "!";
    }

    if (type === "warning") {
        icon = "!";
    }


    const popup =
        document.createElement("div");


    popup.id =
        "walletNotificationPopup";


    popup.innerHTML = `

        <div style="
            position:fixed;
            inset:0;
            z-index:999999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            background:rgba(0,0,0,.75);
            backdrop-filter:blur(8px);
        ">

            <div style="
                width:100%;
                max-width:380px;
                padding:28px 22px 22px;
                border-radius:25px;
                text-align:center;
                color:white;
                background:linear-gradient(
                    145deg,
                    #071b35,
                    #062c42
                );
                border:1px solid
                    rgba(0,210,255,.28);
                box-shadow:
                    0 25px 70px
                    rgba(0,0,0,.65);
            ">

                <div style="
                    width:72px;
                    height:72px;
                    margin:0 auto 16px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    border-radius:50%;
                    font-size:36px;
                    font-weight:800;
                    color:white;
                    background:
                        ${type === "success"
                            ? "linear-gradient(135deg,#00e676,#00bfa5)"
                            : type === "warning"
                            ? "linear-gradient(135deg,#ffb300,#ff6f00)"
                            : "linear-gradient(135deg,#ff1744,#d50000)"
                        };
                ">

                    ${icon}

                </div>

                <h2>
                    ${title}
                </h2>

                <p style="
                    color:rgba(255,255,255,.72);
                    line-height:1.6;
                    white-space:pre-line;
                ">
                    ${message}
                </p>

                <button
                    id="walletNotificationBtn"
                    style="
                        width:100%;
                        border:none;
                        padding:14px;
                        border-radius:15px;
                        font-size:15px;
                        font-weight:700;
                        color:white;
                        background:
                            linear-gradient(
                                135deg,
                                #006eff,
                                #00c6ff
                            );
                        cursor:pointer;
                    "
                >
                    ${buttonText}
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(popup);


    document
        .getElementById(
            "walletNotificationBtn"
        )
        .onclick = () => {

            popup.remove();

            if (
                typeof onClose ===
                "function"
            ) {

                onClose();

            }

        };

}


// ======================================================
// LOAD RECHARGE
// ======================================================

const rechargeString =
    localStorage.getItem(
        "walletRecharge"
    );


let recharge = null;


try {

    recharge =
        rechargeString
            ? JSON.parse(rechargeString)
            : null;

} catch (error) {

    console.error(
        "Recharge data parse error:",
        error
    );

    recharge = null;

}


// ======================================================
// CHECK RECHARGE
// ======================================================

if (!recharge) {

    showNotification(

        "error",

        "Recharge Not Found",

        "No active recharge was found.\n\nPlease go back and start a new recharge.",

        "Go Back",

        () => {

            window.location.replace(
                "wallet.html"
            );

        }

    );

} else {

    loadPaymentDetails();

}


// ======================================================
// LOAD PAYMENT DETAILS
// ======================================================

function loadPaymentDetails() {

    const amount =
        Number(
            recharge.amount || 0
        );


    const mobile =
        String(
            recharge.mobile || ""
        );


    if (
        !amount ||
        amount < 10 ||
        amount > 10000
    ) {

        showNotification(

            "error",

            "Invalid Amount",

            "The recharge amount is invalid.",

            "Go Back",

            () => {

                window.location.replace(
                    "wallet.html"
                );

            }

        );

        return;

    }


    paymentAmount.textContent =
        "₹" +
        amount.toFixed(2);


    paymentMobile.textContent =
        mobile;


    upiId.textContent =
        UPI_ID;


    // ==========================
    // UPI LINK
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


    payNow.href =
        upiLink;


    // ==========================
    // QR
    // ==========================

    qrImage.src =
        "https://quickchart.io/qr?text=" +
        encodeURIComponent(upiLink) +
        "&size=300";

}


// ======================================================
// COPY UPI
// ======================================================

copyUpi.addEventListener(
    "click",
    async () => {

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

                "UPI ID:\n" + UPI_ID

            );

        }

    }
);


// ======================================================
// AUTH
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
            "Payment user:",
            user.email
        );

    }
);


// ======================================================
// I'VE PAID
// ======================================================

paidBtn.addEventListener(
    "click",
    async () => {

        if (paidBtn.disabled) {
            return;
        }


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


        // --------------------------
        // GET DATA AGAIN
        // --------------------------

        const dataString =
            localStorage.getItem(
                "walletRecharge"
            );


        if (!dataString) {

            showNotification(

                "error",

                "Recharge Not Found",

                "Recharge information is missing.",

                "Go Back",

                () => {

                    window.location.replace(
                        "wallet.html"
                    );

                }

            );

            return;

        }


        let data;


        try {

            data =
                JSON.parse(dataString);

        } catch (error) {

            showNotification(
                "error",
                "Invalid Recharge",
                "Recharge data is invalid."
            );

            return;

        }


        const amount =
            Number(data.amount || 0);


        const mobile =
            String(
                data.mobile || ""
            ).trim();


        const rechargeId =
            String(
                data.rechargeId || ""
            );


        // ==========================
        // VALIDATION
        // ==========================

        if (
            amount < 10 ||
            amount > 10000
        ) {

            showNotification(
                "error",
                "Invalid Amount",
                "Amount must be between ₹10 and ₹10,000."
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
                "Invalid Mobile",
                "Please enter a valid 10 digit mobile number."
            );

            return;

        }


        if (!rechargeId) {

            showNotification(
                "error",
                "Recharge ID Missing",
                "Please start the recharge again.",
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

        paidBtn.disabled = true;

        paidBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';


        try {

            // ==================================================
            // 1. FIRESTORE RECHARGE REQUEST
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


            // ==================================================
            // 2. TRANSACTION
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


            // ==================================================
            // 3. TELEGRAM
            // ==================================================

            try {

                const response =
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


                console.log(
                    "Telegram response:",
                    response.status
                );


            } catch (telegramError) {

                console.error(
                    "Telegram notification failed:",
                    telegramError
                );

            }


            // ==================================================
            // 4. REMOVE TEMP DATA
            // ==================================================

            localStorage.removeItem(
                "walletRecharge"
            );


            // ==================================================
            // 5. SUCCESS
            // ==================================================

            showNotification(

                "success",

                "Payment Submitted!",

                "Your payment request has been submitted successfully.\n\nYour balance will be added after manual verification.",

                "Done",

                () => {

                    window.location.replace(
                        "wallet.html"
                    );

                }

            );


        } catch (error) {

            console.error(
                "Payment error:",
                error
            );


            paidBtn.disabled =
                false;


            paidBtn.innerHTML =
                '<i class="fa-solid fa-check"></i> I\'ve Paid';


            showNotification(

                "error",

                "Payment Failed",

                "Unable to submit your payment request.\n\nPlease try again."

            );

        }

    }
);