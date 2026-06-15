import { useState, useEffect } from 'react';
import Icon from '../icons/Icon';
import './UserModal.css';

interface User {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'driver' | 'carwash' | 'admin' | 'subadmin';
  adminLevel?: 'super_admin' | 'admin' | 'support';
  isActive: boolean;
}

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (data: Partial<User>) => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    phone: '',
    role: 'client',
    isActive: true,
  });

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{user ? 'Edit User' : 'Add User'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={!!user}
            />
          </div>

          <div className="form-group">
            <label>Phone *</label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select
              value={formData.role || 'client'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
              required
            >
              <option value="client">Client</option>
              <option value="driver">Driver</option>
              <option value="carwash">Car Wash</option>
              <option value="subadmin">Subadmin</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {formData.role === 'admin' && (
            <div className="form-group">
              <label>Admin Level</label>
              <select
                value={formData.adminLevel || 'admin'}
                onChange={(e) => setFormData({ ...formData, adminLevel: e.target.value as User['adminLevel'] })}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="support">Support</option>
              </select>
              <small className="form-hint">Super Admin has full access, Admin can manage users, Support is read-only</small>
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive ?? true}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Active</span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
