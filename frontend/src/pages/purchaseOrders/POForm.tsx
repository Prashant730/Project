import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import api from '../../api/client';

const POForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([]);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await api.get('/suppliers?limit=1000')).data.data,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/products?limit=1000')).data.data,
  });

  const addItem = () => setItems([...items, { productId: '', quantity: 1, unitCost: 0 }]);
  
  const updateItem = (idx: number, field: string, val: string | number) => {
    const newItems = [...items];
    (newItems[idx] as any)[field] = val;
    if (field === 'productId') {
      const p = products?.find((x: any) => x.id === val);
      if (p) newItems[idx].unitCost = p.unitPrice; // Default to selling price, user can edit
    }
    setItems(newItems);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const mutation = useMutation({
    mutationFn: async () => {
      const validItems = items.filter(i => i.productId && i.quantity > 0 && i.unitCost >= 0);
      if (!supplierId || validItems.length === 0) throw new Error('Invalid form');
      return api.post('/purchase-orders', { supplierId, items: validItems });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      navigate('/purchase-orders');
    },
  });

  const grandTotal = items.reduce((acc, it) => acc + (it.quantity * it.unitCost), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/purchase-orders')} className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-xs mb-1 font-mono uppercase tracking-wider text-[var(--color-muted)]">New Purchase Order</p>
          <h1 className="text-xl font-medium text-[var(--color-ink)]">Create PO</h1>
        </div>
      </div>

      <div className="p-6 space-y-6 border border-[var(--color-rule)] bg-[var(--color-paper)]">
        <div>
          <label className="field-label">Supplier *</label>
          <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="field-select max-w-sm">
            <option value="">Select Supplier...</option>
            {suppliers?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <label className="field-label">Order Items *</label>
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end p-3 border border-[var(--color-rule)] bg-white rounded-sm">
              <div className="flex-1 w-full">
                <label className="text-xs text-[var(--color-muted)] mb-1 block">Product</label>
                <select value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} className="field-select">
                  <option value="">Select Product...</option>
                  {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="w-full sm:w-24">
                <label className="text-xs text-[var(--color-muted)] mb-1 block">Qty</label>
                <input type="number" min="1" value={item.quantity || ''} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} className="field-input font-mono" />
              </div>
              <div className="w-full sm:w-32">
                <label className="text-xs text-[var(--color-muted)] mb-1 block">Unit Cost (₹)</label>
                <input type="number" min="0" step="0.01" value={item.unitCost === 0 ? '' : item.unitCost} onChange={e => updateItem(idx, 'unitCost', parseFloat(e.target.value) || 0)} className="field-input font-mono" />
              </div>
              <div className="w-full sm:w-32">
                <label className="text-xs text-[var(--color-muted)] mb-1 block">Subtotal</label>
                <input type="text" readOnly value={`₹${(item.quantity * item.unitCost).toFixed(2)}`} className="field-input font-mono bg-transparent border-transparent" />
              </div>
              <button onClick={() => removeItem(idx)} className="p-2 text-[var(--color-terracotta)] hover:bg-red-50 rounded-sm mb-[2px]">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addItem} className="btn-secondary text-xs py-1.5"><Plus className="w-3 h-3 mr-1" /> Add Row</button>
        </div>

        <div className="flex justify-between items-end pt-4 border-t border-[var(--color-rule)]">
          <div className="text-sm font-mono text-[var(--color-ink)]">
            Total Value: ₹{grandTotal.toFixed(2)}
          </div>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !supplierId || items.length === 0}
            className="btn-primary"
          >
            <Save className="w-4 h-4 mr-1.5" /> Save Draft PO
          </button>
        </div>
      </div>
    </div>
  );
};

export default POForm;
