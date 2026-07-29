// ==========================
// Firebase Auth Check
// ==========================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadUsers();

});

// ==========================
// Elements
// ==========================

const userTable = document.getElementById("userTable");
const userForm = document.getElementById("userForm");
const userModal = document.getElementById("userModal");
const addUserBtn = document.getElementById("addUserBtn");
const closeModal = document.getElementById("closeModal");

let editId = null;

// ==========================
// Modal
// ==========================

addUserBtn.onclick = () => {

    editId = null;

    document.getElementById("modalTitle").innerText = "Add User";

    userForm.reset();

    userModal.style.display = "flex";

};

closeModal.onclick = () => {

    userModal.style.display = "none";

};

window.onclick = (e) => {

    if (e.target == userModal) {

        userModal.style.display = "none";

    }

};
// ==========================
// Save User
// ==========================

userForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const userData = {

        name: document.getElementById("userName").value,
        email: document.getElementById("userEmail").value,
        role: document.getElementById("userRole").value,
        status: document.getElementById("userStatus").value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()

    };

    try {

        if (editId) {

            await db.collection("users")
                .doc(editId)
                .update(userData);

            alert("User Updated Successfully!");

        } else {

            await db.collection("users")
                .add(userData);

            alert("User Added Successfully!");

        }

        userModal.style.display = "none";
        userForm.reset();

    } catch (error) {

        alert(error.message);

    }

});

// ==========================
// Load Users
// ==========================

function loadUsers() {

    db.collection("users")
        .orderBy("createdAt", "desc")
        .onSnapshot((snapshot) => {

            userTable.innerHTML = "";

            snapshot.forEach((doc) => {

                const user = doc.data();

                userTable.innerHTML += `
                <tr>
                    <td>${user.name || ""}</td>
                    <td>${user.email || ""}</td>
                    <td>${user.role || ""}</td>
                    <td>${user.status || ""}</td>
                    <td>
                        <button class="action-btn edit"
                            onclick="editUser('${doc.id}')">
                            Edit
                        </button>

                        <button class="action-btn delete"
                            onclick="deleteUser('${doc.id}')">
                            Delete
                        </button>
                    </td>
                </tr>
                `;

            });

        });

}
// ==========================
// Edit User
// ==========================

async function editUser(id) {

    try {

        const doc = await db.collection("users").doc(id).get();

        if (!doc.exists) return;

        const user = doc.data();

        editId = id;

        document.getElementById("modalTitle").innerText = "Edit User";

        document.getElementById("userName").value = user.name || "";
        document.getElementById("userEmail").value = user.email || "";
        document.getElementById("userRole").value = user.role || "Staff";
        document.getElementById("userStatus").value = user.status || "Active";

        userModal.style.display = "flex";

    } catch (error) {

        alert(error.message);

    }

}

// ==========================
// Delete User
// ==========================

async function deleteUser(id) {

    if (!confirm("Delete this user?")) return;

    try {

        await db.collection("users").doc(id).delete();

        alert("User Deleted Successfully!");

    } catch (error) {

        alert(error.message);

    }

}

// ==========================
// Search
// ==========================

document.getElementById("searchUser")
.addEventListener("keyup", function () {

    const value = this.value.toLowerCase();

    document.querySelectorAll("#userTable tr").forEach((row) => {

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