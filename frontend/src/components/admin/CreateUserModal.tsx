import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ToastContainer';
import api from '../../services/api';
import Icon from '../icons/Icon';
import './CreateUserModal.css';

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: (requiresApproval: boolean) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    password: '',
    phone: '',
    nrc: '',
    role: 'client',
    adminLevel: 'support',
  });

  const [roleSpecificFields, setRoleSpecificFields] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check if current user is admin (can auto-approve)
  const isAdmin = currentUser?.role === 'admin' &&
    (currentUser?.adminLevel === 'super_admin' || currentUser?.adminLevel === 'admin');
  const isSubAdmin = currentUser?.role === 'admin' && currentUser?.adminLevel === 'support';

  useEffect(() => {
    // Reset role-specific fields when role changes
    setRoleSpecificFields({});
  }, [formData.role]);

  const handleRoleSpecificChange = (field: string, value: any) => {
    setRoleSpecificFields({ ...roleSpecificFields, [field]: value });
  };

  const validateForm = (): string | null => {
    // Basic validation
    if (!formData.name?.trim()) return 'Full name is required';
    if (!formData.email?.trim()) return 'Email is required';
    if (!formData.password || formData.password.length < 6) return 'Password must be at least 6 characters';
    if (!formData.phone?.trim()) return 'Phone number is required';
    if (!formData.nrc?.trim()) return 'NRC number is required';

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Invalid email format';

    // Role-specific validation
    if (formData.role === 'driver') {
      if (!roleSpecificFields.licenseNo?.trim()) return 'License number is required for drivers';
      if (!roleSpecificFields.licenseType) return 'License type is required for drivers';
      if (!roleSpecificFields.licenseExpiry) return 'License expiry date is required for drivers';
      if (!roleSpecificFields.address?.trim()) return 'Address is required for drivers';
    } else if (formData.role === 'carwash') {
      if (!roleSpecificFields.carWashName?.trim()) return 'Car wash name is required';
      if (!roleSpecificFields.location?.trim()) return 'Location is required';
      if (!roleSpecificFields.washingBays || roleSpecificFields.washingBays < 1) {
        return 'Number of washing bays must be at least 1';
      }
      if (roleSpecificFields.washingBays > 20) {
        return 'Number of washing bays cannot exceed 20';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const userData = {
        ...formData,
        ...roleSpecificFields,
      };

      const response = await api.post('/admin/users/create', userData);

      // Show success toast notification
      const successMessage = response.data.data.requiresApproval
        ? 'User created successfully! Awaiting admin approval.'
        : 'User created and approved successfully!';

      showToast(successMessage, 'success', 4000);
      // Close modal and notify parent
      onSuccess(response.data.data.requiresApproval);
      onClose(); // Ensure modal closes
    } catch (err: any) {
      let errorMessage = err.response?.data?.message || err.message || 'Failed to create user. Please try again.';

      // Provide more helpful error messages
      if (errorMessage.includes('already exists')) {
        // Extract email from error if available
        const emailMatch = errorMessage.match(/Email: ([^\s]+)/);
        if (emailMatch) {
          errorMessage = `This email is already registered: ${emailMatch[1]}. Please use a different email address.`;
        } else {
          errorMessage = 'This email or NRC is already registered. Please use different values.';
        }
      }

      setError(errorMessage);
      showToast(errorMessage, 'error', 6000);
      console.error('User creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New User</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="x" size={16} /></button>
        </div>

        {isSubAdmin && (
          <div className="approval-notice">
            <span className="notice-icon"><Icon name="clock" size={16} /></span>
            <div>
              <strong>Approval Required</strong>
              <p>This user will require admin approval before they can access the system.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter full name"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="user@example.com"
            />
            {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
              <p className="form-hint error">Please enter a valid email address</p>
            )}
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
            />
            {formData.password && formData.password.length < 6 && (
              <p className="form-hint error">Password must be at least 6 characters</p>
            )}
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="0977123456"
            />
          </div>

          <div className="form-group">
            <label>NRC Number *</label>
            <input
              type="text"
              value={formData.nrc}
              onChange={(e) => setFormData({ ...formData, nrc: e.target.value })}
              required
              placeholder="NRC001"
            />
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="client">Client</option>
              <option value="driver">Driver</option>
              <option value="carwash">Car Wash</option>
              {isAdmin && <option value="subadmin">Subadmin</option>}
              {isAdmin && <option value="admin">Admin</option>}
            </select>
          </div>

          {/* Driver-specific fields */}
          {formData.role === 'driver' && (
            <>
              <div className="form-group">
                <label>License Number *</label>
                <input
                  type="text"
                  value={roleSpecificFields.licenseNo || ''}
                  onChange={(e) => handleRoleSpecificChange('licenseNo', e.target.value)}
                  required
                  placeholder="DL001"
                />
              </div>
              <div className="form-group">
                <label>License Type *</label>
                <select
                  value={roleSpecificFields.licenseType || ''}
                  onChange={(e) => handleRoleSpecificChange('licenseType', e.target.value)}
                  required
                >
                  <option value="">Select type</option>
                  <option value="Class B">Class B</option>
                  <option value="Class C">Class C</option>
                </select>
              </div>
              <div className="form-group">
                <label>License Expiry *</label>
                <input
                  type="date"
                  value={roleSpecificFields.licenseExpiry || ''}
                  onChange={(e) => handleRoleSpecificChange('licenseExpiry', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address *</label>
                <textarea
                  value={roleSpecificFields.address || ''}
                  onChange={(e) => handleRoleSpecificChange('address', e.target.value)}
                  required
                  placeholder="Residential address"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Marital Status</label>
                <select
                  value={roleSpecificFields.maritalStatus || ''}
                  onChange={(e) => handleRoleSpecificChange('maritalStatus', e.target.value)}
                >
                  <option value="">Select status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                </select>
              </div>
            </>
          )}

          {/* Car Wash-specific fields */}
          {formData.role === 'carwash' && (
            <>
              <div className="form-group">
                <label>Car Wash Name *</label>
                <input
                  type="text"
                  value={roleSpecificFields.carWashName || ''}
                  onChange={(e) => handleRoleSpecificChange('carWashName', e.target.value)}
                  required
                  placeholder="Sparkle Auto Wash"
                />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={roleSpecificFields.location || ''}
                  onChange={(e) => handleRoleSpecificChange('location', e.target.value)}
                  required
                  placeholder="Cairo Road, Lusaka"
                />
              </div>
              <div className="form-group">
                <label>Number of Washing Bays *</label>
                <input
                  type="number"
                  value={roleSpecificFields.washingBays || ''}
                  onChange={(e) => handleRoleSpecificChange('washingBays', parseInt(e.target.value))}
                  required
                  min="1"
                  max="20"
                />
              </div>
            </>
          )}

          {/* Client-specific fields */}
          {formData.role === 'client' && (
            <>
              <div className="form-group">
                <label>Business Name (Optional)</label>
                <input
                  type="text"
                  value={roleSpecificFields.businessName || ''}
                  onChange={(e) => handleRoleSpecificChange('businessName', e.target.value)}
                  placeholder="Company name if business client"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={roleSpecificFields.isBusiness || false}
                    onChange={(e) => handleRoleSpecificChange('isBusiness', e.target.checked)}
                  />
                  This is a business account
                </label>
              </div>
            </>
          )}

          {/* Admin-specific fields */}
          {formData.role === 'admin' && isAdmin && (
            <div className="form-group">
              <label>Admin Level *</label>
              <select
                value={formData.adminLevel}
                onChange={(e) => setFormData({ ...formData, adminLevel: e.target.value })}
                required
              >
                <option value="support">Support (Sub-Admin)</option>
                <option value="admin">Admin</option>
                {currentUser?.adminLevel === 'super_admin' && (
                  <option value="super_admin">Super Admin</option>
                )}
              </select>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : isSubAdmin ? 'Create & Request Approval' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
