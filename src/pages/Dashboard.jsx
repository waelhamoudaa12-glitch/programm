import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { Users, DollarSign, CalendarDays } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalIncome: 0,
    todaysAppointments: 0,
    recentPatients: [],
    financialChartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Total patients
      const { count: patientsCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      
      // 2. Today's appointments
      const todayString = new Date().toISOString().split('T')[0];
      const { count: apptsCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', todayString);

      // 3. Transactions for chart and total income
      const { data: txData } = await supabase.from('transactions').select('amount, type, date').order('date', { ascending: true });
      
      let totalIncome = 0;
      
      // Group by month for the chart
      const chartMap = {};

      if (txData) {
        txData.forEach(tx => {
          if (tx.type === 'دخل') totalIncome += Number(tx.amount);
          
          const month = new Date(tx.date).toLocaleString('ar-EG', { month: 'short' });
          if (!chartMap[month]) chartMap[month] = { name: month, 'الإيرادات': 0, 'المصروفات': 0 };
          
          if (tx.type === 'دخل') chartMap[month]['الإيرادات'] += Number(tx.amount);
          if (tx.type === 'مصروف') chartMap[month]['المصروفات'] += Number(tx.amount);
        });
      }

      const financialChartData = Object.values(chartMap);

      // 4. Recent patients
      const { data: recentPatients } = await supabase.from('patients').select('id, name, created_at').order('created_at', { ascending: false }).limit(3);

      setStats({
        totalPatients: patientsCount || 0,
        todaysAppointments: apptsCount || 0,
        totalIncome: totalIncome,
        recentPatients: recentPatients || [],
        financialChartData: financialChartData
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">جاري تحميل إحصائيات العيادة...</div>;

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1>اللوحة الرئيسية وإحصائيات العيادة</h1>
        <p className="text-muted">مرحباً بك. هذه لمحة سريعة ومفصلة عن أداء العيادة المالي والتشغيلي.</p>
      </header>

      <div className="stats-grid grid grid-cols-3 gap-6 mt-6">
        <div className="stat-card card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--primary-color)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>إجمالي المرضى المسجلين</h3>
            <p className="stat-value">{stats.totalPatients}</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-color)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>إجمالي الإيرادات التاريخية</h3>
            <p className="stat-value">{stats.totalIncome.toLocaleString()} ج.م</p>
          </div>
        </div>

        <div className="stat-card card cursor-pointer hover:shadow-md transition" onClick={() => navigate('/appointments')}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <CalendarDays size={24} />
          </div>
          <div className="stat-info">
            <h3>مواعيد اليوم</h3>
            <p className="stat-value">{stats.todaysAppointments}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content grid grid-cols-2 gap-6 mt-6">
        <div className="card w-full" style={{ minHeight: '300px' }}>
          <h2>الأداء المالي (إيرادات ومصروفات)</h2>
          {stats.financialChartData.length === 0 ? (
            <p className="text-muted mt-4">لا توجد بيانات مالية كافية لرسم المخطط البياني.</p>
          ) : (
            <div style={{ width: '100%', height: '250px', marginTop: '1rem', direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.financialChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ textAlign: 'right', direction: 'rtl' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="الإيرادات" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="المصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card appointments-card">
          <h2>أحدث المرضى المضافين</h2>
          {stats.recentPatients.length === 0 ? (
            <p className="text-muted mt-4">لا يوجد مرضى مسجلين حتى الآن.</p>
          ) : (
            <ul className="appointments-list">
              {stats.recentPatients.map(patient => (
                <li key={patient.id} className="appointment-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/patients/${patient.id}`)}>
                  <div className="time" dir="ltr" style={{ minWidth: '80px', fontSize: '0.8rem' }}>
                    {new Date(patient.created_at).toLocaleDateString('ar-EG')}
                  </div>
                  <div className="details">
                    <strong>{patient.name}</strong>
                    <span className="text-muted">رقم الملف: #{patient.id.substring(0,6)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button className="btn btn-outline w-full mt-4" onClick={() => navigate('/patients')}>عرض كل المرضى</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
