
import { IdeaItem } from "../types";

const STORAGE_KEY = 'conversion_craft_ideas';

export const getIdeas = (): IdeaItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load ideas", e);
    return [];
  }
};

export const saveIdea = (idea: Omit<IdeaItem, 'id' | 'date'>) => {
  try {
    const ideas = getIdeas();
    const newIdea: IdeaItem = {
      ...idea,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      isPinned: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newIdea, ...ideas]));
    return newIdea;
  } catch (e) {
    console.error("Failed to save idea", e);
    return null;
  }
};

export const deleteIdea = (id: string) => {
  try {
    const ideas = getIdeas().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  } catch (e) {
    console.error("Failed to delete idea", e);
  }
};

export const togglePin = (id: string) => {
  try {
    const ideas = getIdeas().map(i => 
      i.id === id ? { ...i, isPinned: !i.isPinned } : i
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  } catch (e) {
    console.error("Failed to toggle pin", e);
  }
};
