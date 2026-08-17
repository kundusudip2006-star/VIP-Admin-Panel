// ======================================================
// VIP PANEL STORE
// WALLET SYSTEM
// TRANSACTION HISTORY
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
// FIREBASE AUTH
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

        if (customerUnsubscribe) {

            customerUnsubscribe();

            customerUnsubscribe = null;

        }


        if (transactionUnsubscribe) {

            transactionUnsubscribe();

            transactionUnsubscribe = null;

        }


        window.location.replace(
            "login.html"
        );

        return;

    }


    // ==================================================
    // SAVE CURRENT USER
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

    loadWallet(
        user.uid
    );

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
    // WALLET LOADING
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
    // CUSTOMER DOCUMENT
    // customers/{uid}
    // ==================================================

    const customerRef = db
        .collection("customers")
        .doc(uid);


    customerUnsubscribe =
        customerRef.onSnapshot(

            (doc) => {

                console.log(
                    "Customer document exists:",
                    doc.exists
                );


                // ======================================
                // CUSTOMER NOT FOUND
                // ======================================

                if (!doc.exists) {

                    if (walletBalance) {

                        walletBalance.innerText =
                            "0.00";

                    }

                    loadTransactionHistory(
                        uid
                    );

                    return;

                }


                // ======================================
                // CUSTOMER DATA
                // ======================================

                const data =
                    doc.data() || {};


                // ======================================
                // BALANCE
                // ======================================

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


                // ======================================
                // SHOW BALANCE
                // ======================================

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


                if (transactionList) {

                    transactionList.innerHTML = `

                        <div class="wallet-error">

                            <i class="fa-solid fa-circle-exclamation"></i>

                            <h3>
                                Wallet unavailable
                            </h3>

                            <p>
                                Unable to load your wallet.
                            </p>

                        </div>

                    `;

                }

            }

        );


    // ==================================================
    // LOAD TRANSACTIONS
    // ==================================================

    loadTransactionHistory(
        uid
    );

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

        .collection(
            "balanceTransactions"
        )

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
                // NO TRANSACTIONS
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
// TIMESTAMP
// ======================================================

function getTimestamp(value) {

    if (!value) {

        return 0;

    }


    // Firestore Timestamp

    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    // Firestore Timestamp object

    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate().getTime();

    }


    // Date

    if (
        value instanceof Date
    ) {

        return value.getTime();

    }


    // Number

    if (
        typeof value === "number"
    ) {

        return value;

    }


    // String

    const parsed =
        new Date(value).getTime();


    return Number.isNaN(parsed)
        ? 0
        : parsed;

}


// ======================================================
// TRANSACTION STATUS SYSTEM
// ======================================================

function getTransactionInfo(tx) {

    const type =
        String(tx.type || "")
            .toLowerCase()
            .trim();

    const transactionType =
        String(tx.transactionType || "")
            .toLowerCase()
            .trim();

    const category =
        String(tx.category || "")
            .toLowerCase()
            .trim();

    const reason =
        String(tx.reason || "")
            .toLowerCase()
            .trim();

    const description =
        String(tx.description || "")
            .toLowerCase()
            .trim();

    const title =
        String(tx.title || "")
            .toLowerCase()
            .trim();

    const rawStatus =
        String(tx.status || "Pending")
            .toLowerCase()
            .trim();


    // ==================================================
    // REFUND DETECTION
    // IMPORTANT:
    // Refund must be checked BEFORE credit/recharge
    // and BEFORE pending status.
    // ==================================================

    const isRefund =
        type === "refund" ||
        type === "refunded" ||

        transactionType === "refund" ||
        transactionType === "refunded" ||

        category === "refund" ||
        category === "refunded" ||

        reason.includes("refund") ||

        description.includes("refund") ||

        title.includes("refund");


    if (isRefund) {

        return {

            title:
                "Refund",

            status:
                "Complete",

            className:
                "refund",

            icon:
                "fa-rotate-left",

            amountClass:
                "positive"

        };

    }


    // ==================================================
    // REJECTED / FAILED
    // ==================================================

    if (
        rawStatus === "rejected" ||
        rawStatus === "reject" ||
        rawStatus === "failed" ||
        rawStatus === "failure" ||
        rawStatus === "cancelled" ||
        rawStatus === "canceled"
    ) {

        return {

            title:
                "Payment Failed",

            status:
                "Payment Failed",

            className:
                "rejected",

            icon:
                "fa-xmark",

            amountClass:
                "negative"

        };

    }


    // ==================================================
    // PENDING
    // ==================================================

    if (
        rawStatus === "pending" ||
        rawStatus === "processing" ||
        rawStatus === "waiting"
    ) {

        return {

            title:
                getTransactionTitle(
                    type
                ),

            status:
                "Pending",

            className:
                "pending",

            icon:
                "fa-clock",

            amountClass:
                getAmountClass(type)

        };

    }


    // ==================================================
    // BALANCE RECHARGE
    // ==================================================

    if (
        type === "credit" ||
        type === "recharge" ||
        type === "balance_recharge" ||
        type === "balance-recharge"
    ) {

        return {

            title:
                "Balance Recharge",

            status:
                "Successful",

            className:
                "credit",

            icon:
                "fa-arrow-down",

            amountClass:
                "positive"

        };

    }


    // ==================================================
    // PURCHASE
    // ==================================================

    if (
        type === "debit" ||
        type === "purchase"
    ) {

        return {

            title:
                "Purchase",

            status:
                "Complete",

            className:
                "debit",

            icon:
                "fa-arrow-up",

            amountClass:
                "negative"

        };

    }


    // ==================================================
    // DEFAULT
    // ==================================================

    return {

        title:
            "Transaction",

        status:
            "Complete",

        className:
            "credit",

        icon:
            "fa-receipt",

        amountClass:
            "positive"

    };

}


// ======================================================
// TRANSACTION TITLE
// ======================================================

function getTransactionTitle(type) {

    type =
        String(type || "")
            .toLowerCase()
            .trim();


    if (
        type === "refund" ||
        type === "refunded"
    ) {

        return "Refund";

    }


    if (
        type === "credit" ||
        type === "recharge" ||
        type === "balance_recharge" ||
        type === "balance-recharge"
    ) {

        return "Balance Recharge";

    }


    if (
        type === "debit" ||
        type === "purchase"
    ) {

        return "Purchase";

    }


    return "Transaction";

}


// ======================================================
// AMOUNT CLASS
// ======================================================

function getAmountClass(type) {

    type =
        String(type || "")
            .toLowerCase()
            .trim();


    if (
        type === "debit" ||
        type === "purchase"
    ) {

        return "negative";

    }


    // Refund is money returned to customer
    return "positive";

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


        // ==========================================
        // TRANSACTION INFO
        // ==========================================

        const info =
            getTransactionInfo(
                tx
            );


        // ==========================================
        // AMOUNT
        // ==========================================

        const amount =
            Math.abs(
                Number(
                    tx.amount || 0
                )
            );


        // ==========================================
        // AMOUNT PREFIX
        // ==========================================

        let amountText;


        if (
            info.amountClass ===
            "positive"
        ) {

            amountText =
                "+ ₹" +
                amount.toFixed(2);

        } else {

            amountText =
                "- ₹" +
                amount.toFixed(2);

        }


        // ==========================================
        // DATE
        // ==========================================

        const dateText =
            formatDate(
                tx.createdAt
            );


        // ==========================================
        // CARD
        // ==========================================

        const card =
            document.createElement(
                "div"
            );


        card.className =
            "transaction-card " +
            info.className;


        // ==========================================
        // ONLY:
        //
        // TITLE
        // DATE
        // AMOUNT
        // STATUS
        //
        // NO DESCRIPTION
        // NO ORDER ID
        // NO RECHARGE ID
        // ==========================================

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

                </div>

            </div>


            <div class="transaction-right">

                <strong
                    class="${info.amountClass}">

                    ${amountText}

                </strong>


                <span
                    class="transaction-status ${info.className}">

                    ${escapeHTML(
                        info.status
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


    // Date

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


        // ==========================================
        // AMOUNT
        // ==========================================

        const amount =
            Number(
                balanceAmount.value
            );


        // ==========================================
        // MOBILE
        // ==========================================

        const mobile =
            balanceMobile.value.trim();


        // ==========================================
        // VALIDATE AMOUNT
        // ==========================================

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


        // ==========================================
        // VALIDATE MOBILE
        // ==========================================

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


        // ==========================================
        // LOGIN
        // ==========================================

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


        // ==========================================
        // RECHARGE ID
        // ==========================================

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


        // ==========================================
        // SAVE RECHARGE DATA
        // ==========================================

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


        // ==========================================
        // PAYMENT PAGE
        // ==========================================

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

            title:
                "Success",

            icon:
                "✓"

        },


        error: {

            title:
                "Something went wrong",

            icon:
                "!"

        },


        warning: {

            title:
                "Attention",

            icon:
                "!"

        },


        info: {

            title:
                "Notice",

            icon:
                "i"

        }

    };


    const data =
        config[type] ||
        config.info;


    // ==========================================
    // REMOVE OLD ALERT
    // ==========================================

    const oldAlert =
        document.querySelector(
            ".vip-alert-overlay"
        );


    if (oldAlert) {

        oldAlert.remove();

    }


    // ==========================================
    // CREATE ALERT
    // ==========================================

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

    return String(
        value ?? ""
    )

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