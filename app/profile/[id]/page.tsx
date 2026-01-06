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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const nominee = await getNominee(params.id);

    if (!nominee) {
        return {
            title: 'Nominee Not Found - Sanza Music Awards',
        };
    }

    const category = await getCategory(nominee.category_id || nominee.categoryId);
    const categoryName = category?.title || 'Artist';
    const artistName = nominee.name;
    const voteCount = nominee.votes || 0;
    const imageUrl = nominee.image || nominee.image_url;

    const title = `VOTE FOR ${artistName.toUpperCase()} - Sanza Music Awards`;
    const description = `Une voix incroyable nommée dans la catégorie "${categoryName}". Soutenez ${artistName} avec vos votes ! Actuellement : ${voteCount} votes. Ensemble pour la culture !`;

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
                    alt: `Vote for ${artistName}`,
                },
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
    };
}

export default async function ProfilePage({ params }: Props) {
    const nominee = await getNominee(params.id);

    return <ProfileClient initialNominee={nominee} />;
}
