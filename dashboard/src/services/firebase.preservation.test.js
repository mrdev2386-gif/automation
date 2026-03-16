/**
 * Preservation Property Tests for Firebase Auth Setup Fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * Property 2: Preservation - Existing Auth Flow and Functionality
 * 
 * These tests MUST PASS on unfixed code to establish baseline behavior.
 * They verify that the fix does NOT break existing functionality.
 * 
 * Tests that:
 * - Route protection redirects unauthenticated users to /login
 * - Email format and password validation (min 6 chars) work correctly
 * - Firestore operations return data in same format
 * - Auth state management with onAuthStateChanged tracks user login status
 * - Logout functionality clears auth state and redirects to login
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Property 2: Preservation - Existing Auth Flow and Functionality', () => {
  
  /**
   * Requirement 3.1: Route protection redirects unauthenticated users to /login
   */
  test('Route protection logic should redirect unauthenticated users to /login', () => {
    const appJsxPath = join(process.cwd(), 'src', 'App.jsx');
    const appJsxContent = readFileSync(appJsxPath, 'utf-8');
    
    // Check that protected routes have Navigate to /login when user is not authenticated
    const hasProtectedRoutePattern = appJsxContent.includes('element={user ?') && 
                                      appJsxContent.includes(': <Navigate to="/login" />}');
    
    // Check that login route redirects to / when user is authenticated
    const hasLoginRedirectPattern = appJsxContent.includes('element={!user ?') && 
                                     appJsxContent.includes('<Login />') &&
                                     appJsxContent.includes(': <Navigate to="/" />}');
    
    // Verify route protection patterns exist
    expect(hasProtectedRoutePattern).toBe(true);
    expect(hasLoginRedirectPattern).toBe(true);
    
    // Count protected routes (should have multiple)
    const protectedRouteCount = (appJsxContent.match(/element=\{user \?/g) || []).length;
    expect(protectedRouteCount).toBeGreaterThan(0);
  });

  /**
   * Requirement 3.2: Email format and password validation work correctly
   */
  test('Password validation should require minimum 6 characters', () => {
    const loginJsxPath = join(process.cwd(), 'src', 'pages', 'Login.jsx');
    const loginJsxContent = readFileSync(loginJsxPath, 'utf-8');
    
    // Check for password length validation
    const hasPasswordLengthCheck = loginJsxContent.includes('password.length < 6');
    const hasPasswordLengthError = loginJsxContent.includes('Password must be at least 6 characters');
    
    expect(hasPasswordLengthCheck).toBe(true);
    expect(hasPasswordLengthError).toBe(true);
  });

  test('Password confirmation validation should check for matching passwords', () => {
    const loginJsxPath = join(process.cwd(), 'src', 'pages', 'Login.jsx');
    const loginJsxContent = readFileSync(loginJsxPath, 'utf-8');
    
    // Check for password match validation
    const hasPasswordMatchCheck = loginJsxContent.includes('password !== confirmPassword');
    const hasPasswordMatchError = loginJsxContent.includes('Passwords do not match');
    
    expect(hasPasswordMatchCheck).toBe(true);
    expect(hasPasswordMatchError).toBe(true);
  });

  test('Email input should have type="email" for format validation', () => {
    const loginJsxPath = join(process.cwd(), 'src', 'pages', 'Login.jsx');
    const loginJsxContent = readFileSync(loginJsxPath, 'utf-8');
    
    // Check for email input type
    const hasEmailInput = loginJsxContent.includes('type="email"');
    const hasEmailRequired = loginJsxContent.includes('required') && 
                              loginJsxContent.includes('value={email}');
    
    expect(hasEmailInput).toBe(true);
    expect(hasEmailRequired).toBe(true);
  });

  /**
   * Requirement 3.3: Firestore operations work with the same API
   */
  test('Firebase service should export all expected Firestore functions', () => {
    const firebaseJsPath = join(process.cwd(), 'src', 'services', 'firebase.js');
    const firebaseJsContent = readFileSync(firebaseJsPath, 'utf-8');
    
    // Check that all expected functions are exported
    const expectedFunctions = [
      'getRestaurants',
      'getRestaurant',
      'createRestaurant',
      'updateRestaurant',
      'deleteRestaurant',
      'getBookings',
      'getBooking',
      'updateBookingStatus',
      'getMessages',
      'sendMessage',
      'getUsers',
      'signIn',
      'signUp',
      'logOut'
    ];
    
    expectedFunctions.forEach(funcName => {
      const hasExport = firebaseJsContent.includes(`export const ${funcName}`) ||
                        firebaseJsContent.includes(`export { ${funcName}`);
      expect(hasExport).toBe(true);
    });
  });

  /**
   * Requirement 3.4: Firestore queries return data in the same format
   */
  test('Firestore query functions should return data with id field', () => {
    const firebaseJsPath = join(process.cwd(), 'src', 'services', 'firebase.js');
    const firebaseJsContent = readFileSync(firebaseJsPath, 'utf-8');
    
    // Check that query functions map docs to include id
    const hasIdMapping = firebaseJsContent.includes('{ id: doc.id, ...doc.data() }');
    
    // Check that multiple functions use this pattern
    const idMappingCount = (firebaseJsContent.match(/\{ id: doc\.id, \.\.\.doc\.data\(\) \}/g) || []).length;
    
    expect(hasIdMapping).toBe(true);
    expect(idMappingCount).toBeGreaterThan(3); // Multiple functions should use this pattern
  });

  test('Firestore functions should use serverTimestamp for timestamps', () => {
    const firebaseJsPath = join(process.cwd(), 'src', 'services', 'firebase.js');
    const firebaseJsContent = readFileSync(firebaseJsPath, 'utf-8');
    
    // Check that serverTimestamp is imported
    const hasServerTimestampImport = firebaseJsContent.includes('serverTimestamp');
    
    // Check that serverTimestamp is used in create/update operations
    const hasCreatedAt = firebaseJsContent.includes('createdAt: serverTimestamp()');
    const hasUpdatedAt = firebaseJsContent.includes('updatedAt: serverTimestamp()');
    
    expect(hasServerTimestampImport).toBe(true);
    expect(hasCreatedAt).toBe(true);
    expect(hasUpdatedAt).toBe(true);
  });

  test('Firestore query functions should use proper ordering and limits', () => {
    const firebaseJsPath = join(process.cwd(), 'src', 'services', 'firebase.js');
    const firebaseJsContent = readFileSync(firebaseJsPath, 'utf-8');
    
    // Check that orderBy is imported and used
    const hasOrderByImport = firebaseJsContent.includes('orderBy');
    const hasOrderByUsage = firebaseJsContent.includes("orderBy('createdAt'") ||
                             firebaseJsContent.includes("orderBy('timestamp'") ||
                             firebaseJsContent.includes("orderBy('lastSeen'");
    
    // Check that limit is imported and used
    const hasLimitImport = firebaseJsContent.includes('limit');
    const hasLimitUsage = firebaseJsContent.includes('limit(');
    
    expect(hasOrderByImport).toBe(true);
    expect(hasOrderByUsage).toBe(true);
    expect(hasLimitImport).toBe(true);
    expect(hasLimitUsage).toBe(true);
  });

  /**
   * Requirement 3.5: Auth state management with onAuthStateChanged
   */
  test('App.jsx should use onAuthStateChanged to track user login status', () => {
    const appJsxPath = join(process.cwd(), 'src', 'App.jsx');
    const appJsxContent = readFileSync(appJsxPath, 'utf-8');
    
    // Check that onAuthStateChanged is used
    const hasOnAuthStateChanged = appJsxContent.includes('onAuthStateChanged');
    
    // Check that it's used in useEffect
    const hasUseEffect = appJsxContent.includes('useEffect');
    
    // Check that user state is set based on auth state
    const hasSetUser = appJsxContent.includes('setUser(user)');
    
    // Check that loading state is managed
    const hasLoadingState = appJsxContent.includes('setLoading(false)');
    
    expect(hasOnAuthStateChanged).toBe(true);
    expect(hasUseEffect).toBe(true);
    expect(hasSetUser).toBe(true);
    expect(hasLoadingState).toBe(true);
  });

  test('App.jsx should show loading state while checking auth', () => {
    const appJsxPath = join(process.cwd(), 'src', 'App.jsx');
    const appJsxContent = readFileSync(appJsxPath, 'utf-8');
    
    // Check for loading state initialization
    const hasLoadingState = appJsxContent.includes('useState(true)') && 
                             appJsxContent.includes('loading');
    
    // Check for loading UI
    const hasLoadingUI = appJsxContent.includes('if (loading)') &&
                          appJsxContent.includes('Loading...');
    
    expect(hasLoadingState).toBe(true);
    expect(hasLoadingUI).toBe(true);
  });

  test('App.jsx should cleanup onAuthStateChanged subscription', () => {
    const appJsxPath = join(process.cwd(), 'src', 'App.jsx');
    const appJsxContent = readFileSync(appJsxPath, 'utf-8');
    
    // Check that unsubscribe is returned from useEffect
    const hasUnsubscribe = appJsxContent.includes('const unsubscribe = onAuthStateChanged');
    const hasCleanup = appJsxContent.includes('return () => unsubscribe()');
    
    expect(hasUnsubscribe).toBe(true);
    expect(hasCleanup).toBe(true);
  });

  /**
   * Requirement 3.5: Logout functionality clears auth state and redirects
   */
  test('Firebase service should export logOut function', () => {
    const firebaseJsPath = join(process.cwd(), 'src', 'services', 'firebase.js');
    const firebaseJsContent = readFileSync(firebaseJsPath, 'utf-8');
    
    // Check that logOut is exported
    const hasLogOutExport = firebaseJsContent.includes('export const logOut');
    
    // Check that it uses firebaseSignOut
    const hasFirebaseSignOut = firebaseJsContent.includes('firebaseSignOut');
    
    expect(hasLogOutExport).toBe(true);
    expect(hasFirebaseSignOut).toBe(true);
  });

  test('Login page should use signIn and signUp from firebase service', () => {
    const loginJsxPath = join(process.cwd(), 'src', 'pages', 'Login.jsx');
    const loginJsxContent = readFileSync(loginJsxPath, 'utf-8');
    
    // Check that signIn and signUp are imported from firebase service
    const hasFirebaseImport = loginJsxContent.includes("from '../services/firebase'");
    const hasSignInImport = loginJsxContent.includes('signIn');
    const hasSignUpImport = loginJsxContent.includes('signUp');
    
    // Check that they are used in handleSubmit
    const hasSignInUsage = loginJsxContent.includes('await signIn(email, password)');
    const hasSignUpUsage = loginJsxContent.includes('await signUp(email, password)');
    
    expect(hasFirebaseImport).toBe(true);
    expect(hasSignInImport).toBe(true);
    expect(hasSignUpImport).toBe(true);
    expect(hasSignInUsage).toBe(true);
    expect(hasSignUpUsage).toBe(true);
  });

  /**
   * Additional preservation checks for UI components
   */
  test('App.jsx should conditionally render Sidebar and Navbar based on user state', () => {
    const appJsxPath = join(process.cwd(), 'src', 'App.jsx');
    const appJsxContent = readFileSync(appJsxPath, 'utf-8');
    
    // Check that Sidebar and Navbar are conditionally rendered
    const hasSidebarCondition = appJsxContent.includes('{user && <Sidebar') ||
                                 appJsxContent.includes('{user && <Sidebar');
    const hasNavbarCondition = appJsxContent.includes('{user && <Navbar') ||
                                appJsxContent.includes('{user && <Navbar');
    
    expect(hasSidebarCondition).toBe(true);
    expect(hasNavbarCondition).toBe(true);
  });

  test('App.jsx should use QueryClientProvider for React Query', () => {
    const appJsxPath = join(process.cwd(), 'src', 'App.jsx');
    const appJsxContent = readFileSync(appJsxPath, 'utf-8');
    
    // Check for QueryClient and QueryClientProvider
    const hasQueryClientImport = appJsxContent.includes('QueryClient') &&
                                  appJsxContent.includes('QueryClientProvider');
    const hasQueryClientInit = appJsxContent.includes('new QueryClient()');
    const hasQueryClientProvider = appJsxContent.includes('<QueryClientProvider');
    
    expect(hasQueryClientImport).toBe(true);
    expect(hasQueryClientInit).toBe(true);
    expect(hasQueryClientProvider).toBe(true);
  });

  /**
   * Comprehensive preservation check: All imports and exports remain consistent
   */
  test('Firebase service should maintain all Firestore imports', () => {
    const firebaseJsPath = join(process.cwd(), 'src', 'services', 'firebase.js');
    const firebaseJsContent = readFileSync(firebaseJsPath, 'utf-8');
    
    // Check that all necessary Firestore functions are imported
    const expectedImports = [
      'getFirestore',
      'collection',
      'addDoc',
      'getDocs',
      'getDoc',
      'doc',
      'updateDoc',
      'deleteDoc',
      'query',
      'where',
      'orderBy',
      'limit',
      'serverTimestamp'
    ];
    
    expectedImports.forEach(importName => {
      expect(firebaseJsContent.includes(importName)).toBe(true);
    });
  });

  test('Firebase service should maintain all Auth imports', () => {
    const firebaseJsPath = join(process.cwd(), 'src', 'services', 'firebase.js');
    const firebaseJsContent = readFileSync(firebaseJsPath, 'utf-8');
    
    // Check that all necessary Auth functions are imported
    const expectedAuthImports = [
      'getAuth',
      'signInWithEmailAndPassword',
      'signOut',
      'createUserWithEmailAndPassword'
    ];
    
    expectedAuthImports.forEach(importName => {
      expect(firebaseJsContent.includes(importName)).toBe(true);
    });
  });

  test('Firebase service should export db and auth instances', () => {
    const firebaseJsPath = join(process.cwd(), 'src', 'services', 'firebase.js');
    const firebaseJsContent = readFileSync(firebaseJsPath, 'utf-8');
    
    // Check that db and auth are exported
    const hasDbExport = firebaseJsContent.includes('export { db') ||
                         firebaseJsContent.includes('export { auth, db }') ||
                         firebaseJsContent.includes('export { db, auth }');
    
    expect(hasDbExport).toBe(true);
  });
});
