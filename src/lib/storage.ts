export interface Evaluation {
  challenge: number;
  transition: number;
  intelligence: number;
  hardwork: number;
  mental: number;
  captaincy: number;
}

export interface Match {
  id: string;
  userId: string;
  type?: 'match' | 'practice';
  opponent?: string;
  practiceName?: string;
  myScore?: number;
  opponentScore?: number;
  date: string; // ISO string
  goodPoints: string;
  badPoints: string;
  comment: string;
  evaluation: Evaluation;
  aiAdvice?: string;
  aiKeyword?: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
}

const USERS_KEY = "soccer_users";
const MATCHES_KEY = "soccer_matches";

export const getStorageUsers = (): User[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveStorageUser = (user: User): void => {
  if (typeof window === "undefined") return;
  const users = getStorageUsers();
  if (!users.find(u => u.id === user.id)) {
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const getStorageMatches = (userId?: string): Match[] => {
  if (typeof window === "undefined") return [];
  try {
    const matchesJson = localStorage.getItem(MATCHES_KEY);
    if (!matchesJson) return [];
    const matches: Match[] = JSON.parse(matchesJson);
    
    // Migration: ensure type and necessary fields exist
    const migratedMatches = matches.map(m => ({
      ...m,
      type: m.type || 'match',
    }));

    if (userId) {
      return migratedMatches.filter(m => m.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
    }
    return migratedMatches.sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) {
    return [];
  }
};

export const getStorageMatchById = (id: string): Match | undefined => {
  const matches = getStorageMatches();
  return matches.find(m => m.id === id);
};

export const saveStorageMatch = (match: Match): void => {
  if (typeof window === "undefined") return;
  const matches = getStorageMatches();
  const existingIndex = matches.findIndex(m => m.id === match.id);
  if (existingIndex >= 0) {
    matches[existingIndex] = match;
  } else {
    matches.push(match);
  }
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
};

export const deleteStorageUser = (userId: string): void => {
  if (typeof window === "undefined") return;
  const users = getStorageUsers();
  const newUsers = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
  
  const matches = getStorageMatches();
  const newMatches = matches.filter(m => m.userId !== userId);
  localStorage.setItem(MATCHES_KEY, JSON.stringify(newMatches));
};

export const deleteStorageMatch = (matchId: string): void => {
  if (typeof window === "undefined") return;
  const matches = getStorageMatches();
  const newMatches = matches.filter(m => m.id !== matchId);
  localStorage.setItem(MATCHES_KEY, JSON.stringify(newMatches));
};

export const calculateAverageEvaluation = (userId: string): Evaluation | null => {
  const matches = getStorageMatches(userId);
  if (matches.length === 0) return null;

  const sum: Evaluation = {
    challenge: 0,
    transition: 0,
    intelligence: 0,
    hardwork: 0,
    mental: 0,
    captaincy: 0,
  };

  matches.forEach(m => {
    sum.challenge += m.evaluation.challenge;
    sum.transition += m.evaluation.transition;
    sum.intelligence += m.evaluation.intelligence;
    sum.hardwork += m.evaluation.hardwork;
    sum.mental += m.evaluation.mental;
    sum.captaincy += m.evaluation.captaincy;
  });

  const count = matches.length;
  // 小数第1位まで表示するためか、ここでは数値として平均を返す
  return {
    challenge: sum.challenge / count,
    transition: sum.transition / count,
    intelligence: sum.intelligence / count,
    hardwork: sum.hardwork / count,
    mental: sum.mental / count,
    captaincy: sum.captaincy / count,
  };
};
