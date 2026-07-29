// ==========================
// Firebase Auth Check
// ==========================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadProducts();

});

// ==========================
// Elements
// ==========================

const productTable = document.getElementById("productTable");
const productForm = document.getElementById("productForm");
const productModal = document.getElementById("productModal");
const addProductBtn = document.getElementById("addProductBtn");
const closeModal = document.getElementById("closeModal");
const searchProduct = document.getElementById("searchProduct");

const plansContainer = document.getElementById("plansContainer");
const addPlanBtn = document.getElementById("addPlanBtn");

let editId = null;

// ==========================
// Dynamic Plans
// ==========================

function createPlanCard(data = {}) {

    const div = document.createElement("div");

    div.className = "plan-card";

    div.innerHTML = `

    <input
    type="text"
    class="planName"
    placeholder="Plan Name"
    value="${data.name || ""}"
    required>

    <input
    type="number"
    class="planPrice"
    placeholder="Price"
    value="${data.price || ""}"
    required>

    <input
    type="number"
    class="planStock"
    placeholder="Stock"
    value="${data.stock || ""}"
    required>

    <textarea
    class="planKeys"
    rows="5"
    placeholder="One Key Per Line">${data.keys ? data.keys.join("\n") : ""}</textarea>

    <button
    type="button"
    class="removePlan">

    Remove Plan

    </button>

    `;

    plansContainer.appendChild(div);

}

addPlanBtn.onclick = () => {

    createPlanCard();

};

document.addEventListener("click",(e)=>{

    if(e.target.classList.contains("removePlan")){

        e.target.parentElement.remove();

    }

});

// ==========================
// Open Modal
// ==========================

addProductBtn.onclick = () => {

    editId = null;

    productForm.reset();

    plansContainer.innerHTML = "";

    createPlanCard();

    productModal.style.display = "flex";

};

closeModal.onclick = () => {

    productModal.style.display = "none";

};

window.onclick = (e) => {

    if (e.target === productModal) {

        productModal.style.display = "none";

    }

};
// ==========================
// Save Product
// ==========================

productForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const plans = [];

    document.querySelectorAll(".plan-card").forEach(card => {

        plans.push({

            name: card.querySelector(".planName").value.trim(),

            price: Number(card.querySelector(".planPrice").value),

            stock: Number(card.querySelector(".planStock").value),

            keys: card.querySelector(".planKeys").value
                .split("\n")
                .map(k => k.trim())
                .filter(k => k)

        });

    });

    const product = {

        name: document.getElementById("productName").value,

        plans: plans,

        image: document.getElementById("productImage").value,

        description: document.getElementById("productDescription").value,

        createdAt: firebase.firestore.FieldValue.serverTimestamp()

    };

    try {

        if (editId) {

            await db.collection("products")
                .doc(editId)
                .update(product);

            alert("Product Updated Successfully!");

        } else {

            await db.collection("products")
                .add(product);

            alert("Product Added Successfully!");

        }

        productForm.reset();

        plansContainer.innerHTML = "";

        createPlanCard();

        productModal.style.display = "none";

    } catch (error) {

        alert(error.message);

    }

});

// ==========================
// Load Products
// ==========================

function loadProducts() {

    db.collection("products")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot)=>{

        productTable.innerHTML="";

        snapshot.forEach((doc)=>{

            const product=doc.data();

            let plansHTML="";

            if (Array.isArray(product.plans)) {
    product.plans.forEach(plan => {

                    plansHTML+=`
                    <div style="margin-bottom:8px;border-bottom:1px solid #ddd;padding-bottom:5px;">
                        <b>${plan.name}</b><br>
                        Price : ₹${plan.price}<br>
                        Stock : ${plan.stock}<br>
                        Keys : ${plan.keys ? plan.keys.length : 0}
                    </div>
                    `;

                });

            }

            productTable.innerHTML+=`

            <tr>

            <td>
            <img class="product-image"
            src="${product.image || 'https://via.placeholder.com/60'}">
            </td>

            <td>${product.name}</td>

            <td>${plansHTML}</td>

            <td>

            <button class="action-btn edit"
            onclick="editProduct('${doc.id}')">
            Edit
            </button>

            <button class="action-btn delete"
            onclick="deleteProduct('${doc.id}')">
            Delete
            </button>

            </td>

            </tr>

            `;

        });

    });

}
// ==========================
// Edit Product
// ==========================

async function editProduct(id){

    const doc=await db.collection("products").doc(id).get();

    if(!doc.exists) return;

    const product=doc.data();

    editId=id;

    document.getElementById("productName").value=product.name||"";

    document.getElementById("productImage").value=product.image||"";

    document.getElementById("productDescription").value=product.description||"";

    plansContainer.innerHTML = "";

if (product.plans && product.plans.length > 0) {
    product.plans.forEach(plan => {
        createPlanCard(plan);
    });
} else {
    createPlanCard();
}

    productModal.style.display="flex";

}

// ==========================
// Delete Product
// ==========================

async function deleteProduct(id) {

    if (!confirm("Delete this product?")) return;

    await db.collection("products").doc(id).delete();

    alert("Product Deleted Successfully!");

}

// ==========================
// Search Product
// ==========================

searchProduct.addEventListener("keyup", function () {

    const value = this.value.toLowerCase();

    document.querySelectorAll("#productTable tr").forEach((row) => {

        row.style.display =
            row.innerText.toLowerCase().includes(value)
                ? ""
                : "none";

    });

});

// ==========================
// Logout
// ==========================

document.getElementById("logoutBtn")
.addEventListener("click", async () => {

    if (confirm("Logout?")) {

        await firebase.auth().signOut();

        window.location.href = "login.html";

    }

});