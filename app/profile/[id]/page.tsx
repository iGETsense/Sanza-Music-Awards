import { Metadata } from 'next';
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
        const resolvedParams = await params;
        const id = resolvedParams.id;
        const nominee = await getNominee(id);

        if (!nominee) {
            console.log(`[Metadata] Nominee not found for id: ${id}`);
            return {
                title: 'Sanza Music Awards',
                description: 'La plus grande cérémonie de récompense musicale.'
            };
        }

        const category = await getCategory(nominee.category_id || nominee.categoryId);
        const categoryName = category?.title || 'Artiste';
        const artistName = nominee.name;
        const voteCount = nominee.votes || 0;

        let imageUrl = nominee.image || nominee.image_url;
        // Make sure image URL is absolute
        if (imageUrl && imageUrl.startsWith('/')) {
            imageUrl = `https://sanza-music-awards.vercel.app${imageUrl}`;
        } else if (!imageUrl) {
            imageUrl = 'https://sanza-music-awards.vercel.app/og-image.png'; // Fallback
        }

        const title = `VOTE POUR ${artistName.toUpperCase()} - Sanza Music Awards`;
        const description = `Soutenez ${artistName} nommé dans la catégorie "${categoryName}". Actuellement ${voteCount} votes ! Ensemble pour la culture.`;

        console.log(`[Metadata] Generated for ${artistName}`);

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
                    },
                ],
                type: 'website',
                siteName: 'Sanza Music Awards',
                url: `https://sanza-music-awards.vercel.app/profile/${id}`,
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
