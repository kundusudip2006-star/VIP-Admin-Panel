console.log("Server starting...");

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ======================================================
// FIREBASE ADMIN
// ======================================================

const secretDir = "/etc/secrets";

if (!admin.apps.length) {

    if (!fs.existsSync(secretDir)) {
        throw new Error(
            `Secrets directory not found: ${secretDir}`
        );
    }

    const files = fs.readdirSync(secretDir);

    console.log(
        "Files found in /etc/secrets:",
        files
    );

    const serviceAccountFile = files.find(
        file =>
            file.toLowerCase().endsWith(".json")
    );

    if (!serviceAccountFile) {
        throw new Error(
            "Firebase Admin SDK JSON file not found in /etc/secrets"
        );
    }

    const serviceAccountPath =
        path.join(
            secretDir,
            serviceAccountFile
        );

    console.log(
        "Using Firebase Admin SDK file:",
        serviceAccountPath
    );

    const serviceAccount =
        JSON.parse(
            fs.readFileSync(
                serviceAccountPath,
                "utf8"
            )
        );

    admin.initializeApp({
        credential:
            admin.credential.cert(
                serviceAccount
            )
    });

    console.log(
        "Firebase Admin initialized:",
        serviceAccount.project_id
    );
}

const db = admin.firestore();

// ======================================================
// TELEGRAM
// ======================================================

const BOT_TOKEN =
    process.env.BOT_TOKEN;

const CHAT_ID =
    "8152666872";

if (!BOT_TOKEN) {
    throw new Error(
        "BOT_TOKEN environment variable is missing"
    );
}

const TELEGRAM_API =
    `https://api.telegram.org/bot${BOT_TOKEN}`;

// ======================================================
// TELEGRAM HELPER
// ======================================================

async function telegramRequest(
    method,
    data
) {
    try {

        const response =
            await axios.post(
                `${TELEGRAM_API}/${method}`,
                data
            );

        return response.data;

    } catch (error) {

        console.error(
            `Telegram ${method} error:`,
            error.response?.data ||
            error.message
        );

        throw error;
    }
}

// ======================================================
// SEND TELEGRAM MESSAGE
// ======================================================

async function sendTelegramMessage(
    text,
    replyMarkup = null
) {

    const payload = {
        chat_id: CHAT_ID,
        text: text
    };

    if (replyMarkup) {
        payload.reply_markup =
            replyMarkup;
    }

    return telegramRequest(
        "sendMessage",
        payload
    );
}

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

    res.send(
        "VIP Admin Panel Telegram Notification Server Running"
    );
});

// ======================================================
// NEW ORDER
// ======================================================

app.post(
    "/new-order",
    async (req, res) => {

        try {

            const data = req.body;

            if (!data.orderId) {

                return res.status(400).json({
                    success: false,
                    error:
                        "Order ID is missing"
                });
            }

            const isWallet =
                data.paymentMethod ===
                "Wallet Balance";

            const text = `
🛒 NEW ORDER RECEIVED

━━━━━━━━━━━━━━━━━━

🆔 Order ID:
${data.orderId}

👤 Customer:
${data.name || "N/A"}

📧 Email:
${data.email || "N/A"}

📞 Phone:
${data.phone || "N/A"}

📦 Product:
${data.product || "N/A"}

📋 Plan:
${data.plan || "N/A"}

💰 Price:
₹${data.amount || "N/A"}

💳 Payment:
${data.paymentMethod || "N/A"}

${
    isWallet
        ? "✅ Wallet Payment: APPROVED"
        : "⏳ Payment Status: PENDING"
}

📌 Order Status:
Pending

📅 Date:
${new Date().toLocaleDateString()}

⏰ Time:
${new Date().toLocaleTimeString()}

━━━━━━━━━━━━━━━━━━

VIP Admin Panel
`;

            const buttons = [];

            // Wallet payment
            if (isWallet) {

                buttons.push([
                    {
                        text:
                            "🔑 Deliver Key",

                        callback_data:
                            `deliver:${data.orderId}`
                    }
                ]);

            } else {

                buttons.push([
                    {
                        text:
                            "✅ Approve Payment",

                        callback_data:
                            `approve:${data.orderId}`
                    }
                ]);

                buttons.push([
                    {
                        text:
                            "🔑 Deliver Key",

                        callback_data:
                            `deliver:${data.orderId}`
                    }
                ]);
            }

            const replyMarkup = {
                inline_keyboard:
                    buttons
            };

            await sendTelegramMessage(
                text,
                replyMarkup
            );

            console.log(
                "Telegram order notification sent:",
                data.orderId
            );

            res.json({
                success: true
            });

        } catch (error) {

            console.error(
                "NEW ORDER ERROR:",
                error.response?.data ||
                error.message
            );

            res.status(500).json({
                success: false,
                error:
                    error.message
            });
        }
    }
);

// ======================================================
// WALLET RECHARGE NOTIFICATION
// ======================================================

app.post(
    "/wallet-recharge",
    async (req, res) => {

        try {

            const data = req.body;

            if (!data.rechargeId) {

                return res.status(400).json({
                    success: false,
                    error:
                        "Recharge ID is missing"
                });
            }

            const amount =
                Number(data.amount || 0);

            if (!amount || amount < 10) {

                return res.status(400).json({
                    success: false,
                    error:
                        "Invalid amount"
                });
            }

            const text = `
💰 WALLET RECHARGE REQUEST

━━━━━━━━━━━━━━━━━━

🆔 Recharge ID:
${data.rechargeId}

📧 Customer:
${data.email || "N/A"}

📱 Mobile:
${data.mobile || "N/A"}

💰 Amount:
₹${amount.toFixed(2)}

💳 Payment:
${data.paymentMethod || "UPI / Google Pay"}

⏳ Status:
Pending

━━━━━━━━━━━━━━━━━━

VIP Admin Panel
`;

            const replyMarkup = {
                inline_keyboard: [
                    [
                        {
                            text:
                                "✅ Approve Balance",

                            callback_data:
                                `walletapprove:${data.rechargeId}`
                        }
                    ],
                    [
                        {
                            text:
                                "❌ Reject",

                            callback_data:
                                `walletreject:${data.rechargeId}`
                        }
                    ]
                ]
            };

            await sendTelegramMessage(
                text,
                replyMarkup
            );

            console.log(
                "Wallet recharge notification sent:",
                data.rechargeId
            );

            res.json({
                success: true
            });

        } catch (error) {

            console.error(
                "WALLET RECHARGE ERROR:",
                error.response?.data ||
                error.message
            );

            res.status(500).json({
                success: false,
                error:
                    error.message
            });
        }
    }
);

// ======================================================
// FIND ORDER
// ======================================================

async function findOrder(
    orderId
) {

    const snapshot =
        await db
            .collection("orders")
            .where(
                "orderId",
                "==",
                orderId
            )
            .limit(1)
            .get();

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0];
}

// ======================================================
// TELEGRAM WEBHOOK
// ======================================================

app.post(
    "/telegram-webhook",
    async (req, res) => {

        try {

            const update =
                req.body;

            // ==================================================
            // CALLBACK BUTTON
            // ==================================================

            if (update.callback_query) {

                const callbackQuery =
                    update.callback_query;

                const callbackData =
                    callbackQuery.data ||
                    "";

                const callbackChatId =
                    String(
                        callbackQuery
                            .message
                            ?.chat
                            ?.id || ""
                    );

                // ==================================================
                // ADMIN CHECK
                // ==================================================

                if (
                    callbackChatId !==
                    CHAT_ID
                ) {

                    await telegramRequest(
                        "answerCallbackQuery",
                        {
                            callback_query_id:
                                callbackQuery.id,

                            text:
                                "❌ Unauthorized",

                            show_alert:
                                true
                        }
                    );

                    return res.json({
                        ok: true
                    });
                }

                const parts =
                    callbackData.split(":");

                const action =
                    parts[0];

                const actionId =
                    parts
                        .slice(1)
                        .join(":");

                console.log(
                    "Telegram button clicked:",
                    action,
                    actionId
                );

                if (!actionId) {

                    await telegramRequest(
                        "answerCallbackQuery",
                        {
                            callback_query_id:
                                callbackQuery.id,

                            text:
                                "❌ ID missing",

                            show_alert:
                                true
                        }
                    );

                    return res.json({
                        ok: true
                    });
                }

                // Remove Telegram loading animation

                await telegramRequest(
                    "answerCallbackQuery",
                    {
                        callback_query_id:
                            callbackQuery.id
                    }
                );

                // ==================================================
                // WALLET APPROVE
                // ==================================================

                if (
                    action ===
                    "walletapprove"
                ) {

                    const rechargeId =
                        actionId;

                    console.log(
                        "Approving wallet recharge:",
                        rechargeId
                    );

                    const rechargeRef =
                        db
                            .collection(
                                "balanceRechargeRequests"
                            )
                            .doc(
                                rechargeId
                            );

                    const rechargeDoc =
                        await rechargeRef.get();

                    if (
                        !rechargeDoc.exists
                    ) {

                        await sendTelegramMessage(
                            `❌ RECHARGE NOT FOUND

🆔 Recharge ID:
${rechargeId}`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    const recharge =
                        rechargeDoc.data();

                    // Already approved

                    if (
                        recharge.status ===
                        "Approved"
                    ) {

                        await sendTelegramMessage(
                            `ℹ️ BALANCE ALREADY ADDED

🆔 Recharge ID:
${rechargeId}

💰 Amount:
₹${Number(
    recharge.amount || 0
).toFixed(2)}`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    // Already rejected

                    if (
                        recharge.status ===
                        "Rejected"
                    ) {

                        await sendTelegramMessage(
                            `⚠️ RECHARGE WAS REJECTED

🆔 Recharge ID:
${rechargeId}`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    const amount =
                        Number(
                            recharge.amount ||
                            0
                        );

                    const email =
                        recharge.email ||
                        "";

                    if (
                        !email ||
                        !amount ||
                        amount <= 0
                    ) {

                        await sendTelegramMessage(
                            `❌ INVALID RECHARGE DATA

🆔 Recharge ID:
${rechargeId}`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    // ==================================================
                    // FIND CUSTOMER
                    // ==================================================

                    const customerSnapshot =
                        await db
                            .collection(
                                "customers"
                            )
                            .where(
                                "email",
                                "==",
                                email
                            )
                            .limit(1)
                            .get();

                    if (
                        customerSnapshot.empty
                    ) {

                        await sendTelegramMessage(
                            `❌ CUSTOMER NOT FOUND

🆔 Recharge ID:
${rechargeId}

📧 Email:
${email}`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    const customerDoc =
                        customerSnapshot.docs[0];

                    // ==================================================
                    // ATOMIC TRANSACTION
                    // ==================================================

                    let previousBalance = 0;
                    let newBalance = 0;

                    await db.runTransaction(
                        async (
                            transaction
                        ) => {

                            const freshRecharge =
                                await transaction.get(
                                    rechargeRef
                                );

                            if (
                                !freshRecharge.exists
                            ) {
                                throw new Error(
                                    "Recharge request not found"
                                );
                            }

                            const freshData =
                                freshRecharge.data();

                            // Prevent double approval

                            if (
                                freshData.status ===
                                "Approved"
                            ) {
                                return;
                            }

                            if (
                                freshData.status ===
                                "Rejected"
                            ) {
                                throw new Error(
                                    "Recharge is already rejected"
                                );
                            }

                            const freshCustomer =
                                await transaction.get(
                                    customerDoc.ref
                                );

                            if (
                                !freshCustomer.exists
                            ) {
                                throw new Error(
                                    "Customer not found"
                                );
                            }

                            const customerData =
                                freshCustomer.data();

                            previousBalance =
                                Number(
                                    customerData.balance ||
                                    0
                                );

                            newBalance =
                                previousBalance +
                                amount;

                            // Update customer balance

                            transaction.update(
                                customerDoc.ref,
                                {
                                    balance:
                                        newBalance
                                }
                            );

                            // Update recharge request

                            transaction.update(
                                rechargeRef,
                                {
                                    status:
                                        "Approved",

                                    balanceAdded:
                                        true,

                                    approvedAt:
                                        admin.firestore
                                            .FieldValue
                                            .serverTimestamp()
                                }
                            );

                            // Update transaction

                            transaction.set(
                                db
                                    .collection(
                                        "balanceTransactions"
                                    )
                                    .doc(
                                        rechargeId
                                    ),
                                {
                                    rechargeId:
                                        rechargeId,

                                    uid:
                                        freshData.uid,

                                    email:
                                        freshData.email,

                                    mobile:
                                        freshData.mobile,

                                    amount:
                                        amount,

                                    type:
                                        "credit",

                                    status:
                                        "Approved",

                                    balanceBefore:
                                        previousBalance,

                                    balanceAfter:
                                        newBalance,

                                    approvedAt:
                                        admin.firestore
                                            .FieldValue
                                            .serverTimestamp()
                                },
                                {
                                    merge:
                                        true
                                }
                            );
                        }
                    );

                    // ==================================================
                    // SUCCESS
                    // ==================================================

                    await sendTelegramMessage(
                        `✅ BALANCE ADDED SUCCESSFULLY

━━━━━━━━━━━━━━━━━━

🆔 Recharge ID:
${rechargeId}

📧 Customer:
${email}

📱 Mobile:
${recharge.mobile || "N/A"}

💰 Added:
₹${amount.toFixed(2)}

💳 Previous Balance:
₹${previousBalance.toFixed(2)}

💰 New Balance:
₹${newBalance.toFixed(2)}

📌 Status:
Approved

━━━━━━━━━━━━━━━━━━

VIP Admin Panel`
                    );

                    return res.json({
                        ok: true
                    });
                }

                // ==================================================
                // WALLET REJECT
                // ==================================================

                if (
                    action ===
                    "walletreject"
                ) {

                    const rechargeId =
                        actionId;

                    console.log(
                        "Rejecting wallet recharge:",
                        rechargeId
                    );

                    const rechargeRef =
                        db
                            .collection(
                                "balanceRechargeRequests"
                            )
                            .doc(
                                rechargeId
                            );

                    const rechargeDoc =
                        await rechargeRef.get();

                    if (
                        !rechargeDoc.exists
                    ) {

                        await sendTelegramMessage(
                            `❌ RECHARGE NOT FOUND

🆔 Recharge ID:
${rechargeId}`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    const recharge =
                        rechargeDoc.data();

                    if (
                        recharge.status ===
                        "Approved"
                    ) {

                        await sendTelegramMessage(
                            `⚠️ CANNOT REJECT

🆔 Recharge ID:
${rechargeId}

Balance has already been added.`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    if (
                        recharge.status ===
                        "Rejected"
                    ) {

                        await sendTelegramMessage(
                            `ℹ️ RECHARGE ALREADY REJECTED

🆔 Recharge ID:
${rechargeId}`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    await rechargeRef.update({
                        status:
                            "Rejected",

                        balanceAdded:
                            false,

                        rejectedAt:
                            admin.firestore
                                .FieldValue
                                .serverTimestamp()
                    });

                    await db
                        .collection(
                            "balanceTransactions"
                        )
                        .doc(
                            rechargeId
                        )
                        .set(
                            {
                                status:
                                    "Rejected",

                                rejectedAt:
                                    admin.firestore
                                        .FieldValue
                                        .serverTimestamp()
                            },
                            {
                                merge:
                                    true
                            }
                        );

                    await sendTelegramMessage(
                        `❌ WALLET RECHARGE REJECTED

━━━━━━━━━━━━━━━━━━

🆔 Recharge ID:
${rechargeId}

📧 Customer:
${recharge.email || "N/A"}

📱 Mobile:
${recharge.mobile || "N/A"}

💰 Amount:
₹${Number(
    recharge.amount || 0
).toFixed(2)}

📌 Status:
Rejected

━━━━━━━━━━━━━━━━━━

Balance was NOT added.`
                    );

                    return res.json({
                        ok: true
                    });
                }

                // ==================================================
                // APPROVE NORMAL ORDER PAYMENT
                // ==================================================

                if (
                    action ===
                    "approve"
                ) {

                    const orderId =
                        actionId;

                    console.log(
                        "Approving order:",
                        orderId
                    );

                    const orderDoc =
                        await findOrder(
                            orderId
                        );

                    if (!orderDoc) {

                        await sendTelegramMessage(
                            `❌ ORDER NOT FOUND

🆔 Order ID:
${orderId}

The order could not be found in Firestore.`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    const order =
                        orderDoc.data();

                    if (
                        order.paymentStatus ===
                        "Approved"
                    ) {

                        await sendTelegramMessage(
                            `ℹ️ PAYMENT ALREADY APPROVED

🆔 Order ID:
${orderId}`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    await orderDoc.ref.update({

                        paymentStatus:
                            "Approved",

                        status:
                            "Approved",

                        approvedAt:
                            admin.firestore
                                .FieldValue
                                .serverTimestamp()
                    });

                    await sendTelegramMessage(
                        `✅ PAYMENT APPROVED

🆔 Order ID:
${orderId}

👤 Customer:
${order.customerName || "N/A"}

💰 Amount:
₹${order.price || "N/A"}

Payment has been approved successfully.

🔑 You can now press "Deliver Key".`
                    );

                    return res.json({
                        ok: true
                    });
                }

                // ==================================================
                // DELIVER KEY
                // ==================================================

                if (
                    action ===
                    "deliver"
                ) {

                    const orderId =
                        actionId;

                    console.log(
                        "Preparing key delivery:",
                        orderId
                    );

                    const orderDoc =
                        await findOrder(
                            orderId
                        );

                    if (!orderDoc) {

                        await sendTelegramMessage(
                            `❌ ORDER NOT FOUND

🆔 Order ID:
${orderId}`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    const order =
                        orderDoc.data();

                    // Payment check

                    if (
                        order.paymentStatus !==
                        "Approved"
                    ) {

                        await sendTelegramMessage(
                            `⚠️ PAYMENT NOT APPROVED

🆔 Order ID:
${orderId}

Please approve the payment first.`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    // Existing key

                    if (
                        order.productKey &&
                        String(
                            order.productKey
                        ).trim() !== ""
                    ) {

                        await sendTelegramMessage(
                            `ℹ️ KEY ALREADY DELIVERED

🆔 Order ID:
${orderId}

🔑 Key:
${order.productKey}`
                        );

                        return res.json({
                            ok: true
                        });
                    }

                    // Save pending delivery

                    await db
                        .collection(
                            "telegramPendingDeliveries"
                        )
                        .doc(
                            CHAT_ID
                        )
                        .set({
                            orderId:
                                orderId,

                            createdAt:
                                admin.firestore
                                    .FieldValue
                                    .serverTimestamp()
                        });

                    await sendTelegramMessage(
                        `🔑 KEY DELIVERY

🆔 Order ID:
${orderId}

👤 Customer:
${order.customerName || "N/A"}

📧 Email:
${order.customerEmail || "N/A"}

📦 Product:
${order.productName || "N/A"}

📋 Plan:
${order.planName || "N/A"}

━━━━━━━━━━━━━━━━━━

✏️ Please send the product key now.

Example:
ABC-123-XYZ

/cancel`
                    );

                    return res.json({
                        ok: true
                    });
                }

                return res.json({
                    ok: true
                });
            }
            // ==================================================
            // TELEGRAM TEXT MESSAGE
            // ==================================================

            if (update.message) {

                const message =
                    update.message;

                const messageChatId =
                    String(
                        message.chat?.id ||
                        ""
                    );

                // Admin only

                if (
                    messageChatId !==
                    CHAT_ID
                ) {

                    return res.json({
                        ok: true
                    });
                }

                const text =
                    String(
                        message.text ||
                        ""
                    ).trim();

                if (!text) {

                    return res.json({
                        ok: true
                    });
                }

                // ==================================================
                // CANCEL DELIVERY
                // ==================================================

                if (
                    text.toLowerCase() ===
                    "/cancel"
                ) {

                    await db
                        .collection(
                            "telegramPendingDeliveries"
                        )
                        .doc(
                            CHAT_ID
                        )
                        .delete();

                    await sendTelegramMessage(
                        `❌ KEY DELIVERY CANCELLED`
                    );

                    return res.json({
                        ok: true
                    });
                }

                // ==================================================
                // CHECK PENDING DELIVERY
                // ==================================================

                const pendingDoc =
                    await db
                        .collection(
                            "telegramPendingDeliveries"
                        )
                        .doc(
                            CHAT_ID
                        )
                        .get();

                if (
                    !pendingDoc.exists
                ) {

                    return res.json({
                        ok: true
                    });
                }

                const pending =
                    pendingDoc.data();

                const orderId =
                    pending.orderId;

                console.log(
                    "Receiving key for order:",
                    orderId
                );

                // ==================================================
                // FIND ORDER
                // ==================================================

                const orderDoc =
                    await findOrder(
                        orderId
                    );

                if (!orderDoc) {

                    await sendTelegramMessage(
                        `❌ ORDER NOT FOUND

🆔 Order ID:
${orderId}

Key was NOT delivered.`
                    );

                    await pendingDoc.ref.delete();

                    return res.json({
                        ok: true
                    });
                }

                const order =
                    orderDoc.data();

                // ==================================================
                // PAYMENT CHECK
                // ==================================================

                if (
                    order.paymentStatus !==
                    "Approved"
                ) {

                    await sendTelegramMessage(
                        `⚠️ PAYMENT IS NOT APPROVED

🆔 Order ID:
${orderId}

Key was NOT delivered.`
                    );

                    await pendingDoc.ref.delete();

                    return res.json({
                        ok: true
                    });
                }

                // ==================================================
                // EXISTING KEY CHECK
                // ==================================================

                if (
                    order.productKey &&
                    String(
                        order.productKey
                    ).trim() !== ""
                ) {

                    await sendTelegramMessage(
                        `⚠️ KEY ALREADY EXISTS

🆔 Order ID:
${orderId}

🔑 Existing Key:
${order.productKey}`
                    );

                    await pendingDoc.ref.delete();

                    return res.json({
                        ok: true
                    });
                }

                // ==================================================
                // SAVE KEY
                // ==================================================

                await orderDoc.ref.update({

                    productKey:
                        text,

                    status:
                        "Delivered",

                    deliveredAt:
                        admin.firestore
                            .FieldValue
                            .serverTimestamp()
                });

                await pendingDoc.ref.delete();

                // ==================================================
                // SUCCESS
                // ==================================================

                await sendTelegramMessage(
                    `✅ KEY DELIVERED SUCCESSFULLY

━━━━━━━━━━━━━━━━━━

🆔 Order ID:
${orderId}

👤 Customer:
${order.customerName || "N/A"}

📧 Email:
${order.customerEmail || "N/A"}

📦 Product:
${order.productName || "N/A"}

📋 Plan:
${order.planName || "N/A"}

🔑 Product Key:
${text}

📌 Status:
Delivered

━━━━━━━━━━━━━━━━━━

Customer can now see the key in My Orders.`
                );

                return res.json({
                    ok: true
                });
            }

            // ==================================================
            // IGNORE OTHER UPDATES
            // ==================================================

            return res.json({
                ok: true
            });

        } catch (error) {

            console.error(
                "Telegram webhook error:"
            );

            console.error(
                error.response?.data ||
                error.stack ||
                error.message
            );

            try {

                await sendTelegramMessage(
                    `❌ SERVER ERROR

${error.message}`
                );

            } catch (
                telegramError
            ) {

                console.error(
                    "Could not send Telegram error:",
                    telegramError.message
                );
            }

            res.status(500).json({
                ok: false,
                error:
                    error.message
            });
        }
    }
);
// ======================================================
// WALLET RECHARGE
// ======================================================

app.post("/wallet-recharge", async (req, res) => {

    try {

        const data = req.body;

        if (!data.rechargeId) {
            return res.status(400).json({
                success: false,
                error: "Recharge ID is missing"
            });
        }

        const amount = Number(data.amount || 0);

        if (!amount || amount < 10 || amount > 10000) {
            return res.status(400).json({
                success: false,
                error: "Invalid recharge amount"
            });
        }

        const text = `
💰 WALLET RECHARGE REQUEST

━━━━━━━━━━━━━━━━━━

🆔 Recharge ID:
${data.rechargeId}

👤 Email:
${data.email || "N/A"}

📞 Mobile:
${data.mobile || "N/A"}

💰 Amount:
₹${amount.toFixed(2)}

💳 Payment:
${data.paymentMethod || "UPI / Google Pay"}

📌 Status:
⏳ Pending

━━━━━━━━━━━━━━━━━━

Please verify the payment manually.

VIP Admin Panel
`;

        const buttons = [

            [
                {
                    text: "✅ Approve Recharge",
                    callback_data:
                        `walletapprove:${data.rechargeId}`
                }
            ],

            [
                {
                    text: "❌ Reject Recharge",
                    callback_data:
                        `walletreject:${data.rechargeId}`
                }
            ]

        ];

        await sendTelegramMessage(
            text,
            {
                inline_keyboard: buttons
            }
        );

        console.log(
            "Wallet recharge notification sent:",
            data.rechargeId
        );

        return res.json({
            success: true
        });

    } catch (error) {

        console.error(
            "WALLET RECHARGE ERROR:",
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});