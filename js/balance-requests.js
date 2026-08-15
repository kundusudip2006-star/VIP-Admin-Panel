// ==========================================
// ADMIN AUTH CHECK
// ==========================================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadBalanceRequests();

});


// ==========================================
// LOAD BALANCE REQUESTS
// ==========================================

function loadBalanceRequests() {

    db.collection("balanceRequests")
        .orderBy("createdAt", "desc")
        .onSnapshot((snapshot) => {

            const table =
                document.getElementById("balanceRequestTable");

            table.innerHTML = "";

            if (snapshot.empty) {

                table.innerHTML = `
                    <tr>
                        <td colspan="6" align="center">
                            No Balance Requests
                        </td>
                    </tr>
                `;

                return;
            }


            snapshot.forEach((doc) => {

                const request = doc.data();

                const status =
                    request.status || "Pending";

                let actionHTML = "";


                if (status === "Pending") {

                    actionHTML = `
                        <button
                            onclick="approveBalance('${doc.id}')">
                            ✅ Approve
                        </button>

                        <button
                            onclick="rejectBalance('${doc.id}')">
                            ❌ Reject
                        </button>
                    `;

                } else {

                    actionHTML = `
                        <span>
                            ${status}
                        </span>
                    `;

                }


                table.innerHTML += `

                    <tr>

                        <td>
                            ${request.customerName || "-"}
                        </td>

                        <td>
                            ${request.email || "-"}
                        </td>

                        <td>
                            ₹${Number(
                                request.amount || 0
                            ).toFixed(2)}
                        </td>

                        <td>
                            ${request.utr || "-"}
                        </td>

                        <td>
                            ${status}
                        </td>

                        <td>
                            ${actionHTML}
                        </td>

                    </tr>

                `;

            });

        });

}


// ==========================================
// APPROVE BALANCE
// ==========================================

async function approveBalance(requestId) {

    if (!confirm("Approve this balance request?")) {
        return;
    }


    try {

        const requestRef =
            db.collection("balanceRequests")
                .doc(requestId);


        await db.runTransaction(async (transaction) => {

            const requestSnap =
                await transaction.get(requestRef);


            if (!requestSnap.exists) {
                throw new Error(
                    "Balance request not found."
                );
            }


            const request =
                requestSnap.data();


            if (request.status !== "Pending") {

                throw new Error(
                    "This request has already been processed."
                );

            }


            const customerRef =
                db.collection("customers")
                    .doc(request.customerId);


            const customerSnap =
                await transaction.get(customerRef);


            if (!customerSnap.exists) {

                throw new Error(
                    "Customer not found."
                );

            }


            const customer =
                customerSnap.data();


            const oldBalance =
                Number(customer.balance || 0);


            const amount =
                Number(request.amount || 0);


            if (amount <= 0) {

                throw new Error(
                    "Invalid balance amount."
                );

            }


            const newBalance =
                oldBalance + amount;


            // ==================================
            // UPDATE CUSTOMER BALANCE
            // ==================================

            transaction.update(
                customerRef,
                {
                    balance: newBalance
                }
            );


            // ==================================
            // UPDATE REQUEST
            // ==================================

            transaction.update(
                requestRef,
                {
                    status: "Approved",

                    approvedAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp(),

                    approvedBy:
                        firebase.auth()
                            .currentUser
                            .email
                }
            );


            // ==================================
            // BALANCE TRANSACTION
            // ==================================

            const transactionRef =
                db.collection(
                    "balanceTransactions"
                ).doc();


            transaction.set(
                transactionRef,
                {

                    customerId:
                        request.customerId,

                    email:
                        request.email,

                    type:
                        "credit",

                    amount:
                        amount,

                    requestId:
                        requestId,

                    status:
                        "Completed",

                    description:
                        "Wallet balance added",

                    createdAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                }
            );

        });


        alert(
            "✅ Balance approved successfully."
        );


    } catch (error) {

        console.error(
            "Approve Balance Error:",
            error
        );

        alert(
            "❌ Approval failed.\n\n" +
            error.message
        );

    }

}


// ==========================================
// REJECT BALANCE
// ==========================================

async function rejectBalance(requestId) {

    if (!confirm("Reject this balance request?")) {
        return;
    }


    try {

        const requestRef =
            db.collection("balanceRequests")
                .doc(requestId);


        const requestSnap =
            await requestRef.get();


        if (!requestSnap.exists) {

            throw new Error(
                "Balance request not found."
            );

        }


        const request =
            requestSnap.data();


        if (request.status !== "Pending") {

            throw new Error(
                "This request has already been processed."
            );

        }


        await requestRef.update({

            status: "Rejected",

            rejectedAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp(),

            rejectedBy:
                firebase.auth()
                    .currentUser
                    .email

        });


        alert(
            "❌ Balance request rejected."
        );


    } catch (error) {

        console.error(
            "Reject Balance Error:",
            error
        );

        alert(
            "❌ Reject failed.\n\n" +
            error.message
        );

    }

}