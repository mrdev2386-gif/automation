'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('App Error:', error);
    }, [error]);

    return (
        <html lang="en" className="dark">
            <body className="bg-slate-900 text-slate-100 antialiased">
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full">
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>

                            <h1 className="text-2xl font-bold text-slate-100 mb-2">
                                Something went wrong!
                            </h1>

                            <p className="text-slate-400 mb-4">
                                An error occurred while processing your request.
                            </p>

                            {error.message && (
                                <div className="mb-6 p-3 bg-slate-700/50 rounded border border-slate-600">
                                    <p className="text-sm text-slate-300 font-mono">
                                        {error.message}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={() => reset()}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try again
                            </button>

                            <p className="text-xs text-slate-500 mt-4">
                                Error ID: {error.digest || 'unknown'}
                            </p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
