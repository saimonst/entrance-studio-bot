const express = require("express");
const { google } = require("googleapis");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "entrance_studio_bot";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || "";
const CALENDAR_ID = process.env.CALENDAR_ID || "entrancelifeth@gmail.com";

// ======= Google Calendar Auth =======
function getCalendarClient() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || "{}");
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  return google.calendar({ version: "v3", auth });
}

// ======= เช็คเวลาว่าง =======
async function checkAvailability(dateStr, startTime, endTime) {
  try {
    const calendar = getCalendarClient();

    // Parse วันที่และเวลา โดยใช้ timezone Asia/Bangkok (UTC+7)
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let year, month, day;
    const now = new Date();
    // แปลงเป็นเวลาไทยก่อน
    const bangkokNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));

    if (dateStr === "วันนี้" || dateStr === "today") {
      year = bangkokNow.getFullYear();
      month = bangkokNow.getMonth() + 1;
      day = bangkokNow.getDate();
    } else if (dateStr === "พรุ่งนี้" || dateStr === "tomorrow") {
      const tomorrow = new Date(bangkokNow);
      tomorrow.setDate(tomorrow.getDate() + 1);
      year = tomorrow.getFullYear();
      month = tomorrow.getMonth() + 1;
      day = tomorrow.getDate();
    } else {
      // รูปแบบ YYYY-MM-DD
      const parts = dateStr.split("-");
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);
    }

    // สร้าง ISO string แบบ Bangkok timezone โดยไม่ใช้ UTC
    const pad = (n) => String(n).padStart(2, "0");
    const timeMinStr = `${year}-${pad(month)}-${pad(day)}T${pad(startHour)}:${pad(startMin)}:00+07:00`;
    const timeMaxStr = `${year}-${pad(month)}-${pad(day)}T${pad(endHour)}:${pad(endMin)}:00+07:00`;

    console.log("Checking availability:", timeMinStr, "to", timeMaxStr);

    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: timeMinStr,
      timeMax: timeMaxStr,
      singleEvents: true,
      timeZone: "Asia/Bangkok",
    });

    const events = res.data.items || [];
    console.log("Events found:", events.length);
    events.forEach(e => console.log("Event:", e.summary, "|", e.start?.dateTime || e.start?.date, "-", e.end?.dateTime || e.end?.date));
    return { available: events.length === 0, events };
  } catch (err) {
    console.error("Calendar error:", err.message);
    return { available: null, error: err.message };
  }
}

// ======= Parse เวลาจากข้อความ =======
function parseTimeRequest(text) {
  // รูปแบบ: 12:00-14:00, 12.00-14.00, 12น-14น
  const timePattern = /(\d{1,2})[:.:]?(\d{0,2})\s*[-–ถึง]\s*(\d{1,2})[:.:]?(\d{0,2})/;
  const match = text.match(timePattern);
  
  if (!match) return null;
  
  const startHour = match[1].padStart(2, "0");
  const startMin = (match[2] || "00").padStart(2, "0");
  const endHour = match[3].padStart(2, "0");
  const endMin = (match[4] || "00").padStart(2, "0");
  
  // Parse วันที่
  let dateStr = "วันนี้";
  if (text.includes("พรุ่งนี้")) dateStr = "พรุ่งนี้";
  else if (text.match(/\d{1,2}\/\d{1,2}/)) {
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
    const year = new Date().getFullYear();
    dateStr = `${year}-${dateMatch[2].padStart(2,"0")}-${dateMatch[1].padStart(2,"0")}`;
  }
  
  return {
    date: dateStr,
    startTime: `${startHour}:${startMin}`,
    endTime: `${endHour}:${endMin}`,
  };
}

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
  { q: ["จอง", "จองยังไง", "จองได้", "book", "อยากจอง", "อยาก จอง", "ขอจอง", "สนใจจอง", "จองห้อง", "จองได้ไหม"], a: "ขอบคุณที่สนใจนะครับ 🙏 กรุณารอสักครู่ ทางเจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันการจองให้ครับ 😊" },
  { q: ["สวัสดี", "หวัดดี", "hello", "hi"], a: "สวัสดีครับ! 😊 ยินดีต้อนรับสู่ Entrance Studio\nมีอะไรให้ช่วยเรื่องห้องซ้อมหรือห้องอัดไหมครับ?" },
];

async function getReply(text) {
  const txt = text.toLowerCase();
  
  // เช็คก่อนว่าถามเรื่องเวลาว่างไหม
  const timeInfo = parseTimeRequest(txt);
  if (timeInfo) {
    const result = await checkAvailability(timeInfo.date, timeInfo.startTime, timeInfo.endTime);
    if (result.error) {
      return "ขออภัยครับ ไม่สามารถเช็คตารางได้ในขณะนี้ กรุณาติดต่อเจ้าหน้าที่โดยตรงนะครับ 🙏";
    }
    if (result.available) {
      return `ช่วงเวลา ${timeInfo.startTime}–${timeInfo.endTime} น. ว่างอยู่ครับ 🎸\nอยากให้จองเลยไหมครับ? ทางเจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันให้นะครับ 😊`;
    } else {
      return `ขออภัยครับ ช่วงเวลา ${timeInfo.startTime}–${timeInfo.endTime} น. มีการจองแล้ว 🙏\nลองเวลาอื่นได้เลยนะครับ หรือให้เจ้าหน้าที่ช่วยหาเวลาว่างให้ไหมครับ?`;
    }
  }
  
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
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ======= Receive Messages =======
app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object !== "page") return res.sendStatus(404);

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      if (!event.message || event.message.is_echo) continue;
      const senderId = event.sender.id;
      const text = event.message.text || "";
      const reply = await getReply(text);
      await sendMessage(senderId, reply);
    }
  }
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
