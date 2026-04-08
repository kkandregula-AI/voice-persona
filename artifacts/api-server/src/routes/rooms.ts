import { randomBytes } from "crypto";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface RoomTranslation {
  id: string;
  timestamp: number;
  original: string;
  translations: Record<string, string>;
}

interface Room {
  id: string;
  createdAt: number;
  translations: RoomTranslation[];
}

const rooms = new Map<string, Room>();

function makeId(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

router.post("/rooms", (_req, res) => {
  const id = makeId();
  const room: Room = { id, createdAt: Date.now(), translations: [] };
  rooms.set(id, room);
  setTimeout(() => rooms.delete(id), 2 * 60 * 60 * 1000);
  res.json({ roomId: id });
});

router.get("/rooms/:id", (req, res) => {
  const room = rooms.get(req.params.id.toUpperCase());
  if (!room) return res.status(404).json({ error: "Room not found or expired" });
  res.json({ roomId: room.id, createdAt: room.createdAt });
});

router.post("/rooms/:id/push", (req, res) => {
  const room = rooms.get(req.params.id.toUpperCase());
  if (!room) return res.status(404).json({ error: "Room not found or expired" });

  const { original, translations } = req.body as {
    original?: string;
    translations?: Record<string, string>;
  };
  if (!original) return res.status(400).json({ error: "No content" });

  const entry: RoomTranslation = {
    id: randomBytes(4).toString("hex"),
    timestamp: Date.now(),
    original: original ?? "",
    translations: translations ?? {},
  };
  room.translations.push(entry);
  if (room.translations.length > 60) {
    room.translations = room.translations.slice(-60);
  }
  res.json({ ok: true });
});

router.get("/rooms/:id/pull", (req, res) => {
  const room = rooms.get(req.params.id.toUpperCase());
  if (!room) return res.status(404).json({ error: "Room not found or expired" });

  const since = parseInt((req.query.since as string) ?? "0", 10);
  const items = since > 0
    ? room.translations.filter((t) => t.timestamp > since)
    : room.translations.slice(-15);
  res.json({ translations: items, roomId: room.id });
});

export default router;
