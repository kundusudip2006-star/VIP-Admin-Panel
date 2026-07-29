const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const axios = require("axios");

const BOT_TOKEN = "8545735365:AAEVzSmQQZiAdznz3FZfyrRXUS5ZPvcqLS4";
const CHAT_ID = "8152666872";

exports.newOrderNotification = onDocumentCreated(
  "orders/{orderId}",
  async (event) => {
    const data = event.data.data();

    const text = `
🛒 New Order

👤 Name: ${data.name || "N/A"}
📞 Phone: ${data.phone || "N/A"}
💰 Amount: ${data.amount || "N/A"}
`;

    await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        params: {
          chat_id: CHAT_ID,
          text: text,
        },
      }
    );
  }
);