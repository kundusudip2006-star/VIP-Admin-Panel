// ======================================================
// VIP PANEL STORE
// WALLET SYSTEM
// ======================================================

// IMPORTANT:
// Firebase db is loaded from js/firebase.js
// Do NOT declare const db here.

document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // ELEMENTS
    // ==============================

    const walletBalance = document.getElementById("walletBalance");
    const transactionList = document.getElementById("transactionList");

    const addBalanceBtn = document.getElementById("addBalanceBtn");
    const addBalanceModal = document.getElementById("addBalanceModal");
    const closeModal = document.getElementById("closeModal");

    const balanceAmount = document.getElementById("balanceAmount");
    const balanceMobile = document.getElementById("balanceMobile");
    const continuePayment = document.getElementById("continuePayment");


    // ==============================
    // CHECK ELEMENTS
    // ==============================

    if (!walletBalance || !transactionList) {
        console.error("Wallet elements not found.");
        return;
    }


    // ==============================
    // AUTH CHECK
    // ==============================

    firebase.auth().onAuthStateChanged(async (user) => {

        if (!user) {
            window.location.replace("login.html");
            return;
        }

        console.log("Wallet user:", user.uid);

        await loadWallet(user);
        await loadTransactions(user);

    });


    // ==============================
    // OPEN MODAL
    // ==============================

    if (addBalanceBtn) {

        addBalanceBtn.addEventListener("click", () => {

            addBalanceModal.classList.add("active");

            if (balanceAmount) {
                balanceAmount.value = "";
            }

            if (balanceMobile) {
                balanceMobile.value = "";
            }

        });

    }


    // ==============================
    // CLOSE MODAL
    // ==============================

    if (closeModal) {

        closeModal.addEventListener("click", () => {

            addBalanceModal.classList.remove("active");

        });

    }


    // ==============================
    // CLICK OUTSIDE MODAL
    // ==============================

    if (addBalanceModal) {

        addBalanceModal.addEventListener("click", (event) => {

            if (event.target === addBalanceModal) {

                addBalanceModal.classList.remove("active");

            }

        });

    }


    // ==============================
    // CONTINUE PAYMENT
    // ==============================

    if (continuePayment) {

        continuePayment.addEventListener("click", async () => {

            const user = firebase.auth().currentUser;

            if (!user) {

                alert("Please login first.");
                return;

            }


            // --------------------------
            // GET AMOUNT
            // --------------------------

            const amount = Number(
                balanceAmount.value
            );


            // --------------------------
            // GET MOBILE
            // --------------------------

            const mobile = String(
                balanceMobile.value
            ).trim();


            // --------------------------
            // VALIDATE AMOUNT
            // --------------------------

            if (
                !amount ||
                amount < 10 ||
                amount > 10000
            ) {

                alert(
                    "Recharge amount must be between ₹10 and ₹10,000."
                );

                return;
            }


            // --------------------------
            // VALIDATE MOBILE
            // --------------------------

            if (!/^[6-9]\d{9}$/.test(mobile)) {

                alert(
                    "Please enter a valid 10 digit Indian mobile number."
                );

                return;
            }


            // --------------------------
            // CREATE RECHARGE ID
            // --------------------------

            const rechargeId =
                "REC_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .substring(2, 8);


            // --------------------------
            // TEMPORARY PAYMENT DATA
            // --------------------------

            const rechargeData = {

                rechargeId: rechargeId,

                uid: user.uid,

                email: user.email || "",

                amount: amount,

                mobile: mobile,

                createdAt: Date.now()

            };


            localStorage.setItem(
                "walletRecharge",
                JSON.stringify(rechargeData)
            );


            // --------------------------
            // CLOSE MODAL
            // --------------------------

            addBalanceModal.classList.remove("active");


            // --------------------------
            // GO PAYMENT PAGE
            // --------------------------

            window.location.href = "payment.html";

        });

    }


    // ==================================================
    // LOAD WALLET BALANCE
    // ==================================================

    async function loadWallet(user) {

        try {

            const userDoc = await db
                .collection("users")
                .doc(user.uid)
                .get();


            if (!userDoc.exists) {

                walletBalance.textContent = "0.00";

                console.warn(
                    "User document not found:",
                    user.uid
                );

                return;
            }


            const data = userDoc.data() || {};


            // Support multiple possible balance field names

            let balance = 0;


            if (typeof data.balance === "number") {

                balance = data.balance;

            } else if (
                typeof data.walletBalance === "number"
            ) {

                balance = data.walletBalance;

            } else if (
                typeof data.wallet === "number"
            ) {

                balance = data.wallet;

            } else if (
                typeof data.balance === "string"
            ) {

                balance = Number(data.balance);

            } else if (
                typeof data.walletBalance === "string"
            ) {

                balance = Number(data.walletBalance);

            }


            if (!Number.isFinite(balance)) {

                balance = 0;

            }


            walletBalance.textContent =
                balance.toFixed(2);


        } catch (error) {

            console.error(
                "Wallet loading error:",
                error
            );

            walletBalance.textContent =
                "0.00";

        }

    }


    // ==================================================
    // LOAD TRANSACTIONS
    // ==================================================

    async function loadTransactions(user) {

        try {

            transactionList.innerHTML =
                '<p class="loading">Loading...</p>';


            const snapshot = await db
                .collection("balanceTransactions")
                .where("uid", "==", user.uid)
                .get();


            if (snapshot.empty) {

                transactionList.innerHTML = `
                    <p class="loading">
                        No transactions yet.
                    </p>
                `;

                return;
            }


            const transactions = [];


            snapshot.forEach((doc) => {

                transactions.push({
                    id: doc.id,
                    ...doc.data()
                });

            });


            // Newest first

            transactions.sort((a, b) => {

                const aTime =
                    a.createdAt &&
                    a.createdAt.toMillis
                        ? a.createdAt.toMillis()
                        : 0;

                const bTime =
                    b.createdAt &&
                    b.createdAt.toMillis
                        ? b.createdAt.toMillis()
                        : 0;

                return bTime - aTime;

            });


            transactionList.innerHTML = "";


            transactions.forEach((transaction) => {

                const amount =
                    Number(transaction.amount || 0);


                const status =
                    transaction.status || "Pending";


                const type =
                    transaction.type || "credit";


                let statusClass =
                    "pending";


                if (
                    status.toLowerCase() ===
                    "approved"
                ) {

                    statusClass = "approved";

                } else if (
                    status.toLowerCase() ===
                    "rejected"
                ) {

                    statusClass = "rejected";

                }


                const icon =
                    type === "credit"
                        ? "fa-arrow-down"
                        : "fa-arrow-up";


                const sign =
                    type === "credit"
                        ? "+"
                        : "-";


                const item =
                    document.createElement("div");


                item.className =
                    "transaction-item";


                item.innerHTML = `

                    <div class="transaction-icon">

                        <i class="fa-solid ${icon}"></i>

                    </div>

                    <div class="transaction-info">

                        <strong>
                            ${type === "credit"
                                ? "Balance Recharge"
                                : "Debit"}
                        </strong>

                        <small>
                            ${formatDate(transaction.createdAt)}
                        </small>

                    </div>

                    <div class="transaction-right">

                        <strong>
                            ${sign}₹${amount.toFixed(2)}
                        </strong>

                        <span class="${statusClass}">
                            ${escapeHTML(status)}
                        </span>

                    </div>

                `;


                transactionList.appendChild(item);

            });


        } catch (error) {

            console.error(
                "Transaction loading error:",
                error
            );


            transactionList.innerHTML = `

                <p class="loading">
                    Unable to load transactions.
                </p>

            `;

        }

    }


    // ==================================================
    // FORMAT DATE
    // ==================================================

    function formatDate(timestamp) {

        if (
            !timestamp ||
            !timestamp.toDate
        ) {

            return "Just now";

        }


        const date =
            timestamp.toDate();


        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    // ==================================================
    // ESCAPE HTML
    // ==================================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

});