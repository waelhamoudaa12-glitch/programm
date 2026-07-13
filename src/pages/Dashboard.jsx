import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { Users, DollarSign, Activity } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalIncome: 0,
    recentPatients: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Get total patients count
      const { count: patientsCount, error: countError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });
      
      // 2. Get total income
      const { data: incomeData, error: incomeError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'دخل');
      
      const totalIncome = incomeData ? incomeData.reduce((acc, curr) => acc + Number(curr.amount), 0) : 0;

      // 3. Get recent patients (last 3)
      const { data: recentPatients, error: recentPatError } = await supabase
        .from('patients')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // 4. Get recent transactions (last 3)
      const { data: recentTx, error: recentTxError } = await supabase
        .from('transactions')
        .select('description, amount, created_at, type')
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({
        totalPatients: patientsCount || 0,
        totalIncome: totalIncome,
        recentPatients: recentPatients || [],
        recentTransactions: recentTx || []
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">جاري تحميل إحصائيات العيادة...</div>;
  }

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1>اللوحة الرئيسية</h1>
        <p className="text-muted">أهلاً بك. إليك نظرة عامة على العيادة بناءً على البيانات الحقيقية.</p>
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
            <h3>إجمالي الإيرادات</h3>
            <p className="stat-value">{stats.totalIncome.toLocaleString()} ج.م</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <h3>نشاط العيادة</h3>
            <p className="stat-value">مستقر</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content grid grid-cols-2 gap-6 mt-6">
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

        <div className="card recent-activity-card">
          <h2>المعاملات المالية الأخيرة</h2>
          {stats.recentTransactions.length === 0 ? (
            <p className="text-muted mt-4">لا توجد معاملات مسجلة حتى الآن.</p>
          ) : (
            <div className="activity-list">
              {stats.recentTransactions.map((tx, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-dot" style={{ backgroundColor: tx.type === 'دخل' ? 'var(--success-color)' : 'var(--danger-color)' }}></div>
                  <div className="activity-text flex justify-between w-full">
                    <div>
                      <p><strong>{tx.description}</strong></p>
                      <span className="time-ago">{new Date(tx.created_at).toLocaleString('ar-EG')}</span>
                    </div>
                    <div style={{ color: tx.type === 'دخل' ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>
                      {tx.type === 'دخل' ? '+' : '-'}{tx.amount} ج.م
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-outline w-full mt-4" onClick={() => navigate('/financials')}>عرض كل المعاملات</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
