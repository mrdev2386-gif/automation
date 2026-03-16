import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'WA Automation - Admin Panel',
    description: 'Admin panel for WA Automation platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className="bg-slate-900 text-slate-100 antialiased">
                {children}
            </body>
        </html>
    );
}
