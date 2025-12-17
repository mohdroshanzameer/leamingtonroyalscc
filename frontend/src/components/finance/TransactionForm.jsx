import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, RefreshCw } from 'lucide-react';

const INCOME_CATEGORIES = [
  'Membership Fees', 'Sponsorship', 'Match Revenue', 
  'Merchandise Sales', 'Donations', 'Event Income', 'Other'
];

const EXPENSE_CATEGORIES = [
  'Player Wages', 'Equipment', 'Ground Maintenance', 'Utilities',
  'Travel & Transport', 'Catering', 'Marketing', 'Insurance',
  'Medical', 'Coaching', 'Administration', 'Other'
];

export default function TransactionForm({ transaction, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(transaction || {
    type: 'Income',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    paid_to: '',
    received_from: '',
    payment_method: 'Bank Transfer',
    status: 'Completed',
    is_recurring: false,
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount) || 0
    });
  };

  const categories = formData.type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(v) => setFormData({ ...formData, type: v, category: '' })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Income">Income</SelectItem>
              <SelectItem value="Expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select 
            value={formData.category} 
            onValueChange={(v) => setFormData({ ...formData, category: v })}
          >
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Amount (£) *</Label>
          <Input 
            type="number" 
            step="0.01"
            min="0"
            required 
            value={formData.amount || ''} 
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label>Date *</Label>
          <Input 
            type="date" 
            required 
            value={formData.date} 
            onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
          />
        </div>
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select 
            value={formData.payment_method} 
            onValueChange={(v) => setFormData({ ...formData, payment_method: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
              <SelectItem value="Online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(v) => setFormData({ ...formData, status: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Reference Number</Label>
          <Input 
            value={formData.reference} 
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })} 
            placeholder="INV-001"
          />
        </div>
        <div className="space-y-2">
          <Label>Transaction Nature</Label>
          <div className="flex items-center gap-3 h-10 px-3 border rounded-md bg-white">
            <Switch 
              checked={formData.is_recurring} 
              onCheckedChange={(v) => setFormData({ ...formData, is_recurring: v })}
            />
            <span className="text-sm flex items-center gap-2">
              {formData.is_recurring ? (
                <><RefreshCw className="w-4 h-4 text-blue-600" /> Recurring</>
              ) : (
                <>One-time</>
              )}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <Label>{formData.type === 'Expense' ? 'Paid To' : 'Received From'}</Label>
          <Input 
            value={formData.type === 'Expense' ? formData.paid_to : formData.received_from} 
            onChange={(e) => setFormData({ 
              ...formData, 
              [formData.type === 'Expense' ? 'paid_to' : 'received_from']: e.target.value 
            })} 
            placeholder={formData.type === 'Expense' ? 'Vendor name' : 'Payer name'}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input 
          value={formData.description} 
          onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
          placeholder="Brief description of the transaction"
        />
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea 
          value={formData.notes} 
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
          placeholder="Additional notes..."
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full bg-emerald-800 hover:bg-emerald-900">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        {transaction ? 'Update Transaction' : 'Add Transaction'}
      </Button>
    </form>
  );
}