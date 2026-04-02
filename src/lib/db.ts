import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
import { Match, Evaluation } from "./storage"; // 型を再利用

const MATCHES_COLLECTION = "soccer_matches";

export const saveMatch = async (match: Match): Promise<void> => {
  try {
    await setDoc(doc(db, MATCHES_COLLECTION, match.id), match);
  } catch (error) {
    console.error("Error saving match:", error);
    throw error;
  }
};

export const getMatches = async (userIdFilter?: string, isParent: boolean = false): Promise<Match[]> => {
  try {
    const matchesRef = collection(db, MATCHES_COLLECTION);
    
    // 親権限の場合は全てのデータを取得する
    let q;
    if (isParent) {
      q = query(matchesRef, orderBy("createdAt", "desc"));
    } else if (userIdFilter) {
      q = query(matchesRef, where("userId", "==", userIdFilter), orderBy("createdAt", "desc"));
    } else {
      q = query(matchesRef, orderBy("createdAt", "desc"));
    }
    
    const querySnapshot = await getDocs(q);
    const matches: Match[] = [];
    querySnapshot.forEach((doc) => {
      matches.push(doc.data() as Match);
    });
    return matches;
  } catch (error) {
    console.error("Error getting matches:", error);
    return [];
  }
};

export const getMatchById = async (id: string): Promise<Match | null> => {
  try {
    const matchDoc = await getDoc(doc(db, MATCHES_COLLECTION, id));
    if (matchDoc.exists()) {
      return matchDoc.data() as Match;
    }
    return null;
  } catch (error) {
    console.error("Error getting match:", error);
    return null;
  }
};

export const deleteMatch = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, MATCHES_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting match:", error);
    throw error;
  }
};

export const calculateAverageEvaluationFromFirestore = async (userId: string, isParent: boolean = false): Promise<Evaluation | null> => {
  const matches = await getMatches(userId, isParent);
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
  return {
    challenge: sum.challenge / count,
    transition: sum.transition / count,
    intelligence: sum.intelligence / count,
    hardwork: sum.hardwork / count,
    mental: sum.mental / count,
    captaincy: sum.captaincy / count,
  };
};
