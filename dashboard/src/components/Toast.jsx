import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    AlertCircle,
    Info,
    X
} from 'lucide-react';

// Toast context for global access
const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast types configuration
const toastConfig = {
    success: {
        icon: CheckCircle,
        iconClass: 'text-success-500',
        borderClass: 'border-l-success-500',
    },
    error: {
        icon: XCircle,
        iconClass: 'text-error-500',
        borderClass: 'border-l-error-500',
    },
    warning: {
        icon: AlertTriangle,
        iconClass: 'text-warning-500',
        borderClass: 'border-l-warning-500',
    },
    info: {
        icon: Info,
        iconClass: 'text-info-500',
        borderClass: 'border-l-info-500',
    },
};

// Single Toast component
const Toast = ({
    id,
    type = 'info',
    title,
    message,
    duration = 5000,
    onClose,
    position = 'top-right'
}) => {
    const [isExiting, setIsExiting] = useState(false);
    const config = toastConfig[type] || toastConfig.info;
    const Icon = config.icon;

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(id);
        }, 200);
    };

    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
    };

    return (
        <div
            className={`
                fixed ${positionClasses[position]} z-50 flex items-start gap-3 p-4 
                bg-white dark:bg-slate-900 rounded-xl shadow-soft-lg border border-slate-100 dark:border-slate-800
                max-w-sm w-full animate-fade-in-up
                ${config.borderClass} border-l-4
                ${isExiting ? 'animate-fade-out' : ''}
            `}
            role="alert"
        >
            <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 ${config.iconClass}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                {title && (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                )}
                {message && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{message}</p>
                )}
            </div>
            <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -m-1 rounded-lg transition-colors duration-150"
                aria-label="Close"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// Toast Container
const ToastContainer = ({ toasts, onClose, position }) => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
            <div className={`absolute ${position.includes('right') ? 'right-0' : 'left-0'} ${position.includes('top') ? 'top-0' : 'bottom-0'} flex flex-col gap-2 p-4 ${position.includes('left') ? 'items-start' : 'items-end'}`}>
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            {...toast}
                            onClose={onClose}
                            position={position}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Toast Provider
export const ToastProvider = ({ children, position = 'top-right' }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((toast) => {
        const id = Date.now() + Math.random();
        const newToast = {
            id,
            type: 'info',
            duration: 5000,
            ...toast,
        };
        setToasts((prev) => [...prev, newToast]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const toast = {
        success: (title, message) => addToast({ type: 'success', title, message }),
        error: (title, message) => addToast({ type: 'error', title, message }),
        warning: (title, message) => addToast({ type: 'warning', title, message }),
        info: (title, message) => addToast({ type: 'info', title, message }),
        dismiss: removeToast,
        // Backward compatibility: showToast method
        showToast: (message, type = 'info') => {
            addToast({ type, title: message, message: '' });
        }
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onClose={removeToast} position={position} />
        </ToastContext.Provider>
    );
};

// Loading spinner component
export const Loader = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    return (
        <div className={`${sizeClasses[size]} ${className}`}>
            <div className="w-full h-full border-2 border-slate-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin" />
        </div>
    );
};

// Global loader overlay
export const GlobalLoader = ({ isLoading, message = 'Loading...' }) => {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
            <Loader size="lg" className="mb-4" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{message}</p>
        </div>
    );
};

// Skeleton loaders
export const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
    </div>
);

export const SkeletonCard = ({ className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 ${className}`}>
        <div className="flex items-center gap-4 mb-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        </div>
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-3 w-full" />
    </div>
);

// Empty state component
export const EmptyState = ({
    icon: Icon,
    title,
    description,
    action
}) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        {Icon && (
            <div className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-4">
                <Icon className="w-full h-full" />
            </div>
        )}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
        {description && (
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
        )}
        {action && <div>{action}</div>}
    </div>
);

// Access not enabled empty state
export const AccessNotEnabled = ({ title = 'Access Not Enabled', description = 'You don\'t have permission to view this content. Please contact your administrator.' }) => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-24 h-24 text-slate-200 dark:text-slate-700 mb-6">
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">{description}</p>
    </div>
);

// Confirm dialog component
export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning'
}) => {
    if (!isOpen) return null;

    const iconBgClass = {
        warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
        danger: 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400',
        info: 'bg-info-100 dark:bg-info-900/30 text-info-600 dark:text-info-400',
    };

    const confirmBtnClass = {
        warning: 'bg-warning-600 hover:bg-warning-700 text-white',
        danger: 'bg-error-600 hover:bg-error-700 text-white',
        info: 'bg-info-600 hover:bg-info-700 text-white',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-soft-xl max-w-md w-full p-6 animate-scale-in">
                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${iconBgClass[type]}`}>
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">{message}</p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 h-11 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors duration-150"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 h-11 px-4 font-medium rounded-xl transition-colors duration-150 ${confirmBtnClass[type]}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToastProvider;
