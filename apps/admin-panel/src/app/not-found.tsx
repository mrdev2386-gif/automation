import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <html lang="en" className="dark">
            <head>
                <title>Page Not Found - WA Automation Admin</title>
            </head>
            <body className="bg-slate-900 text-slate-100 antialiased">
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full">
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                            <div className="text-6xl font-bold text-slate-600 mb-4">404</div>

                            <h1 className="text-2xl font-bold text-slate-100 mb-2">
                                Page Not Found
                            </h1>

                            <p className="text-slate-400 mb-8">
                                The page you're looking for doesn't exist or has been moved.
                            </p>

                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                            >
                                Back to Login
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
