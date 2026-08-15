// ==========================
// SEND / DELIVER KEY
// ==========================

sendKeyBtn.addEventListener("click", async () => {

    try {

        if (!selectedOrderId) {

            alert("Order not selected.");
            return;

        }

        const key =
            document
                .getElementById("productKey")
                .value
                .trim();

        if (!key) {

            alert("Enter Product Key.");
            return;

        }

        sendKeyBtn.disabled = true;
        sendKeyBtn.innerText = "Delivering...";

        const orderRef =
            db.collection("orders")
                .doc(selectedOrderId);

        const orderDoc =
            await orderRef.get();

        if (!orderDoc.exists) {

            throw new Error(
                "Order not found."
            );

        }

        const order =
            orderDoc.data();

        // ==========================
        // PAYMENT CHECK
        // ==========================

        if (
            order.paymentMethod !==
            "Wallet Balance"
        ) {

            if (
                order.paymentStatus !==
                "Paid"
            ) {

                throw new Error(
                    "Payment is not approved."
                );

            }

        }

        // ==========================
        // ALREADY DELIVERED
        // ==========================

        if (
            order.productKey &&
            String(order.productKey)
                .trim() !== ""
        ) {

            throw new Error(
                "Key has already been delivered."
            );

        }

        // ==========================
        // SAVE KEY
        // ==========================

        await orderRef.update({

            productKey:
                key,

            status:
                "Delivered",

            deliveredAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp()

        });

        // ==========================
        // SUCCESS
        // ==========================

        alert(
            "✅ Key Delivered Successfully!"
        );

        orderModal.style.display =
            "none";

    } catch (error) {

        console.error(
            "Deliver Key Error:",
            error
        );

        alert(
            "❌ " +
            error.message
        );

    } finally {

        sendKeyBtn.disabled = false;

        sendKeyBtn.innerText =
            "Deliver Key";

    }

});