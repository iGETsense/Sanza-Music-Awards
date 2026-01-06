"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Minus, Plus, Lock, Smartphone, CreditCard, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { useVotes } from '@/components/context/VoteContext';
import { useLayout } from '@/components/context/LayoutContext';
import api from '@/components/services/api';
import PaymentStatusOverlay from '@/components/ui/PaymentStatusOverlay';

interface VoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    nominee: any;
}

const VoteModal = ({ isOpen, onClose, nominee }: VoteModalProps) => {
    const [voteCount, setVoteCount] = useState<number | string>(1);
    const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'OM'>('MOMO');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [localPolling, setLocalPolling] = useState(false);
    const [pollingMessage, setPollingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'polling' | 'success' | 'failed'>('idle');
    const [statusMessage, setStatusMessage] = useState('');

    const router = useRouter();

    const { incrementVote, processVote, useBackend, refetch, categories, language } = useVotes();
    const { hideNavbar, showNavbar } = useLayout();

    useEffect(() => {
        if (isOpen) {
            hideNavbar();
        }
        return () => {
            showNavbar();
        };
    }, [isOpen, hideNavbar, showNavbar]);

    const t = {
        FR: {
            share: "Partager le profil",
            copied: "Lien copié !",
            voteCount: "Nombre de Votes / Prix",
            paymentMethod: "Moyen de Paiement",
            phonePlaceholder: "Numéro de téléphone",
            processing: "TRAITEMENT EN COURS...",
            polling: "VÉRIFIEZ VOTRE TÉLÉPHONE...",
            voteNow: "VOTER MAINTENANT",
            secure: "Paiement Sécurisé",
            confirmPhone: "Vérifiez votre téléphone pour confirmer le paiement.",
            paymentFailed: "Le paiement a échoué. Veuillez réessayer.",
            transactionError: "Erreur de transaction.",
            category: "Catégorie"
        },
        EN: {
            share: "Share Profile",
            copied: "Link copied!",
            voteCount: "Number of Votes / Price",
            paymentMethod: "Payment Method",
            phonePlaceholder: "Phone Number",
            processing: "PROCESSING...",
            polling: "CHECK YOUR PHONE...",
            voteNow: "VOTE NOW",
            secure: "Secure Payment",
            confirmPhone: "Check your phone to confirm payment.",
            paymentFailed: "Payment failed. Please try again.",
            transactionError: "Transaction error.",
            category: "Category"
        }
    }[language as 'FR' | 'EN'] || {
        FR: {
            share: "Partager le profil",
            copied: "Lien copié !",
            voteCount: "Nombre de Votes / Prix",
            paymentMethod: "Moyen de Paiement",
            phonePlaceholder: "Numéro de téléphone",
            processing: "TRAITEMENT EN COURS...",
            polling: "VÉRIFIEZ VOTRE TÉLÉPHONE...",
            voteNow: "VOTER MAINTENANT",
            secure: "Paiement Sécurisé",
            confirmPhone: "Vérifiez votre téléphone pour confirmer le paiement.",
            paymentFailed: "Le paiement a échoué. Veuillez réessayer.",
            transactionError: "Erreur de transaction.",
            category: "Catégorie"
        }
    }.FR;

    const categoryTitle = categories?.find((c: any) => c.id === nominee?.categoryId)?.title || t.category;

    const pricePerVote = 105;
    const currentVoteCount = typeof voteCount === 'string' ? 0 : voteCount;
    const totalPrice = currentVoteCount * pricePerVote;

    const handleVoteChange = (delta: number) => {
        setVoteCount(prev => {
            const count = typeof prev === 'string' ? 1 : prev;
            return Math.max(1, count + delta);
        });
    };

    const handleShare = () => {
        if (!nominee) return;
        const url = new URL(window.location.origin + `/profile/${nominee.id}`);
        navigator.clipboard.writeText(url.toString());
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleClose = () => {
        setVoteCount(1);
        setPhoneNumber('');
        setIsLoading(false);
        setIsPolling(false);
        setLocalPolling(false);
        setPaymentStatus('idle'); // Reset overlay
        onErrorReset();
        onClose();
    };

    const onErrorReset = () => setError(null);

    const processPayment = async (method: string, phone: string, amount: number) => {
        setIsLoading(true);
        setPaymentStatus('processing');
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return { success: true };
        } catch (error: any) {
            console.error('Payment failed:', error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const handleVoteSubmit = async () => {
        setIsLoading(true);
        setPaymentStatus('processing');
        setError(null);
        setPollingMessage('');

        try {
            if (useBackend && processVote) {
                const result = await processVote(nominee.id, currentVoteCount, phoneNumber, paymentMethod);

                if (result.success) {
                    setIsLoading(false);
                    // Instead of just setting isPolling, we set paymentStatus to polling
                    setIsPolling(true);
                    setPaymentStatus('polling');

                    if (result.status === 'pending') {
                        setLocalPolling(true);
                        setPollingMessage(result.message || t.confirmPhone);
                        setStatusMessage(result.message || t.confirmPhone); // Update overlay message

                        const pollInterval = setInterval(async () => {
                            try {
                                const statusResult = await (api as any).checkPaymentStatus(result.transactionId || result.paymentId);
                                if (statusResult.status === 'success' || statusResult.status === 'completed') {
                                    clearInterval(pollInterval);
                                    setIsPolling(false);
                                    setLocalPolling(false);
                                    setPaymentStatus('success'); // Show success overlay

                                    if (refetch) await refetch();

                                    // Delay redirect to show success animation
                                    setTimeout(() => {
                                        router.push(`/vote-success?nomineeId=${nominee.id}&count=${currentVoteCount}`);
                                    }, 2000);

                                } else if (statusResult.status === 'failed') {
                                    clearInterval(pollInterval);
                                    setIsPolling(false);
                                    setLocalPolling(false);
                                    setError(statusResult.error || t.paymentFailed);
                                    setPaymentStatus('failed'); // Show failed overlay
                                    setStatusMessage(statusResult.error || t.paymentFailed);
                                }
                            } catch (e) {
                                console.error('Polling error:', e);
                            }
                        }, 3000);

                        // Timeout
                        setTimeout(() => {
                            clearInterval(pollInterval);
                            setLocalPolling(false);
                            setIsPolling(false);
                            // If still polling after timeout, maybe show manual check needed or timeout error
                            // For now, let's just close or show error if strictly needed
                        }, 120000);
                    } else {
                        setPaymentStatus('success');
                        setTimeout(() => {
                            router.push(`/vote-success?nomineeId=${nominee.id}&count=${currentVoteCount}`);
                        }, 1500);
                    }
                } else {
                    setError(result.error || result.message || t.paymentFailed);
                    setStatusMessage(result.error || result.message || t.paymentFailed);
                    setPaymentStatus('failed');
                    setIsLoading(false);
                }
            } else {
                // Mock flow
                const result = await processPayment(paymentMethod, phoneNumber, totalPrice);
                if (result.success) {
                    incrementVote(nominee.id, currentVoteCount, totalPrice, paymentMethod);
                    setPaymentStatus('success');
                    setTimeout(() => {
                        router.push(`/vote-success?nomineeId=${nominee.id}&count=${currentVoteCount}`);
                    }, 1500);
                } else {
                    setError(t.paymentFailed);
                    setPaymentStatus('failed');
                    setIsLoading(false);
                }
            }
        } catch (err: any) {
            console.error('Payment error:', err);
            setError(err.message || t.transactionError);
            setStatusMessage(err.message || t.transactionError);
            setPaymentStatus('failed');
            setIsLoading(false);
        }
    };

    if (!isOpen || !nominee) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-[#1a1a1a] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 max-h-[90vh] overflow-y-auto scrollbar-hide text-white"
                    >
                        {/* Status Overlay */}
                        <PaymentStatusOverlay
                            status={paymentStatus}
                            message={statusMessage}
                            onClose={() => setPaymentStatus('idle')}
                        />

                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-6 right-6 z-30 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8 pb-12">
                            {/* Nominee Info */}
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="relative w-24 h-24 mb-4">
                                    <Image
                                        src={nominee.image}
                                        alt={nominee.name}
                                        fill
                                        className="object-cover rounded-2xl shadow-xl"
                                    />
                                </div>

                                <h3 className="text-2xl font-bold mb-1">{nominee.name}</h3>
                                <p className="text-secondary text-xs font-bold uppercase tracking-widest mb-4">
                                    {categoryTitle}
                                </p>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="gap-2 rounded-full text-[10px] font-bold bg-white/5 hover:bg-white/10 text-gray-400 border-none px-4"
                                    onClick={handleShare}
                                >
                                    {isCopied ? (
                                        <>
                                            <Check size={12} /> {t.copied}
                                        </>
                                    ) : (
                                        <>
                                            <Share2 size={12} /> {t.share}
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Vote Counter */}
                            <div className="bg-white/5 rounded-3xl p-6 mb-6 border border-white/5">
                                <p className="text-center text-gray-500 text-[10px] mb-4 uppercase tracking-widest font-bold">{t.voteCount}: {pricePerVote} XAF</p>
                                <div className="flex items-center justify-center gap-8">
                                    <button
                                        onClick={() => handleVoteChange(-1)}
                                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={voteCount}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val) && val >= 1) {
                                                setVoteCount(val);
                                            } else if (e.target.value === '') {
                                                setVoteCount('');
                                            }
                                        }}
                                        onBlur={() => {
                                            if (voteCount === '' || (typeof voteCount === 'number' && voteCount < 1)) {
                                                setVoteCount(1);
                                            }
                                        }}
                                        className="bg-transparent text-4xl font-bold text-center w-24 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none text-white px-2"
                                    />
                                    <button
                                        onClick={() => handleVoteChange(1)}
                                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="space-y-4 mb-8">
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4">{t.paymentMethod}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setPaymentMethod('MOMO')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'MOMO'
                                            ? 'border-secondary bg-secondary/10'
                                            : 'border-white/5 bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <Smartphone size={20} className={paymentMethod === 'MOMO' ? 'text-secondary' : 'text-gray-400'} />
                                        <span translate="no" className="text-[10px] font-bold uppercase">Mobile Money</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('OM')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'OM'
                                            ? 'border-secondary bg-secondary/10'
                                            : 'border-white/5 bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <CreditCard size={20} className={paymentMethod === 'OM' ? 'text-secondary' : 'text-gray-400'} />
                                        <span translate="no" className="text-[10px] font-bold uppercase">Orange Money</span>
                                    </button>
                                </div>
                            </div>

                            {/* Phone Input */}
                            <div className="mb-8">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">+237</span>
                                    <input
                                        type="tel"
                                        placeholder={t.phonePlaceholder}
                                        value={phoneNumber}
                                        maxLength={9}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 9) {
                                                setPhoneNumber(val);
                                            }
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-16 pr-4 focus:outline-none focus:border-secondary transition-colors font-bold text-sm text-white"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                className="w-full py-4 text-sm font-bold rounded-2xl shadow-lg shadow-secondary/20 mb-4 flex items-center justify-center gap-2"
                                disabled={isLoading || isPolling || localPolling}
                                onClick={handleVoteSubmit}
                            >
                                {isLoading ? t.processing : (localPolling || isPolling) ? t.polling : `${t.voteNow} • ${totalPrice} XAF`}
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                <Lock size={12} /> {t.secure}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default VoteModal;
