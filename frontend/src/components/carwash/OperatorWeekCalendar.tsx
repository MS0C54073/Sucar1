import { useMemo } from 'react';
import './OperatorWeekCalendar.css';

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const STATUS_CLASS: Record<string, string> = {
  pending: 'cal-pending',
  accepted: 'cal-pending',
  picked_up: 'cal-progress',
  at_wash: 'cal-progress',
  washing_bay: 'cal-progress',
  drying_bay: 'cal-progress',
  wash_completed: 'cal-done',
  completed: 'cal-done',
  delivered: 'cal-done',
  cancelled: 'cal-cancel',
};

interface BookingLike {
  id?: string;
  _id?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  clientId?: { name?: string };
  serviceId?: { name?: string };
}

interface OperatorWeekCalendarProps {
  bookings: BookingLike[];
  isLoading?: boolean;
}

const startOfWeek = (d: Date) => {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const OperatorWeekCalendar = ({ bookings, isLoading }: OperatorWeekCalendarProps) => {
  const weekStart = useMemo(() => {
    const s = startOfWeek(new Date());
    s.setHours(0, 0, 0, 0);
    return s;
  }, []);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const rangeLabel = `${days[0].toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const blocks = useMemo(() => {
    return bookings
      .map((b) => {
        const raw = b.createdAt || b.created_at;
        if (!raw) return null;
        const dt = new Date(raw);
        const dayIdx = Math.floor((dt.getTime() - weekStart.getTime()) / 86400000);
        if (dayIdx < 0 || dayIdx > 6) return null;
        const hour = dt.getHours();
        const row = HOURS.findIndex((h) => h >= hour);
        if (row < 0) return null;
        return {
          key: b.id || b._id,
          dayIdx,
          row: row >= 0 ? row : 0,
          name: b.clientId?.name || 'Client',
          service: b.serviceId?.name || 'Wash',
          status: b.status || 'pending',
          time: dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        };
      })
      .filter(Boolean) as {
      key: string;
      dayIdx: number;
      row: number;
      name: string;
      service: string;
      status: string;
      time: string;
    }[];
  }, [bookings, weekStart]);

  if (isLoading) {
    return <div className="op-calendar card">Loading schedule…</div>;
  }

  return (
    <div className="op-calendar card">
      <div className="card-head">
        <h3>Bookings this week</h3>
        <span className="cal-range">{rangeLabel}</span>
      </div>
      <div className="cal-grid-wrap">
        <div className="cal-grid">
          <div className="cal-corner" />
          {days.map((d, i) => (
            <div key={i} className="cal-day-head">
              <div className="cal-dow">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
              <div className="cal-dom">{d.getDate()}</div>
            </div>
          ))}
          {HOURS.map((h, row) => (
            <div key={h} className="cal-row">
              <div className="cal-time">{h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}</div>
              {days.map((_, col) => (
                <div key={col} className="cal-cell">
                  {blocks
                    .filter((b) => b.dayIdx === col && b.row === row)
                    .map((b) => (
                      <div key={b.key} className={`cal-block ${STATUS_CLASS[b.status] || 'cal-pending'}`}>
                        <div className="cal-block-name">{b.name}</div>
                        <div className="cal-block-svc">{b.service}</div>
                        <div className="cal-block-time">{b.time}</div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="cal-legend">
        <span><i className="leg cal-progress" /> In progress</span>
        <span><i className="leg cal-pending" /> Pending</span>
        <span><i className="leg cal-done" /> Completed</span>
      </div>
    </div>
  );
};

export default OperatorWeekCalendar;
