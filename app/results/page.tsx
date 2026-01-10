"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Star, TrendingUp, ChevronLeft, Search, Globe } from 'lucide-react';
import SanzaTrophy from '@/components/ui/SanzaTrophy';
import Link from 'next/link';
import SearchOverlay from '@/components/SearchOverlay';
import { useVotes } from '@/components/context/VoteContext';

const Results = () => {
    const { nominees, categories, getGlobalRankings, getCategoryRankings, getTotalVotes, language, switchLanguage } = useVotes();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState('global');

    const t = {
        FR: {
            title: "Résultats en Direct",
            totalVotes: "Total des Votes Exprimés",
            realTime: "Mise à jour en temps réel",
            nextUpdate: "Prochaine mise à jour dans 4m",
            general: "Classement Général",
            live: "Résultats en Direct",
            pos: "Position Actuelle",
            pastWinners: "Anciens Gagnants",
            unknown: "Inconnue",
            filterAll: "GÉNÉRAL"
        },
        EN: {
            title: "Live Results",
            totalVotes: "Total Votes Cast",
            realTime: "Real-time update",
            nextUpdate: "Next update in 4m",
            general: "Global Rankings",
            live: "Live Results",
            pos: "Current Position",
            pastWinners: "Previous Winners",
            unknown: "Unknown",
            filterAll: "GLOBAL"
        }
    }[language as 'FR' | 'EN'] || {
        FR: {
            title: "Résultats en Direct",
            totalVotes: "Total des Votes Exprimés",
            realTime: "Mise à jour en temps réel",
            nextUpdate: "Prochaine mise à jour dans 4m",
            general: "Classement Général",
            live: "Résultats en Direct",
            pos: "Position Actuelle",
            pastWinners: "Anciens Gagnants",
            unknown: "Inconnue",
            filterAll: "GÉNÉRAL"
        }
    }.FR;

    const globalRankings = getGlobalRankings();

    const displayedNominees = selectedCategoryId === 'global'
        ? globalRankings
        : getCategoryRankings(selectedCategoryId);

    const getGlobalRank = (nomineeId: string | number) => {
        return globalRankings.findIndex((n: any) => n.id === nomineeId) + 1;
    };

    const getCategoryRank = (nominee: any) => {
        const categoryNominees = getCategoryRankings(nominee.categoryId);
        return categoryNominees.findIndex((n: any) => n.id === nominee.id) + 1;
    };

    const getCategoryTitle = (categoryId: any) => {
        return categories.find((c: any) => c.id === categoryId)?.title || t.unknown;
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
                data={nominees}
            />

            <div className="px-6 space-y-8">
                <div className="relative h-48 rounded-[2.5rem] overflow-hidden border border-white/5 p-8 flex flex-col justify-center">
                    <img
                        src="https://images.unsplash.com/photo-1514525253361-bee871871771?q=80&w=1000"
                        alt="Results Hero"
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <SanzaTrophy size={60} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-sm font-bold text-secondary uppercase tracking-[0.2em] mb-2">{t.totalVotes}</h3>
                        <p className="text-5xl font-black tracking-tighter">{getTotalVotes()}</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            {t.realTime} • {t.nextUpdate}
                        </p>
                    </div>
                </div>

                <div>
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                {selectedCategoryId === 'global' ? t.general : getCategoryTitle(selectedCategoryId)}
                            </h3>
                            <span className="text-[10px] text-secondary font-bold uppercase tracking-widest flex items-center gap-1">
                                <TrendingUp size={12} /> {t.live}
                            </span>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <button
                                onClick={() => setSelectedCategoryId('global')}
                                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border ${selectedCategoryId === 'global'
                                    ? 'bg-secondary border-secondary text-white' : 'bg-transparent border-white/10 text-gray-500'} transition-all`}>
                                {t.filterAll}
                            </button>
                            {categories.map((cat: any) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategoryId(cat.id.toString())}
                                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategoryId === cat.id.toString()
                                        ? 'bg-secondary border-secondary text-white'
                                        : 'bg-white/5 border-white/10 text-gray-400'
                                        }`}
                                >
                                    {cat.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {displayedNominees.map((nominee: any, index: number) => {
                            const globalRank = getGlobalRank(nominee.id);
                            const categoryRank = getCategoryRank(nominee);

                            return (
                                <motion.div
                                    key={nominee.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="p-4 bg-[#1a1a1a] border-none rounded-3xl flex items-center gap-4 group hover:bg-white/5 transition-all">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden">
                                                <img src={nominee.image} alt={nominee.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-black ${globalRank === 1 ? 'bg-yellow-400 text-black' :
                                                globalRank === 2 ? 'bg-gray-300 text-black' :
                                                    globalRank === 3 ? 'bg-orange-400 text-black' : 'bg-white/10 text-white'
                                                }`}>
                                                {globalRank}
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm mb-0.5">{nominee.name}</h4>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-2">
                                                {getCategoryTitle(nominee.categoryId)}
                                            </p>
                                            <div className="flex gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] text-gray-500 uppercase font-bold tracking-tighter">Général</span>
                                                    <span className="text-xs font-black text-white">#{globalRank}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] text-gray-500 uppercase font-bold tracking-tighter">{getCategoryTitle(nominee.categoryId).slice(0, 10)}...</span>
                                                    <span className="text-xs font-black text-secondary">#{categoryRank}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm font-bold">{nominee.votes}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">{t.pos}</p>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Results;
