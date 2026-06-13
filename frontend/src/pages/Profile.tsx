import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from '../components/ToastContainer';
import LoadingSpinner from '../components/LoadingSpinner';
import './Profile.css';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<any>({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                profilePictureUrl: user.profilePictureUrl || '',
                carWashPictureUrl: user.carWashPictureUrl || '',
                bio: user.bio || '',
                address: user.address || '',
                // Role specific
                licenseNumber: user.licenseNumber || '',
                businessName: user.businessName || '',
                carWashName: user.carWashName || '',
                location: user.location || '',
                washingBays: user.washingBays || '',
            });
        }
    }, [user]);

    // Fetch vehicles if client
    const { data: vehicles, isLoading: loadingVehicles } = useQuery({
        queryKey: ['my-vehicles'],
        queryFn: async () => {
            const response = await api.get('/vehicles');
            return response.data.data;
        },
        enabled: user?.role === 'client',
    });

    // Fetch services if carwash
    const { data: services, isLoading: loadingServices } = useQuery({
        queryKey: ['my-services'],
        queryFn: async () => {
            const response = await api.get(`/carwashes/${user?.id}/services`);
            return response.data.data;
        },
        enabled: user?.role === 'carwash',
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.put('/auth/profile', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
            showToast('Profile updated successfully', 'success');
            setIsEditing(false);
            
            // Redirect to home page after successful profile update
            setTimeout(() => {
                const homePath = user?.role === 'admin' ? '/admin' 
                               : user?.role === 'carwash' ? '/carwash'
                               : user?.role === 'driver' ? '/driver'
                               : '/client';
                navigate(homePath, { replace: true });
            }, 1500);
        },
        onError: (error: any) => {
            showToast(error.response?.data?.message || 'Failed to update profile', 'error');
        },
    });

    const availabilityMutation = useMutation({
        mutationFn: async (availability: boolean) => {
            const response = await api.put('/drivers/availability', { availability });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
            showToast('Availability updated', 'success');
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev: any) => ({ ...prev, profilePictureUrl: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCarWashPictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev: any) => ({ ...prev, carWashPictureUrl: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submissionData: any = { ...formData };
        
        // Only include carWashPictureUrl if user is a carwash
        if (user?.role !== 'carwash') {
            delete submissionData.carWashPictureUrl;
        }
        
        // Convert washingBays to number if it exists
        if (submissionData.washingBays) {
            submissionData.washingBays = parseInt(submissionData.washingBays.toString());
        }
        
        updateProfileMutation.mutate(submissionData);
    };

    const getDashboardPath = () => {
        switch (user?.role) {
            case 'admin':
                return '/admin';
            case 'client':
                return '/client';
            case 'driver':
                return '/driver';
            case 'carwash':
                return '/carwash';
            default:
                return '/';
        }
    };

    const handleBackClick = () => {
        // Try to go back using browser history, otherwise go to dashboard
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate(getDashboardPath());
        }
    };

    if (!user) return <LoadingSpinner />;

    return (
        <div className="profile-page sucar-page">
            <header className="profile-header">
                <div className="header-left">
                    <button className="btn btn-secondary" onClick={handleBackClick}>
                        ← Back
                    </button>
                    <h1>My Profile</h1>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                    <button className="btn btn-danger" onClick={logout}>Logout</button>
                </div>
            </header>

            <div className="profile-container">
                <div className="profile-card main-info">
                    <div className="profile-pic-section">
                        <div className="profile-pic-container">
                            {formData.profilePictureUrl ? (
                                <img src={formData.profilePictureUrl} alt="Profile" className="profile-pic" />
                            ) : (
                                <div className="profile-pic-placeholder">{user.name?.charAt(0)}</div>
                            )}
                            {isEditing && (
                                <label className="profile-pic-upload">
                                    <span>Change Photo</span>
                                    <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                                </label>
                            )}
                        </div>
                        <div className="profile-name-role">
                            <h2>{user.name}</h2>
                            <span className={`role-badge role-${user.role}`}>{user.role}</span>
                            {user.role === 'admin' && user.adminLevel && (
                                <span className="role-badge admin-level">Level: {user.adminLevel}</span>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>Bio / About</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        {user.role === 'driver' && (
                            <div className="role-specific-section">
                                <h3>Driver Details</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>License Number</label>
                                        <input
                                            type="text"
                                            name="licenseNumber"
                                            value={formData.licenseNumber}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {user.role === 'carwash' && (
                            <div className="role-specific-section">
                                <h3>Business Details</h3>
                                
                                {/* Car Wash Picture Upload */}
                                {isEditing && (
                                    <div className="form-group full-width">
                                        <label>Car Wash Business Picture</label>
                                        <div className="carwash-picture-upload-section">
                                            {formData.carWashPictureUrl ? (
                                                <div className="carwash-picture-preview">
                                                    <img 
                                                        src={formData.carWashPictureUrl} 
                                                        alt="Car Wash" 
                                                        className="carwash-picture-preview-img"
                                                    />
                                                    <label className="carwash-picture-upload-btn">
                                                        <span>Change Picture</span>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={handleCarWashPictureChange} 
                                                            hidden 
                                                        />
                                                    </label>
                                                </div>
                                            ) : (
                                                <label className="carwash-picture-upload-placeholder">
                                                    <div className="upload-icon">📷</div>
                                                    <span>Upload Car Wash Picture</span>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={handleCarWashPictureChange} 
                                                        hidden 
                                                    />
                                                </label>
                                            )}
                                        </div>
                                        <p className="form-hint">Upload a picture of your car wash business. This will be displayed to clients.</p>
                                    </div>
                                )}
                                
                                {!isEditing && formData.carWashPictureUrl && (
                                    <div className="form-group full-width">
                                        <label>Car Wash Business Picture</label>
                                        <div className="carwash-picture-display">
                                            <img 
                                                src={formData.carWashPictureUrl} 
                                                alt="Car Wash" 
                                                className="carwash-picture-display-img"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Car Wash Name</label>
                                        <input
                                            type="text"
                                            name="carWashName"
                                            value={formData.carWashName || formData.businessName}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Washing Bays</label>
                                        <input
                                            type="number"
                                            name="washingBays"
                                            value={formData.washingBays}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEditing && (
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={updateProfileMutation.isPending}>
                                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                <div className="side-content">
                    {user.role === 'client' && (
                        <div className="profile-card accent-card">
                            <h3>My Vehicles</h3>
                            {loadingVehicles ? <LoadingSpinner /> : (
                                <ul className="role-data-list">
                                    {vehicles?.map((v: any) => (
                                        <li key={v.id}>
                                            <strong>{v.make} {v.model}</strong>
                                            <span>{v.registrationNumber}</span>
                                        </li>
                                    ))}
                                    {(!vehicles || vehicles.length === 0) && <li>No vehicles added yet.</li>}
                                </ul>
                            )}
                            <button className="btn btn-secondary full-width" onClick={() => window.location.href = '/client/vehicles/add'}>Add Vehicle</button>
                        </div>
                    )}

                    {user.role === 'driver' && (
                        <div className="profile-card accent-card">
                            <h3>Availability</h3>
                            <div className="toggle-container">
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={user.availability}
                                        onChange={(e) => availabilityMutation.mutate(e.target.checked)}
                                        disabled={availabilityMutation.isPending}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <span>{user.availability ? 'Active & Available' : 'Currently Offline'}</span>
                            </div>
                            <p className="hint-text">Go offline if you're not ready to accept new bookings.</p>
                        </div>
                    )}

                    {user.role === 'carwash' && (
                        <div className="profile-card accent-card">
                            <h3>Services Offered</h3>
                            {loadingServices ? <LoadingSpinner /> : (
                                <ul className="role-data-list">
                                    {services?.map((s: any) => (
                                        <li key={s.id}>
                                            <strong>{s.name}</strong>
                                            <span>ZK {s.price}</span>
                                        </li>
                                    ))}
                                    {(!services || services.length === 0) && <li>No services configured.</li>}
                                </ul>
                            )}
                            <button className="btn btn-secondary full-width" onClick={() => window.location.href = '/carwash'}>Manage Services</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;

