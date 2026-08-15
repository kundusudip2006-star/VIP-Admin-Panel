// ======================================================
// WALLET SYSTEM
// ======================================================

const walletBalance = document.getElementById("walletBalance");
const transactionList = document.getElementById("transactionList");

const addBalanceBtn = document.getElementById("addBalanceBtn");
const addBalanceModal = document.getElementById("addBalanceModal");
const closeModal = document.getElementById("closeModal");

const balanceAmount = document.getElementById("balanceAmount");
const balanceMobile = document.getElementById("balanceMobile");
const continuePayment = document.getElementById("continuePayment");

// ======================================================
// AUTH
// ======================================================

firebase.auth().onAuthStateChanged(async (user) => {

    if (!user) {
        window.location.replace("login.html");
        return;
    }

    console.log("Wallet User:", user.uid);

    loadWallet(user.uid);
});

// ======================================================
// ADD BALANCE MODAL
// ======================================================

addBalanceBtn.onclick = () => {
    addBalanceModal.classList.add("show");
};

closeModal.onclick = () => {
    addBalanceModal.classList.remove("show");
};

addBalanceModal.onclick = (e) => {

    if (e.target === addBalanceModal) {
        addBalanceModal.classList.remove("show");
    }

};

// ======================================================
// CONTINUE PAYMENT
// ======================================================

continuePayment.onclick = () => {

    const amount = Number(balanceAmount.value);
    const mobile = balanceMobile.value.trim();

    if (!amount || amount < 10 || amount > 10000) {
        alert("Amount must be between ₹10 and ₹10,000.");
        return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
        alert("Please enter a valid 10 digit mobile number.");
        return;
    }

    // Unique Recharge ID
    const rechargeId =
        "RCG-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    // Temporary payment data
    localStorage.setItem(
        "walletRecharge",
        JSON.stringify({
            rechargeId: rechargeId,
            amount: amount,
            mobile: mobile
        })
    );

    window.location.href = "wallet-payment.html";
};

// ======================================================
// LOAD WALLET
// ======================================================

async function loadWallet(uid) {

    try {

        transactionList.innerHTML = `
            <p class="loading">Loading transactions...</p>
        `;

        const snapshot = await db
            .collection("balanceTransactions")
            .where("uid", "==", uid)
            .get();

        let transactions = [];

        snapshot.forEach(doc => {

            const data = doc.data();

            transactions.push({
                id: doc.id,
                ...data
            });

        });

        // Newest first
        transactions.sort((a, b) => {

            const aTime =
                a.createdAt?.toMillis
                    ? a.createdAt.toMillis()
                    : 0;

            const bTime =
                b.createdAt?.toMillis
                    ? b.createdAt.toMillis()
                    : 0;

            return bTime - aTime;

        });

        // ==================================================
        // CALCULATE BALANCE
        // ==================================================

        let balance = 0;

        transactions.forEach(tx => {

            const type =
                String(tx.type || "").toLowerCase();

            const status =
                String(tx.status || "").toLowerCase();

            // Only approved/completed transactions
            if (
                status !== "approved" &&
                status !== "completed"
            ) {
                return;
            }

            const amount =
                Number(tx.amount || 0);

            if (
                type === "credit" ||
                type === "recharge"
            ) {

                balance += amount;

            }

            if (
                type === "debit" ||
                type === "purchase"
            ) {

                balance -= amount;

            }

        });

        // Never show negative balance
        balance = Math.max(0, balance);

        walletBalance.innerText =
            balance.toFixed(2);

        // ==================================================
        // SHOW TRANSACTIONS
        // ==================================================

        renderTransactions(transactions);

    } catch (error) {

        console.error(
            "Wallet loading error:",
            error
        );

        walletBalance.innerText = "0.00";

        transactionList.innerHTML = `
            <div class="wallet-error">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>Unable to load transactions.</p>
                <button onclick="location.reload()">
                    Try Again
                </button>
            </div>
        `;

    }

}

// ======================================================
// RENDER TRANSACTIONS
// ======================================================

function renderTransactions(transactions) {

    if (!transactions.length) {

        transactionList.innerHTML = `
            <div class="empty-wallet">
                <i class="fa-solid fa-receipt"></i>
                <h3>No Transactions</h3>
                <p>Your transaction history will appear here.</p>
            </div>
        `;

        return;
    }

    transactionList.innerHTML = "";

    transactions.forEach(tx => {

        const type =
            String(tx.type || "").toLowerCase();

        const amount =
            Number(tx.amount || 0);

        const status =
            String(tx.status || "Pending");

        const isCredit =
            type === "credit" ||
            type === "recharge";

        const isDebit =
            type === "debit" ||
            type === "purchase";

        // ------------------------------------------
        // TITLE
        // ------------------------------------------

        let title = "Transaction";

        if (isCredit) {
            title = "Balance Recharge";
        }

        if (isDebit) {
            title = "Purchase";
        }

        // ------------------------------------------
        // CLASS
        // ------------------------------------------

        const transactionClass =
            isCredit
                ? "credit"
                : "debit";

        // ------------------------------------------
        // ICON
        // ------------------------------------------

        const icon =
            isCredit
                ? "fa-arrow-down"
                : "fa-arrow-up";

        // ------------------------------------------
        // AMOUNT
        // ------------------------------------------

        const amountText =
            isCredit
                ? `+ ₹${amount.toFixed(2)}`
                : `- ₹${amount.toFixed(2)}`;

        // ------------------------------------------
        // DATE
        // ------------------------------------------

        let dateText = "Date unavailable";

        if (
            tx.createdAt &&
            tx.createdAt.toDate
        ) {

            const date =
                tx.createdAt.toDate();

            dateText =
                date.toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                ) +
                " • " +
                date.toLocaleTimeString(
                    "en-IN",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

        }

        // ------------------------------------------
        // CARD
        // ------------------------------------------

        const card =
            document.createElement("div");

        card.className =
            `transaction-card ${transactionClass}`;

        card.innerHTML = `

            <div class="transaction-left">

                <div class="transaction-icon">
                    <i class="fa-solid ${icon}"></i>
                </div>

                <div class="transaction-info">

                    <h3>
                        ${title}
                    </h3>

                    <p>
                        ${dateText}
                    </p>

                </div>

            </div>

            <div class="transaction-right">

                <strong>
                    ${amountText}
                </strong>

                <span class="transaction-status">
                    ${status}
                </span>

            </div>

        `;

        transactionList.appendChild(card);

    });

}