"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Mic2, Users, Music, Video, Star, Sparkles, ChevronLeft, Search, Disc, Radio, Zap, Globe } from 'lucide-react';
import SanzaTrophy from '@/components/ui/SanzaTrophy';
import Link from 'next/link';
import { useVotes } from '@/components/context/VoteContext';
import SearchOverlay from '@/components/SearchOverlay';
import Image from 'next/image';

const Categories = () => {
    const { categories, nominees, language, switchLanguage, isLoading } = useVotes();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [shuffledCategories, setShuffledCategories] = useState<any[]>([]);

    useEffect(() => {
        if (categories && categories.length > 0) {
            const shuffled = [...categories].sort(() => Math.random() - 0.5);
            setShuffledCategories(shuffled);
        }
    }, [categories]);

    const t = {
        FR: {
            title: "Catégories de Prix",
            showAll: "Tout voir",
            showLess: "Voir moins",
            featured: "Catégorie Vedette",
            voteOpen: "VOTE OUVERT",
            voteNow: "Voter Maintenant",
            browse: "Parcourir les catégories",
            noData: "Aucune catégorie trouvée. Veuillez initialiser la base de données."
        },
        EN: {
            title: "Award Categories",
            showAll: "View All",
            showLess: "View Less",
            featured: "Featured Category",
            voteOpen: "OPEN VOTE",
            voteNow: "Vote Now",
            browse: "Browse Categories",
            noData: "No categories found. Please seed the database."
        }
    }[language as 'FR' | 'EN'] || {
        FR: {
            title: "Catégories de Prix",
            showAll: "Tout voir",
            showLess: "Voir moins",
            featured: "Catégorie Vedette",
            voteOpen: "VOTE OUVERT",
            voteNow: "Voter Maintenant",
            browse: "Parcourir les catégories",
            noData: "Aucune catégorie trouvée. Veuillez initialiser la base de données."
        }
    }.FR;

    const featuredCategory = useMemo(() => {
        if (shuffledCategories.length > 0) return shuffledCategories[0];
        if (!categories || categories.length === 0) return null;
        return categories.find((c: any) => c.featured) || categories[0];
    }, [shuffledCategories, categories]);

    const otherCategories = useMemo(() => {
        if (shuffledCategories.length > 0) return shuffledCategories.slice(1);
        if (!categories || categories.length === 0) return [];
        return categories.filter((c: any) => c.id !== (featuredCategory?.id));
    }, [shuffledCategories, categories, featuredCategory]);

    const getIcon = (title: string) => {
        if (!title) return SanzaTrophy;
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('vocaliste') || lowerTitle.includes('rap')) return Mic2;
        if (lowerTitle.includes('clip') || lowerTitle.includes('vidéo')) return Video;
        if (lowerTitle.includes('artiste') || lowerTitle.includes('auteur')) return Sparkles;
        if (lowerTitle.includes('chanson') || lowerTitle.includes('enregistrement')) return Music;
        if (lowerTitle.includes('album') || lowerTitle.includes('ep')) return Disc;
        if (lowerTitle.includes('producteur')) return Zap;
        if (lowerTitle.includes('groupe') || lowerTitle.includes('duo')) return Users;
        if (lowerTitle.includes('live') || lowerTitle.includes('performance')) return Radio;
        return SanzaTrophy;
    };

    if (isLoading) {
        return <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>;
    }

    if (!categories || categories.length === 0 || !featuredCategory) {
        return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
            <h2 className="text-xl font-bold mb-2">No Data</h2>
            <p className="text-gray-400">{t.noData}</p>
        </div>;
    }

    const displayedCategories = showAll ? otherCategories : otherCategories.slice(0, 4);

    return (
        <div className="p-0 bg-black min-h-screen text-white pb-32">
            <div className="flex items-center justify-between p-6 pt-8">
                <Link href="/">
                    <Button variant="ghost" className="p-2 rounded-full hover:bg-white/5">
                        <ChevronLeft size={24} />
                    </Button>
                </Link>
                <div className="flex flex-col items-center">
                    <h2 className="text-sm font-bold tracking-widest uppercase">{t.title}</h2>
                    <button
                        onClick={switchLanguage}
                        className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10"
                    >
                        <Globe size={10} className="text-[#FDB931]" />
                        <span className="text-[9px] font-black text-[#FDB931]">{language}</span>
                    </button>
                </div>
                <Button
                    variant="ghost"
                    className="p-2 rounded-full hover:bg-white/5"
                    onClick={() => setIsSearchOpen(true)}
                >
                    <Search size={20} />
                </Button>
            </div>

            <SearchOverlay
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                data={[...categories, ...nominees]}
            />

            <div className="px-6 space-y-6">
                <Link href={`/nominees?categoryId=${featuredCategory.id}`}>
                    <Card className="relative h-56 overflow-hidden group border-none p-0 rounded-[2.5rem]">
                        <Image
                            src={featuredCategory.image}
                            alt={featuredCategory.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        <div className="absolute top-4 right-4">
                            <span className="text-[9px] font-bold bg-secondary text-white px-3 py-1 rounded-full uppercase tracking-widest">
                                ● {t.voteOpen}
                            </span>
                        </div>

                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center border border-secondary/30">
                                    <Star className="text-secondary" size={20} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">{featuredCategory.title}</h3>
                                    <p className="text-[10px] text-gray-300 uppercase tracking-widest">
                                        {t.featured} • {featuredCategory.nominees} <br />
                                        <span className="text-secondary font-bold">Sanza Music Awards 2026</span>
                                    </p>
                                </div>
                            </div>
                            <Button className="w-full py-3 rounded-xl font-bold bg-secondary hover:bg-secondary/90 text-white border-none text-xs">
                                {t.voteNow}
                            </Button>
                        </div>
                    </Card>
                </Link>

                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.browse}</h3>
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-[10px] text-secondary font-bold uppercase tracking-widest hover:underline"
                    >
                        {showAll ? t.showLess : t.showAll}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {displayedCategories.map((cat: any, index: number) => {
                        const Icon = getIcon(cat.title);
                        return (
                            <Link href={`/nominees?categoryId=${cat.id}`} key={cat.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="relative h-44 overflow-hidden group border-none p-0 rounded-[2rem]">
                                        <Image
                                            src={cat.image}
                                            alt={cat.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                                        <div className="absolute top-3 right-3">
                                            <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/30">
                                                <Icon size={12} className="text-secondary" />
                                            </div>
                                        </div>

                                        <div className="absolute bottom-4 left-4 right-4">
                                            <span className="text-[8px] font-bold text-secondary uppercase tracking-[0.2em] mb-1 block">
                                                {t.voteOpen}
                                            </span>
                                            <h4 className="font-bold text-sm mb-1 leading-tight">{cat.title}</h4>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{cat.nominees}</p>
                                        </div>
                                    </Card>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Categories;
