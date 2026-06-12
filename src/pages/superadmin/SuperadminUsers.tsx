import { useEffect, useState } from 'react';
import { Users, Search, Ban, CheckCircle, ShieldAlert, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/Toast';
import { formatDate } from '@/utils/format';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  ban_status: 'active' | 'banned_pelanggan' | 'banned_mitra' | 'banned_permanent';
  ban_reason: string | null;
  banned_at: string | null;
  reportCount: number;
}

export default function SuperadminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pelanggan' | 'mitra'>('pelanggan');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banType, setBanType] = useState<'banned_pelanggan' | 'banned_mitra' | 'banned_permanent' | 'active'>('active');
  const [banReason, setBanReason] = useState('');
  
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Get all profiles except superadmin
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'superadmin');

      if (profilesError) throw profilesError;

      // Also get report counts for these users (where target_id = profile.id)
      const { data: reportsData } = await supabase
        .from('reports')
        .select('target_id');

      const reportCounts: Record<string, number> = {};
      (reportsData as any[])?.forEach(r => {
        if (r.target_id) {
          reportCounts[r.target_id] = (reportCounts[r.target_id] || 0) + 1;
        }
      });

      const processedUsers = profilesData.map((p: any) => ({
        ...p,
        reportCount: reportCounts[p.id] || 0,
        ban_status: p.ban_status || 'active',
        // Note: we don't have email in profiles directly if it's not stored there.
        // Usually email is only in auth.users. 
        // We will mock email or use a placeholder if it's not available in profiles.
        email: p.email || 'email-tidak-publik@digido.id' // Supabase doesn't expose auth.users by default
      }));

      setUsers(processedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Gagal memuat daftar pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateBanStatus = async () => {
    if (!selectedUser) return;
    setIsActionLoading(true);

    try {
      const updates = {
        ban_status: banType,
        ban_reason: banType === 'active' ? null : banReason,
        banned_at: banType === 'active' ? null : new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success(`Status akun ${selectedUser.full_name} berhasil diubah.`);
      setIsBanModalOpen(false);
      setBanReason('');
      fetchUsers();
    } catch (err) {
      console.error('Error updating ban status:', err);
      toast.error('Gagal mengubah status akun.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesTab = activeTab === 'pelanggan' ? u.role === 'pelanggan' : u.role === 'mitra';
    const matchesSearch = u.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-red-500" size={28} />
        <h1 className="text-2xl font-bold text-content-primary">Manajemen Pengguna</h1>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex bg-surface-secondary p-1 rounded-xl w-fit border border-border">
          <button
            onClick={() => setActiveTab('pelanggan')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === 'pelanggan' ? 'bg-surface-card text-red-500 shadow-sm' : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            Pelanggan
          </button>
          <button
            onClick={() => setActiveTab('mitra')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === 'mitra' ? 'bg-surface-card text-red-500 shadow-sm' : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            Mitra
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-content-placeholder" size={16} />
          <input
            type="text"
            placeholder="Cari nama pengguna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-card focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
        </div>
      </div>

      {/* User List */}
      <Card className="overflow-hidden border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary text-content-secondary uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-bold">Pengguna</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Registrasi</th>
                <th className="px-6 py-4 font-bold">Laporan</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={user.full_name.charAt(0)} size="sm" />
                        <div>
                          <p className="font-bold text-content-primary">{user.full_name}</p>
                          <p className="text-xs text-content-placeholder">{user.id.substring(0,8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.ban_status === 'active' ? (
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 w-fit">
                          <CheckCircle size={10} /> Aktif
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 w-fit">
                          <Ban size={10} /> {user.ban_status.replace('banned_', '')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-content-secondary">
                      {formatDate(user.created_at).split(',')[0]}
                    </td>
                    <td className="px-6 py-4">
                      {user.reportCount > 0 ? (
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                          {user.reportCount} Laporan
                        </span>
                      ) : (
                        <span className="text-content-placeholder text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                        className="text-xs"
                      >
                        Kelola
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-content-secondary italic">
                    Tidak ada data pengguna ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Detail Modal */}
      {selectedUser && !isBanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface-secondary/50">
              <h3 className="font-bold text-lg">Detail Pengguna</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-black/10 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar fallback={selectedUser.full_name.charAt(0)} size="lg" />
                <div>
                  <h4 className="text-xl font-bold">{selectedUser.full_name}</h4>
                  <p className="text-content-secondary text-sm">Role: <span className="uppercase font-bold">{selectedUser.role}</span></p>
                </div>
              </div>

              <div className="bg-surface-secondary p-4 rounded-xl space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-content-secondary">Status Akun</span>
                  <span className="font-bold uppercase text-xs">{selectedUser.ban_status.replace('_', ' ')}</span>
                </div>
                {selectedUser.ban_reason && (
                  <div className="flex justify-between">
                    <span className="text-content-secondary">Alasan Banned</span>
                    <span className="font-medium text-red-500 max-w-[60%] text-right">{selectedUser.ban_reason}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-content-secondary">ID Pengguna</span>
                  <span className="font-mono text-xs">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-secondary">Total Dilaporkan</span>
                  <span className="font-bold text-yellow-600">{selectedUser.reportCount} kali</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h5 className="font-bold text-sm text-content-secondary uppercase tracking-widest">Tindakan Administratif</h5>
                
                {selectedUser.ban_status === 'active' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="secondary" 
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                      onClick={() => { setBanType('banned_pelanggan'); setIsBanModalOpen(true); }}
                    >
                      Banned Pelanggan
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                      onClick={() => { setBanType('banned_mitra'); setIsBanModalOpen(true); }}
                    >
                      Banned Mitra
                    </Button>
                    <Button 
                      variant="danger" 
                      className="col-span-2"
                      onClick={() => { setBanType('banned_permanent'); setIsBanModalOpen(true); }}
                    >
                      <Ban size={16} className="mr-2" /> Banned Permanen
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="primary" 
                    fullWidth
                    onClick={() => { setBanType('active'); setIsBanModalOpen(true); }}
                  >
                    <CheckCircle size={16} className="mr-2" /> Pulihkan Akun (Unban)
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Ban Confirm Dialog */}
      {isBanModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-orange-500 p-6 text-center">
              <ShieldAlert size={40} className="mx-auto text-white mb-2" />
              <h3 className="text-xl font-bold text-white">Konfirmasi Tindakan</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-content-primary">
                Anda akan mengubah status akun <strong>{selectedUser.full_name}</strong> menjadi <span className="font-bold uppercase text-orange-600">{banType.replace('_', ' ')}</span>.
              </p>
              
              {banType !== 'active' && (
                <div>
                  <label className="block text-xs font-bold text-content-secondary mb-1">Alasan (Wajib diisi)</label>
                  <Input 
                    placeholder="Contoh: Melanggar aturan berulang kali..."
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" fullWidth onClick={() => setIsBanModalOpen(false)}>Batal</Button>
                <Button 
                  variant="primary" 
                  fullWidth 
                  onClick={handleUpdateBanStatus}
                  isLoading={isActionLoading}
                  disabled={banType !== 'active' && !banReason.trim()}
                  className="bg-orange-500 hover:bg-orange-600 border-none text-white"
                >
                  Konfirmasi
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
