"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/components/services/api';
import { CATEGORY_IMAGE_MAP } from '@/components/constants/categoryImages';
import localData from '@/sanza_db_export.json';

interface Nominee {
    id: string | number;
    categoryId: string | number;
    name: string;
    song: string;
    votes: string;
    image: string;
    tag: string | null;
    description: string;
    bio?: string;
    genre: string;
    country: string;
    rank?: string;
    listeners?: string;
    hits: any[];
}

interface Category {
    id: string | number;
    title: string;
    nominees: string | number;
    image: string;
    featured: boolean;
}

interface VoteContextType {
    nominees: Nominee[];
    categories: Category[];
    transactions: any[];
    totalRevenue: number;
    isLoading: boolean;
    error: string | null;
    useBackend: boolean;
    incrementVote: (nomineeId: string | number, count?: number, amount?: number, method?: string) => void;
    processVote: (nomineeId: string | number, count: number, phoneNumber: string, paymentMethod: string, nomineeName: string) => Promise<any>;
    refetch: () => Promise<void>;
    getGlobalRankings: () => Nominee[];
    getCategoryRankings: (categoryId: string | number) => Nominee[];
    getTotalVotes: () => string;
    language: string;
    switchLanguage: () => void;
}

const VoteContext = createContext<VoteContextType | undefined>(undefined);

export const useVotes = () => {
    const context = useContext(VoteContext);
    if (!context) {
        throw new Error('useVotes must be used within a VoteProvider');
    }
    return context;
};

export const VoteProvider = ({ children }: { children: ReactNode }) => {
    const [nominees, setNominees] = useState<Nominee[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [transactions, setTransactions] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [useBackend, setUseBackend] = useState(true);
    const [language, setLanguage] = useState('FR'); // 'EN' or 'FR'

    const switchLanguage = useCallback(() => {
        setLanguage(prev => prev === 'FR' ? 'EN' : 'FR');
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            let [categoriesData, nomineesData] = await Promise.all([
                (api as any).getCategories(),
                (api as any).getNominees(),
            ]);

            // Fallback to local data if API returns empty
            if (!categoriesData || categoriesData.length === 0) {
                console.log('⚠️ No categories from API, using fallback data');
                categoriesData = Object.entries(localData.categories).map(([id, val]) => ({ id, ...val }));
            }

            if (!nomineesData || nomineesData.length === 0) {
                console.log('⚠️ No nominees from API, using fallback data');
                nomineesData = Object.entries(localData.nominees).map(([id, val]) => ({ id, ...val }));
            }

            const transformNominees = (data: any[]): Nominee[] => data.map(n => ({
                id: n.id,
                categoryId: n.category_id,
                name: n.name,
                song: n.song,
                votes: n.votes_display || n.votes?.toString() || '0',
                image: n.image_url,
                tag: n.tag,
                description: n.description,
                bio: n.bio,
                genre: n.genre,
                country: n.country,
                rank: n.rank,
                listeners: n.listeners,
                hits: n.hits || [],
            }));

            const transformedCategories = categoriesData.map((c: any): Category => ({
                id: c.id,
                title: c.title,
                nominees: c.nominees_count,
                image: CATEGORY_IMAGE_MAP[c.id] || c.image_url,
                featured: c.featured,
            }));

            setCategories(transformedCategories);
            setNominees(transformNominees(nomineesData));
            setUseBackend(true);
            console.log('✅ Connected to backend API');
        } catch (err: any) {
            console.error('❌ Backend request failed:', err.message);

            // Critical fallback if API completely fails
            try {
                const categoriesData = Object.entries(localData.categories).map(([id, val]) => ({ id, ...val }));
                const nomineesData = Object.entries(localData.nominees).map(([id, val]) => ({ id, ...val }));

                const transformNominees = (data: any[]): Nominee[] => data.map(n => ({
                    id: n.id,
                    categoryId: n.category_id,
                    name: n.name,
                    song: n.song,
                    votes: n.votes_display || n.votes?.toString() || '0',
                    image: n.image_url,
                    tag: n.tag,
                    description: n.description,
                    bio: n.bio,
                    genre: n.genre,
                    country: n.country,
                    rank: n.rank,
                    listeners: n.listeners,
                    hits: n.hits || [],
                }));

                const transformedCategories = categoriesData.map((c: any): Category => ({
                    id: c.id,
                    title: c.title,
                    nominees: c.nominees_count,
                    image: CATEGORY_IMAGE_MAP[c.id] || c.image_url,
                    featured: c.featured,
                }));

                setCategories(transformedCategories);
                setNominees(transformNominees(nomineesData));
                setUseBackend(false);
                setError('Mode hors-ligne : Utilisation des données locales.');
            } catch (fallbackErr) {
                setError('Failed to load data from server. Please try again later.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const processVote = useCallback(async (nomineeId: string | number, count: number, phoneNumber: string, paymentMethod: string, nomineeName: string) => {
        try {
            const result = await (api as any).initiatePayment({
                nomineeId,
                nomineeName,
                voteCount: count,
                phoneNumber,
                paymentMethod,
            });

            if (result.success && result.status !== 'pending') {
                await refetch();
            }

            return result;
        } catch (err) {
            console.error('Payment failed:', err);
            throw err;
        }
    }, []);

    const incrementVote = useCallback((nomineeId: string | number, count = 1, amount = 0, method = 'MOMO') => {
        const nominee = nominees.find(n => n.id === nomineeId);
        if (!nominee) return;

        setNominees(prevNominees =>
            prevNominees.map(n => {
                if (n.id === nomineeId) {
                    const currentVotes = parseFloat(n.votes.replace('k', '')) * (n.votes.includes('k') ? 1000 : 1);
                    const newVotes = currentVotes + count;
                    const formattedVotes = newVotes >= 1000 ? `${(newVotes / 1000).toFixed(1)}k` : newVotes.toString();
                    return { ...n, votes: formattedVotes };
                }
                return n;
            })
        );
    }, [nominees]);

    const refetch = useCallback(async () => {
        if (!useBackend) return;

        try {
            const nomineesData = await (api as any).getNominees();
            const transformedNominees = nomineesData.map((n: any) => ({
                id: n.id,
                categoryId: n.category_id,
                name: n.name,
                song: n.song,
                votes: n.votes_display || n.votes?.toString() || '0',
                image: n.image_url,
                tag: n.tag,
                description: n.description,
                bio: n.bio,
                genre: n.genre,
                country: n.country,
                rank: n.rank,
                listeners: n.listeners,
                hits: n.hits || [],
            }));
            setNominees(transformedNominees);
        } catch (err) {
            console.error('Refetch failed:', err);
        }
    }, [useBackend]);

    const getGlobalRankings = useCallback(() => {
        return [...nominees].sort((a, b) => {
            const votesA = parseFloat(a.votes.replace('k', '')) * (a.votes.includes('k') ? 1000 : 1);
            const votesB = parseFloat(b.votes.replace('k', '')) * (b.votes.includes('k') ? 1000 : 1);
            return votesB - votesA;
        });
    }, [nominees]);

    const getCategoryRankings = useCallback((categoryId: string | number) => {
        return nominees
            .filter(n => String(n.categoryId) === String(categoryId))
            .sort((a, b) => {
                const votesA = parseFloat(a.votes.replace('k', '')) * (a.votes.includes('k') ? 1000 : 1);
                const votesB = parseFloat(b.votes.replace('k', '')) * (b.votes.includes('k') ? 1000 : 1);
                return votesB - votesA;
            });
    }, [nominees]);

    const getTotalVotes = useCallback(() => {
        const total = nominees.reduce((acc, nominee) => {
            const votes = parseFloat(nominee.votes.replace('k', '')) * (nominee.votes.includes('k') ? 1000 : 1);
            return acc + votes;
        }, 0);

        return total >= 1000000
            ? `${(total / 1000000).toFixed(1)}M+`
            : total >= 1000
                ? `${(total / 1000).toFixed(1)}k+`
                : total.toString();
    }, [nominees]);

    const value = {
        nominees,
        categories,
        transactions,
        totalRevenue,
        isLoading,
        error,
        useBackend,
        incrementVote,
        processVote,
        refetch,
        getGlobalRankings,
        getCategoryRankings,
        getTotalVotes,
        language,
        switchLanguage
    };

    return (
        <VoteContext.Provider value={value}>
            {children}
        </VoteContext.Provider>
    );
};
