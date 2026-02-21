import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'CurrentPrep',
            credentials: {
                email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                // Demo-mode authentication
                // In production, validate against Supabase/Postgres
                if (credentials?.email && credentials?.password) {
                    return {
                        id: '1',
                        name: 'Demo User',
                        email: credentials.email,
                    };
                }
                return null;
            },
        }),
    ],
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET || 'cse-selfstudy-hub-secret-key-change-in-production',
});

export { handler as GET, handler as POST };
