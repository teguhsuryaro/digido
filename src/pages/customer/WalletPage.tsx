import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { formatRupiah, formatDate } from '@/utils/format';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Info } from 'lucide-react';
import PageTransition from '@/components/ui/PageTransition';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

interface WalletState {
  id: string;
  balance: number;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  created_at: string;
}

export default function WalletPage() {
  const user = useAuthStore((s) => s.user);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // 1. Fetch wallet balance
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', user.id)
          .single();

        if (walletError) throw walletError;
        setWallet(walletData as any);

        // 2. Fetch transactions
        const { data: txData, error: txError } = await supabase
          .from('wallet_transactions')
          .select('id, type, amount, description, created_at')
          .eq('wallet_id', (walletData as any).id)
          .order('created_at', { ascending: false });

        if (txError) throw txError;
        setTransactions((txData as any) || []);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Dompet DigiDO</h1>
          <p className="text-sm text-content-secondary mt-1">
            Pantau saldo refund dan riwayat transaksi Anda.
          </p>
        </div>

        {/* Saldo Card */}
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-card" />
        ) : (
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-card p-6 text-white shadow-lg shadow-primary-500/20">
            <p className="text-primary-100 text-sm font-medium">Saldo Saat Ini</p>
            <h2 className="text-3xl font-extrabold mt-1">
              {formatRupiah(wallet?.balance || 0)}
            </h2>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-primary-100 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Info size={12} className="shrink-0" />
              <span>Saldo berasal dari pengembalian dana (refund). Tidak tersedia fitur Top-Up.</span>
            </div>
          </div>
        )}

        {/* Riwayat Transaksi */}
        <section>
          <h3 className="text-lg font-bold text-content-primary mb-4">Riwayat Transaksi</h3>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-card" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {transactions.map((tx) => (
                <WalletTransactionItem key={tx.id} transaction={tx} />
              ))}
            </div>
          ) : (
            <Card className="py-16 text-center flex flex-col items-center justify-center">
              <div className="text-content-placeholder opacity-40 mb-3">
                <Wallet size={48} />
              </div>
              <p className="text-content-secondary text-sm">Belum ada transaksi dompet.</p>
            </Card>
          )}
        </section>
      </div>
    </PageTransition>
  );
}

function WalletTransactionItem({ transaction }: { transaction: Transaction }) {
  const isCredit = transaction.type === 'credit';

  return (
    <Card className="p-4 transition-base hover:border-primary-500/30 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isCredit 
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {isCredit ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
        </div>
        
        {/* Info */}
        <div className="min-w-0">
          <p className="font-bold text-content-primary text-sm truncate">
            {isCredit ? 'Refund' : 'Pembayaran'}
          </p>
          <p className="text-xs text-content-secondary mt-0.5 truncate max-w-[150px] sm:max-w-[200px]">
            {transaction.description}
          </p>
          <p className="text-[10px] text-content-placeholder mt-1">
            {formatDate(transaction.created_at)}
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className={`text-right font-bold text-sm whitespace-nowrap pl-2 ${
        isCredit ? 'text-green-600 dark:text-green-400' : 'text-content-primary'
      }`}>
        {isCredit ? '+' : '-'}{formatRupiah(transaction.amount)}
      </div>
    </Card>
  );
}
