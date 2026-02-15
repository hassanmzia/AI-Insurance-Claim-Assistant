import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ManagedUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  department: string;
  phone: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

const ROLES = [
  { value: 'admin', label: 'Administrator', color: '#7c3aed' },
  { value: 'manager', label: 'Claims Manager', color: '#0891b2' },
  { value: 'adjuster', label: 'Claims Adjuster', color: '#1a56db' },
  { value: 'reviewer', label: 'QA / Compliance Reviewer', color: '#d97706' },
  { value: 'agent', label: 'Insurance Agent', color: '#059669' },
  { value: 'customer', label: 'Customer', color: '#6b7280' },
];

const roleBadge = (role: string): React.CSSProperties => {
  const r = ROLES.find((x) => x.value === role);
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    background: `${r?.color || '#6b7280'}18`,
    color: r?.color || '#6b7280',
  };
};

const UserAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editForm, setEditForm] = useState({ role: '', first_name: '', last_name: '', email: '', department: '', phone: '', is_active: true });
  const [editMsg, setEditMsg] = useState('');
  const [editErr, setEditErr] = useState('');

  // New user form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '', role: 'adjuster',
  });
  const [createMsg, setCreateMsg] = useState('');
  const [createErr, setCreateErr] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const data = await api.getUsers(params);
      setUsers(data.results || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const openEdit = (u: ManagedUser) => {
    setEditingUser(u);
    setEditForm({
      role: u.role,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      department: u.department || '',
      phone: u.phone || '',
      is_active: u.is_active,
    });
    setEditMsg('');
    setEditErr('');
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setEditMsg('');
    setEditErr('');
    try {
      await api.updateUser(editingUser.id, editForm);
      setEditMsg('User updated successfully.');
      fetchUsers();
    } catch (err: any) {
      setEditErr(err.response?.data?.error || 'Failed to update user.');
    }
  };

  const handleToggleActive = async (u: ManagedUser) => {
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      fetchUsers();
    } catch { /* ignore */ }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg('');
    setCreateErr('');
    if (!createForm.username || !createForm.password || !createForm.email) {
      setCreateErr('Username, email, and password are required.');
      return;
    }
    try {
      await api.createUser(createForm);
      setCreateMsg('User created successfully.');
      setCreateForm({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'adjuster' });
      fetchUsers();
    } catch (err: any) {
      const errors = err.response?.data;
      if (typeof errors === 'object' && !errors.error) {
        const msgs = Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        setCreateErr(msgs.join(' | '));
      } else {
        setCreateErr(errors?.error || 'Failed to create user.');
      }
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box',
  };
  const btnPrimary: React.CSSProperties = {
    padding: '8px 16px', background: '#1a56db', color: '#fff', border: 'none',
    borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px',
  };

  const availableRoles = ROLES.filter((r) => {
    if (isAdmin) return true;
    return r.value !== 'admin'; // managers can't assign admin
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>User Administration</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Manage users, roles, and access permissions
          </p>
        </div>
        <button style={btnPrimary} onClick={() => { setShowCreate(!showCreate); setCreateMsg(''); setCreateErr(''); }}>
          {showCreate ? 'Cancel' : '+ Create User'}
        </button>
      </div>

      {/* RBAC Reference Card */}
      <div style={{
        background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px',
        padding: '16px', marginBottom: '20px',
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#0369a1' }}>
          Role Permissions Reference
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12px' }}>
          <div><span style={roleBadge('admin')}>Admin</span> Full access, user management</div>
          <div><span style={roleBadge('manager')}>Manager</span> Assign claims, approve, analytics</div>
          <div><span style={roleBadge('adjuster')}>Adjuster</span> Process, approve/deny claims</div>
          <div><span style={roleBadge('reviewer')}>Reviewer</span> QA, audit, fraud investigation</div>
          <div><span style={roleBadge('agent')}>Agent</span> Help customers, view claims</div>
          <div><span style={roleBadge('customer')}>Customer</span> File claims, view own data</div>
        </div>
      </div>

      {/* Create User Form */}
      {showCreate && (
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
          padding: '20px', marginBottom: '20px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Create New User</h3>
          {createMsg && <div style={{ padding: '10px', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' }}>{createMsg}</div>}
          {createErr && <div style={{ padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' }}>{createErr}</div>}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Username *</label>
                <input style={inputStyle} value={createForm.username} onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Email *</label>
                <input type="email" style={inputStyle} value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Password *</label>
                <input type="password" style={inputStyle} value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>First Name</label>
                <input style={inputStyle} value={createForm.first_name} onChange={(e) => setCreateForm((f) => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Last Name</label>
                <input style={inputStyle} value={createForm.last_name} onChange={(e) => setCreateForm((f) => ({ ...f, last_name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Role *</label>
                <select style={inputStyle} value={createForm.role} onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}>
                  {availableRoles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" style={btnPrimary}>Create User</button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center',
        background: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb',
        flexWrap: 'wrap',
      }}>
        <select
          style={{ ...inputStyle, width: '180px', minWidth: '120px' }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {availableRoles.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, or email..."
          />
          <button type="submit" style={{ ...btnPrimary, padding: '8px 20px' }}>Search</button>
        </form>
        <span style={{ color: '#6b7280', fontSize: '13px', whiteSpace: 'nowrap' }}>
          {users.length} user{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Users Table */}
      <div style={{
        background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflowX: 'auto',
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No users found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>User</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Role</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Joined</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Last Login</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>@{u.username} &middot; {u.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={roleBadge(u.role)}>{u.role_display}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                      background: u.is_active ? '#ecfdf5' : '#fef2f2',
                      color: u.is_active ? '#065f46' : '#991b1b',
                    }}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                    {new Date(u.date_joined).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {u.id !== user?.id && (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEdit(u)}
                          style={{
                            padding: '4px 12px', background: '#1a56db', color: '#fff',
                            border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          style={{
                            padding: '4px 12px',
                            background: u.is_active ? '#dc2626' : '#059669',
                            color: '#fff', border: 'none', borderRadius: '6px',
                            fontSize: '12px', cursor: 'pointer',
                          }}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '24px',
            maxWidth: '500px', width: '90%',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              Edit User: {editingUser.first_name} {editingUser.last_name}
            </h3>
            {editMsg && <div style={{ padding: '10px', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' }}>{editMsg}</div>}
            {editErr && <div style={{ padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' }}>{editErr}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>First Name</label>
                <input style={inputStyle} value={editForm.first_name} onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Last Name</label>
                <input style={inputStyle} value={editForm.last_name} onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Email</label>
              <input type="email" style={inputStyle} value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Role</label>
                <select style={inputStyle} value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                  {availableRoles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Department</label>
                <input style={inputStyle} value={editForm.department} onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))} placeholder="e.g. Claims, Underwriting" />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Phone</label>
              <input style={inputStyle} value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))} />
                Account Active
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingUser(null)}
                style={{ ...btnPrimary, background: '#6b7280' }}
              >
                Close
              </button>
              <button onClick={handleEditSave} style={btnPrimary}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAdminPage;
