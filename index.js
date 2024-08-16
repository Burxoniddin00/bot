const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs"); // Fayl tizimi bilan ishlash uchun
const token = "7251602217:AAHIPrMz328B_1W0qjkLMJFMnGSlcdW4vEY";
const bot = new TelegramBot(token, { polling: true });

const adminUserId = "5017464342";
const groupId = "@new_tavar_grupa";

// JSON faylini o'qish va saqlash uchun yordamchi funksiya
const jsonFilePath = "data.json";

function readJsonFile() {
  try {
    const data = fs.readFileSync(jsonFilePath);
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeJsonFile(data) {
  fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
}

// Admin tomonidan rasm yuborilganda
bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  if (chatId.toString() === adminUserId) {
    if (msg.photo) {
      // Rasmning oxirgi versiyasini olish
      const photoId = msg.photo[msg.photo.length - 1].file_id;

      // Agar photoId mavjud bo'lsa
      if (photoId) {
        const products = readJsonFile();

        // Agar rasm ID allaqachon mavjud bo'lmasa, qo'shamiz
        const exists = products.some((product) => product.id === photoId);
        if (!exists) {
          const textParts = msg.caption ? msg.caption.split(",") : [];
          const productInfo = {
            id: photoId,
            description: textParts[0] ? textParts[0].trim() : "No description",
            price: textParts[1] ? parseFloat(textParts[1].trim()) : 0,
            message_id: null, // Yuborilgan rasm xabarining message_id sini saqlaymiz
          };

          // Rasmni guruhga yuborish va xabarni olish
          bot
            .sendPhoto(groupId, photoId)
            .then((sentMessage) => {
              // Yuborilgan rasm xabarining message_id sini saqlash
              productInfo.message_id = sentMessage.message_id;

              // JSON faylga yozish
              products.push(productInfo);
              writeJsonFile(products);
            })
            .catch((err) => {
              console.error("Rasm yuborishda xato:", err);
            });
        } else {
          bot.sendMessage(
            chatId,
            "Bu rasm allaqachon mavjud, yangilanishi mumkin emas."
          );
        }
      } else {
        bot.sendMessage(chatId, "Rasm ID topilmadi, ma'lumot saqlanmadi.");
      }
    } else if (msg.text) {
      bot.sendMessage(chatId, "Faqat rasm yuboriladi, matn emas.");
    }
  } else if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    const textParts = msg.text.split(" ");
    if (msg.reply_to_message) {
      if (msg.text === "malumot"||msg.text === "Malumot") {
        const products = readJsonFile();

        const product = products.find(
          (p) => p.message_id === msg.reply_to_message.message_id
        );

        if (product) {
          const response = `Malumot: ${product.description}`;
          bot.sendMessage(chatId, response, {
            reply_to_message_id: msg.message_id,
          });
        } else {
          bot.sendMessage(chatId, "Bu rasm haqida ma'lumot topilmadi.");
        }
      } else if (msg.text === "narx"||msg.text === "Narx") {
        const products = readJsonFile();

        const product = products.find(
          (p) => p.message_id === msg.reply_to_message.message_id
        );

        if (product) {
          const response = `Narxi: ${product.price} so'm`;
          bot.sendMessage(chatId, response, {
            reply_to_message_id: msg.message_id,
          });
        } else {
          bot.sendMessage(chatId, "Bu rasm haqida ma'lumot topilmadi.");
        }
      }
    }
  } else {
    bot.sendMessage(chatId, "Sizda bu bot bilan ishlash huquqi yo'q.");
  }
});
