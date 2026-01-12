"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { LayoutGrid, Mail, MessageCircle, Globe } from 'lucide-react';
import SanzaTrophy from '@/components/ui/SanzaTrophy';
import { useVotes } from '@/components/context/VoteContext';

const Landing = () => {
    const { language, switchLanguage } = useVotes();

    const t = {
        FR: {
            title: "Sanza Music Awards",
            tagline: "Là où les étoiles de la musique brillent",
            cta: "Votez Maintenant",
            whatsapp: "Contactez-nous sur WhatsApp",
            email: "Envoyez-nous un email"
        },
        EN: {
            title: "Sanza Music Awards",
            tagline: "Where music stars shine",
            cta: "Vote Now",
            whatsapp: "Contact us on WhatsApp",
            email: "Send us an email"
        }
    }[language as 'FR' | 'EN'] || {
        FR: {
            title: "Sanza Music Awards",
            tagline: "Là où les étoiles de la musique brillent",
            cta: "Votez Maintenant",
            whatsapp: "Contactez-nous sur WhatsApp",
            email: "Envoyez-nous un email"
        }
    }.FR;

    return (
        <div className="flex flex-col min-h-screen bg-[#051040] text-white pb-24 font-sans overflow-x-hidden relative">
            {/* Responsive Luxury Background */}
            <div className="fixed inset-0 z-0 overflow-hidden bg-[#051040]">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105 opacity-100"
                    style={{
                        backgroundImage: 'var(--hero-bg)'
                    } as any}
                />
                <style dangerouslySetInnerHTML={{
                    __html: `
                    :root { --hero-bg: url("/hero-bg-mobile.png"); }
                    @media (min-width: 768px) {
                        :root { --hero-bg: url("/hero-bg-2.jpg"); }
                    }
                `}} />

                {/* Supporting Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#051040]/40 via-transparent to-[#051040] z-[1]" />

                {/* Center Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(253,185,49,0.1)_0%,_rgba(5,16,64,0)_70%)] z-[1]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-6 pt-10 z-50 relative max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3">
                    <Link href="/categories" className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10 group backdrop-blur-md">
                        <LayoutGrid size={18} className="text-[#FDB931] group-hover:text-white transition-colors" />
                    </Link>

                    {/* Language Switcher */}
                    <button
                        onClick={switchLanguage}
                        className="p-2.5 px-4 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md flex items-center gap-2 group"
                    >
                        <Globe size={14} className="text-[#FDB931] group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-[10px] font-black tracking-widest text-[#FDB931]">{language}</span>
                    </button>
                </div>

                <div className="hidden md:block">
                    <h1 className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#FDB931]/80">{t.title}</h1>
                </div>
                <Link href="/results" className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all relative border border-white/10 group flex items-center justify-center backdrop-blur-md">
                    <SanzaTrophy size={20} className="group-hover:drop-shadow-[0_0_8px_rgba(255,215,0,0.5)] transition-all" />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-start relative w-full z-10 px-4 md:px-0">

                {/* Hero Section Content */}
                <div className="w-full min-h-[75vh] flex flex-col items-center justify-start pt-16 md:pt-24 py-8">

                    {/* Main Logo Block */}
                    <div className="flex flex-row items-center justify-center gap-3 md:gap-8 mb-10 md:mb-14">
                        {/* Trophy Icon */}
                        <motion.div
                            animate={{ y: [-8, 8, -8] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            className="h-[120px] xs:h-[150px] md:h-[220px] lg:h-[280px] aspect-[0.45] relative flex-shrink-0"
                        >
                            <SanzaTrophy className="h-full w-auto drop-shadow-[0_0_40px_rgba(253,185,49,0.5)]" />
                        </motion.div>

                        {/* Text Block */}
                        <div className="flex flex-col items-start justify-center">
                            <motion.h1
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                className="text-6xl xs:text-7xl md:text-9xl lg:text-[10rem] font-serif font-bold leading-none text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] via-[#FDB931] to-[#C49102] drop-shadow-sm"
                            >
                                Sanza
                            </motion.h1>
                            <motion.h2
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-lg xs:text-2xl md:text-4xl lg:text-5xl font-sans font-light text-[#FDB931] tracking-[0.2em] md:tracking-[0.3em] pl-1 md:pl-3"
                            >
                                Music Awards
                            </motion.h2>
                        </div>
                    </div>

                    {/* Enhanced Tagline */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="flex flex-col items-center mb-12"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#FDB931]" />
                            <div className="w-1 h-1 rounded-full bg-[#FDB931]" />
                            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#FDB931]" />
                        </div>
                        <p className="text-white/90 text-[8px] sm:text-xs md:text-sm tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.5em] uppercase font-light text-center px-4 whitespace-nowrap leading-loose">
                            {t.tagline}
                        </p>

                        <div className="flex items-center gap-3 mt-2">
                            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#FDB931]" />
                            <div className="w-1 h-1 rounded-full bg-[#FDB931]" />
                            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#FDB931]" />
                        </div>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-col items-center gap-6 w-full max-w-[350px] md:max-w-md"
                    >
                        <Link href="/categories" className="w-full md:w-auto">
                            <div className="w-full md:w-auto px-10 sm:px-20 md:px-24 py-4 md:py-4.5 bg-gradient-to-r from-[#DF9F28] via-[#FDB931] to-[#DF9F28] text-[#051040] font-black uppercase tracking-widest text-sm rounded-full shadow-[0_4px_30px_rgba(253,185,49,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer whitespace-nowrap">
                                {t.cta}
                            </div>
                        </Link>

                        {/* Contact Icons */}
                        <div className="flex items-center justify-center gap-6">
                            <a
                                href="https://wa.me/237672274712"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group"
                                aria-label={t.whatsapp}
                            >
                                <div className="w-11 h-11 rounded-full border-2 border-[#FDB931]/50 group-hover:border-[#25D366] group-hover:scale-110 flex items-center justify-center transition-all duration-300 bg-white/5 backdrop-blur-sm">
                                    <MessageCircle size={20} className="text-[#FDB931]/80 group-hover:text-[#25D366] transition-colors" />
                                </div>
                            </a>

                            <a
                                href="mailto:augerbidjang@gmail.com"
                                className="group"
                                aria-label={t.email}
                            >
                                <div className="w-11 h-11 rounded-full border-2 border-[#FDB931]/50 group-hover:border-white group-hover:scale-110 flex items-center justify-center transition-all duration-300 bg-white/5 backdrop-blur-sm">
                                    <Mail size={20} className="text-[#FDB931]/80 group-hover:text-white transition-colors" />
                                </div>
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
