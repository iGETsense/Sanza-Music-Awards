"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ChevronLeft, Star, Share2, Check, LayoutGrid, User, Globe } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import VoteModal from '@/components/VoteModal';
import { useVotes } from '@/components/context/VoteContext';

const NomineesContent = () => {
    const { nominees: allNominees, categories, language, switchLanguage, isLoading } = useVotes();
    const [activeTab, setActiveTab] = useState('All');
    const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
    const [selectedNominee, setSelectedNominee] = useState<any>(null);
    const searchParams = useSearchParams();
    const categoryId = searchParams.get('categoryId') || 'cat_01';

    const t = {
        FR: {
            voteFor: "Votez pour le",
            winner: "gagnant 2026.",
            endsIn: "Soutenez vos artistes préférés en votant chaque jour.",
            tabs: {
                All: "Tous",
                Trending: "Tendances",
                Newest: "Nouveaux",
                "A-Z": "A-Z"
            },
            voter: "VOTER",
            votes: "Votes",
            loading: "Chargement...",
            noCategory: "Catégorie non trouvée"
        },
        EN: {
            voteFor: "Vote for the",
            winner: "2026 winner.",
            endsIn: "Support your favorite artists by voting every day.",
            tabs: {
                All: "All",
                Trending: "Trending",
                Newest: "Newest",
                "A-Z": "A-Z"
            },
            voter: "VOTE",
            votes: "Votes",
            loading: "Loading...",
            noCategory: "Category not found"
        }
    }[language as 'FR' | 'EN'] || {
        FR: {
            voteFor: "Votez pour le",
            winner: "gagnant 2026.",
            endsIn: "Soutenez vos artistes préférés en votant chaque jour.",
            tabs: {
                All: "Tous",
                Trending: "Tendances",
                Newest: "Nouveaux",
                "A-Z": "A-Z"
            },
            voter: "VOTER",
            votes: "Votes",
            loading: "Chargement...",
            noCategory: "Catégorie non trouvée"
        }
    }.FR;

    const [copiedId, setCopiedId] = useState<string | number | null>(null);

    if (isLoading) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">{t.loading}</div>;
    }

    const category = categories.find((c: any) => String(c.id) === String(categoryId)) || categories[0];

    if (!category) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">{t.noCategory}</div>;
    }

    const filteredNominees = allNominees.filter((n: any) => String(n.categoryId) === String(categoryId));

    const handleVoteClick = (nominee: any) => {
        setSelectedNominee(nominee);
        setIsVoteModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsVoteModalOpen(false);
        setSelectedNominee(null);
    };

    const handleShare = (e: React.MouseEvent, nominee: any) => {
        e.preventDefault();
        e.stopPropagation();
        const url = new URL(`${window.location.origin}/profile/${nominee.id}`);
        navigator.clipboard.writeText(url.toString());
        setCopiedId(nominee.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="p-0 bg-black min-h-screen text-white pb-32">
            <div className="flex items-center justify-between p-6 pt-8">
                <Link href="/categories">
                    <Button variant="ghost" className="p-2 rounded-full hover:bg-white/5">
                        <ChevronLeft size={24} />
                    </Button>
                </Link>
                <div className="flex flex-col items-center">
                    <h2 className="text-sm font-bold tracking-widest uppercase">{category.title}</h2>
                    <button
                        onClick={switchLanguage}
                        className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10"
                    >
                        <Globe size={10} className="text-[#FDB931]" />
                        <span className="text-[9px] font-black text-[#FDB931]">{language}</span>
                    </button>
                </div>
                <Button variant="ghost" className="p-2 rounded-full hover:bg-white/5">
                    <LayoutGrid size={20} />
                </Button>
            </div>

            <div className="px-6">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">
                        {t.voteFor} <br />
                        <span className="text-secondary">{t.winner}</span>
                    </h2>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                        {t.endsIn}
                    </p>
                </div>

                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {['All', 'Trending', 'Newest', 'A-Z'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                                ? 'bg-secondary text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {(t.tabs as any)[tab] || tab}
                        </button>
                    ))}
                </div>

                <div className="space-y-8">
                    {filteredNominees.map((nominee: any, index: number) => (
                        <motion.div
                            key={nominee.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-0 overflow-hidden border-none bg-[#1a1a1a] group rounded-[2.5rem]">
                                <Link href={`/profile/${nominee.id}`} className="block relative h-64">
                                    <img
                                        src={nominee.image}
                                        alt={nominee.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />

                                    {nominee.tag && (
                                        <div className="absolute top-4 left-4">
                                            <span className="flex items-center gap-1 px-3 py-1 bg-yellow-400/20 text-yellow-400 text-[9px] font-bold rounded-full backdrop-blur-md border border-yellow-400/30 uppercase tracking-widest">
                                                <Star size={10} fill="currentColor" /> {nominee.tag}
                                            </span>
                                        </div>
                                    )}

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <h3 className="text-2xl font-bold mb-1">{nominee.name}</h3>
                                                <p className="text-secondary text-[10px] font-bold tracking-[0.2em] uppercase">{nominee.song}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold">{nominee.votes}</p>
                                                <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t.votes}</p>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 font-medium">
                                            {nominee.description}
                                        </p>
                                    </div>
                                </Link>

                                <div className="absolute top-4 right-4 z-10">
                                    <button
                                        onClick={(e) => handleShare(e, nominee)}
                                        className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all border border-white/10"
                                    >
                                        {copiedId === nominee.id ? (
                                            <Check size={14} className="text-green-400" />
                                        ) : (
                                            <Share2 size={14} />
                                        )}
                                    </button>
                                </div>

                                <div className="p-6 pt-0">
                                    <Button
                                        className="w-full py-4 bg-secondary hover:bg-secondary/90 text-white border-none rounded-full font-bold flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-[0_10px_20px_rgba(217,70,239,0.2)]"
                                        onClick={() => handleVoteClick(nominee)}
                                    >
                                        <User size={16} fill="currentColor" /> {t.voter}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {selectedNominee && (
                <VoteModal
                    isOpen={isVoteModalOpen}
                    onClose={handleCloseModal}
                    nominee={selectedNominee}
                />
            )}
        </div>
    );
};

const Nominees = () => {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Chargement...</div>}>
            <NomineesContent />
        </Suspense>
    );
};

export default Nominees;
