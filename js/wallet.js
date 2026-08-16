// ======================================================
// VIP PANEL STORE
// WALLET SYSTEM
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
// AUTH STATE
// ======================================================

firebase.auth().onAuthStateChanged((user) => {

    console.log(
        "Wallet Auth State:",
        user ? user.uid : "NOT LOGGED IN"
    );


    // ==================================================
    // USER NOT LOGGED IN
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
    // SHOW LOADING
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
    //
    // customers/{AUTH_UID}
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


                // ======================================
                // CUSTOMER NOT FOUND
                // ======================================

                if (!doc.exists) {

                    if (walletBalance) {

                        walletBalance.innerText =
                            "0.00";

                    }


                    console.warn(
                        "Customer document not found:",
                        uid
                    );

                    return;
                }


                // ======================================
                // CUSTOMER DATA
                // ======================================

                const data =
                    doc.data() || {};


                console.log(
                    "Customer wallet data:",
                    data
                );


                // ======================================
                // BALANCE
                //
                // MAIN SOURCE:
                // customers/{uid}.balance
                // ======================================

                let balance =
                    Number(
                        data.balance || 0
                    );


                // ======================================
                // INVALID BALANCE PROTECTION
                // ======================================

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

                            <small>
                                ${escapeHTML(error.message)}
                            </small>

                        </div>

                    `;

                }

            }

        );


    // ==================================================
    // LOAD TRANSACTION HISTORY
    // ==================================================

    loadTransactionHistory(uid);

}


// ======================================================
// TRANSACTION HISTORY
// ======================================================

function loadTransactionHistory(uid) {

    if (!uid) return;


    // ==================================================
    // STOP OLD LISTENER
    // ==================================================

    if (transactionUnsubscribe) {

        transactionUnsubscribe();

        transactionUnsubscribe = null;

    }


    // ==================================================
    // QUERY
    //
    // balanceTransactions
    // where uid == AUTH UID
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
                // CONVERT SNAPSHOT TO ARRAY
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
                // SORT NEWEST FIRST
                //
                // No Firestore orderBy used,
                // so composite index is NOT required.
                // ======================================

                transactions.sort(
                    (a, b) => {

                        return (
                            getTimestamp(b.createdAt)
                            -
                            getTimestamp(a.createdAt)
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
// TIMESTAMP HELPER
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


    // JavaScript Date

    if (value instanceof Date) {

        return value.getTime();

    }


    // Number

    if (
        typeof value === "number"
    ) {

        return value;

    }


    // String date

    const parsed =
        new Date(value).getTime();


    return Number.isNaN(parsed)
        ? 0
        : parsed;

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
        // TYPE
        // ==========================================

        const type =
            String(
                tx.type || ""
            ).toLowerCase();


        // ==========================================
        // AMOUNT
        // ==========================================

        const amount =
            Number(
                tx.amount || 0
            );


        // ==========================================
        // STATUS
        // ==========================================

        const status =
            String(
                tx.status || "Pending"
            );


        // ==========================================
        // CREDIT / DEBIT
        // ==========================================

        const isCredit =
            type === "credit" ||
            type === "recharge";


        const isDebit =
            type === "debit" ||
            type === "purchase";


        // ==========================================
        // TITLE
        // ==========================================

        let title =
            "Transaction";


        if (isCredit) {

            title =
                "Balance Recharge";

        }


        if (isDebit) {

            title =
                "Purchase";

        }


        // ==========================================
        // DESCRIPTION
        // ==========================================

        let description =
            tx.description || "";


        if (!description) {

            if (isCredit) {

                description =
                    "Wallet Recharge";

            } else if (isDebit) {

                description =
                    "Wallet Purchase";

            }

        }


        // ==========================================
        // CLASS
        // ==========================================

        const transactionClass =
            isCredit
                ? "credit"
                : "debit";


        // ==========================================
        // ICON
        // ==========================================

        const icon =
            isCredit
                ? "fa-arrow-down"
                : "fa-arrow-up";


        // ==========================================
        // AMOUNT TEXT
        // ==========================================

        let amountText;


        if (isCredit) {

            amountText =
                "+ ₹" +
                Math.abs(amount)
                    .toFixed(2);

        } else {

            amountText =
                "- ₹" +
                Math.abs(amount)
                    .toFixed(2);

        }


        // ==========================================
        // DATE
        // ==========================================

        const dateText =
            formatDate(
                tx.createdAt
            );


        // ==========================================
        // ORDER / RECHARGE ID
        // ==========================================

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


        // ==========================================
        // CARD
        // ==========================================

        const card =
            document.createElement("div");


        card.className =
            "transaction-card " +
            transactionClass;


        card.innerHTML = `

            <div class="transaction-left">

                <div class="transaction-icon">

                    <i class="fa-solid ${icon}"></i>

                </div>


                <div class="transaction-info">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <p>
                        ${escapeHTML(
                            description
                        )}
                    </p>

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

                    ${amountText}

                </strong>


                <span class="transaction-status">

                    ${escapeHTML(
                        status
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


        addBalanceModal.classList.add(
            "show"
        );

    };

}


// ======================================================
// CLOSE MODAL
// ======================================================

if (closeModal) {

    closeModal.onclick = () => {

        addBalanceModal.classList.remove(
            "show"
        );

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


        // ==========================================
        // AMOUNT
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
        // MOBILE
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
        // LOGIN CHECK
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