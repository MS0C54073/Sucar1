import { useMemo } from 'react';
import './OperatorStaffPanel.css';

interface BookingLike {
  driverId?: { id?: string; _id?: string; name?: string; phone?: string };
  status?: string;
}

interface OperatorStaffPanelProps {
  bookings: BookingLike[];
}

const busyStatuses = ['picked_up', 'at_wash', 'washing_bay', 'drying_bay', 'accepted'];

const OperatorStaffPanel = ({ bookings }: OperatorStaffPanelProps) => {
  const staff = useMemo(() => {
    const map = new Map<string, { name: string; phone?: string; active: number }>();
    bookings.forEach((b) => {
      const d = b.driverId;
      if (!d?.name) return;
      const id = d.id || d._id || d.name;
      const cur = map.get(id) || { name: d.name, phone: d.phone, active: 0 };
      if (busyStatuses.includes(b.status || '')) cur.active += 1;
      map.set(id, cur);
    });
    return Array.from(map.values()).slice(0, 6);
  }, [bookings]);

  return (
    <div className="staff-panel card">
      <div className="card-head">
        <h3>Staff availability</h3>
      </div>
      {staff.length === 0 ? (
        <p className="staff-empty">Drivers appear here when assigned to your bookings.</p>
      ) : (
        <ul className="staff-list">
          {staff.map((s, i) => {
            const status = s.active > 0 ? 'busy' : 'available';
            return (
              <li key={i} className="staff-item">
                <span className="staff-av">{(s.name || 'D').charAt(0)}</span>
                <div className="staff-info">
                  <div className="staff-name">{s.name}</div>
                  <div className="staff-role">Driver · {s.active > 0 ? `${s.active} active job(s)` : 'Available'}</div>
                </div>
                <span className={`staff-dot staff-${status}`}>{status === 'busy' ? 'Busy' : 'Available'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default OperatorStaffPanel;
