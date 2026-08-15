let currentUser = null;
let customerDocId = null;

const walletBalance = document.getElementById("walletBalance");
const addBalanceBtn = document.getElementById("addBalanceBtn");
const addBalanceModal = document.getElementById("addBalanceModal");
const closeModal = document.getElementById("closeModal");

const balanceAmount = document.getElementById("balanceAmount");
const balanceMobile = document.getElementById("balanceMobile");
const continuePayment = document.getElementById("continuePayment");

const transactionList = document.getElementById("transactionList");


// ==========================
// CONFIG
// ==========================

const UPI_ID = "kundusudip2006@oksbi";
const UPI_NAME = "VIP Store";


// ==========================
// AUTH
// ==========================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.replace("login.html");
        return;
    }

    currentUser = user;

    loadWallet();
    loadTransactions();

});


// ==========================
// LOAD WALLET
// ==========================

function loadWallet() {

    db.collection("customers")
        .where("email", "==", currentUser.email)
        .limit(1)
        .onSnapshot((snapshot) => {

            if (snapshot.empty) {

                customerDocId = null;

                walletBalance.innerText = "0.00";

                return;
            }

            const doc = snapshot.docs[0];

            customerDocId = doc.id;

            const data = doc.data();

            const balance = Number(data.balance || 0);

            walletBalance.innerText =
                balance.toFixed(2);

        });

}


// ==========================
// TRANSACTIONS
// ==========================

function loadTransactions() {

    db.collection("balanceTransactions")
        .where("email", "==", currentUser.email)
        .limit(30)
        .onSnapshot((snapshot) => {

            transactionList.innerHTML = "";

            if (snapshot.empty) {

                transactionList.innerHTML = `
                    <p class="loading">
                        No transactions yet.
                    </p>
                `;

                return;
            }

            snapshot.forEach((doc) => {

                const data = doc.data();

                const amount =
                    Number(data.amount || 0);

                const isCredit =
                    data.type === "credit";

                transactionList.innerHTML += `

                    <div class="transaction-item">

                        <div>

                            <b>
                                ${isCredit
                                    ? "Balance Added"
                                    : "Purchase"}
                            </b>

                            <small>
                                ${data.status || "Pending"}
                            </small>

                        </div>

                        <div class="amount">

                            ${isCredit ? "+" : "-"}
                            ₹${amount.toFixed(2)}

                        </div>

                    </div>

                `;

            });

        });

}


// ==========================
// OPEN MODAL
// ==========================

addBalanceBtn.onclick = () => {

    balanceAmount.value = "";
    balanceMobile.value = "";

    addBalanceModal.style.display = "flex";

};


// ==========================
// CLOSE MODAL
// ==========================

closeModal.onclick = () => {

    addBalanceModal.style.display = "none";

};


window.onclick = (event) => {

    if (event.target === addBalanceModal) {

        addBalanceModal.style.display = "none";

    }

};


// ==========================
// CONTINUE PAYMENT
// ==========================

continuePayment.onclick = () => {

    const amount =
        Number(balanceAmount.value);

    const mobile =
        balanceMobile.value.trim();


    // Amount validation

    if (!amount || amount <= 0) {

        alert("Enter a valid amount.");

        return;

    }


    if (amount < 10) {

        alert("Minimum balance amount is ₹10.");

        return;

    }


    if (amount > 10000) {

        alert("Maximum balance amount is ₹10,000.");

        return;

    }


    // Mobile validation

    if (!/^[6-9]\d{9}$/.test(mobile)) {

        alert(
            "Enter a valid 10 digit Indian mobile number."
        );

        return;

    }


    // Create unique recharge ID

    const rechargeId =
        "WALLET-" + Date.now();


    // UPI payment link

    const upiLink =
        "upi://pay?" +
        "pa=" + encodeURIComponent(UPI_ID) +
        "&pn=" + encodeURIComponent(UPI_NAME) +
        "&am=" + encodeURIComponent(amount.toFixed(2)) +
        "&cu=INR";


    // Save temporary recharge data

    localStorage.setItem(
        "walletRecharge",
        JSON.stringify({

            rechargeId: rechargeId,

            uid: currentUser.uid,

            email: currentUser.email,

            amount: amount,

            mobile: mobile,

            upiId: UPI_ID,

            status: "Pending"

        })
    );


    // Open payment page

    window.location.href =
        "wallet-payment.html";

};