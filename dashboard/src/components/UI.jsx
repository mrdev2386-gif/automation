import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, ChevronDown, Check } from 'lucide-react';

// ==================== CARD COMPONENTS ====================

export const Card = ({
    children,
    className = '',
    hover = false,
    gradient = false,
    padding = 'p-6'
}) => {
    return (
        <div className={`
            bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft
            transition-all duration-200
            ${hover ? 'hover:shadow-soft-lg hover:-translate-y-0.5 cursor-pointer' : ''}
            ${gradient ? 'card-gradient' : ''}
            ${padding}
            ${className}
        `}>
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '' }) => (
    <div className={`px-6 py-4 border-b border-slate-100 dark:border-slate-800 ${className}`}>
        {children}
    </div>
);

export const CardBody = ({ children, className = '' }) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);

export const CardFooter = ({ children, className = '' }) => (
    <div className={`px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl ${className}`}>
        {children}
    </div>
);

// Stat Card Component
export const StatCard = ({
    icon: Icon,
    value,
    label,
    trend = null,
    trendLabel = '',
    className = ''
}) => {
    const isPositive = trend > 0;
    const isNegative = trend < 0;

    return (
        <Card hover className={className}>
            <div className="flex items-start justify-between">
                <div>
                    <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 w-fit mb-4">
                        {Icon && <Icon className="w-6 h-6" />}
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {value}
                    </p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {label}
                    </p>
                </div>
            </div>
            {trend !== null && (
                <div className={`mt-4 text-sm font-medium flex items-center gap-1 ${isPositive ? 'text-success-600 dark:text-success-400' :
                    isNegative ? 'text-error-600 dark:text-error-400' :
                        'text-slate-500'
                    }`}>
                    <span>{isPositive ? '↑' : isNegative ? '↓' : '→'}</span>
                    <span>{Math.abs(trend)}%</span>
                    {trendLabel && <span className="text-slate-400 dark:text-slate-500">{trendLabel}</span>}
                </div>
            )}
        </Card>
    );
};

// ==================== FORM COMPONENTS ====================

export const Input = ({
    label,
    error,
    hint,
    required = false,
    className = '',
    ...props
}) => {
    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className={`label ${required ? 'label-required' : ''}`}>
                    {label}
                </label>
            )}
            <input
                className={`input ${error ? 'input-error' : ''}`}
                {...props}
            />
            {error && <p className="form-error">{error}</p>}
            {hint && !error && <p className="form-hint">{hint}</p>}
        </div>
    );
};

export const Select = ({
    label,
    error,
    hint,
    required = false,
    options = [],
    placeholder = 'Select an option',
    className = '',
    ...props
}) => {
    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className={`label ${required ? 'label-required' : ''}`}>
                    {label}
                </label>
            )}
            <select
                className={`select ${error ? 'input-error' : ''}`}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="form-error">{error}</p>}
            {hint && !error && <p className="form-hint">{hint}</p>}
        </div>
    );
};

export const Textarea = ({
    label,
    error,
    hint,
    required = false,
    className = '',
    ...props
}) => {
    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className={`label ${required ? 'label-required' : ''}`}>
                    {label}
                </label>
            )}
            <textarea
                className={`textarea ${error ? 'input-error' : ''}`}
                {...props}
            />
            {error && <p className="form-error">{error}</p>}
            {hint && !error && <p className="form-hint">{hint}</p>}
        </div>
    );
};

export const PasswordInput = ({
    label,
    error,
    hint,
    required = false,
    className = '',
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className={`label ${required ? 'label-required' : ''}`}>
                    {label}
                </label>
            )}
            <div className="password-wrapper">
                <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input pr-12 ${error ? 'input-error' : ''}`}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>
            {error && <p className="form-error">{error}</p>}
            {hint && !error && <p className="form-hint">{hint}</p>}
        </div>
    );
};

// Checkbox Component
export const Checkbox = ({
    label,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className={`flex items-start gap-3 ${className}`}>
            <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                {...props}
            />
            {label && (
                <label className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    {label}
                </label>
            )}
            {error && <p className="form-error">{error}</p>}
        </div>
    );
};

// Toggle/Switch Component
export const Toggle = ({
    label,
    checked,
    onChange,
    className = ''
}) => {
    return (
        <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only"
                />
                <div className={`
                    w-11 h-6 rounded-full transition-colors duration-200
                    ${checked ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}
                `}>
                    <div className={`
                        absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
                        transition-transform duration-200
                        ${checked ? 'translate-x-5' : 'translate-x-0'}
                    `} />
                </div>
            </div>
            {label && (
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                </span>
            )}
        </label>
    );
};

// Button Components
export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    ...props
}) => {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
        danger: 'btn-danger',
    };

    const sizes = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
    };

    return (
        <button
            className={`
                btn ${variants[variant]} ${sizes[size]}
                ${loading ? 'opacity-70 cursor-wait' : ''}
                ${className}
            `}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {children}
        </button>
    );
};

// ==================== TABLE COMPONENTS ====================

export const Table = ({
    children,
    className = '',
    stickyHeader = false
}) => {
    return (
        <div className="table-container">
            <table className={`table ${stickyHeader ? 'table-sticky-header' : ''} ${className}`}>
                {children}
            </table>
        </div>
    );
};

export const TableHeader = ({ children }) => (
    <thead>{children}</thead>
);

export const TableBody = ({ children }) => (
    <tbody>{children}</tbody>
);

export const TableRow = ({ children, className = '', onClick }) => (
    <tr
        className={`${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
    >
        {children}
    </tr>
);

export const TableHead = ({ children, className = '' }) => (
    <th className={className}>{children}</th>
);

export const TableCell = ({ children, className = '' }) => (
    <td className={className}>{children}</td>
);

// Pagination Component
export const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    className = ''
}) => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div className={`flex items-center justify-between ${className}`}>
            <div className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
            </div>
            <div className="pagination">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                >
                    Previous
                </button>
                {startPage > 1 && (
                    <>
                        <button onClick={() => onPageChange(1)} className="pagination-btn">
                            1
                        </button>
                        {startPage > 2 && <span className="px-2 text-slate-400">...</span>}
                    </>
                )}
                {pages.map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`pagination-btn ${currentPage === page ? 'pagination-btn-active' : ''}`}
                    >
                        {page}
                    </button>
                ))}
                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="px-2 text-slate-400">...</span>}
                        <button onClick={() => onPageChange(totalPages)} className="pagination-btn">
                            {totalPages}
                        </button>
                    </>
                )}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

// ==================== BADGE COMPONENTS ====================

export const Badge = ({
    children,
    variant = 'neutral',
    className = ''
}) => {
    const variants = {
        success: 'badge-success',
        warning: 'badge-warning',
        error: 'badge-error',
        info: 'badge-info',
        neutral: 'badge-neutral',
    };

    return (
        <span className={`${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

// Status Badge with dot
export const StatusBadge = ({
    status,
    label,
    className = ''
}) => {
    const statusConfig = {
        active: { color: 'success', dot: true },
        inactive: { color: 'neutral', dot: true },
        pending: { color: 'warning', dot: true },
        approved: { color: 'success', dot: true },
        rejected: { color: 'error', dot: true },
        cancelled: { color: 'error', dot: true },
        completed: { color: 'success', dot: true },
        in_progress: { color: 'info', dot: true },
    };

    const config = statusConfig[status] || { color: 'neutral', dot: false };

    return (
        <Badge variant={config.color} className={className}>
            {config.dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />}
            {label || status}
        </Badge>
    );
};

// ==================== TABS COMPONENT ====================

export const Tabs = ({
    tabs,
    activeTab,
    onChange,
    className = ''
}) => {
    return (
        <div className={`tabs ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-700">
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

// ==================== EMPTY STATE COMPONENT ====================

export const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
            {Icon && (
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <Icon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                </div>
            )}
            {title && (
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {title}
                </h3>
            )}
            {description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                    {description}
                </p>
            )}
            {action}
        </div>
    );
};

export default {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    StatCard,
    Input,
    Select,
    Textarea,
    PasswordInput,
    Checkbox,
    Toggle,
    Button,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    Pagination,
    Badge,
    StatusBadge,
    Tabs,
    EmptyState,
};
