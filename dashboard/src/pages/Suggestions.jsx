import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Loader2,
    AlertCircle,
    Check,
    Save,
    X,
    MessageCircle,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { Card, Input, Button, Badge } from '../components/UI';
import { getSuggestions, createSuggestion, updateSuggestion, deleteSuggestion } from '../services/firebase';

const TRIGGER_OPTIONS = [
    { value: 'greeting', label: 'Greeting' },
    { value: 'menu', label: 'Menu Request' },
    { value: 'booking', label: 'Booking Request' },
    { value: 'timing', label: 'Timing Query' },
    { value: 'location', label: 'Location Query' },
    { value: 'general', label: 'General' },
    { value: 'fallback', label: 'Fallback' }
];

/**
 * Assistant Suggestions Manager Page
 * Manage quick reply suggestions for different intents
 */
const Suggestions = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        triggerIntent: 'general',
        suggestions: ['', '', ''],
        isActive: true
    });
    const [saving, setSaving] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);

    useEffect(() => {
        fetchSuggestions();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            setFilteredSuggestions(
                suggestions.filter(
                    s => s.triggerIntent.toLowerCase().includes(query)
                )
            );
        } else {
            setFilteredSuggestions(suggestions);
        }
    }, [searchQuery, suggestions]);

    const fetchSuggestions = async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await getSuggestions();
            setSuggestions(result.suggestions || []);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
            setError(err.message || 'Failed to load suggestions');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Filter out empty suggestions
        const validSuggestions = formData.suggestions.filter(s => s.trim());
        if (validSuggestions.length === 0) {
            setError('At least one suggestion is required');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            if (editingId) {
                await updateSuggestion(editingId, {
                    triggerIntent: formData.triggerIntent,
                    suggestions: validSuggestions,
                    isActive: formData.isActive
                });
                setSuccess('Suggestion group updated successfully!');
            } else {
                await createSuggestion(formData.triggerIntent, validSuggestions, formData.isActive);
                setSuccess('Suggestion group created successfully!');
            }

            setFormData({
                triggerIntent: 'general',
                suggestions: ['', '', ''],
                isActive: true
            });
            setShowForm(false);
            setEditingId(null);

            await fetchSuggestions();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error saving suggestion:', err);
            setError(err.message || 'Failed to save suggestion');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (suggestion) => {
        setFormData({
            triggerIntent: suggestion.triggerIntent,
            suggestions: [...suggestion.suggestions, '', '', ''].slice(0, 3),
            isActive: suggestion.isActive
        });
        setEditingId(suggestion.id);
        setShowForm(true);
    };

    const handleToggleActive = async (suggestion) => {
        try {
            await updateSuggestion(suggestion.id, { isActive: !suggestion.isActive });
            setSuccess(`Suggestion ${suggestion.isActive ? 'deactivated' : 'activated'} successfully!`);
            await fetchSuggestions();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error toggling suggestion:', err);
            setError(err.message || 'Failed to update suggestion');
        }
    };

    const handleDelete = async (suggestionId) => {
        if (!confirm('Are you sure you want to delete this suggestion group?')) return;

        try {
            await deleteSuggestion(suggestionId);
            setSuccess('Suggestion deleted successfully!');
            await fetchSuggestions();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error deleting suggestion:', err);
            setError(err.message || 'Failed to delete suggestion');
        }
    };

    const cancelEdit = () => {
        setFormData({
            triggerIntent: 'general',
            suggestions: ['', '', ''],
            isActive: true
        });
        setShowForm(false);
        setEditingId(null);
    };

    const updateSuggestionText = (index, value) => {
        const newSuggestions = [...formData.suggestions];
        newSuggestions[index] = value;
        setFormData(prev => ({ ...prev, suggestions: newSuggestions }));
    };

    const getTriggerLabel = (value) => {
        const option = TRIGGER_OPTIONS.find(o => o.value === value);
        return option ? option.label : value;
    };

    if (loading) {
        return (
            <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-8">
                    <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <Card className="animate-pulse">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                </Card>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Quick Reply Suggestions
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Manage clickable quick replies shown after assistant responses
                    </p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Suggestions
                </Button>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="mb-6 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto text-sm underline">
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {success && (
                <div className="mb-6 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 flex-shrink-0" />
                        <p>{success}</p>
                    </div>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {editingId ? 'Edit Suggestions' : 'Add New Suggestion Group'}
                        </h3>
                        <button
                            onClick={cancelEdit}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Trigger Intent
                            </label>
                            <select
                                value={formData.triggerIntent}
                                onChange={(e) => setFormData(prev => ({ ...prev, triggerIntent: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                            >
                                {TRIGGER_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-500">
                                Suggestions will appear after this intent is detected
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Quick Replies (max 3)
                            </label>
                            {formData.suggestions.map((suggestion, index) => (
                                <div key={index} className="mb-2">
                                    <Input
                                        type="text"
                                        value={suggestion}
                                        onChange={(e) => updateSuggestionText(index, e.target.value)}
                                        placeholder={`Quick reply ${index + 1} (e.g., "Cost kya hai?")`}
                                        maxLength={50}
                                    />
                                </div>
                            ))}
                            <p className="mt-1 text-xs text-slate-500">
                                These buttons will appear below the assistant's response
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    Active
                                </span>
                            </label>

                            <div className="flex gap-3">
                                <Button type="button" variant="secondary" onClick={cancelEdit}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving} className="flex items-center gap-2">
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {editingId ? 'Update' : 'Create'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>
            )}

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by intent..."
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                    />
                </div>
            </div>

            {/* Suggestions List */}
            {filteredSuggestions.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                            <MessageCircle className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            {searchQuery ? 'No suggestions found' : 'No suggestions yet'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Create your first suggestion group to show quick replies'}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Suggestions
                            </Button>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredSuggestions.map((suggestion) => (
                        <Card key={suggestion.id} className={!suggestion.isActive ? 'opacity-60' : ''}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">
                                            {getTriggerLabel(suggestion.triggerIntent)}
                                        </h4>
                                        <Badge variant={suggestion.isActive ? 'success' : 'neutral'}>
                                            {suggestion.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestion.suggestions?.map((s, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-full"
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleToggleActive(suggestion)}
                                        className="p-2 text-slate-400 hover:text-primary-500 transition-colors"
                                        title={suggestion.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {suggestion.isActive ? (
                                            <ToggleRight className="w-5 h-5 text-success-500" />
                                        ) : (
                                            <ToggleLeft className="w-5 h-5" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleEdit(suggestion)}
                                        className="p-2 text-slate-400 hover:text-primary-500 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={() => handleDelete(suggestion.id)}
                                        className="p-2 text-slate-400 hover:text-error-500 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Stats */}
            {suggestions.length > 0 && (
                <div className="mt-6 flex items-center gap-6 text-sm text-slate-500">
                    <span>Total: {suggestions.length}</span>
                    <span>Active: {suggestions.filter(s => s.isActive).length}</span>
                </div>
            )}
        </div>
    );
};

export default Suggestions;
