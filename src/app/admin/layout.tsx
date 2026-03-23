/**
 * Admin Layout
 * 
 * Server component that wraps all /admin pages with:
 *   - force-dynamic (requires auth, no static prerender)
 *   - Sidebar navigation
 *   - Admin-specific styling
 */

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Admin Console — CurrentPrep',
    robots: 'noindex, nofollow',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
