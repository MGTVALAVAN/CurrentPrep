// Force dashboard to be dynamic (not statically prerendered)
// because it uses useSession() which requires client-side rendering
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
