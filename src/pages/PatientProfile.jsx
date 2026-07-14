import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, UserCircle, Phone, Calendar, Plus, Upload, X, Trash2, Printer, FileText, Banknote } from 'lucide-react';
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
  const [totalCost, setTotalCost] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  
  const [treatmentPlan, setTreatmentPlan] = useState([]);
  
  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState([]);
  const [newMeds, setNewMeds] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(null); // stores prescription id to print

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

      // Fetch prescriptions
      const { data: rxData, error: rxError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      
      if (!rxError && rxData) {
        setPrescriptions(rxData);
      }

      // Fetch xrays
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
        const cost = parseFloat(totalCost) || 0;
        const paid = parseFloat(paidAmount) || 0;

        const { data, error } = await supabase
          .from('treatments')
          .insert([
            { 
              patient_id: patient.id,
              tooth: toothNumber, 
              problem: problem, 
              procedure: procedure,
              total_cost: cost,
              paid_amount: paid
            }
          ])
          .select();

        if (error) throw error;
        
        // Add transaction record automatically if paid > 0
        if (paid > 0) {
          const { error: txError } = await supabase
            .from('transactions')
            .insert([
              {
                description: `علاج مريض: ${patient.name} - ${procedure}`,
                amount: paid,
                type: 'دخل'
              }
            ]);
          if (txError) throw txError;
        }

        if (data) {
          setTreatmentPlan([data[0], ...treatmentPlan]);
          setToothNumber('');
          setProblem('');
          setProcedure('');
          setTotalCost('');
          setPaidAmount('');
        }
      } catch (error) {
        console.error('Error saving diagnosis:', error.message);
      }
    }
  };

  const savePrescription = async (e) => {
    e.preventDefault();
    if (newMeds && patient) {
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .insert([{ patient_id: patient.id, medications: newMeds, notes: newNotes }])
          .select();
        
        if (error) throw error;
        if (data) {
          setPrescriptions([data[0], ...prescriptions]);
          setNewMeds('');
          setNewNotes('');
        }
      } catch (error) {
        console.error('Error saving prescription:', error.message);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && patient) {
      const localUrl = URL.createObjectURL(file);
      const newXray = { id: Date.now().toString(), name: file.name, url: localUrl, date: new Date().toLocaleDateString('ar-EG') };
      setXrays([newXray, ...xrays]);
    }
  };

  const handleDeletePatient = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المريض؟ سيتم مسح كافة السجلات الطبية المرتبطة به إلى الأبد.')) {
      try {
        const { error } = await supabase.from('patients').delete().eq('id', id);
        if (error) throw error;
        navigate('/patients');
      } catch (err) {
        console.error('Error deleting patient:', err.message);
        alert('حدث خطأ أثناء مسح المريض.');
      }
    }
  };

  const printPrescription = (rx) => {
    setShowPrintModal(rx);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (loading) return <div className="p-8 text-center">جاري تحميل بيانات المريض...</div>;
  if (!patient) return <div className="p-8 text-center text-danger">لم يتم العثور على المريض.</div>;

  // Calculate Balances
  const totalIncurred = treatmentPlan.reduce((sum, t) => sum + (Number(t.total_cost) || 0), 0);
  const totalPaid = treatmentPlan.reduce((sum, t) => sum + (Number(t.paid_amount) || 0), 0);
  const remainingBalance = totalIncurred - totalPaid;

  return (
    <div className="patient-profile">
      {/* Hide headers when printing */}
      <div className="no-print">
        <header className="page-header flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button className="btn btn-outline" onClick={() => navigate('/patients')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
              <ArrowRight size={18} /> رجوع
            </button>
            <div>
              <h1>ملف المريض: {patient.name}</h1>
            </div>
          </div>
          <button className="btn" onClick={handleDeletePatient} style={{ backgroundColor: 'var(--danger-color)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', width: 'auto' }}>
            <Trash2 size={18} /> مسح المريض
          </button>
        </header>

        <div className="profile-grid grid grid-cols-3 gap-6">
          <div className="col-span-1 flex flex-col gap-6" style={{ alignSelf: 'start' }}>
            {/* Patient Info Card */}
            <div className="card profile-info-card">
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

            {/* Financial Balance Card */}
            <div className="card balance-card" style={{ backgroundColor: remainingBalance > 0 ? '#fff1f2' : '#f0fdf4', border: `1px solid ${remainingBalance > 0 ? '#fecdd3' : '#bbf7d0'}` }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: remainingBalance > 0 ? '#e11d48' : '#16a34a' }}>
                <Banknote size={20} />
                <h3 style={{ margin: 0 }}>الحساب المالي</h3>
              </div>
              <div className="flex justify-between mt-4 text-sm">
                <span>إجمالي التكلفة:</span>
                <strong>{totalIncurred} ج.م</strong>
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span>المدفوع:</span>
                <strong>{totalPaid} ج.م</strong>
              </div>
              <div className="flex justify-between mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span>المتبقي (المديونية):</span>
                <span style={{ color: remainingBalance > 0 ? '#e11d48' : '#16a34a' }}>{remainingBalance} ج.م</span>
              </div>
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
                  <input type="text" className="input-field" placeholder="مثال: 14، العلوي الأمامي..." value={toothNumber} onChange={(e) => setToothNumber(e.target.value)} required />
                </div>
                
                <div className="input-group">
                  <label className="input-label">المشكلة / التشخيص</label>
                  <textarea className="input-field" rows="2" placeholder="مثال: تسوس عميق، كسر في التاج..." value={problem} onChange={(e) => setProblem(e.target.value)} required></textarea>
                </div>

                <div className="input-group">
                  <label className="input-label">الإجراء المطلوب / العلاج</label>
                  <textarea className="input-field" rows="2" placeholder="مثال: حشو عصب، تركيب طربوش..." value={procedure} onChange={(e) => setProcedure(e.target.value)} required></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label">إجمالي تكلفة الإجراء (ج.م)</label>
                    <input type="number" className="input-field" placeholder="0" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">ما تم دفعه الآن (ج.م)</label>
                    <input type="number" className="input-field" placeholder="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} required />
                  </div>
                </div>

                <div className="flex mt-2">
                  <button type="submit" className="btn btn-primary">
                    <Plus size={18} /> حفظ السجل والحساب
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
                        {(record.total_cost > 0 || record.paid_amount > 0) && (
                          <div className="mt-2 text-sm text-muted">
                            التكلفة: {record.total_cost || 0} ج.م | المدفوع: {record.paid_amount || 0} ج.م
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Prescriptions Section */}
            <div className="card prescriptions-section">
              <h2>الوصفات الطبية (الروشتات)</h2>
              <form onSubmit={savePrescription} className="mt-4 flex flex-col gap-4 p-4" style={{ backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <div className="input-group">
                  <label className="input-label">الأدوية (كل دواء في سطر)</label>
                  <textarea className="input-field" rows="3" placeholder="1. Augmentin 1g tab..." value={newMeds} onChange={(e) => setNewMeds(e.target.value)} required></textarea>
                </div>
                <div className="input-group">
                  <label className="input-label">ملاحظات / تعليمات (اختياري)</label>
                  <input type="text" className="input-field" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
                </div>
                <div>
                  <button type="submit" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} /> حفظ الوصفة
                  </button>
                </div>
              </form>

              {prescriptions.length > 0 && (
                <div className="mt-6 flex flex-col gap-4">
                  {prescriptions.map(rx => (
                    <div key={rx.id} className="p-4 border rounded-md flex justify-between items-start">
                      <div>
                        <div className="text-sm text-muted mb-2">{new Date(rx.created_at).toLocaleDateString('ar-EG')}</div>
                        <pre style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0 }}>{rx.medications}</pre>
                        {rx.notes && <p className="text-sm text-muted mt-2">ملاحظات: {rx.notes}</p>}
                      </div>
                      <button className="btn btn-sm btn-primary" onClick={() => printPrescription(rx)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Printer size={16} /> طباعة
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* X-Rays Section */}
            <div className="card xrays-section">
              <div className="flex justify-between items-center mb-4">
                <h2>الأشعة والملفات المرفقة (مؤقتة لهذه الجلسة)</h2>
                <div>
                  <input type="file" id="xray-upload" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
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
      </div>

      {/* Fullscreen X-Ray Modal */}
      {selectedXray && (
        <div className="modal-overlay no-print" onClick={() => setSelectedXray(null)}>
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

      {/* Print Prescription Template (Only visible when printing) */}
      {showPrintModal && (
        <div className="print-only prescription-template">
          <div className="prescription-header">
            <h2>عيادة د. أحمد لطب الفم والأسنان</h2>
            <p>Dr. Ahmed Dental Clinic</p>
            <hr />
          </div>
          <div className="prescription-info">
            <p><strong>اسم المريض:</strong> {patient.name}</p>
            <p><strong>التاريخ:</strong> {new Date(showPrintModal.created_at).toLocaleDateString('ar-EG')}</p>
          </div>
          <div className="prescription-body">
            <h1 className="rx-symbol">Rx</h1>
            <pre className="medications-text">{showPrintModal.medications}</pre>
            {showPrintModal.notes && <p className="notes-text"><strong>تعليمات:</strong> {showPrintModal.notes}</p>}
          </div>
          <div className="prescription-footer">
            <hr />
            <p>العنوان: شارع العيادة، العمارة رقم 1 - الهاتف: 0100000000</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
