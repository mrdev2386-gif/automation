/**
 * Bug Condition Exploration Test for Firebase Auth Setup Fix
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 * 
 * This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * 
 * Property 1: Fault Condition - Single Firebase Initialization with Valid Config
 * 
 * Tests that:
 * - Firebase initializes exactly once (not twice in App.jsx and services/firebase.js)
 * - firebaseConfig uses production values (not placeholders like "your-api-key")
 * - App.jsx imports from services/firebase.js (not directly from 'firebase/auth')
 * - Analytics is initialized when measurementId exists
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Property 1: Fault Condition - Single Firebase Initialization with Valid Config', () => {
  
  test('Firebase should initialize exactly once (not in both App.jsx and firebase.js)', () => {
    // Read both files
    const appJsxPath = join(process.cwd(), 'src', 'App.jsx');
    const firebaseJsPath = join(process.cwd(), 'src', 'services', 'firebase.js');
    
    const appJsxContent = readFileSync(appJsxPath, 'utf-8');
    const firebaseJsContent = readFileSync(firebaseJsPath, 'utf-8');
    
    // Count initializeApp calls
    const appJsxInitCount = (appJsxContent.match(/initializeApp\s*\(/g) || []).length;
    const firebaseJsInitCount = (firebaseJsContent.match(/initializeApp\s*\(/g) || []).length;
    
    const totalInitCount = appJsxInitCount + firebaseJsInitCount;
    
    // Expected: Only 1 initialization (in firebase.js)
    // Actual on unfixed code: 2 initializations (one in each file)
    expect(totalInitCount).toBe(1);
    expect(appJsxInitCount).toBe(0); // App.jsx should NOT initialize Firebase
    expect(firebaseJsInitCount).toBe(1); // firebase.js should initialize Firebase
  });

  test('firebaseConfig should use production values (not placeholders)', () => {
    const firebaseJsPath = join(process.cwd(), 'src', 'services', 'firebase.js');
    const firebaseJsContent = readFileSync(firebaseJsPath, 'utf-8');
    
    // Check for placeholder values that indicate bug
    const hasPlaceholderApiKey = firebaseJsContent.includes('"your-api-key"');
    const hasPlaceholderAuthDomain = firebaseJsContent.includes('"your-project.firebaseapp.com"');
    const hasPlaceholderProjectId = firebaseJsContent.includes('"your-project-id"');
    
    // Check for production values
    const hasProductionApiKey = firebaseJsContent.includes('AIzaSyAOB97HJHHsAbO5OQQ-kJtw3jyXU22A0bs');
    const hasProductionAuthDomain = firebaseJsContent.includes('waautomation-13fa6.firebaseapp.com');
    const hasProductionProjectId = firebaseJsContent.includes('waautomation-13fa6');
    
    // Expected: Production values present, no placeholders
    // Actual on unfixed code: Placeholders present, no production values
    expect(hasPlaceholderApiKey).toBe(false);
    expect(hasPlaceholderAuthDomain).toBe(false);
    expect(hasPlaceholderProjectId).toBe(false);
    
    expect(hasProductionApiKey).toBe(true);
    expect(hasProductionAuthDomain).toBe(true);
    expect(hasProductionProjectId).toBe(true);
  });

  test('App.jsx should import from services/firebase.js (not directly from firebase/auth)', () => {
    const appJsxPath = join(process.cwd(), 'src', 'App.jsx');
    const appJsxContent = readFileSync(appJsxPath, 'utf-8');
    
    // Check for direct Firebase SDK imports (indicates bug)
    const hasDirectFirebaseImport = appJsxContent.includes("from 'firebase/app'");
    const hasDirectAuthImport = appJsxContent.includes("from 'firebase/auth'");
    
    // Check for centralized service import (expected behavior)
    const hasCentralizedImport = appJsxContent.includes("from './services/firebase'") || 
                                  appJsxContent.includes('from "./services/firebase"');
    
    // Expected: Import from centralized service, no direct Firebase imports
    // Actual on unfixed code: Direct Firebase imports, no centralized import
    expect(hasDirectFirebaseImport).toBe(false);
    expect(hasDirectAuthImport).toBe(false);
    expect(hasCentralizedImport).toBe(true);
  });

  test('Analytics should be initialized when measurementId exists', () => {
    const firebaseJsPath = join(process.cwd(), 'src', 'services', 'firebase.js');
    const firebaseJsContent = readFileSync(firebaseJsPath, 'utf-8');
    
    // Check if Analytics is imported
    const hasAnalyticsImport = firebaseJsContent.includes("from 'firebase/analytics'");
    
    // Check if Analytics is initialized
    const hasAnalyticsInit = firebaseJsContent.includes('getAnalytics');
    
    // Check for browser-only guard
    const hasBrowserGuard = firebaseJsContent.includes('typeof window') || 
                            firebaseJsContent.includes('window !== undefined');
    
    // Expected: Analytics imported, initialized with browser guard
    // Actual on unfixed code: No Analytics import or initialization
    expect(hasAnalyticsImport).toBe(true);
    expect(hasAnalyticsInit).toBe(true);
    expect(hasBrowserGuard).toBe(true);
  });

  test('App.jsx should NOT have its own firebaseConfig object', () => {
    const appJsxPath = join(process.cwd(), 'src', 'App.jsx');
    const appJsxContent = readFileSync(appJsxPath, 'utf-8');
    
    // Check if App.jsx defines its own firebaseConfig
    const hasFirebaseConfig = appJsxContent.includes('const firebaseConfig') || 
                               appJsxContent.includes('const firebaseConfig');
    
    // Expected: No firebaseConfig in App.jsx
    // Actual on unfixed code: firebaseConfig defined in App.jsx
    expect(hasFirebaseConfig).toBe(false);
  });

  test('App.jsx should NOT create its own auth instance', () => {
    const appJsxPath = join(process.cwd(), 'src', 'App.jsx');
    const appJsxContent = readFileSync(appJsxPath, 'utf-8');
    
    // Check if App.jsx creates its own auth instance
    const hasGetAuthCall = appJsxContent.includes('getAuth(');
    
    // Expected: No getAuth call in App.jsx (should import auth from service)
    // Actual on unfixed code: getAuth called in App.jsx
    expect(hasGetAuthCall).toBe(false);
  });

  test('services/firebase.js should export onAuthStateChanged', () => {
    const firebaseJsPath = join(process.cwd(), 'src', 'services', 'firebase.js');
    const firebaseJsContent = readFileSync(firebaseJsPath, 'utf-8');
    
    // Check if onAuthStateChanged is exported (look for it in any export statement)
    const exportsOnAuthStateChanged = /export\s*{[^}]*onAuthStateChanged[^}]*}/.test(firebaseJsContent);
    
    // Expected: onAuthStateChanged is exported from firebase.js
    // Actual on unfixed code: onAuthStateChanged is NOT exported
    expect(exportsOnAuthStateChanged).toBe(true);
  });
});
