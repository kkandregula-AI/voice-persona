const SESSIONS_KEY = "tt_sessions_v1";
const PHRASES_KEY = "tt_phrases_v1";

function getLS(): Storage | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {}
  return null;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type SessionMessage = {
  id: string;
  speaker: "you" | "them" | "system";
  original: string;
  translated: string;
  timestamp: number;
  direction: "my-to-their" | "their-to-my";
  replayLang?: string;
  confidence?: number;
};

export type ConversationInsights = {
  summary: string;
  keyPhrases: string[];
  topic: string;
  totalExchanges: number;
};

export type ConversationSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  srcLang: string;
  tgtLang: string;
  srcCode: string;
  tgtCode: string;
  mode: string;
  messages: SessionMessage[];
  insights?: ConversationInsights;
  pinned?: boolean;
};

export type SavedPhrase = {
  id: string;
  original: string;
  translated: string;
  srcLang: string;
  tgtLang: string;
  createdAt: number;
};

// ─── Session helpers ──────────────────────────────────────────────────────────

function readSessions(): ConversationSession[] {
  const ls = getLS();
  if (!ls) return [];
  try { return JSON.parse(ls.getItem(SESSIONS_KEY) ?? "[]"); } catch { return []; }
}

function writeSessions(sessions: ConversationSession[]): void {
  const ls = getLS();
  if (!ls) return;
  try { ls.setItem(SESSIONS_KEY, JSON.stringify(sessions)); } catch {}
}

export function loadSessions(): ConversationSession[] {
  return readSessions().sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });
}

export function upsertSession(session: ConversationSession): void {
  const all = readSessions();
  const idx = all.findIndex((x) => x.id === session.id);
  if (idx >= 0) all[idx] = session;
  else all.unshift(session);
  writeSessions(all);
}

export function deleteSession(id: string): void {
  writeSessions(readSessions().filter((s) => s.id !== id));
}

export function renameSession(id: string, title: string): void {
  const all = readSessions();
  const s = all.find((x) => x.id === id);
  if (s) { s.title = title; writeSessions(all); }
}

export function pinSession(id: string, pinned: boolean): void {
  const all = readSessions();
  const s = all.find((x) => x.id === id);
  if (s) { s.pinned = pinned; writeSessions(all); }
}

export function setSessionInsights(id: string, insights: ConversationInsights): void {
  const all = readSessions();
  const s = all.find((x) => x.id === id);
  if (s) { s.insights = insights; writeSessions(all); }
}

export function createNewSession(
  srcLang: string,
  tgtLang: string,
  srcCode: string,
  tgtCode: string,
  mode: string,
): ConversationSession {
  const now = Date.now();
  const d = new Date(now);
  const dateStr = d.toLocaleDateString([], { day: "numeric", month: "short" });
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return {
    id: now.toString(36) + Math.random().toString(36).slice(2, 7),
    title: `${srcLang} ↔ ${tgtLang} · ${dateStr} ${timeStr}`,
    createdAt: now,
    updatedAt: now,
    srcLang,
    tgtLang,
    srcCode,
    tgtCode,
    mode,
    messages: [],
  };
}

export function exportSessionText(session: ConversationSession): string {
  const header = [
    `Travel Talk Transcript`,
    `Title: ${session.title}`,
    `Languages: ${session.srcLang} ↔ ${session.tgtLang}`,
    `Mode: ${session.mode}`,
    `Date: ${new Date(session.createdAt).toLocaleString()}`,
    `Messages: ${session.messages.length}`,
    ``,
    `─────────────────────────────────────────`,
    ``,
  ].join("\n");

  const body = session.messages
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((m) => {
      const ts = new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const who = m.speaker === "you" ? "You" : m.speaker === "them" ? "Other Person" : "System";
      return `[${ts}] ${who}\n  Original:   ${m.original}\n  Translated: ${m.translated}`;
    })
    .join("\n\n");

  return header + body;
}

// ─── Phrase helpers ───────────────────────────────────────────────────────────

function readPhrases(): SavedPhrase[] {
  const ls = getLS();
  if (!ls) return [];
  try { return JSON.parse(ls.getItem(PHRASES_KEY) ?? "[]"); } catch { return []; }
}

function writePhrases(phrases: SavedPhrase[]): void {
  const ls = getLS();
  if (!ls) return;
  try { ls.setItem(PHRASES_KEY, JSON.stringify(phrases)); } catch {}
}

export function loadSavedPhrases(): SavedPhrase[] {
  return readPhrases().sort((a, b) => b.createdAt - a.createdAt);
}

export function upsertPhrase(phrase: SavedPhrase): void {
  const all = readPhrases();
  const idx = all.findIndex((x) => x.id === phrase.id);
  if (idx >= 0) all[idx] = phrase;
  else all.unshift(phrase);
  writePhrases(all);
}

export function deletePhrase(id: string): void {
  writePhrases(readPhrases().filter((p) => p.id !== id));
}
