import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Financials.css';

const Financials = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [txType, setTxType] = useState('دخل');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (txAmount && txDesc) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert([
            { 
              description: txDesc, 
              amount: parseFloat(txAmount), 
              type: txType
            }
          ])
          .select();

        if (error) throw error;
        if (data) {
          setTransactions([data[0], ...transactions]);
          setShowAddModal(false);
          setTxAmount('');
          setTxDesc('');
        }
      } catch (error) {
        console.error('Error adding transaction:', error.message);
      }
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('هل أنت متأكد من مسح هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء.')) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        setTransactions(transactions.filter(tx => tx.id !== id));
      } catch (err) {
        console.error('Error deleting transaction:', err.message);
        alert('حدث خطأ أثناء مسح المعاملة.');
      }
    }
  };

  const handleResetAccounts = async () => {
    if (window.confirm('تنبيه خطير: هل أنت متأكد من تصفير الحسابات (جرد)؟ سيتم مسح جميع الإيرادات والمصروفات الحالية نهائياً ولن تتمكن من استرجاعها.')) {
      try {
        const { error } = await supabase.from('transactions').delete().not('id', 'is', null);
        if (error) throw error;
        setTransactions([]);
      } catch (err) {
        console.error('Error resetting accounts:', err.message);
        alert('حدث خطأ أثناء تصفير الحسابات.');
      }
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'دخل').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'مصروف').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="financials-page">
      <header className="page-header flex justify-between items-center">
        <div>
          <h1>المالية والحسابات</h1>
          <p className="text-muted">نظرة عامة على الإيرادات والمصروفات</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }} onClick={handleResetAccounts} title="مسح جميع المعاملات وبدء جرد جديد">
            <Trash2 size={18} /> تصفير الحسابات
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> تسجيل معاملة جديدة
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="card stat-card" style={{ borderRight: '4px solid var(--success-color)' }}>
          <div className="stat-header">
            <h3>إجمالي الإيرادات</h3>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-color)' }}>
              <ArrowUpRight size={24} />
            </div>
          </div>
          <div className="stat-value">{totalIncome.toLocaleString()} ج.م</div>
        </div>

        <div className="card stat-card" style={{ borderRight: '4px solid var(--danger-color)' }}>
          <div className="stat-header">
            <h3>إجمالي المصروفات</h3>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
              <ArrowDownRight size={24} />
            </div>
          </div>
          <div className="stat-value">{totalExpense.toLocaleString()} ج.م</div>
        </div>

        <div className="card stat-card" style={{ borderRight: '4px solid var(--primary-color)' }}>
          <div className="stat-header">
            <h3>صافي الربح</h3>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--primary-color)' }}>
              <DollarSign size={24} />
            </div>
          </div>
          <div className="stat-value" style={{ color: netProfit >= 0 ? 'inherit' : 'var(--danger-color)' }}>
            {netProfit.toLocaleString()} ج.م
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h2>سجل المعاملات</h2>
        {loading ? (
          <p className="text-center text-muted mt-4">جاري التحميل...</p>
        ) : transactions.length === 0 ? (
          <p className="text-center text-muted mt-4">لا توجد معاملات مسجلة بعد.</p>
        ) : (
          <div className="table-container mt-4">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الوصف</th>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>{tx.description}</td>
                    <td>
                      <span className={`status-badge ${tx.type === 'دخل' ? 'active' : 'inactive'}`} 
                            style={{ 
                              backgroundColor: tx.type === 'دخل' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              color: tx.type === 'دخل' ? 'var(--success-color)' : 'var(--danger-color)'
                            }}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{Number(tx.amount).toLocaleString()} ج.م</td>
                    <td>
                      <button className="btn btn-outline" onClick={() => handleDeleteTransaction(tx.id)} style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)', padding: '0.25rem 0.5rem' }} title="مسح">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h3>إضافة معاملة مالية</h3>
            <form onSubmit={handleAddTransaction} className="flex flex-col gap-4 mt-4">
              <div className="input-group">
                <label className="input-label">نوع المعاملة</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" checked={txType === 'دخل'} onChange={() => setTxType('دخل')} /> إيراد (دخل)
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" checked={txType === 'مصروف'} onChange={() => setTxType('مصروف')} /> مصروف
                  </label>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">المبلغ (ج.م)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  required 
                />
              </div>
              <div className="input-group">
                <label className="input-label">الوصف / التفاصيل</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="مثال: دفع كشف مريض، شراء مستلزمات..." 
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  required 
                />
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financials;
