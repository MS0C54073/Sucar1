import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import './ManageCarWashes.css';

const ManageCarWashes = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: carWashes, isLoading } = useQuery({
    queryKey: ['admin-carwashes'],
    queryFn: async () => {
      const response = await api.get('/admin/users?role=carwash');
      return response.data.data;
    },
  });

  const filteredCarWashes = carWashes?.filter(
    (cw: any) =>
      cw.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cw.carWashName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cw.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="manage-carwashes">
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Car Wash Providers</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search car washes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {!filteredCarWashes || filteredCarWashes.length === 0 ? (
          <EmptyState
            icon="🧼"
            title="No car wash providers found"
            description={searchTerm ? 'Try adjusting your search' : 'No car wash providers registered yet'}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Car wash</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th className="cell-center">Bays</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCarWashes.map((cw: any) => (
                  <tr key={cw.id}>
                    <td>{cw.name}</td>
                    <td>{cw.carWashName || '—'}</td>
                    <td>{cw.email}</td>
                    <td>{cw.phone}</td>
                    <td>{cw.location || '—'}</td>
                    <td className="cell-center">{cw.washingBays || 0}</td>
                    <td>
                      <div className="status-group">
                        <span className={`status-badge ${cw.isActive ? 'status-active' : 'status-inactive'}`}>
                          {cw.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {cw.approval_status === 'pending' && (
                          <span className="status-badge status-pending">Pending Approval</span>
                        )}
                        {cw.approval_status === 'rejected' && (
                          <span className="status-badge status-rejected">Rejected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCarWashes;
