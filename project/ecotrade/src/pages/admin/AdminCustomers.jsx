import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Mail, Phone, ChevronLeft, ChevronRight, Loader2, User, Eye, ArrowUpCircle, ShieldCheck, XCircle, Users, BadgeCheck } from 'lucide-react';
import { fetchAllUsers } from '../../store/slices/adminSlice';
import { adminAPI } from '../../api/AdminAPI';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';

const AdminCustomers = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.admin);
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const filteredUsers = users?.filter(u => {
    if (u._id === currentUser?._id) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(searchLower) ||
      (u.email || '').toLowerCase().includes(searchLower) ||
      (u.companyName || '').toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleUpgrade = async (userId, planType, userType, extra = {}) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await adminAPI.upgradeUser(userId, { planType, userType, manufacturerStatus: 'ACTIVE', ...extra }, token);
      showSuccess(`User permissions updated!`);
      dispatch(fetchAllUsers());
      // Keep selected user updated
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser(prev => ({ ...prev, ...extra, userType, subscription: { ...prev.subscription, planType } }));
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (userId, status) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await adminAPI.updateStatus(userId, status, token);
      showSuccess(`User status updated to ${status}`);
      dispatch(fetchAllUsers());
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading && users?.length === 0) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {!selectedUser ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search users, companies, emails..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all font-bold"
              />
            </div>
            <div className="flex items-center gap-2 px-6 py-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-xl shadow-blue-500/5">
              <Users size={18} className="text-blue-500" />
              <span className="text-sm font-black text-blue-100">{filteredUsers.length} Active Accounts</span>
            </div>
          </div>

          <div className="bg-[#010a1a] rounded-2xl sm:rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="responsive-table-wrap">
              <table className="w-full text-left border-collapse">
                <thead className="bg-black/40 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-4 sm:px-8 py-4 sm:py-6">Identity & Trust</th>
                    <th className="px-4 sm:px-8 py-4 sm:py-6">Engagement Role</th>
                    <th className="px-4 sm:px-8 py-4 sm:py-6">Subscription</th>
                    <th className="px-4 sm:px-8 py-4 sm:py-6 text-right">Administrative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-xl">
                            {u.fullName?.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <p className="font-black text-white text-lg tracking-tight">{u.fullName}</p>
                               {u.manufacturerSettings?.isVerified && <BadgeCheck size={18} className="text-blue-500 fill-blue-500/10" />}
                            </div>
                            <p className="text-xs text-gray-500 font-bold">{u.companyName || 'No Company'} • {u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          u.userType === 'HYBRID' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          u.userType === 'MANUFACTURER' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {u.userType}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className={`text-xs font-black tracking-widest uppercase ${
                             u.subscription?.planType === 'ENTERPRISE' ? 'text-yellow-500' :
                             u.subscription?.planType === 'PRO' ? 'text-blue-400' :
                             'text-gray-400'
                           }`}>
                             {u.subscription?.planType || 'FREE'}
                           </span>
                           <span className="text-[10px] text-gray-600 font-bold">Manual Access</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => setSelectedUser(u)}
                            className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black text-white border border-white/10 transition-all flex items-center gap-2"
                          >
                             Manage <ChevronRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-[#020b1c] rounded-2xl sm:rounded-[3rem] border border-white/10 p-4 sm:p-8 lg:p-12 max-w-3xl mx-auto animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-white">
             <ShieldCheck size={200} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8 sm:mb-12">
              <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                <button onClick={() => setSelectedUser(null)} className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-gray-400 transition-all"><ChevronLeft size={24} /></button>
                <div className="min-w-0">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Administrative Override</p>
                   <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tighter">Permissions Console</h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8 sm:mb-12">
              <div className="p-5 sm:p-8 bg-white/5 rounded-2xl sm:rounded-[2rem] border border-white/10 hover:border-blue-500/30 transition-all group">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-4 flex items-center gap-2">
                   Strategic Identity <BadgeCheck size={14} className={selectedUser.manufacturerSettings?.isVerified ? 'text-blue-500' : 'text-gray-700'} />
                </p>
                <div className="flex items-center justify-between">
                   <p className="text-2xl font-black text-white">{selectedUser.fullName}</p>
                   <button 
                    onClick={() => handleUpgrade(selectedUser._id, selectedUser.subscription?.planType || 'FREE', selectedUser.userType, { isVerified: !selectedUser.manufacturerSettings?.isVerified })}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black font-black uppercase transition-all ${
                      selectedUser.manufacturerSettings?.isVerified ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500 border border-white/10'
                    }`}
                   >
                     {selectedUser.manufacturerSettings?.isVerified ? 'Verified Elite' : 'Standard Account'}
                   </button>
                </div>
              </div>
              <div className="p-5 sm:p-8 bg-white/5 rounded-2xl sm:rounded-[2rem] border border-white/10">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-4">Engagement Hub</p>
                <p className="text-2xl font-black text-purple-400">{selectedUser.userType}</p>
                <p className="text-[10px] text-gray-600 font-bold font-bold mt-2">ACCOUNT ID: {selectedUser._id.toString().slice(-12).toUpperCase()}</p>
              </div>
            </div>

            <div className="space-y-12">
              <section>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Subscription Tier Assignment</p>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {['FREE', 'STANDARD', 'PRO', 'ENTERPRISE'].map(plan => (
                    <button 
                      key={plan}
                      onClick={() => handleUpgrade(selectedUser._id, plan, selectedUser.userType)}
                      disabled={isUpdating}
                      className={`py-5 rounded-2xl border transition-all font-black text-[10px] tracking-widest ${
                        (selectedUser.subscription?.planType || 'FREE') === plan
                          ? 'bg-[#4881F8] border-[#4881F8] text-white shadow-xl shadow-blue-500/20'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:border-blue-500/30'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Core Behavioral Role</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {['BUYER', 'MANUFACTURER', 'HYBRID'].map(role => (
                    <button 
                      key={role}
                      onClick={() => handleUpgrade(selectedUser._id, selectedUser.subscription?.planType || 'FREE', role)}
                      disabled={isUpdating}
                      className={`py-5 rounded-2xl border transition-all font-black text-[10px] tracking-widest ${
                        selectedUser.userType === role
                          ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-500/20'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:border-purple-500/30'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-10 sm:mt-16 pt-8 sm:pt-10 border-t border-white/5 flex flex-col sm:flex-row gap-4 sm:gap-6">
              <button 
                onClick={() => handleStatusUpdate(selectedUser._id, selectedUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  selectedUser.status === 'ACTIVE' ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 text-white'
                }`}
              >
                {selectedUser.status === 'ACTIVE' ? 'Suspend Infrastructure' : 'Authorize Infrastructure'}
              </button>
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-12 py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
              >
                Sync Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;