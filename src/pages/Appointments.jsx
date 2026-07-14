import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, Phone, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppt, setNewAppt] = useState({ patient_name: '', phone: '', appointment_date: '', appointment_time: '', notes: '' });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
        
      if (error) throw error;
      if (data) setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (newAppt.patient_name && newAppt.appointment_date && newAppt.appointment_time) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .insert([newAppt])
          .select();

        if (error) throw error;
        if (data) {
          setAppointments([...appointments, data[0]].sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date)));
          setShowAddModal(false);
          setNewAppt({ patient_name: '', phone: '', appointment_date: '', appointment_time: '', notes: '' });
        }
      } catch (error) {
        console.error('Error adding appointment:', error.message);
      }
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
      setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
    } catch (error) {
      console.error('Error updating status:', error.message);
    }
  };

  return (
    <div className="appointments-page">
      <header className="page-header flex justify-between items-center">
        <div>
          <h1>المواعيد والحجوزات</h1>
          <p className="text-muted">إدارة جدول المواعيد اليومي للعيادة.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> حجز موعد جديد
        </button>
      </header>

      <div className="card mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2>جدول المواعيد القادمة</h2>
        </div>

        {loading ? (
          <p className="text-center text-muted">جاري تحميل البيانات...</p>
        ) : (
          <div className="table-container">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>اسم المريض</th>
                  <th>التاريخ</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">لا يوجد مواعيد مسجلة.</td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <div className="flex flex-col">
                          <strong className="flex items-center gap-2"><User size={14} className="text-muted" /> {appt.patient_name}</strong>
                          <span className="text-sm text-muted flex items-center gap-1 mt-1" dir="ltr"><Phone size={12}/> {appt.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={16} className="text-muted" />
                          {new Date(appt.appointment_date).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-muted" />
                          <span dir="ltr">{appt.appointment_time}</span>
                        </div>
                      </td>
                      <td>
                        {appt.status === 'scheduled' && <span className="status-badge" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>مجدول</span>}
                        {appt.status === 'completed' && <span className="status-badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>مكتمل</span>}
                        {appt.status === 'cancelled' && <span className="status-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>ملغي</span>}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {appt.status === 'scheduled' && (
                            <>
                              <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--success-color)', color: 'var(--success-color)' }} onClick={() => updateStatus(appt.id, 'completed')} title="تم الحضور">
                                <CheckCircle2 size={16} />
                              </button>
                              <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }} onClick={() => updateStatus(appt.id, 'cancelled')} title="إلغاء">
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h3>حجز موعد جديد</h3>
            <form onSubmit={handleAddAppointment} className="flex flex-col gap-4 mt-4">
              <div className="input-group">
                <label className="input-label">اسم المريض</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newAppt.patient_name}
                  onChange={(e) => setNewAppt({ ...newAppt, patient_name: e.target.value })}
                  required 
                />
              </div>
              <div className="input-group">
                <label className="input-label">رقم الهاتف</label>
                <input 
                  type="text" 
                  className="input-field" 
                  dir="ltr"
                  value={newAppt.phone}
                  onChange={(e) => setNewAppt({ ...newAppt, phone: e.target.value })}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">التاريخ</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={newAppt.appointment_date}
                    onChange={(e) => setNewAppt({ ...newAppt, appointment_date: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">الوقت</label>
                  <input 
                    type="time" 
                    className="input-field" 
                    value={newAppt.appointment_time}
                    onChange={(e) => setNewAppt({ ...newAppt, appointment_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الموعد</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
