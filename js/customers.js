// ==========================
// Firebase Auth Check
// ==========================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    loadCustomers();

});


// ==========================
// GLOBAL
// ==========================

let selectedCustomerId = null;


// ==========================
// LOAD CUSTOMERS
// ==========================

function loadCustomers() {

    db.collection("customers")

        .onSnapshot((snapshot) => {

            const table =
                document.getElementById("customerTable");

            table.innerHTML = "";

            if (snapshot.empty) {

                table.innerHTML = `
                    <tr>
                        <td colspan="6" align="center">
                            No Customers Found
                        </td>
                    </tr>
                `;

                return;
            }


            snapshot.forEach((doc) => {

                const customer = doc.data();

                const balance =
                    Number(customer.balance || 0);


                table.innerHTML += `

                    <tr>

                        <td>
                            ${customer.name || "-"}
                        </td>

                        <td>
                            ${customer.email || "-"}
                        </td>

                        <td>
                            ₹${balance.toFixed(2)}
                        </td>

                        <td>
                            0
                        </td>

                        <td>
                            ₹0
                        </td>

                        <td>

                            <button
                                onclick="viewCustomer('${doc.id}')"
                            >
                                View
                            </button>

                        </td>

                    </tr>

                `;

            });

        });

}


// ==========================
// SEARCH CUSTOMER
// ==========================

document
    .getElementById("searchCustomer")
    .addEventListener("input", function () {

        const search =
            this.value.toLowerCase();

        document
            .querySelectorAll("#customerTable tr")
            .forEach((row) => {

                const text =
                    row.innerText.toLowerCase();

                row.style.display =
                    text.includes(search)
                        ? ""
                        : "none";

            });

    });


// ==========================
// VIEW CUSTOMER
// ==========================

async function viewCustomer(id) {

    try {

        const customerDoc =
            await db
                .collection("customers")
                .doc(id)
                .get();


        if (!customerDoc.exists) {

            alert("Customer not found.");

            return;
        }


        const customer =
            customerDoc.data();


        selectedCustomerId = id;


        // ==========================
        // CUSTOMER INFO
        // ==========================

        document.getElementById("cName").innerText =
            customer.name || "-";


        document.getElementById("cEmail").innerText =
            customer.email || "-";


        document.getElementById("cPhone").innerText =
            customer.phone || "-";


        document.getElementById("cBalance").innerText =
            Number(customer.balance || 0)
                .toFixed(2);


        document.getElementById("adminBalanceAmount").value =
            "";


        // ==========================
        // ORDER HISTORY
        // ==========================

        const orderBody =
            document.getElementById("customerOrders");


        orderBody.innerHTML = "";


        let totalOrders = 0;

        let totalSpending = 0;


        const orders =
            await db
                .collection("orders")
                .where(
                    "customerEmail",
                    "==",
                    customer.email
                )
                .get();


        if (orders.empty) {

            orderBody.innerHTML = `

                <tr>

                    <td
                        colspan="3"
                        align="center"
                    >
                        No Orders
                    </td>

                </tr>

            `;

        } else {


            orders.forEach((doc) => {

                const order =
                    doc.data();


                totalOrders++;


                totalSpending +=
                    Number(order.price || 0);


                orderBody.innerHTML += `

                    <tr>

                        <td>
                            ${order.productName || "-"}
                        </td>

                        <td>
                            ₹${Number(order.price || 0).toFixed(2)}
                        </td>

                        <td>
                            ${order.status || "Pending"}
                        </td>

                    </tr>

                `;

            });

        }


        document.getElementById("cOrders").innerText =
            totalOrders;


        document.getElementById("cSpending").innerText =
            totalSpending.toFixed(2);


        // ==========================
        // SHOW MODAL
        // ==========================

        document.getElementById("customerModal")
            .style.display = "block";


    } catch (error) {

        console.error(
            "View Customer Error:",
            error
        );

        alert(
            "Failed to load customer."
        );

    }

}


// ==========================
// ADD BALANCE FROM ADMIN
// ==========================

document
    .getElementById("addBalanceAdminBtn")
    .addEventListener("click", async function () {


        try {


            if (!selectedCustomerId) {

                alert(
                    "Please select a customer first."
                );

                return;
            }


            const amountInput =
                document.getElementById(
                    "adminBalanceAmount"
                );


            const amount =
                Number(amountInput.value);


            // ==========================
            // VALIDATION
            // ==========================

            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                alert(
                    "Enter a valid amount."
                );

                return;
            }


            if (amount < 10) {

                alert(
                    "Minimum balance amount is ₹10."
                );

                return;
            }


            if (amount > 100000) {

                alert(
                    "Maximum amount is ₹100000."
                );

                return;
            }


            if (
                !confirm(
                    `Add ₹${amount.toFixed(2)} to this customer's wallet?`
                )
            ) {

                return;
            }


            this.disabled = true;

            const oldText =
                this.innerText;

            this.innerText =
                "Adding...";


            // ==========================
            // REFERENCES
            // ==========================

            const customerRef =
                db
                    .collection("customers")
                    .doc(selectedCustomerId);


            const transactionRef =
                db
                    .collection(
                        "balanceTransactions"
                    )
                    .doc();


            // ==========================
            // FIRESTORE TRANSACTION
            // ==========================

            await db.runTransaction(
                async (transaction) => {


                    const customerSnap =
                        await transaction.get(
                            customerRef
                        );


                    if (!customerSnap.exists) {

                        throw new Error(
                            "CUSTOMER_NOT_FOUND"
                        );

                    }


                    const customer =
                        customerSnap.data();


                    const oldBalance =
                        Number(
                            customer.balance || 0
                        );


                    const newBalance =
                        oldBalance + amount;


                    // ==========================
                    // UPDATE BALANCE
                    // ==========================

                    transaction.update(
                        customerRef,
                        {

                            balance:
                                newBalance

                        }
                    );


                    // ==========================
                    // TRANSACTION RECORD
                    // ==========================

                    transaction.set(
                        transactionRef,
                        {

                            email:
                                customer.email || "",

                            customerId:
                                selectedCustomerId,

                            type:
                                "credit",

                            amount:
                                amount,

                            oldBalance:
                                oldBalance,

                            newBalance:
                                newBalance,

                            status:
                                "Completed",

                            method:
                                "Admin Dashboard",

                            description:
                                "Balance added by Admin",

                            createdAt:
                                firebase
                                    .firestore
                                    .FieldValue
                                    .serverTimestamp()

                        }
                    );

                }
            );


            // ==========================
            // SUCCESS
            // ==========================

            amountInput.value = "";


            const updatedCustomer =
                await customerRef.get();


            if (updatedCustomer.exists) {

                const updatedData =
                    updatedCustomer.data();


                document.getElementById(
                    "cBalance"
                ).innerText =
                    Number(
                        updatedData.balance || 0
                    ).toFixed(2);

            }


            alert(
                `✅ ₹${amount.toFixed(2)} added successfully!`
            );


        } catch (error) {


            console.error(
                "Add Balance Error:",
                error
            );


            if (
                error.message ===
                "CUSTOMER_NOT_FOUND"
            ) {

                alert(
                    "Customer not found."
                );

            } else {

                alert(
                    "Failed to add balance.\n\n" +
                    error.message
                );

            }


        } finally {


            this.disabled = false;

            this.innerText =
                "💰 Add Balance";

        }

    });


// ==========================
// CLOSE MODAL
// ==========================

document
    .getElementById("closeCustomerModal")
    .onclick = function () {

        document.getElementById(
            "customerModal"
        ).style.display = "none";

        selectedCustomerId = null;

    };


// ==========================
// CLOSE MODAL OUTSIDE
// ==========================

window.onclick = function (event) {

    const modal =
        document.getElementById(
            "customerModal"
        );


    if (event.target === modal) {

        modal.style.display = "none";

        selectedCustomerId = null;

    }

};