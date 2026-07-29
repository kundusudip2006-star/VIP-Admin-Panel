// Firebase Auth Check
firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadCustomers();

});

function loadCustomers() {

    db.collection("customers")
    .onSnapshot((snapshot) => {

        const table = document.getElementById("customerTable");

        table.innerHTML = "";

        if (snapshot.empty) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" align="center">
                        No Customers Found
                    </td>
                </tr>
            `;
            return;
        }

        snapshot.forEach((doc) => {

            const customer = doc.data();

            table.innerHTML += `
                <tr>
                    <td>${customer.name || "-"}</td>
                    <td>${customer.email || "-"}</td>
                    <td>0</td>
                    <td>₹0</td>
                    <td>
                        <button onclick="viewCustomer('${doc.id}')">
                            View
                        </button>
                    </td>
                </tr>
            `;

        });

    });

}

async function viewCustomer(id) {

    const customerDoc = await db.collection("customers").doc(id).get();

    if (!customerDoc.exists) return;

    const customer = customerDoc.data();

    document.getElementById("cName").innerText = customer.name || "-";
    document.getElementById("cEmail").innerText = customer.email || "-";
    document.getElementById("cPhone").innerText = customer.phone || "-";

    const orderBody = document.getElementById("customerOrders");
    orderBody.innerHTML = "";

    let totalOrders = 0;
    let totalSpending = 0;

    const orders = await db.collection("orders")
        .where("customerEmail", "==", customer.email)
        .get();

    if (orders.empty) {
        orderBody.innerHTML = `
        <tr>
            <td colspan="3" align="center">No Orders</td>
        </tr>`;
    } else {

        orders.forEach((doc) => {

            const order = doc.data();

            totalOrders++;
            totalSpending += Number(order.price || 0);

            orderBody.innerHTML += `
            <tr>
                <td>${order.productName || "-"}</td>
                <td>₹${order.price || 0}</td>
                <td>${order.status || "Pending"}</td>
            </tr>`;
        });

    }

    document.getElementById("cOrders").innerText = totalOrders;
    document.getElementById("cSpending").innerText = totalSpending;

    document.getElementById("customerModal").style.display = "block";
}
document.getElementById("closeCustomerModal").onclick = function () {
    document.getElementById("customerModal").style.display = "none";
};