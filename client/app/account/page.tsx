'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function getStrength(p: string) {
  const checks = {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-400', 'bg-emerald-500'];
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  return { score, color: colors[score], label: labels[score] };
}

interface SellerProfile {
  businessName: string; businessType: string; location: string;
  latitude: string; longitude: string; phone: string; description: string;
}

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState({ username: '', email: '', phone: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [sellerProfile, setSellerProfile] = useState<SellerProfile>({
    businessName: '', businessType: 'agro-dealer', location: '',
    latitude: '', longitude: '', phone: '', description: '',
  });
  const [sellerMsg, setSellerMsg] = useState('');
  const [sellerError, setSellerError] = useState(false);
  const [savingSeller, setSavingSeller] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user) {
      setProfile({ username: user.username, email: user.email, phone: user.phone || '' });
      if (user.role === 'seller') {
        api.get('/sellers').then(r => {
          const mine = r.data.find((s: { user: { _id?: string; id?: string } }) =>
            s.user?._id === user.id || s.user?.id === user.id
          );
          if (mine) setSellerProfile({
            businessName: mine.businessName || '',
            businessType: mine.businessType || 'agro-dealer',
            location: mine.location || '',
            latitude: String(mine.latitude || ''),
            longitude: String(mine.longitude || ''),
            phone: mine.phone || '',
            description: mine.description || '',
          });
        }).catch(() => {});
      }
    }
  }, [user, authLoading]);

  const strength = getStrength(passwords.newPassword);
  const passwordsMatch = passwords.confirmPassword === '' ? null : passwords.newPassword === passwords.confirmPassword;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true); setProfileMsg(''); setProfileError(false);
    try {
      await api.put('/auth/me', { username: profile.username, email: profile.email, phone: profile.phone });
      setProfileMsg('Profile updated successfully.');
    } catch (err: unknown) {
      setProfileMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed.');
      setProfileError(true);
    } finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) { setPasswordMsg('Passwords do not match.'); setPasswordError(true); return; }
    if (strength.score < 3) { setPasswordMsg('Please choose a stronger password.'); setPasswordError(true); return; }
    setSavingPassword(true); setPasswordMsg(''); setPasswordError(false);
    try {
      await api.put('/auth/me', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswordMsg('Password changed successfully.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      setPasswordMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password.');
      setPasswordError(true);
    } finally { setSavingPassword(false); }
  };

  const handleSellerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSeller(true); setSellerMsg(''); setSellerError(false);
    try {
      await api.put('/sellers/me', {
        ...sellerProfile,
        latitude: Number(sellerProfile.latitude),
        longitude: Number(sellerProfile.longitude),
      });
      setSellerMsg('Business profile updated successfully.');
    } catch (err: unknown) {
      setSellerMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed.');
      setSellerError(true);
    } finally { setSavingSeller(false); }
  };

  if (authLoading || !user) return <div className="flex items-center justify-center min-h-64 text-stone-400 text-sm">Loading...</div>;

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    seller: 'bg-amber-100 text-amber-700',
    farmer: 'bg-emerald-100 text-emerald-700',
  };

  const Msg = ({ msg, error }: { msg: string; error: boolean }) => (
    <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-5 border ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
      <span>{error ? '⚠' : '✓'}</span><span>{msg}</span>
    </div>
  );

  const Spinner = () => <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white text-2xl font-bold flex items-center justify-center shadow-sm">
          {user.username[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-stone-800">{user.username}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${roleColors[user.role]}`}>{user.role}</span>
            <span className="text-stone-400 text-xs">{user.email}</span>
          </div>
        </div>
        <Link href={user.role === 'admin' ? '/dashboard/admin' : user.role === 'seller' ? '/dashboard/seller' : '/'} className="btn-outline text-xs px-3 py-2">
          ← Back
        </Link>
      </div>

      {/* Profile Info */}
      <div className="card p-6 mb-5">
        <h2 className="font-bold text-stone-800 mb-1">Profile Information</h2>
        <p className="text-stone-400 text-sm mb-5">Update your name, email and phone number</p>
        {profileMsg && <Msg msg={profileMsg} error={profileError} />}
        <form onSubmit={handleProfileSave} className="space-y-3">
          <div className="field">
            <input type="text" required placeholder=" " value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} className="input-base" />
            <label>Username</label>
          </div>
          <div className="field">
            <input type="email" required placeholder=" " value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="input-base" />
            <label>Email Address</label>
          </div>
          <div className="field">
            <input type="tel" placeholder=" " value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="input-base" />
            <label>Phone <span className="text-stone-300 normal-case tracking-normal font-normal">(optional)</span></label>
          </div>
          <div className="pt-1">
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? <span className="flex items-center gap-2"><Spinner />Saving...</span> : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Seller Business Profile */}
      {user.role === 'seller' && (
        <div className="card p-6 mb-5">
          <h2 className="font-bold text-stone-800 mb-1">Business Profile</h2>
          <p className="text-stone-400 text-sm mb-5">Update your business details shown to farmers</p>
          {sellerMsg && <Msg msg={sellerMsg} error={sellerError} />}
          <form onSubmit={handleSellerSave} className="space-y-3">
            <div className="field">
              <input required placeholder=" " value={sellerProfile.businessName} onChange={e => setSellerProfile({ ...sellerProfile, businessName: e.target.value })} className="input-base" />
              <label>Business Name</label>
            </div>
            <div className="field">
              <select value={sellerProfile.businessType} onChange={e => setSellerProfile({ ...sellerProfile, businessType: e.target.value })} className="input-base select-field">
                <option value="agro-dealer">Agro-dealer</option>
                <option value="nursery">Nursery Operator</option>
                <option value="farmer-producer">Farmer Producer</option>
              </select>
              <label>Business Type</label>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none text-xs">▾</span>
            </div>
            <div className="field">
              <input required placeholder=" " value={sellerProfile.location} onChange={e => setSellerProfile({ ...sellerProfile, location: e.target.value })} className="input-base" />
              <label>Location</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <input placeholder=" " value={sellerProfile.latitude} onChange={e => setSellerProfile({ ...sellerProfile, latitude: e.target.value })} className="input-base" />
                <label>Latitude</label>
              </div>
              <div className="field">
                <input placeholder=" " value={sellerProfile.longitude} onChange={e => setSellerProfile({ ...sellerProfile, longitude: e.target.value })} className="input-base" />
                <label>Longitude</label>
              </div>
            </div>
            <p className="text-xs text-stone-400 px-1">
              💡 Right-click your location on{' '}
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Google Maps</a>
              {' '}to get coordinates.
            </p>
            <div className="field">
              <input type="tel" placeholder=" " value={sellerProfile.phone} onChange={e => setSellerProfile({ ...sellerProfile, phone: e.target.value })} className="input-base" />
              <label>Business Phone <span className="text-stone-300 normal-case tracking-normal font-normal">(optional)</span></label>
            </div>
            <div className="field">
              <textarea rows={3} placeholder=" " value={sellerProfile.description} onChange={e => setSellerProfile({ ...sellerProfile, description: e.target.value })} className="input-base textarea-field" />
              <label>Description <span className="text-stone-300 normal-case tracking-normal font-normal">(optional)</span></label>
            </div>
            <div className="pt-1">
              <button type="submit" disabled={savingSeller} className="btn-primary">
                {savingSeller ? <span className="flex items-center gap-2"><Spinner />Saving...</span> : 'Save Business Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="font-bold text-stone-800 mb-1">Change Password</h2>
        <p className="text-stone-400 text-sm mb-5">Leave blank if you don't want to change it</p>
        {passwordMsg && <Msg msg={passwordMsg} error={passwordError} />}
        <form onSubmit={handlePasswordSave} className="space-y-3">
          <div className="field">
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} required placeholder=" " value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} className="input-base pr-11" />
              <label>Current Password</label>
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-sm">{showCurrent ? '🙈' : '👁'}</button>
            </div>
          </div>
          <div className="field">
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} required placeholder=" " value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} className="input-base pr-11" />
              <label>New Password</label>
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-sm">{showNew ? '🙈' : '👁'}</button>
            </div>
            {passwords.newPassword.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-stone-200'}`} />)}
                </div>
                <p className={`text-xs font-medium ${strength.score <= 2 ? 'text-red-500' : strength.score === 3 ? 'text-yellow-500' : 'text-emerald-600'}`}>{strength.label}</p>
              </div>
            )}
          </div>
          <div className="field">
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} required placeholder=" " value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} className={`input-base pr-11 ${passwordsMatch === false ? 'border-red-400' : passwordsMatch === true ? 'border-emerald-400' : ''}`} />
              <label>Confirm New Password</label>
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-sm">{showConfirm ? '🙈' : '👁'}</button>
              {passwordsMatch !== null && <span className={`absolute right-9 top-1/2 -translate-y-1/2 text-sm ${passwordsMatch ? 'text-emerald-500' : 'text-red-500'}`}>{passwordsMatch ? '✓' : '✗'}</span>}
            </div>
            {passwordsMatch === false && <p className="text-red-500 text-xs mt-1">Passwords do not match</p>}
          </div>
          <div className="pt-1">
            <button type="submit" disabled={savingPassword || passwordsMatch === false || strength.score < 3} className="btn-primary disabled:opacity-40">
              {savingPassword ? <span className="flex items-center gap-2"><Spinner />Changing...</span> : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
