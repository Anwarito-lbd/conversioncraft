// Simple localStorage-backed idea store. Replace with server-backed persistence if needed.

const LS_KEY = "cc_warroom_ideas_v1";

export function loadIdeas(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveIdea(text: string) {
  const list = loadIdeas();
  list.unshift(text);
  localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 200)));
}