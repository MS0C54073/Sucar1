import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../components/ToastContainer';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from '../components/icons/Icon';
import './ReferralDashboard.css';

type DashboardData = {
  isAffiliate: boolean;
  referralCode: string | null;
  referralLink: string | null;
  stats: {
    totalReferrals: number;
    signedUp: number;
    firstBooking: number;
    completedBookings: number;
    totalEarned: number;
    availableBalance: number;
  };
  milestones: { count: number; label: string; tier: number; reached: boolean; current: number }[];
  chartData: { date: string; count: number }[];
  minCashout: number;
  rewardPerReferral: number;
};

type LeaderEntry = {
  rank: number;
  userId: string;
  name: string;
  initials: string;
  completedReferrals: number;
};

const STAT_CARDS = [
  { key: 'totalReferrals', label: 'Total referrals', icon: 'userPlus' as const, accent: 'wash' },
  { key: 'signedUp', label: 'Signed up', icon: 'user' as const, accent: 'detail' },
  { key: 'firstBooking', label: 'First wash booked', icon: 'calendar' as const, accent: 'queue' },
  { key: 'completedBookings', label: 'Successful referrals', icon: 'checkCircle' as const, accent: 'pickup' },
  { key: 'totalEarned', label: 'Total cash earned', icon: 'wallet' as const, accent: 'rate', prefix: 'K' },
  { key: 'availableBalance', label: 'Available balance', icon: 'creditCard' as const, accent: 'cyan', prefix: 'K', cashout: true },
] as const;

const ReferralDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['referral-dashboard'],
    queryFn: async () => {
      const res = await api.get('/referrals/dashboard');
      return res.data.data as DashboardData;
    },
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['referral-leaderboard'],
    queryFn: async () => {
      const res = await api.get('/referrals/leaderboard');
      return res.data.data as LeaderEntry[];
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/referrals/join');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-dashboard'] });
      showToast('Welcome to the SuCAR Referral Program!', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Could not join program', 'error');
    },
  });

  const cashoutMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/referrals/cashout');
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['referral-dashboard'] });
      showToast(data.message || 'Cashout requested', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Cashout failed', 'error');
    },
  });

  const copyLink = async () => {
    if (!dashboard?.referralLink) return;
    try {
      await navigator.clipboard.writeText(dashboard.referralLink);
      setLinkCopied(true);
      showToast('Referral link copied!', 'success');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      showToast('Could not copy link', 'error');
    }
  };

  const homePath = user?.role === 'driver' ? '/driver' : '/client';

  if (isLoading) {
    return (
      <div className="ref-page ref-page--loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (!dashboard?.isAffiliate) {
    return (
      <div className="ref-page">
        <header className="ref-topbar">
          <button type="button" className="ref-back" onClick={() => navigate(homePath)}>
            <Icon name="arrowLeft" size={18} />
            Back
          </button>
        </header>
        <div className="ref-join-hero">
          <div className="ref-join-card">
            <span className="ref-join-badge">
              <Icon name="userPlus" size={16} />
              SuCAR Referral Program
            </span>
            <h1>Earn while you share SuCAR</h1>
            <p>
              Refer friends who need a car wash. When they complete their first booking,
              you earn <strong>K{dashboard?.rewardPerReferral ?? 25}</strong> in cash credits.
            </p>
            <ul className="ref-join-benefits">
              <li>
                <Icon name="checkCircle" size={18} />
                Unique referral link for every affiliate
              </li>
              <li>
                <Icon name="checkCircle" size={18} />
                Track sign-ups, bookings, and earnings in real time
              </li>
              <li>
                <Icon name="checkCircle" size={18} />
                Unlock milestone badges as you grow
              </li>
              <li>
                <Icon name="checkCircle" size={18} />
                Cash out from K{dashboard?.minCashout ?? 100}
              </li>
            </ul>
            <button
              type="button"
              className="ref-join-btn"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? 'Joining…' : 'Become a SuCAR Referrer'}
            </button>
            <p className="ref-join-note">Free to join. Available for clients and drivers.</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboard.stats;
  const maxChart = Math.max(...(dashboard.chartData?.map((d) => d.count) || [1]), 1);

  return (
    <div className="ref-page">
      <header className="ref-topbar">
        <button type="button" className="ref-back" onClick={() => navigate(homePath)}>
          <Icon name="arrowLeft" size={18} />
          Back
        </button>
        <nav className="ref-nav">
          <span className="ref-nav-item ref-nav-item--active">Dashboard</span>
          <span className="ref-nav-item">My referrals</span>
          <span className="ref-nav-item">About</span>
        </nav>
      </header>

      <div className="ref-layout">
        <main className="ref-main">
          <div className="ref-header">
            <div>
              <h1>Dashboard</h1>
              <p>Track your referrals and get rewarded for every wash.</p>
            </div>
            <button type="button" className="ref-link-btn" onClick={copyLink}>
              <Icon name="info" size={16} />
              {linkCopied ? 'Copied!' : 'Your referral link'}
            </button>
          </div>

          <div className="ref-stats-grid">
            {STAT_CARDS.map((card) => {
              const raw = stats[card.key as keyof typeof stats] ?? 0;
              const display = 'prefix' in card ? `${card.prefix}${raw}` : String(raw);
              return (
                <div key={card.key} className="ref-stat-card">
                  <div className={`ref-stat-icon ref-stat-icon--${card.accent}`}>
                    <Icon name={card.icon} size={20} />
                  </div>
                  <div className="ref-stat-body">
                    <span className="ref-stat-label">{card.label}</span>
                    <span className="ref-stat-value">{display}</span>
                  </div>
                  {'cashout' in card && card.cashout && (
                    <button
                      type="button"
                      className="ref-cashout-mini"
                      disabled={
                        cashoutMutation.isPending ||
                        stats.availableBalance < (dashboard.minCashout || 100)
                      }
                      onClick={() => cashoutMutation.mutate()}
                    >
                      Cashout
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <section className="ref-milestones">
            <div className="ref-section-head">
              <h2>
                Milestones
                <Icon name="info" size={14} />
              </h2>
            </div>
            <div className="ref-milestone-track">
              {dashboard.milestones.map((m) => (
                <div
                  key={m.tier}
                  className={`ref-milestone-badge ${m.reached ? 'ref-milestone-badge--reached' : ''}`}
                >
                  <span className="ref-milestone-count">{m.count}</span>
                  <span className="ref-milestone-label">{m.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="ref-chart-section">
            <div className="ref-section-head">
              <h2>
                Total referrals over time
                <Icon name="info" size={14} />
              </h2>
            </div>
            <div className="ref-chart">
              {dashboard.chartData?.some((d) => d.count > 0) ? (
                <div className="ref-chart-bars">
                  {dashboard.chartData.map((d) => (
                    <div key={d.date} className="ref-chart-bar-wrap" title={`${d.date}: ${d.count}`}>
                      <div
                        className="ref-chart-bar"
                        style={{ height: `${Math.max((d.count / maxChart) * 100, 4)}%` }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ref-chart-empty">
                  <Icon name="package" size={40} />
                  <p>No referral data yet. Share your link to get started!</p>
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="ref-sidebar">
          <div className="ref-leaderboard">
            <h3>
              Top referrers in last 30 days
              <Icon name="info" size={14} />
            </h3>

            {leaderboard.length >= 3 && (
              <div className="ref-podium">
                {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
                  if (!entry) return null;
                  const place = i === 0 ? 2 : i === 1 ? 1 : 3;
                  return (
                    <div key={entry.userId} className={`ref-podium-item ref-podium-item--${place}`}>
                      {place === 1 && <Icon name="crown" size={16} className="ref-podium-crown" />}
                      <div className="ref-podium-avatar">{entry.initials}</div>
                      <span className="ref-podium-rank">{place}</span>
                      <span className="ref-podium-name">{entry.initials}</span>
                      <span className="ref-podium-score">{entry.completedReferrals} washes</span>
                    </div>
                  );
                })}
              </div>
            )}

            <ul className="ref-leader-list">
              {leaderboard.slice(leaderboard.length >= 3 ? 3 : 0).map((entry) => (
                <li key={entry.userId} className="ref-leader-row">
                  <span className="ref-leader-rank">{entry.rank}</span>
                  <div className="ref-leader-avatar">{entry.initials}</div>
                  <span className="ref-leader-name">{entry.initials}</span>
                  <span className="ref-leader-score">
                    <Icon name="checkCircle" size={14} />
                    {entry.completedReferrals}
                  </span>
                </li>
              ))}
            </ul>

            {leaderboard.length === 0 && (
              <p className="ref-leader-empty">No referrers yet this month. Be the first!</p>
            )}

            <div className="ref-you-row">
              <div className="ref-leader-avatar ref-leader-avatar--you">
                {(user?.name || 'You').split(' ').map((w) => w[0]).join('. ').slice(0, 5)}
              </div>
              <span className="ref-you-label">You</span>
              <span className="ref-you-score">{stats.completedBookings} washes this month</span>
            </div>
          </div>

          <div className="ref-code-card">
            <span className="ref-code-label">Your code</span>
            <code className="ref-code-value">{dashboard.referralCode}</code>
            <button type="button" className="ref-code-copy" onClick={copyLink}>
              Copy link
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ReferralDashboard;
