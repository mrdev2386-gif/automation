/**
 * Shared Types for WA Automation Platform
 */

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'super_admin' | 'client_user';

export interface UserProfile {
    uid: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    assignedAutomations: string[];
    createdAt?: {
        toDate?: () => Date;
        _seconds?: number;
    } | Date;
}

export interface CreateUserData {
    email: string;
    password: string;
    role: UserRole;
    assignedAutomations?: string[];
}

export interface UpdateUserData {
    role?: UserRole;
    isActive?: boolean;
    assignedAutomations?: string[];
}

// ============================================================================
// AUTOMATION TYPES
// ============================================================================

export interface Automation {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt?: {
        toDate?: () => Date;
        _seconds?: number;
    } | Date;
}

export interface CreateAutomationData {
    name: string;
    description?: string;
    isActive?: boolean;
}

export interface UpdateAutomationData {
    name?: string;
    description?: string;
    isActive?: boolean;
}

// ============================================================================
// ACTIVITY LOG TYPES
// ============================================================================

export interface ActivityLog {
    id: string;
    userId: string;
    action: string;
    metadata?: Record<string, unknown>;
    timestamp: {
        toDate?: () => Date;
        _seconds?: number;
    } | Date;
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalAutomations: number;
    activeAutomations: number;
    inactiveAutomations: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface CallableFunctionResult<T = unknown> {
    success: boolean;
    userId?: string;
    message?: string;
    data?: T;
}

// ============================================================================
// FIREBASE CONFIG
// ============================================================================

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
}

// ============================================================================
// UI TYPES
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IconComponent = any;

export interface NavItem {
    label: string;
    href: string;
    icon?: IconComponent;
    roles?: UserRole[];
}

export interface BreadcrumbItem {
    label: string;
    href?: string;
}
