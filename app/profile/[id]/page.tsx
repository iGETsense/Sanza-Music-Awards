import { Metadata } from 'next';
import { headers } from 'next/headers';
import ProfileClient from './ProfileClient';
import { adminDb } from '@/lib/firebaseAdmin';

interface Props {
    params: { id: string };
}

async function getNominee(id: string) {
    if (!adminDb) return null;
    try {
        const snapshot = await adminDb.ref(`nominees/${id}`).once('value');
        if (snapshot.exists()) {
            return { id, ...snapshot.val() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching nominee for metadata:', error);
        return null;
    }
}

async function getCategory(categoryId: string) {
    if (!adminDb || !categoryId) return null;
    try {
        const snapshot = await adminDb.ref(`categories/${categoryId}`).once('value');
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        return null;
    }
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
    try {
        const headersList = await headers();
        const host = headersList.get('host') || 'sanza-music-awards.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';

        // Standardize siteUrl to avoid issues with different vercel domains
        const siteUrl = `${protocol}://${host}`;

        const resolvedParams = await params;
        const id = resolvedParams.id;
        const nominee = await getNominee(id);

        if (!nominee) {
            return {
                title: 'Sanza Music Awards',
                description: 'La plus grande cérémonie de récompense musicale.'
            };
        }

        const category = await getCategory(nominee.category_id || nominee.categoryId);
        const categoryName = category?.title || 'Artiste';
        const artistName = nominee.name;
        const voteCount = nominee.votes || 0;
        const artistBio = nominee.description || nominee.bio || '';

        // Resolve candidate image - Absolute URL is REQUIRED for OG tags
        let imageUrl = nominee.image || nominee.image_url;
        if (imageUrl && imageUrl.startsWith('/')) {
            imageUrl = `${siteUrl}${imageUrl}`;
        } else if (!imageUrl || imageUrl.includes('cat-artist.png')) {
            // Use a specific high-quality og-image if no custom photo
            imageUrl = `${siteUrl}/og-image.jpg`;
        }

        const title = `VOTE POUR ${artistName.toUpperCase()} - Sanza Music Awards`;
        const baseDescription = `Soutenez ${artistName} (${categoryName}). ${voteCount} votes !`;
        const description = artistBio
            ? `${baseDescription} ${artistBio.substring(0, 150)}...`
            : `${baseDescription} Ensemble pour la culture.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [
                    {
                        url: imageUrl,
                        width: 1200,
                        height: 630,
                        alt: `Voter pour ${artistName}`,
                        type: imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg',
                    },
                ],
                type: 'website',
                siteName: 'Sanza Music Awards',
                url: `${siteUrl}/profile/${id}`,
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [imageUrl],
            },
        };
    } catch (error) {
        console.error('[Metadata] Error generating metadata:', error);
        return {
            title: 'Sanza Music Awards',
            description: 'La plus grande cérémonie de récompense musicale.'
        };
    }
}

export default async function ProfilePage({ params }: any) {
    const { id } = await params;
    const nominee = await getNominee(id);

    return <ProfileClient initialNominee={nominee} />;
}
