'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global Error:', error);
    }, [error]);

    return (
        <html lang="en" className="dark">
            <head>
                <title>Error - WA Automation Admin</title>
            </head>
            <body className="bg-slate-900 text-slate-100 antialiased">
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full">
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>

                            <h1 className="text-2xl font-bold text-slate-100 mb-2">
                                Critical Error
                            </h1>

                            <p className="text-slate-400 mb-4">
                                The application encountered a critical error and needs to restart.
                            </p>

                            {error.message && (
                                <div className="mb-6 p-3 bg-slate-700/50 rounded border border-slate-600">
                                    <p className="text-sm text-slate-300 font-mono break-words">
                                        {error.message}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => reset()}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                                >
                                    Home
                                </button>
                            </div>

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
