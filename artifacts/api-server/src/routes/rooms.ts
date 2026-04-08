import { randomBytes } from "crypto";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface RoomTranslation {
  id: string;
  timestamp: number;
  original: string;
  translations: Record<string, string>;
  senderRole: "A" | "B";
}

interface Room {
  id: string;
  createdAt: number;
  translations: RoomTranslation[];
  mode: "broadcast" | "talk";
}

const rooms = new Map<string, Room>();

function makeId(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

router.post("/rooms", (req, res) => {
  const id = makeId();
  const mode: "broadcast" | "talk" =
    req.body?.mode === "talk" ? "talk" : "broadcast";
  const room: Room = { id, createdAt: Date.now(), translations: [], mode };
  rooms.set(id, room);
  setTimeout(() => rooms.delete(id), 2 * 60 * 60 * 1000);
  res.json({ roomId: id, mode });
});

router.get("/rooms/:id", (req, res) => {
  const room = rooms.get(req.params.id.toUpperCase());
  if (!room) return res.status(404).json({ error: "Room not found or expired" });
  res.json({ roomId: room.id, createdAt: room.createdAt, mode: room.mode });
});

router.post("/rooms/:id/push", (req, res) => {
  const room = rooms.get(req.params.id.toUpperCase());
  if (!room) return res.status(404).json({ error: "Room not found or expired" });

  const { original, translations, senderRole } = req.body as {
    original?: string;
    translations?: Record<string, string>;
    senderRole?: "A" | "B";
  };
  if (!original) return res.status(400).json({ error: "No content" });

  const entry: RoomTranslation = {
    id: randomBytes(4).toString("hex"),
    timestamp: Date.now(),
    original: original ?? "",
    translations: translations ?? {},
    senderRole: senderRole ?? "A",
  };
  room.translations.push(entry);
  if (room.translations.length > 80) {
    room.translations = room.translations.slice(-80);
  }
  res.json({ ok: true });
});

router.get("/rooms/:id/pull", (req, res) => {
  const room = rooms.get(req.params.id.toUpperCase());
  if (!room) return res.status(404).json({ error: "Room not found or expired" });

  const since = parseInt((req.query.since as string) ?? "0", 10);
  const excludeRole = req.query.excludeRole as string | undefined;

  let items = since > 0
    ? room.translations.filter((t) => t.timestamp > since)
    : room.translations.slice(-20);

  if (excludeRole) {
    items = items.filter((t) => t.senderRole !== excludeRole);
  }

  res.json({ translations: items, roomId: room.id, mode: room.mode });
});

router.get("/rooms/:id/web", (req, res) => {
  const roomId = req.params.id.toUpperCase();
  const room = rooms.get(roomId);

  if (!room) {
    res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Room Not Found — Voice Persona AI</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{background:#050508;color:#aaa;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}
  h2{color:#fff;margin:12px 0 8px}
</style></head>
<body><div><div style="font-size:3em">🔍</div><h2>Room not found</h2><p>This room may have expired or the code is wrong.</p></div></body>
</html>`);
    return;
  }

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Voice Persona AI — Live Translations</title>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#050508;color:#e8e8f0;font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;flex-direction:column}
    header{padding:14px 20px;border-bottom:1px solid #1e1e2e;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .logo{font-size:17px;font-weight:700;color:#00D4FF}
    .badge{background:#22C55E18;border:1px solid #22C55E44;color:#22C55E;font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;display:flex;align-items:center;gap:5px}
    .dot{width:6px;height:6px;border-radius:50%;background:#22C55E}
    .room-id{margin-left:auto;font-size:12px;color:#555;font-family:monospace}
    .notice{background:#00D4FF0C;border:1px solid #00D4FF22;border-radius:12px;padding:12px 16px;margin:14px 16px;font-size:13px;color:#8ecfe8;line-height:1.6}
    #feed{flex:1;overflow-y:auto;padding:4px 16px 80px;display:flex;flex-direction:column;gap:10px}
    .msg{background:#16161F;border:1px solid #1e1e2e;border-radius:14px;padding:14px 16px}
    .msg-label{font-size:11px;color:#555;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px}
    .msg-original{font-size:13px;color:#666;margin-bottom:6px;font-style:italic}
    .msg-translated{font-size:17px;color:#e8e8f0;line-height:1.5}
    .msg-time{font-size:11px;color:#444;margin-top:8px}
    .empty{text-align:center;color:#444;padding:60px 20px;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
    .empty-icon{font-size:40px}
  </style>
</head>
<body>
  <header>
    <span class="logo">Voice Persona AI</span>
    <div class="badge"><div class="dot"></div> Live</div>
    <span class="room-id">Room ${roomId}</span>
  </header>
  <div class="notice">
    You are watching live translations from someone using Voice Persona AI. Their speech appears below as they speak — this page updates automatically. No app or account needed.
  </div>
  <div id="feed"><div class="empty"><div class="empty-icon">💬</div><div style="color:#555">Waiting for the broadcaster to speak…</div></div></div>
  <script>
    let since = 0;
    const feed = document.getElementById('feed');
    let hasMessages = false;

    function fmt(ts) {
      return new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    }

    async function poll() {
      try {
        const r = await fetch('/api/rooms/${roomId}/pull?since='+since+'&excludeRole=B');
        if (!r.ok) { setTimeout(poll, 3000); return; }
        const data = await r.json();
        const items = data.translations || [];
        if (items.length > 0 && !hasMessages) {
          feed.innerHTML = '';
          hasMessages = true;
        }
        for (const item of items) {
          if (item.timestamp > since) since = item.timestamp;
          const keys = Object.keys(item.translations || {});
          const translated = keys.length > 0 ? item.translations[keys[0]] : item.original;
          const div = document.createElement('div');
          div.className = 'msg';
          div.innerHTML =
            '<div class="msg-label">They said</div>' +
            '<div class="msg-original">' + item.original + '</div>' +
            '<div class="msg-translated">' + translated + '</div>' +
            '<div class="msg-time">' + fmt(item.timestamp) + '</div>';
          feed.appendChild(div);
          feed.scrollTop = feed.scrollHeight;
        }
      } catch(e) {}
      setTimeout(poll, 2500);
    }

    poll();
  </script>
</body>
</html>`);
});

export default router;
