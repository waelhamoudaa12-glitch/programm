import React, { useState, useEffect } from 'react';
import { Package, Plus, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Inventory.css';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('قطعة');
  const [newItemCost, setNewItemCost] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setItems(data);
    } catch (error) {
      console.error('Error fetching inventory:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (newItemName && newItemQty) {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .insert([
            { 
              name: newItemName, 
              quantity: parseInt(newItemQty), 
              unit: newItemUnit, 
              min_limit: 5 
            }
          ])
          .select();

        if (error) throw error;
        
        // 2. Add transaction record automatically
        const { error: txError } = await supabase
          .from('transactions')
          .insert([
            {
              description: `شراء للمخزن: ${newItemName}`,
              amount: parseFloat(newItemCost),
              type: 'مصروف'
            }
          ]);
          
        if (txError) throw txError;

        if (data) {
          setItems([data[0], ...items]);
          setShowAddModal(false);
          setNewItemName('');
          setNewItemQty('');
          setNewItemCost('');
        }
      } catch (error) {
        console.error('Error adding item:', error.message);
      }
    }
  };

  const handleQuantityChange = async (id, newQtyStr) => {
    const newQty = parseInt(newQtyStr, 10);
    const validQty = isNaN(newQty) ? 0 : newQty;
    
    // Optimistic UI update
    setItems(items.map(item => item.id === id ? { ...item, quantity: validQty } : item));

    try {
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: validQty })
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating quantity:', error.message);
      // Revert on error could be implemented here
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('هل أنت متأكد من مسح هذه المادة من المخزن؟')) {
      try {
        const { error } = await supabase.from('inventory').delete().eq('id', id);
        if (error) throw error;
        setItems(items.filter(item => item.id !== id));
      } catch (err) {
        console.error('Error deleting item:', err.message);
        alert('حدث خطأ أثناء مسح المادة.');
      }
    }
  };

  return (
    <div className="inventory-page">
      <header className="page-header flex justify-between items-center">
        <div>
          <h1>المخزن والمستلزمات</h1>
          <p className="text-muted">إدارة مخزون العيادة من المواد والأدوات الطبية.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> إضافة عنصر جديد
        </button>
      </header>

      <div className="card mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2>قائمة المواد</h2>
        </div>
        
        {loading ? (
          <p className="text-center text-muted">جاري تحميل البيانات من قاعدة البيانات...</p>
        ) : (
          <div className="table-container">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>اسم المادة / الأداة</th>
                  <th>الكمية المتوفرة</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center text-muted">لا توجد مواد في المخزن.</td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Package size={20} className="text-muted" />
                          <strong>{item.name}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="input-field" 
                            style={{ width: '80px', textAlign: 'center', padding: '0.25rem' }}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            min="0"
                          />
                          <span>{item.unit}</span>
                        </div>
                      </td>
                      <td>
                        {item.quantity <= item.min_limit ? (
                          <span className="status-badge inactive flex items-center gap-1" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
                            <AlertCircle size={14} /> أوشك على الانتهاء
                          </span>
                        ) : (
                          <span className="status-badge active flex items-center gap-1" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-color)' }}>
                            <CheckCircle2 size={14} /> متوفر
                          </span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-outline" onClick={() => handleDeleteItem(item.id)} style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)', padding: '0.25rem 0.5rem' }}>
                          <Trash2 size={16} />
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
            <h3>إضافة عنصر جديد للمخزن</h3>
            <form onSubmit={handleAddItem} className="flex flex-col gap-4 mt-4">
              <div className="input-group">
                <label className="input-label">اسم العنصر</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="مثال: قطن طبي، إبر بنج..." 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">الكمية</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="0" 
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">الوحدة</label>
                  <select 
                    className="input-field" 
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                  >
                    <option value="قطعة">قطعة</option>
                    <option value="علبة">علبة</option>
                    <option value="حقنة">حقنة</option>
                    <option value="لتر">لتر</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">إجمالي التكلفة (ج.م)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="مثال: 200" 
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ في قاعدة البيانات</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
