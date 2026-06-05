import { pickSmartMessage, POMODORO_COMPLETE_MESSAGE, type SmartMessage, type NotificationCategory } from './rules';

export interface NotificationSettings {
  enable_all: boolean;
  morning: boolean;
  todo: boolean;
  pomodoro: boolean;
  motivational: boolean;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  enable_all: true,
  morning: true,
  todo: true,
  pomodoro: true,
  motivational: true,
};

const LS_KEY = 'goalgrip.notificationSettings';

export function loadLocalSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveLocalSettings(s: NotificationSettings) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

export async function ensurePermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

function isCategoryEnabled(s: NotificationSettings, cat: NotificationCategory) {
  if (!s.enable_all) return false;
  return s[cat];
}

async function show(msg: SmartMessage) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(msg.title, {
        body: msg.body,
        tag: msg.id,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: { url: '/dashboard/todo', category: msg.category },
      });
      return;
    }
  } catch {}
  new Notification(msg.title, { body: msg.body, icon: '/pwa-192x192.png', tag: msg.id });
}

/** Called from Pomodoro page when a focus session ends. */
export async function notifyPomodoroComplete() {
  const s = loadLocalSettings();
  if (!isCategoryEnabled(s, 'pomodoro')) return;
  if (!(await ensurePermission())) return;
  await show(POMODORO_COMPLETE_MESSAGE);
}

export interface SmartContextProvider {
  (): Promise<{
    name: string;
    todosTotal: number;
    todosCompleted: number;
    goalsPending: number;
  }>;
}

let timer: number | null = null;
const SHOWN_KEY = 'goalgrip.notificationShown';

function hasShownToday(id: string) {
  try {
    const raw = localStorage.getItem(SHOWN_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const today = new Date().toISOString().slice(0, 10);
    return map[today]?.includes(id);
  } catch { return false; }
}

function markShownToday(id: string) {
  try {
    const raw = localStorage.getItem(SHOWN_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const today = new Date().toISOString().slice(0, 10);
    map[today] = Array.from(new Set([...(map[today] || []), id]));
    // prune old keys
    Object.keys(map).filter((k) => k !== today).forEach((k) => delete map[k]);
    localStorage.setItem(SHOWN_KEY, JSON.stringify(map));
  } catch {}
}

/** Starts background reminder loop. Idempotent. */
export function startSmartReminders(getContext: SmartContextProvider) {
  if (timer) return;
  const run = async () => {
    try {
      const s = loadLocalSettings();
      if (!s.enable_all) return;
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const ctx = await getContext();
      const msg = pickSmartMessage({ ...ctx, hour: new Date().getHours() });
      if (!msg) return;
      if (!isCategoryEnabled(s, msg.category)) return;
      if (hasShownToday(msg.id)) return;
      await show(msg);
      markShownToday(msg.id);
    } catch {}
  };
  // Run shortly after startup, then every 2 hours
  window.setTimeout(run, 15_000);
  timer = window.setInterval(run, 2 * 60 * 60 * 1000);
}

export function stopSmartReminders() {
  if (timer) { window.clearInterval(timer); timer = null; }
}