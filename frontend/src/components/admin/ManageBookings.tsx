import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import ConfirmDialog from '../ConfirmDialog';
import DriverSelector from './DriverSelector';
import LiveTracking from '../LiveTracking';
import './ManageBookings.css';

const ManageBookings = () => {
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  type ColumnKey = 'client'|'vehicle'|'carwash'|'service'|'driver'|'status'|'amount';
  type Sorter = { col: ColumnKey; dir: 'asc'|'desc' };
  const [sorters, setSorters] = useState<Sorter[]>([{ col: 'status', dir: 'asc' }]);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [showCols, setShowCols] = useState<Record<ColumnKey, boolean>>({
    client: true,
    vehicle: true,
    carwash: true,
    service: true,
    driver: true,
    status: true,
    amount: true,
  });
  const [showColsPanel, setShowColsPanel] = useState(false);
  const [assignOpen, setAssignOpen] = useState<Record<string, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });
  const queryClient = useQueryClient();
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const response = await api.get('/admin/bookings');
      return response.data.data;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: async () => {
      const response = await api.get('/drivers/available');
      return response.data.data;
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: async ({ bookingId, driverId }: { bookingId: string; driverId: string }) => {
      return api.put(`/admin/bookings/${bookingId}/assign-driver`, { driverId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      setConfirmDialog({ ...confirmDialog, open: false });
    },
  });

  const handleAssignDriver = (bookingId: string, driverId: string, driverName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Assign Driver',
      message: `Assign ${driverName} to this booking?`,
      onConfirm: () => {
        assignDriverMutation.mutate({ bookingId, driverId });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Derived rows: filter, search, sort, paginate
  const normalized = (bookings || []).map((b: any) => ({
    ...b,
    _clientName: b?.clientId?.name || '',
    _carWashName: b?.carWashId?.carWashName || b?.carWashId?.name || '',
    _vehicleText: `${b?.vehicleId?.make || ''} ${b?.vehicleId?.model || ''} ${b?.vehicleId?.plateNo || ''}`.trim(),
    _amountNum: parseFloat(b?.totalAmount || 0),
    _driverName: b?.driverId?.name || '',
  }));

  const filtered = normalized.filter((b: any) => {
    const matchesStatus = filterStatus ? b.status === filterStatus : true;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      b._clientName?.toLowerCase().includes(q) ||
      b._carWashName?.toLowerCase().includes(q) ||
      b._vehicleText?.toLowerCase().includes(q) ||
      String(b.status).toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const sorted = filtered.sort((a: any, b: any) => {
    for (const s of sorters) {
      let delta = 0;
      switch (s.col) {
        case 'client': delta = a._clientName.localeCompare(b._clientName); break;
        case 'vehicle': delta = a._vehicleText.localeCompare(b._vehicleText); break;
        case 'carwash': delta = a._carWashName.localeCompare(b._carWashName); break;
        case 'service': delta = (a?.serviceId?.name || '').localeCompare(b?.serviceId?.name || ''); break;
        case 'driver': delta = a._driverName.localeCompare(b._driverName); break;
        case 'status': delta = String(a.status).localeCompare(String(b.status)); break;
        case 'amount': delta = (a._amountNum || 0) - (b._amountNum || 0); break;
      }
      if (delta !== 0) return s.dir === 'asc' ? delta : -delta;
    }
    return 0;
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * rowsPerPage;
  const pageRows = sorted.slice(start, start + rowsPerPage);

  const toggleSort = (e: React.MouseEvent, col: ColumnKey) => {
    const shift = e.shiftKey;
    setSorters((prev) => {
      const idx = prev.findIndex((s) => s.col === col);
      if (shift) {
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], dir: copy[idx].dir === 'asc' ? 'desc' : 'asc' };
          return copy;
        }
        return [...prev, { col, dir: 'asc' }];
      } else {
        if (idx >= 0) {
          // flip direction
          const dir = prev[idx].dir === 'asc' ? 'desc' : 'asc';
          return [{ col, dir }];
        }
        return [{ col, dir: 'asc' }];
      }
    });
  };

  const sortIcon = (col: ColumnKey) => {
    const s = sorters.find((x) => x.col === col);
    if (!s) return '↕';
    return s.dir === 'asc' ? '⬆' : '⬇';
  };

  const exportCsv = () => {
    const rows = sorted.map((b: any) => ({
      Client: b?.clientId?.name || '',
      Vehicle: `${b?.vehicleId?.make || ''} ${b?.vehicleId?.model || ''} ${b?.vehicleId?.plateNo || ''}`.trim(),
      CarWash: b?.carWashId?.carWashName || b?.carWashId?.name || '',
      Service: b?.serviceId?.name || '',
      Driver: b?.driverId?.name || 'Unassigned',
      Status: String(b?.status || ''),
      Amount: String(parseFloat(b?.totalAmount || 0).toFixed(2)),
    }));

    const headers = Object.keys(rows[0] || { Client: '', Vehicle: '', CarWash: '', Service: '', Driver: '', Status: '', Amount: '' });
    const lines = [headers.join(',')].concat(
      rows.map((r) => headers.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(','))
    );
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="manage-bookings">
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="header-content">
            <h2 className="admin-card-title">Manage Bookings</h2>
            <p className="card-subtitle">View and manage all booking requests</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="toolbar-left">
            <div className="input-wrap">
              <span className="icon">🔎</span>
              <input
                className="search-input"
                placeholder="Search client, car wash, vehicle, status…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="select"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">All statuses</option>
              {[
                'pending','accepted','picked_up','delivered_to_wash','at_wash','waiting_bay','washing_bay','drying_bay','wash_completed','delivered_to_client','delivered','completed','cancelled',
              ].map(s => (<option key={s} value={s}>{s.replace(/_/g,' ')}</option>))}
            </select>
          </div>
          <div className="toolbar-right">
            <div className="cols-toggle-wrap">
              <button className="btn btn-ghost" onClick={() => setShowColsPanel(!showColsPanel)}>Columns ▾</button>
              {showColsPanel && (
                <div className="cols-panel" onMouseLeave={() => setShowColsPanel(false)}>
                  {(['client','vehicle','carwash','service','driver','status','amount'] as ColumnKey[]).map((k) => (
                    <label key={k} className="cols-item">
                      <input
                        type="checkbox"
                        checked={showCols[k]}
                        onChange={() => setShowCols({ ...showCols, [k]: !showCols[k] })}
                      />
                      <span>{k.replace(/_/g,' ')}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-ghost" onClick={exportCsv}>Export CSV</button>
            <select className="select" value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(1); }}>
              {[10,20,50].map(n => (<option key={n} value={n}>{n} / page</option>))}
            </select>
          </div>
        </div>

        {!sorted || total === 0 ? (
          <EmptyState
            icon="📋"
            title="No bookings found"
            description="Bookings will appear here once clients create them"
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {showCols.client && (<th className="th-sortable" onClick={(e) => toggleSort(e,'client')}>Client <span className="th-icon">{sortIcon('client')}</span></th>)}
                  {showCols.vehicle && (<th className="th-sortable" onClick={(e) => toggleSort(e,'vehicle')}>Vehicle <span className="th-icon">{sortIcon('vehicle')}</span></th>)}
                  {showCols.carwash && (<th className="th-sortable" onClick={(e) => toggleSort(e,'carwash')}>Car Wash <span className="th-icon">{sortIcon('carwash')}</span></th>)}
                  {showCols.service && (<th className="th-sortable" onClick={(e) => toggleSort(e,'service')}>Service <span className="th-icon">{sortIcon('service')}</span></th>)}
                  {showCols.driver && (<th className="th-sortable" onClick={(e) => toggleSort(e,'driver')}>Driver <span className="th-icon">{sortIcon('driver')}</span></th>)}
                  {showCols.status && (<th className="th-sortable" onClick={(e) => toggleSort(e,'status')}>Status <span className="th-icon">{sortIcon('status')}</span></th>)}
                  {showCols.amount && (<th className="th-sortable" onClick={(e) => toggleSort(e,'amount')}>Amount <span className="th-icon">{sortIcon('amount')}</span></th>)}
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((booking: any) => (
                  <tr key={booking.id || booking._id}>
                    {showCols.client && (<td>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {booking.clientId?.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <span>{booking.clientId?.name || 'N/A'}</span>
                      </div>
                    </td>)}
                    {showCols.vehicle && (<td>
                      {booking.vehicleId?.make} {booking.vehicleId?.model} - {booking.vehicleId?.plateNo}
                    </td>)}
                    {showCols.carwash && (<td>{booking.carWashId?.carWashName || booking.carWashId?.name || 'N/A'}</td>)}
                    {showCols.service && (<td>{booking.serviceId?.name || 'N/A'}</td>)}
                    {showCols.driver && (<td>
                      {booking.driverId?.name ? (
                        <span className="driver-assigned">{booking.driverId.name}</span>
                      ) : (
                        <span className="driver-unassigned">Unassigned</span>
                      )}
                    </td>)}
                    {showCols.status && (
                      <td>
                        <span className={`status-badge status-${booking.status}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>
                    )}
                    {showCols.amount && (
                      <td className="amount-cell">K{parseFloat(booking.totalAmount || 0).toFixed(2)}</td>
                    )}
                    <td>
                      <div className="row-actions">
                        {['accepted','picked_up','picked_up_pending_confirmation','at_wash','delivered_to_wash','waiting_bay','washing_bay','drying_bay','wash_completed','delivered_to_client'].includes(booking.status) && (
                          <button className="icon-btn" title="Track" onClick={() => setTrackingBookingId(booking.id || booking._id)}>🛰️</button>
                        )}
                        {!booking.driverId ? (
                          <>
                            <button className="icon-btn" title="Assign Driver" onClick={() => setAssignOpen({ ...assignOpen, [booking.id || booking._id]: !assignOpen[booking.id || booking._id] })}>👤➕</button>
                            {assignOpen[booking.id || booking._id] && (
                              <div className="assign-inline">
                                <DriverSelector
                                  drivers={drivers || []}
                                  value={selectedDriver[booking.id || booking._id] || ''}
                                  onChange={(driverId) => {
                                    setSelectedDriver({
                                      ...selectedDriver,
                                      [booking.id || booking._id]: driverId,
                                    });
                                  }}
                                  placeholder="Search driver..."
                                />
                                <button
                                  className="icon-btn"
                                  title="Confirm Assign"
                                  onClick={() => {
                                    const driverId = selectedDriver[booking.id || booking._id];
                                    const driver = drivers?.find((d: any) => (d.id || d._id) === driverId);
                                    if (driver && driverId) {
                                      handleAssignDriver(booking.id || booking._id, driverId, driver.name);
                                      setAssignOpen({ ...assignOpen, [booking.id || booking._id]: false });
                                    }
                                  }}
                                  disabled={!selectedDriver[booking.id || booking._id]}
                                >✔️</button>
                              </div>
                            )}
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="table-pagination">
              <div className="count">{total} results</div>
              <div className="pager">
                <button
                  className="btn btn-ghost"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ◀ Prev
                </button>
                <span className="page-info">Page {currentPage} of {totalPages}</span>
                <button
                  className="btn btn-ghost"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next ▶
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        variant="info"
      />

      {trackingBookingId && (
        <div className="live-tracking-overlay" onClick={() => setTrackingBookingId(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <LiveTracking bookingId={trackingBookingId} onClose={() => setTrackingBookingId(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBookings;
