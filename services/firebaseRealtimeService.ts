// Firebase Real-time Service for IEPH-Manager
// Implements onSnapshot for live data synchronization

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  Query,
  Unsubscribe,
  DocumentData,
  CollectionReference
} from 'firebase/firestore';
import { Batch, Student } from '../types';

// Initialize Firebase (Replace with your config)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Calculate totals from students data
 * Runtime calculations - NOT saved to database
 * @param batches - Array of batches with students
 * @returns Object with Total, Due, and Honorarium
 */
export const calculateTotals = (batches: Batch[]) => {
  const currentMonthIndex = new Date().getMonth();
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const currentMonthName = months[currentMonthIndex];

  let totalHonorarium = 0;
  let totalDue = 0;
  let totalStudents = 0;

  batches.forEach(batch => {
    if (batch.status !== 'ACTIVE') return;

    batch.students.forEach(student => {
      if (student.status !== 'ACTIVE') return;
      totalStudents++;

      // Count honorarium (paid students this month)
      if (student.fees[currentMonthName]) {
        totalHonorarium += batch.monthlyFee;
      }

      // Calculate due amount
      const admissionMonthIndex = months.indexOf(student.admissionMonth || 'JANUARY');
      const unpaidMonths = months.slice(admissionMonthIndex, currentMonthIndex + 1)
        .filter(m => !student.fees[m]);
      
      if (unpaidMonths.length > 0) {
        totalDue += unpaidMonths.length * batch.monthlyFee;
      }
    });
  });

  return {
    totalHonorarium,
    totalDue,
    totalStudents
  };
};

/**
 * Type for the callback function that updates UI
 */
export type UIUpdateCallback = (batches: Batch[], totals: any) => void;

/**
 * Main Real-time Listener - Watches batches collection
 * Uses onSnapshot for automatic updates on any data change
 * Calls calculateTotals() and updateUI() on every change
 * 
 * @param userName - User identifier for data filtering
 * @param updateUI - Callback function to update UI with new data
 * @returns Unsubscribe function to stop listening
 */
export const setupRealtimeBatchListener = (
  userName: string,
  updateUI: UIUpdateCallback
): Unsubscribe => {
  try {
    // Create query for user's batches
    const batchesQuery = query(
      collection(db, 'batches') as CollectionReference<Batch>,
      where('owner', '==', userName)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      batchesQuery,
      (snapshot) => {
        // Collect all data from snapshot
        const batches: Batch[] = [];
        
        snapshot.forEach((doc) => {
          const batchData = doc.data() as Batch;
          batches.push({
            ...batchData,
            id: doc.id
          });
        });

        // Calculate totals from current data
        const totals = calculateTotals(batches);

        // Update UI - single source of truth
        updateUI(batches, totals);
      },
      (error) => {
        console.error('Real-time listener error:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to setup real-time listener:', error);
    return () => {}; // Return empty unsubscribe
  }
};

/**
 * Alternative: Simple onSnapshot for existing local batches
 * Useful when data is still managed locally but needs real-time awareness
 * 
 * @param batches - Current batches array
 * @param onUpdate - Callback when data changes
 * @returns Unsubscribe function
 */
export const setupLocalBatchListener = (
  batches: Batch[],
  onUpdate: (totals: any) => void
): (() => void) => {
  // For local state management, calculate totals whenever needed
  const totals = calculateTotals(batches);
  onUpdate(totals);

  // Return cleanup function
  return () => {
    console.log('Stopping local batch listener');
  };
};

/**
 * Real-time listener for individual student changes
 * Triggers recalculation on any student data modification
 * 
 * @param batchId - ID of the batch to watch
 * @param allBatches - Current batches array
 * @param onStudentChange - Callback with updated totals
 * @returns Unsubscribe function
 */
export const setupStudentChangeListener = (
  batchId: string,
  allBatches: Batch[],
  onStudentChange: (totals: any) => void
): Unsubscribe => {
  try {
    // Query for students in specific batch
    const studentsQuery = query(
      collection(db, `batches/${batchId}/students`) as CollectionReference<Student>
    );

    const unsubscribe = onSnapshot(
      studentsQuery,
      (snapshot) => {
        // Recalculate totals when students change
        const totals = calculateTotals(allBatches);
        onStudentChange(totals);
      },
      (error) => {
        console.error('Student listener error:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to setup student listener:', error);
    return () => {};
  }
};

/**
 * Cleanup function - unsubscribe from all listeners
 * @param unsubscribers - Array of unsubscribe functions
 */
export const cleanupAllListeners = (unsubscribers: Unsubscribe[]) => {
  unsubscribers.forEach(unsubscribe => {
    try {
      unsubscribe();
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  });
};
