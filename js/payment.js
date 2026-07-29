// ==========================
// I've Paid
// ==========================
document.getElementById("paidBtn").addEventListener("click", async () => {

    const user = firebase.auth().currentUser;

    if (!user) {
        alert("Please Login First!");
        return;
    }

    const data = JSON.parse(localStorage.getItem("orderData"));

    if (!data) {
        alert("Order data not found!");
        return;
    }

    const orderId = "VIP-" + Date.now();

    await db.collection("orders").add({

        uid: user.uid,
        customerName: data.customerName,
        customerEmail: user.email,
        customerPhone: "",
        productId: data.productId,
        productName: data.productName,
        planName: data.planName,
        planIndex: data.planIndex,
        price: data.price,

        paymentMethod: "Google Pay",
        paymentStatus: "Pending",
        status: "Pending",

        productKey: "",

        orderId: orderId,
        orderDate: new Date().toLocaleDateString(),
        orderTime: new Date().toLocaleTimeString(),

        createdAt: firebase.firestore.FieldValue.serverTimestamp()

    });

    // Telegram Notification
    try {
    const response = await fetch("https://vip-admin-panel.onrender.com/new-order", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            orderId: orderId,
            name: data.customerName,
            email: user.email,
            phone: "",
            product: data.productName,
            plan: data.planName,
            amount: data.price,
            paymentMethod: "Google Pay"
        })
    });

    console.log("Status:", response.status);

    const result = await response.text();
    console.log("Response:", result);

} catch (e) {
    console.error("Telegram Error:", e);
}

    localStorage.removeItem("orderData");

    alert("Payment Request Submitted!");

    window.location.href = "my-order.html";

});