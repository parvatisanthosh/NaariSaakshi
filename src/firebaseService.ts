import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { CategoryType } from './types';

// Your web app's Firebase configuration read from environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBhk7MlgCCAP_MXQYqRBNqOtd85AjkHSXQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "naarisaakshi.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "naarisaakshi",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "naarisaakshi.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1090898848100",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1090898848100:web:5ff6ece63ab481910fb271",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7E9H7NGZJB"
};

let db: any = null;

try {
  const apps = getApps();
  const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
  db = getFirestore(app);
} catch (e) {
  console.warn('Firebase initialization skipped or failed:', e);
}

/**
 * Rounds lat and lng to 3 decimal places (~100m grid cell precision).
 * Example: (12.9716, 77.5946) -> "12.972,77.595"
 */
export const getGridKey = (lat: number, lng: number): string => {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
};

export const parseGridKey = (gridKey: string): { lat: number; lng: number } | null => {
  const parts = gridKey.split(',');
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
};

export interface CommunitySignalCell {
  gridKey: string;
  lat: number;
  lng: number;
  count: number;
  categoryBreakdown: {
    verbal: number;
    physical: number;
    digital: number;
    stalking: number;
    quid_pro_quo: number;
    other: number;
  };
}

// In-memory fallback / cache for local demo testing
const localSignalCache: { [gridKey: string]: CommunitySignalCell } = {
  "12.972,77.595": {
    gridKey: "12.972,77.595",
    lat: 12.972,
    lng: 77.595,
    count: 4,
    categoryBreakdown: {
      verbal: 2,
      physical: 1,
      digital: 0,
      stalking: 1,
      quid_pro_quo: 0,
      other: 0
    }
  }
};

/**
 * Anonymously contributes a incident's rounded grid cell and category to Firestore.
 * NO name, NO narrative, NO reporter ID, NO time of event is ever transmitted.
 */
export const contributeAnonymousSignal = async (
  lat: number,
  lng: number,
  category: CategoryType
): Promise<boolean> => {
  const gridKey = getGridKey(lat, lng);
  const catKey = getCategoryFieldKey(category);

  // Update local memory cache first (guarantees instant feedback in demo mode)
  if (!localSignalCache[gridKey]) {
    const { lat: gLat, lng: gLng } = parseGridKey(gridKey) || { lat, lng };
    localSignalCache[gridKey] = {
      gridKey,
      lat: gLat,
      lng: gLng,
      count: 0,
      categoryBreakdown: {
        verbal: 0,
        physical: 0,
        digital: 0,
        stalking: 0,
        quid_pro_quo: 0,
        other: 0
      }
    };
  }
  localSignalCache[gridKey].count += 1;
  localSignalCache[gridKey].categoryBreakdown[catKey] += 1;

  if (!db) return true;

  try {
    const docRef = doc(db, 'location_signals', gridKey);
    await setDoc(
      docRef,
      {
        grid_key: gridKey,
        count: increment(1),
        last_updated: serverTimestamp(),
        [`category_breakdown.${catKey}`]: increment(1)
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Firestore write warning (using offline signal fallback):', err);
    return true;
  }
};

/**
 * Fetches aggregate community signals near the user's logged locations.
 */
export const fetchNearbyCommunitySignals = async (
  userLocations: { lat: number; lng: number }[]
): Promise<CommunitySignalCell[]> => {
  if (userLocations.length === 0) return [];

  const resultsMap: { [gridKey: string]: CommunitySignalCell } = {};

  // Always include relevant cached signals
  Object.values(localSignalCache).forEach(cell => {
    const isNearby = userLocations.some(
      loc => Math.abs(loc.lat - cell.lat) < 0.02 && Math.abs(loc.lng - cell.lng) < 0.02
    );
    if (isNearby) {
      resultsMap[cell.gridKey] = cell;
    }
  });

  if (!db) return Object.values(resultsMap);

  try {
    const colRef = collection(db, 'location_signals');
    const snapshot = await getDocs(colRef);

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.grid_key) {
        const coords = parseGridKey(data.grid_key);
        if (coords) {
          const isNearby = userLocations.some(
            loc => Math.abs(loc.lat - coords.lat) < 0.02 && Math.abs(loc.lng - coords.lng) < 0.02
          );
          if (isNearby) {
            resultsMap[data.grid_key] = {
              gridKey: data.grid_key,
              lat: coords.lat,
              lng: coords.lng,
              count: data.count || 1,
              categoryBreakdown: {
                verbal: data.category_breakdown?.verbal || 0,
                physical: data.category_breakdown?.physical || 0,
                digital: data.category_breakdown?.digital || 0,
                stalking: data.category_breakdown?.stalking || 0,
                quid_pro_quo: data.category_breakdown?.quid_pro_quo || 0,
                other: data.category_breakdown?.other || 0
              }
            };
          }
        }
      }
    });
  } catch (err) {
    console.warn('Firestore fetch warning (using cached signal fallback):', err);
  }

  return Object.values(resultsMap);
};

function getCategoryFieldKey(category: CategoryType): 'verbal' | 'physical' | 'digital' | 'stalking' | 'quid_pro_quo' | 'other' {
  switch (category) {
    case 'Verbal': return 'verbal';
    case 'Physical': return 'physical';
    case 'Digital': return 'digital';
    case 'Stalking': return 'stalking';
    case 'Quid-Pro-Quo': return 'quid_pro_quo';
    default: return 'other';
  }
}
