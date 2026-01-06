"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Smartphone, CheckCircle2, XCircle } from 'lucide-react';

interface PaymentStatusOverlayProps {
    status: 'idle' | 'processing' | 'polling' | 'success' | 'failed';
    message?: string;
    onClose?: () => void;
}

const PaymentStatusOverlay = ({ status, message, onClose }: PaymentStatusOverlayProps) => {
    if (status === 'idle') return null;

    const variants = {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md rounded-[2.5rem]">
            <motion.div
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col items-center text-center p-6 space-y-6"
            >
                {/* Icon Animation */}
                <div className="relative">
                    {status === 'processing' && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                            <Loader2 size={64} className="text-secondary" />
                        </motion.div>
                    )}

                    {status === 'polling' && (
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute inset-0 bg-secondary/20 rounded-full blur-xl"
                            />
                            <motion.div
                                animate={{ y: [-5, 5, -5] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Smartphone size={64} className="text-secondary" />
                            </motion.div>
                        </div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring" }}
                        >
                            <CheckCircle2 size={64} className="text-green-500" />
                        </motion.div>
                    )}

                    {status === 'failed' && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring" }}
                        >
                            <XCircle size={64} className="text-red-500" />
                        </motion.div>
                    )}
                </div>

                {/* Status Text */}
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                        {status === 'processing' && 'Initialisation...'}
                        {status === 'polling' && 'Confirmez sur votre téléphone'}
                        {status === 'success' && 'Paiement Réussi !'}
                        {status === 'failed' && 'Échec du Paiement'}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium max-w-[200px]">
                        {message || (status === 'polling' ? 'Veuillez valider la transaction sur votre mobile (USSD).' : '')}
                    </p>
                </div>

                {/* Close Button for Error/Success */}
                {(status === 'failed' || status === 'success') && (
                    <button
                        onClick={onClose}
                        className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold uppercase tracking-widest transition-colors"
                    >
                        Fermer
                    </button>
                )}
            </motion.div>
        </div>
    );
};

export default PaymentStatusOverlay;
