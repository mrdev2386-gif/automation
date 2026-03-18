import admin = require("firebase-admin");
export function initializeFirebase(): typeof admin;
export function getFirestore(): admin.firestore.Firestore;
export function getAuth(): import("firebase-admin/lib/auth").Auth;
export { admin };
//# sourceMappingURL=firebase.d.ts.map