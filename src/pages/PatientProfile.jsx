import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, UserCircle, Phone, Calendar, Plus, Upload, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './PatientProfile.css';

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [toothNumber, setToothNumber] = useState('');
  const [problem, setProblem] = useState('');
  const [procedure, setProcedure] = useState('');
  
  const [treatmentPlan, setTreatmentPlan] = useState([]);
  
  // X-Ray State
  const [xrays, setXrays] = useState([]);
  const [selectedXray, setSelectedXray] = useState(null);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      // Fetch patient details
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
        
      if (patientError) throw patientError;
      setPatient(patientData);

      // Fetch treatments
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from('treatments')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
        
      if (treatmentsError) throw treatmentsError;
      setTreatmentPlan(treatmentsData || []);

      // Fetch xrays (Assuming URL is saved, for now we keep it empty if we don't have storage setup, or fetch existing records)
      const { data: xraysData, error: xraysError } = await supabase
        .from('xrays')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
        
      if (xraysError) throw xraysError;
      setXrays(xraysData || []);

    } catch (error) {
      console.error('Error fetching patient data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveDiagnosis = async (e) => {
    e.preventDefault();
    if (toothNumber && problem && procedure && patient) {
      try {
        const { data, error } = await supabase
          .from('treatments')
          .insert([
            { 
              patient_id: patient.id,
              tooth: toothNumber, 
              problem: problem, 
              procedure: procedure
            }
          ])
          .select();

        if (error) throw error;
        if (data) {
          setTreatmentPlan([data[0], ...treatmentPlan]);
          setToothNumber('');
          setProblem('');
          setProcedure('');
        }
      } catch (error) {
        console.error('Error saving diagnosis:', error.message);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && patient) {
      // NOTE: In a real app, you would upload to Supabase Storage first.
      // Here we just create a local Object URL for the session.
      // If we wanted persistence without Storage, we could base64 encode it, but that's heavy.
      const localUrl = URL.createObjectURL(file);
      
      const newXray = {
        id: Date.now().toString(),
        name: file.name,
        url: localUrl,
        date: new Date().toLocaleDateString('ar-EG')
      };
      setXrays([newXray, ...xrays]);
      
      // We are skipping the DB insert for Xrays here unless Storage is setup to avoid broken links
    }
  };

  if (loading) return <div className="p-8 text-center">جاري تحميل بيانات المريض...</div>;
  if (!patient) return <div className="p-8 text-center text-danger">لم يتم العثور على المريض.</div>;

  return (
    <div className="patient-profile">
      <header className="page-header flex items-center gap-4">
        <button className="btn btn-outline" onClick={() => navigate('/patients')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowRight size={18} /> رجوع
        </button>
        <div>
          <h1>ملف المريض: {patient.name}</h1>
        </div>
      </header>

      <div className="profile-grid grid grid-cols-3 gap-6">
        <div className="card col-span-1 profile-info-card" style={{ alignSelf: 'start' }}>
          <div className="profile-avatar-large">
            <UserCircle size={80} className="text-muted" />
          </div>
          <h2 className="mt-4">{patient.name}</h2>
          <p className="text-muted">رقم الملف: #{patient.id.substring(0, 8)} • {patient.age ? `${patient.age} سنة` : 'العمر غير مسجل'}</p>
          
          <div className="info-list mt-6">
            <div className="info-item">
              <Phone size={18} className="text-muted" />
              <span dir="ltr">{patient.phone}</span>
            </div>
            <div className="info-item">
              <Calendar size={18} className="text-muted" />
              <span>تاريخ الإضافة: {new Date(patient.created_at).toLocaleDateString('ar-EG')}</span>
            </div>
          </div>

          <div className="medical-history mt-6">
            <h3>التاريخ الطبي</h3>
            <p className="text-sm mt-2">{patient.medical_history || 'لا يوجد تاريخ طبي مسجل.'}</p>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-6">
          <div className="card diagnosis-form">
            <div className="flex justify-between items-center mb-4">
              <h2>إضافة تشخيص أو إجراء جديد</h2>
            </div>
            
            <form onSubmit={saveDiagnosis} className="flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label">رقم السن / الضرس</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="مثال: 14، العلوي الأمامي..."
                  value={toothNumber}
                  onChange={(e) => setToothNumber(e.target.value)}
                  required
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">المشكلة / التشخيص</label>
                <textarea 
                  className="input-field" 
                  rows="2" 
                  placeholder="مثال: تسوس عميق، كسر في التاج..."
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="input-group">
                <label className="input-label">الإجراء المطلوب / العلاج</label>
                <textarea 
                  className="input-field" 
                  rows="2" 
                  placeholder="مثال: حشو عصب، تركيب طربوش..."
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="flex mt-2">
                <button type="submit" className="btn btn-primary">
                  <Plus size={18} /> حفظ السجل
                </button>
              </div>
            </form>
          </div>

          <div className="card treatment-history">
            <h2>خطة العلاج والسجل الطبي</h2>
            {treatmentPlan.length === 0 ? (
              <p className="text-muted mt-4">لا توجد علاجات مسجلة حتى الآن.</p>
            ) : (
              <ul className="appointments-list">
                {treatmentPlan.map((record) => (
                  <li key={record.id} className="appointment-item" style={{ alignItems: 'flex-start' }}>
                    <div className="time" dir="ltr" style={{ minWidth: '100px' }}>{new Date(record.created_at).toLocaleDateString('ar-EG')}</div>
                    <div className="details" style={{ width: '100%' }}>
                      <strong>السن: {record.tooth}</strong>
                      <div className="mt-1 flex gap-2 flex-wrap">
                        <span className="status-badge inactive" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
                          المشكلة: {record.problem}
                        </span>
                        <span className="status-badge active" style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--primary-color)' }}>
                          الإجراء: {record.procedure}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* X-Rays Section */}
          <div className="card xrays-section">
            <div className="flex justify-between items-center mb-4">
              <h2>الأشعة والملفات المرفقة (مؤقتة لهذه الجلسة)</h2>
              <div>
                <input 
                  type="file" 
                  id="xray-upload" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
                <label htmlFor="xray-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  <Upload size={18} /> رفع أشعة
                </label>
              </div>
            </div>
            {xrays.length === 0 ? (
              <p className="text-muted mt-4">لا توجد أشعة أو ملفات مرفقة.</p>
            ) : (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {xrays.map(xray => (
                  <div key={xray.id} className="xray-thumbnail-container" onClick={() => setSelectedXray(xray.url)}>
                    <img src={xray.url} alt={xray.name} className="xray-thumbnail" />
                    <p className="text-sm mt-2 truncate" title={xray.name} style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{xray.name}</p>
                    <span className="text-xs text-muted">{xray.date || new Date(xray.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen X-Ray Modal */}
      {selectedXray && (
        <div className="modal-overlay" onClick={() => setSelectedXray(null)}>
          <div className="modal-content" style={{ maxWidth: '80%', maxHeight: '90vh', background: 'transparent', border: 'none', boxShadow: 'none' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-end mb-4">
              <button className="btn" style={{ background: '#fff', color: 'var(--danger-color)', borderRadius: '50%', padding: '0.5rem' }} onClick={() => setSelectedXray(null)}>
                <X size={24} />
              </button>
            </div>
            <img src={selectedXray} alt="X-Ray Full" style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
