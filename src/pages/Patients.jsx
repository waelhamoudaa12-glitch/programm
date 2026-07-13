import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, FileText, Phone } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Patients.css';

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', age: '', medicalHistory: '' });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (newPatient.name && newPatient.phone) {
      try {
        const { data, error } = await supabase
          .from('patients')
          .insert([
            { 
              name: newPatient.name, 
              phone: newPatient.phone, 
              age: newPatient.age ? parseInt(newPatient.age) : null,
              medical_history: newPatient.medicalHistory
            }
          ])
          .select();

        if (error) throw error;
        if (data) {
          setPatients([data[0], ...patients]);
          setShowAddModal(false);
          setNewPatient({ name: '', phone: '', age: '', medicalHistory: '' });
          // Navigate to the new patient's profile directly
          navigate(`/patients/${data[0].id}`);
        }
      } catch (error) {
        console.error('Error adding patient:', error.message);
      }
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.includes(searchTerm) || p.phone.includes(searchTerm)
  );

  return (
    <div className="patients-page">
      <header className="page-header flex justify-between items-center">
        <div>
          <h1>سجل المرضى</h1>
          <p className="text-muted">إدارة بيانات وملفات جميع المرضى بالعيادة.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} /> إضافة مريض جديد
        </button>
      </header>

      <div className="card mt-6">
        <div className="flex justify-between items-center mb-6">
          <div className="search-box relative w-1/2">
            <Search className="search-icon absolute text-muted" size={18} />
            <input 
              type="text" 
              className="input-field pl-10" 
              placeholder="ابحث بالاسم أو رقم الهاتف..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted">جاري تحميل البيانات...</p>
        ) : (
          <div className="table-container">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>رقم الملف</th>
                  <th>الاسم</th>
                  <th>رقم الهاتف</th>
                  <th>تاريخ الإضافة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">لا يوجد مرضى مسجلين.</td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)} style={{ cursor: 'pointer' }}>
                      <td><span className="text-muted">#{patient.id.substring(0, 8)}</span></td>
                      <td style={{ fontWeight: 'bold' }}>{patient.name}</td>
                      <td dir="ltr" style={{ textAlign: 'right' }}>
                        <div className="flex items-center gap-2 justify-end">
                          {patient.phone} <Phone size={14} className="text-muted" />
                        </div>
                      </td>
                      <td>{new Date(patient.created_at).toLocaleDateString('ar-EG')}</td>
                      <td>
                        <button className="btn btn-outline btn-sm">
                          <FileText size={16} /> فتح الملف
                        </button>
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
            <h3>إضافة مريض جديد</h3>
            <form onSubmit={handleAddPatient} className="flex flex-col gap-4 mt-4">
              <div className="input-group">
                <label className="input-label">الاسم بالكامل</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">رقم الهاتف</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    dir="ltr"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    required 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">العمر</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">التاريخ الطبي (أمراض مزمنة، حساسية...)</label>
                <textarea 
                  className="input-field" 
                  rows="3"
                  value={newPatient.medicalHistory}
                  onChange={(e) => setNewPatient({ ...newPatient, medicalHistory: e.target.value })}
                ></textarea>
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ المريض</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
