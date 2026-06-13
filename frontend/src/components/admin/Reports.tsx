import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Reports = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/admin/reports`);
      return response.data.data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const chartData = data?.statusBreakdown?.map((item: any) => ({
    name: item._id.replace('_', ' '),
    count: item.count,
    revenue: item.totalRevenue || 0,
  })) || [];

  return (
    <div className="admin-page-reports">
      <h1>Reports & Analytics</h1>
      <div className="dashboard-card">
        <h2>Booking Status Breakdown</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#00C896" name="Bookings" />
            <Bar dataKey="revenue" fill="rgba(0, 200, 150, 0.45)" name="Revenue (K)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="dashboard-card">
        <h2>Revenue by Car Wash</h2>
        <table>
          <thead>
            <tr>
              <th>Car Wash</th>
              <th>Bookings</th>
              <th>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data?.revenueByCarWash?.map((item: any) => (
              <tr key={item._id}>
                <td>{item.carWashName}</td>
                <td>{item.bookingCount}</td>
                <td>K{item.totalRevenue?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
