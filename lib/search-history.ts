export interface SearchHistoryItem {
  id: string;
  query: string;
  type: "people" | "phone" | "records" | "username" | "vehicle";
  timestamp: number;
  preview?: string;
}

const STORAGE_KEY = "revealai_search_history";
const MAX_ITEMS = 50;

export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addSearchHistoryItem(item: Omit<SearchHistoryItem, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const history = getSearchHistory();
    const newItem: SearchHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };

    // Add to beginning, deduplicate by query+type, and limit
    const filtered = history.filter(
      (h) => !(h.query === item.query && h.type === item.type)
    );
    const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function removeSearchHistoryItem(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = getSearchHistory();
    const updated = history.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getTypeLabel(type: SearchHistoryItem["type"]): string {
  const labels: Record<SearchHistoryItem["type"], string> = {
    people: "People Search",
    phone: "Phone Lookup",
    records: "Records",
    username: "Username",
    vehicle: "Vehicle",
  };
  return labels[type] || type;
}

export function getTypeColor(type: SearchHistoryItem["type"]): { text: string; bg: string } {
  const colors: Record<SearchHistoryItem["type"], { text: string; bg: string }> = {
    people: { text: "text-blue-600", bg: "bg-blue-100" },
    phone: { text: "text-cyan-600", bg: "bg-cyan-100" },
    records: { text: "text-amber-600", bg: "bg-amber-100" },
    username: { text: "text-purple-600", bg: "bg-purple-100" },
    vehicle: { text: "text-emerald-600", bg: "bg-emerald-100" },
  };
  return colors[type] || { text: "text-gray-600", bg: "bg-gray-100" };
}
