/**
 * Toast Utility - Global toast notification helper
 * Provides a simple interface for showing toast messages
 */

export const showToast = (message, type = 'success') => {
    // Log to console for debugging
    console.log(`[${type.toUpperCase()}]: ${message}`);
    
    // You can enhance this to use a toast library like react-hot-toast
    // For now, it provides console logging and can be extended
    
    // Optional: Dispatch custom event for toast component to listen
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message, type }
        }));
    }
};

export default showToast;
