import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createClient, updateClient, getClient, checkWhatsappNumberId } from '../services/firebase';

/**
 * PHASE 8: Updated with all 14 categories
 * 
 * E.164 phone format validation
 * E.164 format: +[country code][subscriber number]
 * Example: +14155552671
 */
const isValidE164 = (phoneNumber) => {
    // E.164 regex: starts with +, followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
};

/**
 * Format phone number to E.164 if possible
 * Strips common formatting characters
 */
const formatToE164 = (phoneNumber) => {
    // Remove spaces, dashes, parentheses, and plus signs (we'll add the plus)
    const cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
    return cleaned;
};

/**
 * Industry Types for Multi-Industry SaaS Platform
 */
const INDUSTRY_TYPES = [
    { value: 'saas', label: 'SaaS Business' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'service', label: 'Other Service' },
];

const AddRestaurant = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [initialFetchLoading, setInitialFetchLoading] = useState(isEdit);
    const [notification, setNotification] = useState(null);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        whatsappNumber: '',
        whatsappNumberId: '',
        whatsappToken: '',
        whatsappBusinessAccountId: '',
        botEnabled: true,
        address: '',
        timing: '',
        menuUrl: '',
        mapUrl: '',
        industryType: 'saas', // Default to SaaS
        category: 'saas', // Keep for backward compatibility
        bookingType: 'table',
        // SaaS-specific fields
        productName: '',
        targetAudience: '',
        description: '',
        pricingModel: '',
        supportEmail: '',
    });

    // Fetch data for edit mode
    useEffect(() => {
        if (isEdit) {
            const fetchClient = async () => {
                try {
                    const client = await getClient(id);
                    if (client) {
                        setFormData({
                            name: client.name || '',
                            whatsappNumber: client.whatsappNumber || '',
                            whatsappNumberId: client.whatsappNumberId || '',
                            whatsappToken: client.whatsappToken || '',
                            whatsappBusinessAccountId: client.whatsappBusinessAccountId || '',
                            botEnabled: client.botEnabled !== undefined ? client.botEnabled : true,
                            address: client.address || '',
                            timing: client.timing || '',
                            menuUrl: client.menuUrl || '',
                            mapUrl: client.mapUrl || '',
                            industryType: client.industryType || 'saas',
                            category: client.category || client.industryType || 'saas',
                            bookingType: client.bookingType || 'table',
                            productName: client.productName || '',
                            targetAudience: client.targetAudience || '',
                            description: client.description || '',
                            pricingModel: client.pricingModel || '',
                            supportEmail: client.supportEmail || '',
                        });
                    } else {
                        showNotification('error', 'Client not found');
                        navigate('/clients');
                    }
                } catch (err) {
                    console.error('Error fetching client:', err);
                    showNotification('error', 'Failed to load client details');
                } finally {
                    setInitialFetchLoading(false);
                }
            };
            fetchClient();
        }
    }, [id, isEdit]);

    /**
     * PHASE 8: Enhanced validation with duplicate checking
     * @returns {boolean} - true if valid, false otherwise
     */
    const validateForm = async () => {
        const newErrors = {};

        // Restaurant Name - required
        if (!formData.name.trim()) {
            newErrors.name = 'Business name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Business name must be at least 2 characters';
        }

        // WhatsApp Number - required and E.164 format
        if (!formData.whatsappNumber.trim()) {
            newErrors.whatsappNumber = 'WhatsApp number is required';
        } else {
            const formattedNumber = formatToE164(formData.whatsappNumber);
            if (!isValidE164(formattedNumber)) {
                newErrors.whatsappNumber = 'Please enter a valid E.164 format number (e.g., +14155552671)';
            }
        }

        // WhatsApp Number ID - required
        if (!formData.whatsappNumberId.trim()) {
            newErrors.whatsappNumberId = 'WhatsApp Number ID is required';
        } else if (!isEdit) {
            // PHASE 8: Check for duplicate whatsappNumberId (only on create)
            try {
                const isDuplicate = await checkWhatsappNumberId(formData.whatsappNumberId.trim());
                if (isDuplicate) {
                    newErrors.whatsappNumberId = 'This WhatsApp Number ID is already in use by another business';
                }
            } catch (error) {
                console.error('Error checking duplicate:', error);
            }
        }

        // WhatsApp Access Token - required
        if (!formData.whatsappToken.trim()) {
            newErrors.whatsappToken = 'WhatsApp Access Token is required';
        }

        // Menu URL - optional but must be valid if provided
        if (formData.menuUrl.trim()) {
            try {
                new URL(formData.menuUrl);
            } catch {
                newErrors.menuUrl = 'Please enter a valid URL';
            }
        }

        // Map URL - optional but must be valid if provided
        if (formData.mapUrl.trim()) {
            try {
                new URL(formData.mapUrl);
            } catch {
                newErrors.mapUrl = 'Please enter a valid URL';
            }
        }

        // Industry Type - required
        if (!formData.industryType) {
            newErrors.industryType = 'Business category is required';
        }

        // Validate industry type is supported
        const supportedIndustryTypes = INDUSTRY_TYPES.map(c => c.value);
        if (!supportedIndustryTypes.includes(formData.industryType)) {
            newErrors.industryType = 'Please select a valid business category';
        }

        // SaaS-specific validation
        if (formData.industryType === 'saas') {
            if (!formData.productName.trim()) {
                newErrors.productName = 'Product/Service name is required for SaaS businesses';
            }
            if (!formData.targetAudience) {
                newErrors.targetAudience = 'Target audience is required for SaaS businesses';
            }
            if (!formData.description.trim()) {
                newErrors.description = 'Description is required for SaaS businesses';
            } else if (formData.description.trim().length < 20) {
                newErrors.description = 'Description must be at least 20 characters';
            }
            if (formData.supportEmail.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.supportEmail)) {
                    newErrors.supportEmail = 'Please enter a valid email address';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Update industryType and category together
        if (name === 'industryType') {
            setFormData(prev => {
                const newData = {
                    ...prev,
                    industryType: value,
                    category: value // Keep category in sync for backward compatibility
                };
                // Clear SaaS fields when switching away from SaaS
                if (value !== 'saas') {
                    newData.productName = '';
                    newData.targetAudience = '';
                    newData.description = '';
                    newData.pricingModel = '';
                    newData.supportEmail = '';
                }
                return newData;
            });
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const showNotification = (type, message) => {
        setNotification({ type, message });
        // Auto-dismiss after 5 seconds
        setTimeout(() => setNotification(null), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form before submission
        const isValid = await validateForm();
        if (!isValid) {
            showNotification('error', 'Please fix the validation errors');
            return;
        }

        setLoading(true);

        try {
            // Format phone number to E.164 before saving
            const formattedData = {
                name: formData.name,
                whatsappNumber: formatToE164(formData.whatsappNumber),
                whatsappNumberId: formData.whatsappNumberId,
                whatsappToken: formData.whatsappToken,
                whatsappBusinessAccountId: formData.whatsappBusinessAccountId || null,
                botEnabled: formData.botEnabled,
                industryType: formData.industryType,
                category: formData.industryType, // Sync for legacy
                address: formData.address || null,
                timing: formData.timing || null,
                menuUrl: formData.menuUrl || null,
                mapUrl: formData.mapUrl || null,
                status: 'active',
                plan: 'starter',
                createdAt: new Date(),
            };

            // Add SaaS-specific fields if category is SaaS
            if (formData.industryType === 'saas') {
                formattedData.productName = formData.productName;
                formattedData.targetAudience = formData.targetAudience;
                formattedData.description = formData.description;
                formattedData.pricingModel = formData.pricingModel || null;
                formattedData.supportEmail = formData.supportEmail || null;
            }

            if (isEdit) {
                await updateClient(id, formattedData);
                showNotification('success', 'Business updated successfully!');
            } else {
                formattedData.createdAt = new Date(); // Add createdAt only for new clients
                await createClient(formattedData);
                showNotification('success', 'Business created successfully!');
                // Reset form after successful submission only on create
                setFormData({
                    name: '',
                    whatsappNumber: '',
                    whatsappNumberId: '',
                    whatsappToken: '',
                    whatsappBusinessAccountId: '',
                    botEnabled: true,
                    address: '',
                    timing: '',
                    menuUrl: '',
                    mapUrl: '',
                    industryType: 'saas',
                    category: 'saas',
                    bookingType: 'table',
                    productName: '',
                    targetAudience: '',
                    description: '',
                    pricingModel: '',
                    supportEmail: '',
                });
            }

            // Navigate back after short delay
            setTimeout(() => navigate('/clients'), 1500);

        } catch (err) {
            console.error('Error saving business:', err);
            showNotification('error', `Failed to ${isEdit ? 'update' : 'create'} business. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    if (initialFetchLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium text-lg">Loading client details...</p>
            </div>
        );
    }

    /**
     * Render notification banner
     */
    const renderNotification = () => {
        if (!notification) return null;

        const isSuccess = notification.type === 'success';

        return (
            <div
                className={`flex items-center gap-3 p-4 rounded-xl mb-6 border ${isSuccess
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                    }`}
            >
                {isSuccess ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm font-semibold">{notification.message}</span>
            </div>
        );
    };

    /**
     * Render input error message
     */
    const renderError = (fieldName) => {
        if (!errors[fieldName]) return null;

        return (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors[fieldName]}
            </p>
        );
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <button
                onClick={() => navigate('/clients')}
                className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 font-medium"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Businesses
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
                        {isEdit ? 'Edit Business' : 'Connect Your Business'}
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
                        {isEdit
                            ? 'Update your business details and WhatsApp Cloud API credentials.'
                            : 'Set up your business profile and connect your WhatsApp Cloud API to automate your workflow.'}
                    </p>
                </div>
            </div>

            {renderNotification()}

            <div className="card-modern p-6 sm:p-8 max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {/* Business Name */}
                    <div>
                        <label htmlFor="name" className="label-modern">
                            Business Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`input-modern w-full ${errors.name ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500' : ''}`}
                            placeholder="e.g., Acme SaaS Inc."
                            aria-invalid={errors.name ? 'true' : 'false'}
                            aria-describedby={errors.name ? 'name-error' : undefined}
                        />
                        {renderError('name')}
                    </div>

                    {/* Business Category (Industry Type) */}
                    <div>
                        <label htmlFor="industryType" className="label-modern">
                            Business Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="industryType"
                            name="industryType"
                            value={formData.industryType}
                            onChange={handleChange}
                            className={`select-modern w-full ${errors.industryType ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500' : ''}`}
                            aria-invalid={errors.industryType ? 'true' : 'false'}
                            aria-describedby={errors.industryType ? 'industryType-error' : undefined}
                        >
                            {INDUSTRY_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        {renderError('industryType')}
                    </div>

                    {/* WhatsApp Number and Number ID */}
                    <div className="mobile-stack">
                        <div className="flex-1">
                            <label htmlFor="whatsappNumber" className="label-modern">
                                WhatsApp Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="whatsappNumber"
                                type="text"
                                name="whatsappNumber"
                                value={formData.whatsappNumber}
                                onChange={handleChange}
                                className={`input-modern w-full ${errors.whatsappNumber ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500' : ''}`}
                                placeholder="+14155552671"
                                aria-invalid={errors.whatsappNumber ? 'true' : 'false'}
                                aria-describedby={errors.whatsappNumber ? 'whatsappNumber-error' : 'whatsappNumber-hint'}
                            />
                            <p id="whatsappNumber-hint" className="mt-1.5 text-xs text-slate-500">
                                E.164 format with country code (e.g., +1 for US)
                            </p>
                            {renderError('whatsappNumber')}
                        </div>
                        <div className="flex-1">
                            <label htmlFor="whatsappNumberId" className="label-modern">
                                WhatsApp Number ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="whatsappNumberId"
                                type="text"
                                name="whatsappNumberId"
                                value={formData.whatsappNumberId}
                                onChange={handleChange}
                                className={`input-modern w-full ${errors.whatsappNumberId ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500' : ''}`}
                                placeholder="From Meta Developer Portal"
                                aria-invalid={errors.whatsappNumberId ? 'true' : 'false'}
                                aria-describedby={errors.whatsappNumberId ? 'whatsappNumberId-error' : undefined}
                            />
                            {renderError('whatsappNumberId')}
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label htmlFor="address" className="label-modern">
                            Address
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={3}
                            className="textarea-modern w-full"
                            placeholder="Full address of the business"
                        />
                    </div>

                    {/* SaaS-Specific Fields */}
                    {formData.industryType === 'saas' && (
                        <div className="pt-6 border-t border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900 mb-6">SaaS Business Details</h3>

                            {/* Product/Service Name */}
                            <div className="mb-6">
                                <label htmlFor="productName" className="label-modern">
                                    Product / Service Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="productName"
                                    type="text"
                                    name="productName"
                                    value={formData.productName}
                                    onChange={handleChange}
                                    className={`input-modern w-full ${errors.productName ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500' : ''}`}
                                    placeholder="e.g., CRM Software"
                                    aria-invalid={errors.productName ? 'true' : 'false'}
                                />
                                {renderError('productName')}
                            </div>

                            {/* Target Audience */}
                            <div className="mb-6">
                                <label htmlFor="targetAudience" className="label-modern">
                                    Target Audience <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="targetAudience"
                                    name="targetAudience"
                                    value={formData.targetAudience}
                                    onChange={handleChange}
                                    className={`select-modern w-full ${errors.targetAudience ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500' : ''}`}
                                    aria-invalid={errors.targetAudience ? 'true' : 'false'}
                                >
                                    <option value="">Select target audience</option>
                                    <option value="B2B">B2B</option>
                                    <option value="B2C">B2C</option>
                                    <option value="Both">Both</option>
                                </select>
                                {renderError('targetAudience')}
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <label htmlFor="description" className="label-modern">
                                    Short Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className={`textarea-modern w-full ${errors.description ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500' : ''}`}
                                    placeholder="Briefly describe what your product does"
                                    style={{ minHeight: '100px' }}
                                    aria-invalid={errors.description ? 'true' : 'false'}
                                />
                                <p className="mt-1.5 text-xs text-slate-500">Briefly describe what your product does</p>
                                {renderError('description')}
                            </div>

                            {/* Pricing Model and Support Email */}
                            <div className="mobile-stack">
                                <div className="flex-1">
                                    <label htmlFor="pricingModel" className="label-modern">
                                        Pricing Model
                                    </label>
                                    <select
                                        id="pricingModel"
                                        name="pricingModel"
                                        value={formData.pricingModel}
                                        onChange={handleChange}
                                        className="select-modern w-full"
                                    >
                                        <option value="">Select pricing model</option>
                                        <option value="Subscription">Subscription</option>
                                        <option value="One-time">One-time</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="supportEmail" className="label-modern">
                                        Support Email
                                    </label>
                                    <input
                                        id="supportEmail"
                                        type="email"
                                        name="supportEmail"
                                        value={formData.supportEmail}
                                        onChange={handleChange}
                                        className={`input-modern w-full ${errors.supportEmail ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500' : ''}`}
                                        placeholder="support@example.com"
                                        aria-invalid={errors.supportEmail ? 'true' : 'false'}
                                    />
                                    {renderError('supportEmail')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Opening Hours */}
                    <div>
                        <label htmlFor="timing" className="label-modern">
                            Opening Hours
                        </label>
                        <input
                            id="timing"
                            type="text"
                            name="timing"
                            value={formData.timing}
                            onChange={handleChange}
                            className="input-modern w-full"
                            placeholder="Mon-Sun: 9AM - 10PM"
                        />
                    </div>

                    {/* Menu URL and Map URL */}
                    <div className="mobile-stack">
                        <div className="flex-1">
                            <label htmlFor="menuUrl" className="label-modern">
                                Menu/Info URL
                            </label>
                            <input
                                id="menuUrl"
                                type="url"
                                name="menuUrl"
                                value={formData.menuUrl}
                                onChange={handleChange}
                                className={`input-modern w-full ${errors.menuUrl ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500' : ''}`}
                                placeholder="https://..."
                                aria-invalid={errors.menuUrl ? 'true' : 'false'}
                                aria-describedby={errors.menuUrl ? 'menuUrl-error' : undefined}
                            />
                            {renderError('menuUrl')}
                        </div>
                        <div className="flex-1">
                            <label htmlFor="mapUrl" className="label-modern">
                                Map URL
                            </label>
                            <input
                                id="mapUrl"
                                type="url"
                                name="mapUrl"
                                value={formData.mapUrl}
                                onChange={handleChange}
                                className={`input-modern w-full ${errors.mapUrl ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500' : ''}`}
                                placeholder="https://maps.google.com/..."
                                aria-invalid={errors.mapUrl ? 'true' : 'false'}
                                aria-describedby={errors.mapUrl ? 'mapUrl-error' : undefined}
                            />
                            {renderError('mapUrl')}
                        </div>
                    </div>

                    {/* WhatsApp Configuration Section */}
                    <div className="pt-6 border-t border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">WhatsApp API Credentials</h3>

                        <div className="mobile-stack">
                            {/* WhatsApp Number ID */}
                            <div className="flex-1">
                                <label htmlFor="whatsappNumberId" className="label-modern">
                                    WhatsApp Number ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="whatsappNumberId"
                                    type="text"
                                    name="whatsappNumberId"
                                    value={formData.whatsappNumberId}
                                    onChange={handleChange}
                                    className={`input-modern w-full ${errors.whatsappNumberId ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500' : ''}`}
                                    placeholder="e.g., 106555123456789"
                                    aria-invalid={errors.whatsappNumberId ? 'true' : 'false'}
                                />
                                {renderError('whatsappNumberId')}
                            </div>

                            {/* WhatsApp Business Account ID */}
                            <div className="flex-1">
                                <label htmlFor="whatsappBusinessAccountId" className="label-modern">
                                    WhatsApp Business Account ID
                                </label>
                                <input
                                    id="whatsappBusinessAccountId"
                                    type="text"
                                    name="whatsappBusinessAccountId"
                                    value={formData.whatsappBusinessAccountId || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        {/* WhatsApp Access Token */}
                        <div className="mt-6">
                            <label htmlFor="whatsappToken" className="label-modern">
                                WhatsApp Access Token <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="whatsappToken"
                                type="password"
                                name="whatsappToken"
                                value={formData.whatsappToken || ''}
                                onChange={handleChange}
                                className={`input-modern w-full ${errors.whatsappToken ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500' : ''}`}
                                placeholder="EAA..."
                                aria-invalid={errors.whatsappToken ? 'true' : 'false'}
                            />
                            <p className="mt-1.5 text-xs text-slate-500">
                                Permanent access token from Meta Developer Portal. Masked for security.
                            </p>
                            {renderError('whatsappToken')}
                        </div>

                        {/* Bot Enabled Toggle */}
                        <div className="mt-6 flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <h4 className="font-semibold text-slate-900">Bot Enabled</h4>
                                <p className="text-sm text-slate-500">Automatically reply to incoming messages</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="botEnabled"
                                    checked={formData.botEnabled}
                                    onChange={(e) => setFormData(prev => ({ ...prev, botEnabled: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4 mt-8 pt-8 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => navigate('/clients')}
                            className="px-8 py-3.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            )}
                            {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Business' : 'Connect Business')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRestaurant;
