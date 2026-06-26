const express = require("express");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "entrance_studio_bot";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || "";

// ======= Logic ตอบคำถาม =======
const PRICING = [
  { q: ["mix", "master", "มิกซ์", "มาสเตอร์"], a: "Mix & Master ราคา 5,800 บาท ครับ 🎚️\n(แยกจากค่าห้องอัดนะครับ)" },
  { q: ["ห้องอัด", "อัดเสียง", "backing", "full band", "อัดร้อง", "อัดเพลง"], a: "ห้องอัดมี 2 แบบครับ 🎙️\n• ร้องกับ Backing Track: 600 บาท/ชม.\n• Full Band: 800 บาท/ชม.\n(ไม่รวม Edit และ Mix&Master นะครับ)" },
  { q: ["ราคาห้องซ้อม", "ห้องซ้อม", "ค่าซ้อม", "ซ้อมดนตรี", "ราคา", "เท่าไหร่", "กี่บาท"], a: "ห้องซ้อมราคา 400 บาท/ชม. 🎸\nจองขั้นต่ำ 1 ชั่วโมงนะครับ" },
];

const FAQS = [
  { q: ["เปิด", "กี่โมง", "เวลา", "ปิด", "วันไหน", "วันอาทิตย์"], a: "เปิดทุกวัน จันทร์–เสาร์ เวลา 10:00–23:00 น. ครับ 🕙\nปิดวันอาทิตย์นะครับ" },
  { q: ["อุปกรณ์", "มีอะไร", "เครื่องดนตรี", "กลอง", "เบส", "เปียโน", "แอมป์", "ไมค์"], a: "อุปกรณ์ในห้องซ้อมมีครับ 🎵\n• กลอง 1 ชุด\n• เบส 4 สาย 1 ตัว / เบส 5 สาย 1 ตัว\n• เปียโน 2 ตัว\n• แอมป์กีตาร์ Marshall + Fender\n• แอมป์เบส 1 ตัว / แอมป์เปียโน 1 ตัว\n• ไมค์ 3 ตัว" },
  { q: ["ห้อง", "ขนาด", "จุ", "กี่คน"], a: "ห้องซ้อมขนาดกลาง จุได้ประมาณ 8 คนครับ 👥" },
  { q: ["จอง", "จองยังไง", "book", "อยากจอง", "ขอจอง"], a: "ขอบคุณที่สนใจนะครับ 🙏 กรุณารอสักครู่ ทางเจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันการจองให้ครับ 😊" },
  { q: ["สวัสดี", "หวัดดี", "hello", "hi"], a: "สวัสดีครับ! 😊 ยินดีต้อนรับสู่ Entrance Studio\nมีอะไรให้ช่วยเรื่องห้องซ้อมหรือห้องอัดไหมครับ?" },
];

function getReply(text) {
  const txt = text.toLowerCase();
  for (const item of [...PRICING, ...FAQS]) {
    if (item.q.some((k) => txt.includes(k.toLowerCase()))) return item.a;
  }
  return "ขออภัยครับ ไม่แน่ใจเรื่องนี้ 🙏\nกรุณาติดต่อเจ้าหน้าที่โดยตรงได้เลยนะครับ";
}

// ======= Webhook Verify =======
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ======= Receive Messages =======
app.post("/webhook", (req, res) => {
  const body = req.body;
  if (body.object !== "page") return res.sendStatus(404);

  body.entry?.forEach((entry) => {
    entry.messaging?.forEach((event) => {
      if (!event.message || event.message.is_echo) return;
      const senderId = event.sender.id;
      const text = event.message.text || "";
      const reply = getReply(text);
      sendMessage(senderId, reply);
    });
  });

  res.status(200).send("EVENT_RECEIVED");
});

// ======= Send Message =======
async function sendMessage(recipientId, text) {
  const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });
}

app.get("/", (req, res) => res.send("Entrance Studio Bot is running! 🎸"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
