"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    TrendingUp,
    DollarSign,
    Clock,
    Search,
    RefreshCw,
    Activity,
    CheckCircle,
    XCircle,
    AlertCircle,
    ArrowRight,
    Lock,
    Wallet,
    ArrowDownCircle
} from 'lucide-react';
import SanzaTrophy from '@/components/ui/SanzaTrophy';
import Link from 'next/link';
import { useVotes } from '@/components/context/VoteContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import api from '@/components/services/api';
import { useAdminTour } from '@/components/AdminTour';
import AdminGuideBook from '@/components/AdminGuideBook';
import { HelpCircle } from 'lucide-react';

const AdminPage = () => {
    const { nominees, getTotalVotes, useBackend, categories } = useVotes();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Dashboard data from API
    const [stats, setStats] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [topNominees, setTopNominees] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [walletBalance, setWalletBalance] = useState<any>(null);
    const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawPhone, setWithdrawPhone] = useState('');
    const [withdrawService, setWithdrawService] = useState<'MTN' | 'ORANGE'>('MTN');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // Guide Book State
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const { startTour } = useAdminTour();
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            verifyToken(token);
        }
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const verifyToken = async (token: string) => {
        try {
            const result = await (api as any).verifyToken();
            if (result.valid) {
                setIsAuthenticated(true);
                setIsAuthenticated(true);
                fetchDashboardData();

                // Trigger tour if first time
                if (!localStorage.getItem('hasSeenAdminTour')) {
                    setTimeout(() => {
                        startTour();
                        localStorage.setItem('hasSeenAdminTour', 'true');
                    }, 1000);
                }
            } else {
                localStorage.removeItem('adminToken');
            }
        } catch (err) {
            localStorage.removeItem('adminToken');
        }
    };

    const fetchDashboardData = useCallback(async () => {
        try {
            const [statsData, txData, topData, balanceData, historyData] = await Promise.all([
                (api as any).admin.getStats(),
                (api as any).admin.getTransactions({ limit: 50 }),
                (api as any).admin.getTopNominees(5),
                (api as any).admin.getBalance(),
                (api as any).admin.getWithdrawalHistory(),
            ]);
            setStats(statsData);
            setTransactions(txData.transactions || []);
            setTopNominees(topData || []);
            setWalletBalance(balanceData);
            setWithdrawHistory(historyData.withdrawals || []);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            // Fall back to local data
            if (!useBackend) {
                setStats({
                    totalVotes: 0,
                    totalRevenue: 0,
                    totalTransactions: 0,
                    successfulTransactions: 0,
                    pendingTransactions: 0,
                    failedTransactions: 0,
                    successRate: 0
                });
            }
        }
    }, [useBackend]);

    // Auto-refresh dashboard data every 10 seconds
    useEffect(() => {
        if (isAuthenticated) {
            fetchDashboardData();
            const interval = setInterval(fetchDashboardData, 10000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, fetchDashboardData]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Try backend API first
            const result = await (api as any).login(email || 'admin', password);
            if (result.success && result.token) {
                localStorage.setItem('adminToken', result.token);
                setIsAuthenticated(true);
                setError('');
                fetchDashboardData();
            } else {
                setError('Identifiants invalides');
            }
        } catch (err: any) {
            // Fallback to hardcoded password for offline mode
            if (password === 'parrot') {
                setIsAuthenticated(true);
                setError('');
            } else {
                setError(err.message || 'Échec de la connexion');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
        setStats(null);
        setTransactions([]);
        setWalletBalance(null);
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!withdrawAmount || !withdrawPhone) return;

        setIsWithdrawing(true);
        try {
            const result = await (api as any).admin.withdraw({
                amount: parseInt(withdrawAmount),
                service: withdrawService,
                receiver: withdrawPhone
            });

            if (result.success) {
                alert('Retrait réussi !');
                setIsWithdrawModalOpen(false);
                setWithdrawAmount('');
                setWithdrawPhone('');
                fetchDashboardData();
            }
        } catch (err: any) {
            alert(err.message || 'Échec du retrait');
        } finally {
            setIsWithdrawing(false);
        }
    };

    const formatVotes = (votes: any) => {
        if (typeof votes === 'string') {
            if (votes.includes('M') || votes.includes('k')) return votes;
            votes = parseFloat(votes);
        }
        if (typeof votes === 'number') {
            if (votes >= 1000000) return `${(votes / 1000000).toFixed(1)}M`;
            if (votes >= 1000) return `${(votes / 1000).toFixed(1)}k`;
            return votes.toString();
        }
        return votes || '0';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
            case 'completed':
                return <CheckCircle size={14} className="text-green-500" />;
            case 'failed':
                return <XCircle size={14} className="text-red-500" />;
            case 'pending':
                return <AlertCircle size={14} className="text-yellow-500" />;
            default:
                return <Clock size={14} className="text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
            case 'completed': return 'text-green-500';
            case 'failed': return 'text-red-500';
            case 'pending': return 'text-yellow-500';
            default: return 'text-gray-500';
        }
    };

    const filteredTransactions = statusFilter === 'all'
        ? transactions
        : transactions.filter(tx => tx.status === statusFilter);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden text-white">
                {/* Background Gradients */}
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px]" />
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-[#1a1a1a] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative z-10"
                >
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center border border-secondary/30 mb-4">
                            <Lock className="text-secondary" size={32} />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight mb-2">Accès Administrateur</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Entrez vos identifiants pour continuer</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email (facultatif)"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-secondary transition-colors font-bold text-sm text-white mb-3"
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mot de passe"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-secondary transition-colors font-bold text-sm text-white"
                            />
                            {error && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-widest">{error}</p>}
                        </div>
                        <Button type="submit" className="w-full py-4 rounded-2xl font-bold" disabled={isLoading}>
                            {isLoading ? 'Connexion...' : 'Se connecter au Tableau de bord'}
                        </Button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-32 relative overflow-hidden scrollbar-hide">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px]" />
            </div>
            {/* Header */}
            <div className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-4" id="admin-header">
                    <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center border border-secondary/30">
                        <LayoutDashboard className="text-secondary" size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight">Tableau de bord Admin</h1>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            <Clock size={10} />
                            {currentTime.toLocaleTimeString()} • {currentTime.toLocaleDateString()}
                            {useBackend && <span className="text-green-500 ml-2">● LIVE</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        className="text-xs font-bold uppercase tracking-widest"
                        onClick={fetchDashboardData}
                    >
                        <RefreshCw size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        className="text-xs font-bold uppercase tracking-widest"
                        onClick={handleLogout}
                    >
                        Déconnexion
                    </Button>
                    <Button
                        variant="ghost"
                        className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                        onClick={() => setIsGuideOpen(true)}
                    >
                        <HelpCircle size={14} />
                        Guide
                    </Button>
                    <Link href="/">
                        <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest">
                            Quitter
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="p-6 space-y-8 relative z-10 max-w-7xl mx-auto">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
                    <Card className="p-6 border-none bg-[#1a1a1a] rounded-[2rem] relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Activity size={100} />
                        </div>
                        <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-2">Total des Votes</p>
                        <h2 className="text-3xl font-black tracking-tighter">
                            {stats ? formatVotes(stats.totalVotes) : getTotalVotes()}
                        </h2>
                    </Card>

                    {/* Live Wallet Balance */}
                    <Card className="p-6 border-none bg-[#1a1a1a] rounded-[2rem] relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Wallet size={100} />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1">Portefeuille</p>
                                <h2 className="text-3xl font-black tracking-tighter">
                                    {walletBalance ? walletBalance.balance.toLocaleString() : '---'}
                                    <span className="text-xs ml-1">XAF</span>
                                </h2>
                            </div>
                            <Button
                                className="mt-4 bg-secondary text-black hover:bg-secondary/90 border-none rounded-xl py-2 px-4 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 w-full transition-all shadow-[0_10px_20px_-5px_rgba(253,185,49,0.3)]"
                                onClick={() => setIsWithdrawModalOpen(true)}
                            >
                                <ArrowDownCircle size={14} />
                                Retirer des Fonds
                            </Button>
                        </div>
                    </Card>
                    <Card className="p-6 border-none bg-[#1a1a1a] rounded-[2rem] relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users size={100} />
                        </div>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-2">Transactions</p>
                        <h2 className="text-3xl font-black tracking-tighter">
                            {stats ? stats.totalTransactions : transactions.length}
                        </h2>
                    </Card>
                    <Card className="p-6 border-none bg-[#1a1a1a] rounded-[2rem] relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp size={100} />
                        </div>
                        <p className="text-[10px] text-purple-500 font-bold uppercase tracking-widest mb-2">Taux de Réussite</p>
                        <h2 className="text-3xl font-black tracking-tighter">
                            {stats ? `${stats.successRate}%` : '0%'}
                        </h2>
                    </Card>
                </div>

                {/* Transaction Status Summary */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="status-summary">
                        <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="text-green-500" size={20} />
                                <span className="text-sm font-bold">Succès</span>
                            </div>
                            <span className="text-2xl font-black text-green-500">{stats.successfulTransactions}</span>
                        </div>
                        <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="text-yellow-500" size={20} />
                                <span className="text-sm font-bold">En attente</span>
                            </div>
                            <span className="text-2xl font-black text-yellow-500">{stats.pendingTransactions}</span>
                        </div>
                        <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <XCircle className="text-red-500" size={20} />
                                <span className="text-sm font-bold">Échoué</span>
                            </div>
                            <span className="text-2xl font-black text-red-500">{stats.failedTransactions}</span>
                        </div>
                    </div>
                )}

                {/* Real-time Monitoring */}
                <div id="live-transactions">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                            <Activity size={16} className="text-secondary" />
                            Transactions en Direct
                        </h3>
                        <div className="flex items-center gap-4">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-[#1a1a1a] border border-white/10 rounded-xl py-2 px-4 text-xs font-bold uppercase text-white"
                            >
                                <option value="all">Tous les Statuts</option>
                                <option value="success">Succès</option>
                                <option value="pending">En attente</option>
                                <option value="failed">Échoué</option>
                            </select>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Temps réel</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredTransactions.length === 0 ? (
                            <div className="p-12 text-center bg-[#1a1a1a] rounded-[2rem] border border-white/5">
                                <Clock size={48} className="mx-auto mb-4 text-gray-700" />
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Aucune transaction pour le moment</p>
                            </div>
                        ) : (
                            filteredTransactions.map((tx, index) => (
                                <motion.div
                                    key={tx.id || index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 bg-[#1a1a1a] rounded-2xl border border-white/5 flex items-center justify-between group hover:border-secondary/30 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-secondary">
                                            {tx.payment_method === 'MOMO' ? 'MTN' : 'OM'}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold">{tx.nominee_name || 'Unknown'}</h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                {new Date(tx.created_at || tx.timestamp || tx.createdAt || Date.now()).toLocaleTimeString()} • {tx.payer || tx.phoneNumber || 'Unknown'}
                                            </p>
                                            {tx.status === 'failed' && (
                                                <p className="text-[9px] text-red-500 font-bold mt-1 max-w-[200px] truncate">
                                                    {tx.error || tx.error_message || 'Erreur inconnue'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <p className="text-sm font-black text-white">+{tx.amount} XAF</p>
                                            <div className={`text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 justify-end ${getStatusColor(tx.status)}`}>
                                                {getStatusIcon(tx.status)}
                                                {tx.status === 'pending' ? 'EN ATTENTE' : tx.status === 'success' ? 'SUCCÈS' : 'ÉCHOUÉ'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Withdrawal History Section */}
                <div id="withdraw-history" className="mt-12">
                    <h3 className="text-sm font-black tracking-tight mb-6 flex items-center gap-2">
                        <ArrowDownCircle size={16} className="text-secondary" />
                        Historique des Retraits ({withdrawHistory.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {withdrawHistory.length === 0 ? (
                            <div className="col-span-full p-12 text-center bg-[#1a1a1a] rounded-[2rem] border border-white/5">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Aucun historique de retrait</p>
                            </div>
                        ) : (
                            withdrawHistory.slice(0, 6).map((item) => (
                                <div key={item.id} className="p-5 bg-[#1a1a1a] rounded-[2rem] border border-white/5 group hover:border-secondary/30 transition-all text-left">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${item.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {item.status}
                                        </div>
                                        <span className="text-[9px] text-gray-500 font-bold">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{item.service}</p>
                                            <p className="text-sm font-black truncate">{item.receiver}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-white">-{item.amount.toLocaleString()}</p>
                                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">XAF</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Nominees */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div id="top-nominees">
                        <h3 className="text-sm font-black tracking-tight mb-6 flex items-center gap-2">
                            <SanzaTrophy size={16} />
                            Top Nommés
                        </h3>
                        <div className="space-y-3">
                            {(topNominees.length > 0 ? topNominees : nominees.slice(0, 5)).map((nominee, index) => (
                                <div key={nominee.id} className="p-4 bg-[#1a1a1a] rounded-2xl border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center font-black text-xs text-secondary">
                                            #{index + 1}
                                        </div>
                                        <h4 className="text-sm font-bold">{nominee.name}</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white">
                                            {formatVotes(nominee.votes_display || nominee.votes)}
                                        </p>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Total des Votes</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div id="categories-grid">
                        <h3 className="text-sm font-black tracking-tight mb-6 flex items-center gap-2">
                            <LayoutDashboard size={16} className="text-secondary" />
                            Gestion des Catégories ({categories.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {categories.map((category) => (
                                <div key={category.id} className="p-4 bg-[#1a1a1a] rounded-2xl border border-white/5 flex items-center justify-between group hover:border-secondary/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                                            <img src={category.image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold truncate max-w-[150px]">{category.title}</h4>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{category.nominees}</p>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white/5 text-gray-500 group-hover:text-secondary transition-colors">
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <AdminGuideBook isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

                {/* Withdrawal Modal */}
                {isWithdrawModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsWithdrawModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="relative w-full max-w-md bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
                        >
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 mx-auto mb-4">
                                    <ArrowDownCircle className="text-secondary" size={32} />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight mb-2">Retrait de Fonds</h2>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Transférez vos revenus vers Mobile Money</p>
                            </div>

                            <form onSubmit={handleWithdraw} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setWithdrawService('MTN')}
                                        className={`py-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${withdrawService === 'MTN' ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                    >
                                        <span className="font-black text-xs uppercase tracking-widest">MTN MOMO</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWithdrawService('ORANGE')}
                                        className={`py-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${withdrawService === 'ORANGE' ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                    >
                                        <span className="font-black text-xs uppercase tracking-widest">Orange Money</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-4 mb-2 block">Numéro de téléphone</label>
                                        <input
                                            type="tel"
                                            placeholder="6XXXXXXXX"
                                            value={withdrawPhone}
                                            onChange={(e) => setWithdrawPhone(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-secondary transition-colors font-bold text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-4 mb-2 block">Montant (XAF)</label>
                                        <input
                                            type="number"
                                            placeholder="Ex: 5000"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-secondary transition-colors font-bold text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full py-4 rounded-2xl font-black uppercase tracking-widest"
                                        disabled={isWithdrawing || !withdrawAmount || !withdrawPhone}
                                    >
                                        {isWithdrawing ? 'Traitement...' : 'Confirmer le Retrait'}
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setIsWithdrawModalOpen(false)}
                                        className="w-full mt-2 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
