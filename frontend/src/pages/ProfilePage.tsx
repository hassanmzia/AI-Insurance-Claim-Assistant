import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InsurancePolicy } from '../types';
import api from '../services/api';

const POLICY_TYPE_LABELS: Record<string, string> = {
  auto: 'Auto Insurance',
  home: 'Home Insurance',
  health: 'Health Insurance',
  life: 'Life Insurance',
  commercial: 'Commercial Insurance',
};

const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Profile form
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteErr, setDeleteErr] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Policies
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
  const [policyType, setPolicyType] = useState('');
  const [policyMsg, setPolicyMsg] = useState('');

  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: (user as any).phone || '',
      });
    }
    api.getPolicies().then((res) => setPolicies(res.results || [])).catch(() => {});
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    setProfileLoading(true);
    try {
      await api.updateProfile(profile);
      await refreshUser();
      setProfileMsg('Profile updated successfully.');
    } catch (err: any) {
      setProfileErr(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    if (passwords.new_password !== passwords.confirm_password) {
      setPwErr('New passwords do not match.');
      return;
    }
    if (passwords.new_password.length < 8) {
      setPwErr('New password must be at least 8 characters.');
      return;
    }
    setPwLoading(true);
    try {
      await api.changePassword(passwords.current_password, passwords.new_password);
      setPwMsg('Password changed successfully.');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setPwErr(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteErr('');
    setDeleteLoading(true);
    try {
      await api.deleteAccount(deletePassword);
      logout();
      navigate('/login');
    } catch (err: any) {
      setDeleteErr(err.response?.data?.error || 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePolicyTypeUpdate = async (policyId: string) => {
    setPolicyMsg('');
    try {
      await api.updatePolicy(policyId, { policy_type: policyType });
      const res = await api.getPolicies();
      setPolicies(res.results || []);
      setEditingPolicy(null);
      setPolicyMsg('Insurance type updated successfully.');
    } catch (err: any) {
      setPolicyMsg('Failed to update insurance type.');
    }
  };

  const sectionStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    border: '1px solid #e5e7eb',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#111827',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box',
  };

  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px',
    background: '#1a56db',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
  };

  const btnDanger: React.CSSProperties = {
    ...btnPrimary,
    background: '#dc2626',
  };

  const msgSuccess: React.CSSProperties = {
    padding: '10px 14px',
    background: '#ecfdf5',
    color: '#065f46',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '14px',
  };

  const msgError: React.CSSProperties = {
    padding: '10px 14px',
    background: '#fef2f2',
    color: '#991b1b',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '14px',
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    manager: 'Claims Manager',
    adjuster: 'Claims Adjuster',
    reviewer: 'QA Reviewer',
    agent: 'Insurance Agent',
    customer: 'Customer',
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>My Profile</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
        Manage your account settings, insurance policies, and security
      </p>

      {/* Account Info */}
      <div style={sectionStyle}>
        <h2 style={headingStyle}>Account Information</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: '#1a56db', color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 700,
          }}>
            {(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '') || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{ color: '#6b7280', fontSize: '13px' }}>
              @{user?.username} &middot; {roleLabels[user?.role || ''] || user?.role}
            </div>
          </div>
        </div>

        {profileMsg && <div style={msgSuccess}>{profileMsg}</div>}
        {profileErr && <div style={msgError}>{profileErr}</div>}

        <form onSubmit={handleProfileSave}>
          <div className="form-row" style={{ gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                First Name
              </label>
              <input
                style={inputStyle}
                value={profile.first_name}
                onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Last Name
              </label>
              <input
                style={inputStyle}
                value={profile.last_name}
                onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
              />
            </div>
          </div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
            Email
          </label>
          <input
            type="email"
            style={inputStyle}
            value={profile.email}
            onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
          />
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
            Phone
          </label>
          <input
            style={inputStyle}
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Optional"
          />
          <button type="submit" style={btnPrimary} disabled={profileLoading}>
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Insurance Policies */}
      <div style={sectionStyle}>
        <h2 style={headingStyle}>My Insurance Policies</h2>
        {policyMsg && <div style={msgSuccess}>{policyMsg}</div>}
        {policies.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '14px' }}>No policies found.</p>
        ) : (
          policies.map((p) => (
            <div key={p.id} style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              marginBottom: '12px',
              background: '#f9fafb',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                    {p.policy_number}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                    {editingPolicy === p.id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={policyType}
                          onChange={(e) => setPolicyType(e.target.value)}
                          style={{ ...inputStyle, marginBottom: 0, width: 'auto' }}
                        >
                          {Object.entries(POLICY_TYPE_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handlePolicyTypeUpdate(p.id)}
                          style={{ ...btnPrimary, padding: '6px 14px', fontSize: '13px' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPolicy(null)}
                          style={{ ...btnPrimary, background: '#6b7280', padding: '6px 14px', fontSize: '13px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span>
                        {POLICY_TYPE_LABELS[p.policy_type] || p.policy_type}
                        <button
                          onClick={() => { setEditingPolicy(p.id); setPolicyType(p.policy_type); }}
                          style={{
                            marginLeft: '8px', color: '#1a56db', background: 'none',
                            border: 'none', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline',
                          }}
                        >
                          Change
                        </button>
                      </span>
                    )}
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: p.status === 'active' ? '#ecfdf5' : '#fef2f2',
                  color: p.status === 'active' ? '#065f46' : '#991b1b',
                }}>
                  {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </span>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginTop: '8px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: '#9ca3af' }}>Premium</div>
                  <div style={{ fontWeight: 600 }}>${Number(p.premium_amount).toLocaleString()}/yr</div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af' }}>Deductible</div>
                  <div style={{ fontWeight: 600 }}>${Number(p.deductible_amount).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af' }}>Coverage Limit</div>
                  <div style={{ fontWeight: 600 }}>${Number(p.coverage_limit).toLocaleString()}</div>
                </div>
              </div>
              <div className="form-row" style={{ gap: '12px', marginTop: '8px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: '#9ca3af' }}>Effective</div>
                  <div>{p.effective_date}</div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af' }}>Expires</div>
                  <div>{p.expiry_date}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Change Password */}
      <div style={sectionStyle}>
        <h2 style={headingStyle}>Change Password</h2>
        {pwMsg && <div style={msgSuccess}>{pwMsg}</div>}
        {pwErr && <div style={msgError}>{pwErr}</div>}
        <form onSubmit={handlePasswordChange}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
            Current Password
          </label>
          <input
            type="password"
            style={inputStyle}
            value={passwords.current_password}
            onChange={(e) => setPasswords((p) => ({ ...p, current_password: e.target.value }))}
            required
          />
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
            New Password
          </label>
          <input
            type="password"
            style={inputStyle}
            value={passwords.new_password}
            onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))}
            required
            minLength={8}
            placeholder="Minimum 8 characters"
          />
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
            Confirm New Password
          </label>
          <input
            type="password"
            style={inputStyle}
            value={passwords.confirm_password}
            onChange={(e) => setPasswords((p) => ({ ...p, confirm_password: e.target.value }))}
            required
            minLength={8}
          />
          <button type="submit" style={btnPrimary} disabled={pwLoading}>
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Delete Account */}
      <div style={{ ...sectionStyle, borderColor: '#fecaca' }}>
        <h2 style={{ ...headingStyle, color: '#dc2626' }}>Danger Zone</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            style={btnDanger}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete My Account
          </button>
        ) : (
          <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px' }}>
            <p style={{ fontWeight: 600, color: '#991b1b', marginBottom: '12px', fontSize: '14px' }}>
              Are you sure? Enter your password to confirm.
            </p>
            {deleteErr && <div style={msgError}>{deleteErr}</div>}
            <input
              type="password"
              style={inputStyle}
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={btnDanger}
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword}
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                style={{ ...btnPrimary, background: '#6b7280' }}
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteErr(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
