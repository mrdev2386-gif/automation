/**
 * getSuggestions - Get all suggestion groups for the authenticated client
 */
export const getSuggestions: functions.HttpsFunction & functions.Runnable<any>;
/**
 * createSuggestion - Create a new suggestion group
 */
export const createSuggestion: functions.HttpsFunction & functions.Runnable<any>;
/**
 * updateSuggestion - Update an existing suggestion group
 */
export const updateSuggestion: functions.HttpsFunction & functions.Runnable<any>;
/**
 * deleteSuggestion - Delete a suggestion group
 */
export const deleteSuggestion: functions.HttpsFunction & functions.Runnable<any>;
import functions = require("firebase-functions");
//# sourceMappingURL=suggestions.d.ts.map