'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // Check if user is admin
        if (typeof window !== 'undefined') {
            const adminUser = localStorage.getItem('admin_user');
            if (adminUser) {
                const parsed = JSON.parse(adminUser);
                if (parsed.role === 'super_admin') {
                    router.push('/admin');
                    return;
                }
            }
        }
        // Redirect to login
        router.push('/login');
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading...</p>
            </div>
        </div>
    );
}
