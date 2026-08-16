// ======================================================
// VIP PANEL STORE
// WALLET SYSTEM
// COMPLETE WALLET.JS
// ======================================================


// ======================================================
// ELEMENTS
// ======================================================

const walletBalance =
    document.getElementById("walletBalance");

const transactionList =
    document.getElementById("transactionList");

const addBalanceBtn =
    document.getElementById("addBalanceBtn");

const addBalanceModal =
    document.getElementById("addBalanceModal");

const closeModal =
    document.getElementById("closeModal");

const balanceAmount =
    document.getElementById("balanceAmount");

const balanceMobile =
    document.getElementById("balanceMobile");

const continuePayment =
    document.getElementById("continuePayment");


// ======================================================
// GLOBAL VARIABLES
// ======================================================

let currentWalletUser = null;

let customerUnsubscribe = null;

let transactionUnsubscribe = null;


// ======================================================
// INJECT WALLET TRANSACTION CSS
// ======================================================

(function injectWalletStyles() {

    if (document.getElementById("walletTransactionStyles")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "walletTransactionStyles";

    style.textContent = `

    /* ==================================================
       TRANSACTION CARD
       ================================================== */

    .transaction-card {

        width: 100%;
        box-sizing: border-box;

        display: flex;
        align-items: center;
        justify-content: space-between;

        gap: 15px;

        padding: 18px;

        margin-bottom: 14px;

        border-radius: 18px;

        background: rgba(25, 55, 100, 0.95);

        border-left: 4px solid transparent;

        box-shadow:
            0 8px 25px rgba(0,0,0,0.18);

        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;

    }


    .transaction-card:hover {

        transform: translateY(-2px);

        box-shadow:
            0 12px 30px rgba(0,0,0,0.25);

    }


    /* ==================================================
       LEFT
       ================================================== */

    .transaction-left {

        display: flex;

        align-items: center;

        gap: 13px;

        min-width: 0;

        flex: 1;

    }


    .transaction-icon {

        width: 46px;

        height: 46px;

        min-width: 46px;

        border-radius: 50%;

        display: flex;

        align-items: center;

        justify-content: center;

        font-size: 17px;

    }


    .transaction-info {

        min-width: 0;

    }


    .transaction-info h3 {

        margin: 0 0 5px 0;

        font-size: 16px;

        font-weight: 700;

        color: #ffffff;

    }


    /* Description intentionally hidden */

    .transaction-info p {

        display: none !important;

    }


    .transaction-date {

        display: block;

        margin-top: 2px;

        font-size: 12px;

        color: rgba(255,255,255,0.68);

    }


    .transaction-reference {

        display: block;

        margin-top: 4px;

        font-size: 11px;

        color: rgba(255,255,255,0.48);

        word-break: break-all;

    }


    /* ==================================================
       RIGHT
       ================================================== */

    .transaction-right {

        display: flex;

        flex-direction: column;

        align-items: flex-end;

        justify-content: center;

        gap: 5px;

        min-width: 95px;

    }


    .transaction-right strong {

        font-size: 17px;

        font-weight: 800;

        white-space: nowrap;

    }


    .transaction-status {

        display: inline-flex;

        align-items: center;

        justify-content: center;

        padding: 4px 9px;

        border-radius: 20px;

        font-size: 10px;

        font-weight: 700;

        white-space: nowrap;

    }


    /* ==================================================
       BALANCE RECHARGE
       ================================================== */

    .transaction-card.recharge {

        border-left-color: #39ff72;

    }


    .transaction-card.recharge
    .transaction-icon {

        background: rgba(57,255,114,0.14);

        color: #39ff72;

    }


    .transaction-card.recharge
    .transaction-right strong {

        color: #39ff72;

    }


    /* ==================================================
       PURCHASE
       ================================================== */

    .transaction-card.purchase {

        border-left-color: #ff4d5a;

    }


    .transaction-card.purchase
    .transaction-icon {

        background: rgba(255,77,90,0.14);

        color: #ff4d5a;

    }


    .transaction-card.purchase
    .transaction-right strong {

        color: #ff4d5a;

    }


    /* ==================================================
       REFUND
       ================================================== */

    .transaction-card.refund {

        border-left-color: #35b8ff;

    }


    .transaction-card.refund
    .transaction-icon {

        background: rgba(53,184,255,0.15);

        color: #35b8ff;

    }


    .transaction-card.refund
    .transaction-right strong {

        color: #35b8ff;

    }


    /* ==================================================
       PENDING
       ================================================== */

    .transaction-card.pending {

        border-left-color: #ffc107;

    }


    .transaction-card.pending
    .transaction-icon {

        background: rgba(255,193,7,0.15);

        color: #ffc107;

    }


    .transaction-card.pending
    .transaction-right strong {

        color: #ffc107;

    }


    /* ==================================================
       FAILED
       ================================================== */

    .transaction-card.failed {

        border-left-color: #ff3b4d;

    }


    .transaction-card.failed
    .transaction-icon {

        background: rgba(255,59,77,0.15);

        color: #ff3b4d;

    }


    .transaction-card.failed
    .transaction-right strong {

        color: #ff3b4d;

    }


    /* ==================================================
       STATUS BADGES
       ================================================== */

    .transaction-status.status-completed,
    .transaction-status.status-approved {

        color: #42ff7b;

        background: rgba(66,255,123,0.12);

    }


    .transaction-status.status-pending {

        color: #ffc107;

        background: rgba(255,193,7,0.13);

    }


    .transaction-status.status-failed,
    .transaction-status.status-rejected {

        color: #ff5364;

        background: rgba(255,83,100,0.13);

    }


    /* ==================================================
       MOBILE
       ================================================== */

    @media (max-width: 600px) {

        .transaction-card {

            padding: 14px;

            gap: 9px;

        }


        .transaction-icon {

            width: 40px;

            height: 40px;

            min-width: 40px;

            font-size: 14px;

        }


        .transaction-info h3 {

            font-size: 14px;

        }


        .transaction-right strong {

            font-size: 14px;

        }


        .transaction-status {

            font-size: 9px;

            padding: 3px 7px;

        }


        .transaction-date {

            font-size: 10px;

        }


        .transaction-reference {

            font-size: 9px;

        }

    }

    `;

    document.head.appendChild(style);

})();


// ======================================================
// AUTH STATE
// ======================================================

firebase.auth().onAuthStateChanged((user) => {

    console.log(
        "Wallet Auth State:",
        user ? user.uid : "NOT LOGGED IN"
    );


    // ==================================================
    // NOT LOGGED IN
    // ==================================================

    if (!user) {

        currentWalletUser = null;

        if (customerUnsubscribe) {

            customerUnsubscribe();

            customerUnsubscribe = null;

        }


        if (transactionUnsubscribe) {

            transactionUnsubscribe();

            transactionUnsubscribe = null;

        }


        window.location.replace("login.html");

        return;

    }


    // ==================================================
    // SAVE USER
    // ==================================================

    currentWalletUser = user;


    console.log(
        "Wallet User UID:",
        user.uid
    );


    console.log(
        "Wallet User Email:",
        user.email
    );


    // ==================================================
    // LOAD WALLET
    // ==================================================

    loadWallet(user.uid);

});


// ======================================================
// LOAD WALLET
// ======================================================

function loadWallet(uid) {

    if (!uid) {

        console.error(
            "Wallet UID missing."
        );

        return;

    }


    // ==================================================
    // STOP OLD LISTENERS
    // ==================================================

    if (customerUnsubscribe) {

        customerUnsubscribe();

        customerUnsubscribe = null;

    }


    if (transactionUnsubscribe) {

        transactionUnsubscribe();

        transactionUnsubscribe = null;

    }


    // ==================================================
    // LOADING
    // ==================================================

    if (walletBalance) {

        walletBalance.innerText =
            "Loading...";

    }


    if (transactionList) {

        transactionList.innerHTML = `

            <div class="wallet-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                <p>Loading wallet...</p>

            </div>

        `;

    }


    // ==================================================
    // CUSTOMER
    // ==================================================

    const customerRef = db
        .collection("customers")
        .doc(uid);


    customerUnsubscribe =
        customerRef.onSnapshot(

            (doc) => {

                console.log(
                    "Customer wallet document:",
                    doc.exists
                );


                if (!doc.exists) {

                    if (walletBalance) {

                        walletBalance.innerText =
                            "0.00";

                    }

                    return;

                }


                const data =
                    doc.data() || {};


                let balance =
                    Number(
                        data.balance || 0
                    );


                if (
                    !Number.isFinite(balance) ||
                    balance < 0
                ) {

                    balance = 0;

                }


                if (walletBalance) {

                    walletBalance.innerText =
                        balance.toFixed(2);

                }

            },

            (error) => {

                console.error(
                    "Customer wallet error:",
                    error
                );


                if (walletBalance) {

                    walletBalance.innerText =
                        "0.00";

                }

            }

        );


    // ==================================================
    // TRANSACTION HISTORY
    // ==================================================

    loadTransactionHistory(uid);

}


// ======================================================
// LOAD TRANSACTION HISTORY
// ======================================================

function loadTransactionHistory(uid) {

    if (!uid) {
        return;
    }


    // ==================================================
    // STOP OLD LISTENER
    // ==================================================

    if (transactionUnsubscribe) {

        transactionUnsubscribe();

        transactionUnsubscribe = null;

    }


    // ==================================================
    // FIRESTORE QUERY
    // ==================================================

    transactionUnsubscribe = db

        .collection("balanceTransactions")

        .where(
            "uid",
            "==",
            uid
        )

        .onSnapshot(

            (snapshot) => {

                console.log(
                    "Wallet transactions:",
                    snapshot.size
                );


                // ======================================
                // EMPTY
                // ======================================

                if (snapshot.empty) {

                    transactionList.innerHTML = `

                        <div class="empty-wallet">

                            <i class="fa-solid fa-receipt"></i>

                            <h3>
                                No Transactions
                            </h3>

                            <p>
                                Your transaction history will appear here.
                            </p>

                        </div>

                    `;

                    return;

                }


                // ======================================
                // ARRAY
                // ======================================

                const transactions = [];


                snapshot.forEach((doc) => {

                    const data =
                        doc.data() || {};


                    transactions.push({

                        id:
                            doc.id,

                        ...data

                    });

                });


                // ======================================
                // NEWEST FIRST
                // ======================================

                transactions.sort(
                    (a, b) => {

                        return (

                            getTimestamp(
                                b.createdAt
                            )

                            -

                            getTimestamp(
                                a.createdAt
                            )

                        );

                    }
                );


                // ======================================
                // RENDER
                // ======================================

                renderTransactions(
                    transactions
                );

            },

            (error) => {

                console.error(
                    "Transaction history error:",
                    error
                );


                transactionList.innerHTML = `

                    <div class="wallet-error">

                        <i class="fa-solid fa-circle-exclamation"></i>

                        <h3>
                            Unable to load history
                        </h3>

                        <p>
                            Please try again later.
                        </p>

                        <small>
                            ${escapeHTML(error.message)}
                        </small>

                        <button
                            onclick="location.reload()"
                            class="wallet-retry-btn">

                            Try Again

                        </button>

                    </div>

                `;

            }

        );

}


// ======================================================
// GET TIMESTAMP
// ======================================================

function getTimestamp(value) {

    if (!value) {
        return 0;
    }


    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (value instanceof Date) {

        return value.getTime();

    }


    if (
        typeof value === "number"
    ) {

        return value;

    }


    const parsed =
        new Date(value).getTime();


    return Number.isNaN(parsed)
        ? 0
        : parsed;

}


// ======================================================
// DETECT TRANSACTION
// ======================================================

function getTransactionInfo(tx) {

    const rawType = String(
        tx.type ||
        tx.transactionType ||
        tx.category ||
        ""
    )
        .trim()
        .toLowerCase();


    const rawStatus = String(
        tx.status ||
        "Pending"
    )
        .trim()
        .toLowerCase();


    const description = String(
        tx.description ||
        tx.productName ||
        tx.name ||
        ""
    )
        .trim()
        .toLowerCase();


    // ==================================================
    // FAILED / REJECTED
    // ==================================================

    const isFailed =
        rawStatus === "rejected" ||
        rawStatus === "reject" ||
        rawStatus === "failed" ||
        rawStatus === "failure" ||
        rawStatus === "cancelled" ||
        rawStatus === "canceled";


    if (isFailed) {

        return {

            kind: "failed",

            title: "Payment Failed",

            icon: "fa-xmark",

            statusText: "Rejected",

            statusClass: "status-rejected"

        };

    }


    // ==================================================
    // PENDING
    // ==================================================

    const isPending =
        rawStatus === "pending" ||
        rawStatus === "processing" ||
        rawStatus === "under review" ||
        rawStatus === "waiting";


    // ==================================================
    // REFUND
    // ==================================================

    const isRefund =
        rawType === "refund" ||
        rawType === "refunded" ||
        description.includes("refund") ||
        tx.refund === true;


    if (isRefund) {

        return {

            kind: isPending
                ? "pending"
                : "refund",

            title: isPending
                ? "Refund Pending"
                : "Refund",

            icon: isPending
                ? "fa-clock"
                : "fa-rotate-left",

            statusText: isPending
                ? "Pending"
                : "Completed",

            statusClass: isPending
                ? "status-pending"
                : "status-completed"

        };

    }


    // ==================================================
    // PURCHASE
    // ==================================================

    const isPurchase =
        rawType === "debit" ||
        rawType === "purchase" ||
        rawType === "order" ||
        tx.orderId ||
        tx.productId;


    if (isPurchase) {

        return {

            kind: isPending
                ? "pending"
                : "purchase",

            title: isPending
                ? "Payment Pending"
                : "Purchase",

            icon: isPending
                ? "fa-clock"
                : "fa-arrow-up",

            statusText: isPending
                ? "Pending"
                : (
                    rawStatus === "approved"
                    ? "Approved"
                    : "Completed"
                ),

            statusClass: isPending
                ? "status-pending"
                : (
                    rawStatus === "approved"
                    ? "status-approved"
                    : "status-completed"
                )

        };

    }


    // ==================================================
    // BALANCE RECHARGE
    // ==================================================

    const isRecharge =
        rawType === "credit" ||
        rawType === "recharge" ||
        rawType === "balance recharge" ||
        tx.rechargeId ||
        tx.balanceAdded === true;


    if (isRecharge) {

        return {

            kind: isPending
                ? "pending"
                : "recharge",

            title: isPending
                ? "Payment Pending"
                : "Balance Recharge",

            icon: isPending
                ? "fa-clock"
                : "fa-arrow-down",

            statusText: isPending
                ? "Pending"
                : (
                    rawStatus === "approved"
                    ? "Approved"
                    : "Completed"
                ),

            statusClass: isPending
                ? "status-pending"
                : (
                    rawStatus === "approved"
                    ? "status-approved"
                    : "status-completed"
                )

        };

    }


    // ==================================================
    // DEFAULT
    // ==================================================

    return {

        kind: isPending
            ? "pending"
            : "recharge",

        title: isPending
            ? "Payment Pending"
            : "Balance Recharge",

        icon: isPending
            ? "fa-clock"
            : "fa-circle-check",

        statusText: isPending
            ? "Pending"
            : "Completed",

        statusClass: isPending
            ? "status-pending"
            : "status-completed"

    };

}


// ======================================================
// RENDER TRANSACTIONS
// ======================================================

function renderTransactions(
    transactions
) {

    if (!transactionList) {
        return;
    }


    if (!transactions.length) {

        transactionList.innerHTML = `

            <div class="empty-wallet">

                <i class="fa-solid fa-receipt"></i>

                <h3>
                    No Transactions
                </h3>

                <p>
                    Your transaction history will appear here.
                </p>

            </div>

        `;

        return;

    }


    transactionList.innerHTML = "";


    transactions.forEach((tx) => {

        const amount =
            Number(
                tx.amount || 0
            );


        const info =
            getTransactionInfo(tx);


        // ==================================================
        // AMOUNT
        // ==================================================

        let amountText = "";


        // Refund / Recharge = +
        if (
            info.kind === "recharge" ||
            info.kind === "refund"
        ) {

            amountText =
                "+ ₹" +
                Math.abs(amount)
                    .toFixed(2);

        }

        // Purchase = -
        else if (
            info.kind === "purchase"
        ) {

            amountText =
                "- ₹" +
                Math.abs(amount)
                    .toFixed(2);

        }

        // Pending
        else if (
            info.kind === "pending"
        ) {

            // Debit pending
            if (
                String(
                    tx.type || ""
                ).toLowerCase() === "debit" ||
                tx.orderId ||
                tx.productId
            ) {

                amountText =
                    "- ₹" +
                    Math.abs(amount)
                        .toFixed(2);

            }

            // Credit pending
            else {

                amountText =
                    "+ ₹" +
                    Math.abs(amount)
                        .toFixed(2);

            }

        }

        // Failed
        else {

            amountText =
                "₹" +
                Math.abs(amount)
                    .toFixed(2);

        }


        // ==================================================
        // DATE
        // ==================================================

        const dateText =
            formatDate(
                tx.createdAt
            );


        // ==================================================
        // REFERENCE
        // ==================================================

        let referenceHTML = "";


        if (tx.orderId) {

            referenceHTML = `

                <span class="transaction-reference">

                    Order: ${escapeHTML(
                        String(tx.orderId)
                    )}

                </span>

            `;

        }


        if (tx.rechargeId) {

            referenceHTML = `

                <span class="transaction-reference">

                    Recharge: ${escapeHTML(
                        String(tx.rechargeId)
                    )}

                </span>

            `;

        }


        // ==================================================
        // CARD
        // ==================================================

        const card =
            document.createElement("div");


        card.className =
            "transaction-card " +
            info.kind;


        card.innerHTML = `

            <div class="transaction-left">

                <div class="transaction-icon">

                    <i class="fa-solid ${info.icon}"></i>

                </div>


                <div class="transaction-info">

                    <h3>
                        ${escapeHTML(
                            info.title
                        )}
                    </h3>


                    <span class="transaction-date">

                        ${escapeHTML(
                            dateText
                        )}

                    </span>


                    ${referenceHTML}

                </div>

            </div>


            <div class="transaction-right">

                <strong>

                    ${escapeHTML(
                        amountText
                    )}

                </strong>


                <span class="transaction-status ${info.statusClass}">

                    ${escapeHTML(
                        info.statusText
                    )}

                </span>

            </div>

        `;


        transactionList.appendChild(
            card
        );

    });

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(timestamp) {

    if (!timestamp) {

        return "Date unavailable";

    }


    let date = null;


    // Firestore Timestamp

    if (
        typeof timestamp.toDate ===
        "function"
    ) {

        date =
            timestamp.toDate();

    }


    // JavaScript Date

    else if (
        timestamp instanceof Date
    ) {

        date =
            timestamp;

    }


    // String / Number

    else {

        const parsed =
            new Date(timestamp);

        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            date =
                parsed;

        }

    }


    if (!date) {

        return "Date unavailable";

    }


    return (

        date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        )

        +

        " • "

        +

        date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        )

    );

}


// ======================================================
// ADD BALANCE MODAL
// ======================================================

if (addBalanceBtn) {

    addBalanceBtn.onclick = () => {

        if (!currentWalletUser) {

            showVIPAlert(
                "Please login first.",
                "warning",
                "Login Required"
            );

            return;

        }


        if (addBalanceModal) {

            addBalanceModal.classList.add(
                "show"
            );

        }

    };

}


// ======================================================
// CLOSE MODAL
// ======================================================

if (closeModal) {

    closeModal.onclick = () => {

        if (addBalanceModal) {

            addBalanceModal.classList.remove(
                "show"
            );

        }

    };

}


// ======================================================
// CLOSE MODAL OUTSIDE
// ======================================================

if (addBalanceModal) {

    addBalanceModal.onclick = (event) => {

        if (
            event.target ===
            addBalanceModal
        ) {

            addBalanceModal.classList.remove(
                "show"
            );

        }

    };

}


// ======================================================
// CONTINUE PAYMENT
// ======================================================

if (continuePayment) {

    continuePayment.onclick = () => {

        const amount =
            Number(
                balanceAmount.value
            );


        const mobile =
            balanceMobile.value.trim();


        // ==================================================
        // AMOUNT VALIDATION
        // ==================================================

        if (
            !amount ||
            amount < 10 ||
            amount > 10000
        ) {

            showVIPAlert(
                "Please enter an amount between ₹10 and ₹10,000.",
                "warning",
                "Invalid Amount"
            );

            return;

        }


        // ==================================================
        // MOBILE VALIDATION
        // ==================================================

        if (
            !/^[6-9]\d{9}$/.test(
                mobile
            )
        ) {

            showVIPAlert(
                "Please enter a valid 10 digit mobile number.",
                "error",
                "Invalid Mobile Number"
            );

            return;

        }


        // ==================================================
        // LOGIN CHECK
        // ==================================================

        const user =
            firebase.auth().currentUser;


        if (!user) {

            showVIPAlert(
                "Please login first.",
                "warning",
                "Login Required"
            );

            return;

        }


        // ==================================================
        // RECHARGE ID
        // ==================================================

        const rechargeId =

            "RCG-" +

            Date.now() +

            "-" +

            Math.random()
                .toString(36)
                .substring(
                    2,
                    8
                )
                .toUpperCase();


        // ==================================================
        // SAVE RECHARGE DATA
        // ==================================================

        localStorage.setItem(

            "walletRecharge",

            JSON.stringify({

                rechargeId:
                    rechargeId,

                amount:
                    amount,

                mobile:
                    mobile

            })

        );


        // ==================================================
        // PAYMENT PAGE
        // ==================================================

        window.location.href =
            "wallet-payment.html";

    };

}


// ======================================================
// VIP ALERT
// ======================================================

function showVIPAlert(
    message,
    type = "info",
    title = ""
) {

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
        config[type] ||
        config.info;


    const oldAlert =
        document.querySelector(
            ".vip-alert-overlay"
        );


    if (oldAlert) {

        oldAlert.remove();

    }


    const overlay =
        document.createElement(
            "div"
        );


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

                ${escapeHTML(
                    title ||
                    data.title
                )}

            </div>


            <div class="vip-alert-message">

                ${escapeHTML(
                    message
                )}

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


    requestAnimationFrame(() => {

        overlay.classList.add(
            "active"
        );

    });

}


// ======================================================
// CLOSE ALERT
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

        if (overlay) {

            overlay.remove();

        }

    }, 250);

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(value) {

    return String(value ?? "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ======================================================
// PAGE CLEANUP
// ======================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (customerUnsubscribe) {

            customerUnsubscribe();

        }


        if (transactionUnsubscribe) {

            transactionUnsubscribe();

        }

    }
);