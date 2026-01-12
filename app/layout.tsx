import './globals.css';
import { Providers } from './providers';
import Layout from '@/components/layout/Layout';
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
});

export const metadata = {
    title: 'African Singing Awards',
    description: 'Premium voting platform',
    appleWebApp: {
        title: 'Sanza Music Awards',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" className={`dark ${inter.variable} ${playfair.variable}`}>
            <body className="font-sans">
                <Providers>
                    <Layout>{children}</Layout>
                </Providers>
            </body>
        </html>
    );
}
