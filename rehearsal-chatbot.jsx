import { useState, useRef, useEffect } from "react";

const STUDIO = {
  hours: "จันทร์–เสาร์ 10:00–23:00 น.",
  closed: "ปิดวันอาทิตย์",
  room: { size: "ขนาดกลาง", capacity: "8 คน" },
  equipment: ["กลอง 1 ชุด", "เบส 4 สาย 1 ตัว", "เบส 5 สาย 1 ตัว", "เปียโน 2 ตัว", "แอมป์กีตาร์ Marshall 1 ตัว", "แอมป์กีตาร์ Fender 1 ตัว", "แอมป์เบส 1 ตัว", "แอมป์เปียโน 1 ตัว", "ไมค์ 3 ตัว"],
  pricing: [
    { q: ["mix", "master", "มิกซ์", "มาสเตอร์"], a: "Mix & Master ราคา 5,800 บาท ครับ 🎚️\n(แยกจากค่าห้องอัดนะครับ)" },
    { q: ["ห้องอัด", "อัดเสียง", "backing", "full band", "อัดร้อง", "อัดเพลง"], a: "ห้องอัดมี 2 แบบครับ 🎙️\n• ร้องกับ Backing Track: 600 บาท/ชม.\n• Full Band: 800 บาท/ชม.\n(ราคานี้ไม่รวม Edit และ Mix&Master นะครับ)" },
    { q: ["ราคาห้องซ้อม", "ห้องซ้อมราคา", "ห้องซ้อม", "ค่าซ้อม", "ซ้อมดนตรี", "ราคา", "เท่าไหร่", "กี่บาท"], a: "ห้องซ้อมราคา 400 บาท/ชม. 🎸\nจองขั้นต่ำ 1 ชั่วโมงนะครับ" },
  ],
  faqs: [
    { q: ["เปิด", "กี่โมง", "เวลา", "ปิด", "วันไหน", "วันอาทิตย์", "จันทร์", "เสาร์"], a: "เปิดทุกวัน จันทร์–เสาร์ เวลา 10:00–23:00 น. ครับ 🕙\nปิดวันอาทิตย์นะครับ" },
    { q: ["อุปกรณ์", "มีอะไร", "เครื่องดนตรี", "กลอง", "เบส", "เปียโน", "แอมป์", "ไมค์"], a: "อุปกรณ์ในห้องซ้อมมีครับ 🎵\n• กลอง 1 ชุด\n• เบส 4 สาย 1 ตัว / เบส 5 สาย 1 ตัว\n• เปียโน 2 ตัว\n• แอมป์กีตาร์ Marshall + Fender\n• แอมป์เบส 1 ตัว / แอมป์เปียโน 1 ตัว\n• ไมค์ 3 ตัว" },
    { q: ["ห้อง", "ขนาด", "จุ", "คน", "กี่คน"], a: "ห้องซ้อมขนาดกลาง จุได้ประมาณ 8 คนครับ 👥" },
    { q: ["จอง", "จองยังไง", "จองได้", "book", "อยากจอง", "ขอจอง"], a: "ขอบคุณที่สนใจนะครับ 🙏 กรุณารอสักครู่ ทางเจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันการจองให้ครับ 😊" },
    { q: ["สวัสดี", "หวัดดี", "hello", "hi", "ดีครับ", "ดีค่ะ"], a: "สวัสดีครับ! 😊 มีอะไรให้ช่วยเรื่องห้องซ้อมหรือห้องอัดไหมครับ?" },
  ],
};

function getReply(input) {
  const txt = input.toLowerCase();
  for (const item of [...STUDIO.pricing, ...STUDIO.faqs]) {
    if (item.q.some(k => txt.includes(k.toLowerCase()))) return item.a;
  }
  return "ขออภัยครับ ไม่แน่ใจเรื่องนี้ 🙏\nกรุณาติดต่อเจ้าหน้าที่โดยตรงได้เลยนะครับ";
}

const QUICK_REPLIES = ["มีอุปกรณ์อะไรบ้าง?", "ราคาห้องซ้อมเท่าไหร่?", "ห้องอัดราคาเท่าไหร่?", "Mix&Master ราคาเท่าไหร่?", "เปิดกี่โมง?", "ปิดวันไหน?"];

export default function RehearsalChatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "สวัสดีครับ! 🎸 ยินดีต้อนรับสู่ Entrance Studio\nจะถามเรื่องห้องซ้อม ห้องอัด หรือราคาก็ได้เลยนะครับ 😊" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    const reply = getReply(userMsg);
    setTimeout(() => {
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    }, 400);
    setMessages(newMessages);
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0f0f0f", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sarabun',sans-serif", padding:"16px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width:"100%", maxWidth:"420px", display:"flex", flexDirection:"column" }}>

        <div style={{ background:"linear-gradient(135deg,#1a1a2e,#16213e)", borderRadius:"20px 20px 0 0", padding:"20px", display:"flex", alignItems:"center", gap:"14px", borderBottom:"1px solid #e85d04" }}>
          <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:"linear-gradient(135deg,#e85d04,#f48c06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>🎸</div>
          <div>
            <div style={{ color:"#fff", fontWeight:"700", fontSize:"16px" }}>Entrance Studio</div>
            <div style={{ color:"#e85d04", fontSize:"12px", marginTop:"2px" }}>● พร้อมตอบตลอด 24 ชม.</div>
          </div>
          <div style={{ marginLeft:"auto", background:"#e85d04", color:"#fff", fontSize:"10px", fontWeight:"600", padding:"4px 10px", borderRadius:"20px" }}>DEMO</div>
        </div>

        <div style={{ background:"#1a1a1a", padding:"16px", display:"flex", flexDirection:"column", gap:"12px", height:"420px", overflowY:"auto" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display:"flex", justifyContent: m.role==="user" ? "flex-end":"flex-start", alignItems:"flex-end", gap:"8px" }}>
              {m.role === "assistant" && (
                <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#e85d04,#f48c06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", flexShrink:0 }}>🎵</div>
              )}
              <div style={{ maxWidth:"75%", padding:"10px 14px", borderRadius: m.role==="user" ? "18px 18px 4px 18px":"4px 18px 18px 18px", background: m.role==="user" ? "linear-gradient(135deg,#e85d04,#f48c06)":"#2a2a2a", color:"#fff", fontSize:"14px", lineHeight:"1.7", whiteSpace:"pre-wrap" }}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={{ background:"#1a1a1a", padding:"8px 12px 10px", display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {QUICK_REPLIES.map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              style={{ background:"transparent", border:"1px solid #e85d04", color:"#e85d04", borderRadius:"20px", padding:"5px 12px", fontSize:"12px", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", transition:"all 0.15s" }}
              onMouseEnter={e => {e.target.style.background="#e85d04";e.target.style.color="#fff";}}
              onMouseLeave={e => {e.target.style.background="transparent";e.target.style.color="#e85d04";}}>
              {q}
            </button>
          ))}
        </div>

        <div style={{ background:"#111", borderRadius:"0 0 20px 20px", padding:"12px", display:"flex", gap:"8px", alignItems:"center", borderTop:"1px solid #2a2a2a" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && sendMessage()} placeholder="พิมพ์คำถาม..."
            style={{ flex:1, background:"#2a2a2a", border:"none", borderRadius:"24px", padding:"10px 16px", color:"#fff", fontSize:"14px", outline:"none", fontFamily:"inherit" }} />
          <button onClick={() => sendMessage()} disabled={!input.trim()}
            style={{ width:"40px", height:"40px", borderRadius:"50%", background: !input.trim() ? "#333":"linear-gradient(135deg,#e85d04,#f48c06)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>
            ➤
          </button>
        </div>
      </div>
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#1a1a1a}::-webkit-scrollbar-thumb{background:#333;border-radius:4px}`}</style>
    </div>
  );
}
