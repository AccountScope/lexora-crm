/**
 * Trust Transaction Form Component
 * Add deposits, withdrawals, transfers, fee transactions
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';

interface ClientLedger {
  id: string;
  client_name: string;
  current_balance: number;
  trust_account_id: string;
}

interface LedgerFormProps {
  preselectedLedgerId?: string;
  onSuccess?: () => void;
}

export default function LedgerForm({ preselectedLedgerId, onSuccess }: LedgerFormProps) {
  const router = useRouter();
  
  const [ledgers, setLedgers] = useState<ClientLedger[]>([]);
  const [formData, setFormData] = useState({
    type: 'deposit' as 'deposit' | 'withdrawal' | 'transfer' | 'fee',
    client_ledger_id: preselectedLedgerId || '',
    destination_ledger_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference_number: '',
    invoice_id: '',
    case_id: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  useEffect(() => {
    fetchLedgers();
  }, []);

  useEffect(() => {
    validateTransaction();
  }, [formData.type, formData.client_ledger_id, formData.amount, formData.destination_ledger_id]);

  async function fetchLedgers() {
    try {
      const response = await fetch('/api/trust/ledgers');
      if (!response.ok) throw new Error('Failed to fetch ledgers');
      const data = await response.json();
      setLedgers(data.ledgers || []);
    } catch (error) {
      console.error('Error fetching ledgers:', error);
    }
  }

  function validateTransaction() {
    const warnings: string[] = [];
    const selectedLedger = ledgers.find((l) => l.id === formData.client_ledger_id);

    if (!selectedLedger) {
      setValidationWarnings([]);
      return;
    }

    const amount = parseFloat(formData.amount) || 0;

    if (formData.type === 'withdrawal' || formData.type === 'fee' || formData.type === 'transfer') {
      if (amount > selectedLedger.current_balance) {
        warnings.push(
          `⚠️ Insufficient funds. Available: $${selectedLedger.current_balance.toFixed(2)}, Requested: $${amount.toFixed(2)}`
        );
      }

      if (selectedLedger.current_balance - amount < 0) {
        warnings.push('❌ This transaction would create a negative balance (BLOCKED)');
      }
    }

    if (formData.type === 'transfer' && formData.destination_ledger_id === formData.client_ledger_id) {
      warnings.push('❌ Cannot transfer to the same ledger');
    }

    setValidationWarnings(warnings);
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.client_ledger_id) {
      newErrors.client_ledger_id = 'Please select a client ledger';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required for compliance';
    }

    if (formData.type === 'transfer' && !formData.destination_ledger_id) {
      newErrors.destination_ledger_id = 'Destination ledger is required for transfers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check for blocking errors
    if (validationWarnings.some((w) => w.includes('BLOCKED'))) {
      alert('Cannot submit: Transaction would violate trust account rules');
      return;
    }

    // Confirm if warnings exist
    if (validationWarnings.length > 0) {
      const confirmed = confirm(
        `Warning:\n${validationWarnings.join('\n')}\n\nDo you want to proceed?`
      );
      if (!confirmed) return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/trust/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create transaction');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/trust-accounting/transactions');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(field: string, value: any) {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  const selectedLedger = ledgers.find((l) => l.id === formData.client_ledger_id);

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Add Trust Transaction</h2>

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            {validationWarnings.map((warning, index) => (
              <p key={index} className="text-sm text-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {warning}
              </p>
            ))}
          </div>
        )}

        <div className="space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="deposit">Deposit (Add Funds)</option>
              <option value="withdrawal">Withdrawal (Remove Funds)</option>
              <option value="transfer">Transfer (Between Clients)</option>
              <option value="fee">Fee Transfer (To Operating Account)</option>
            </select>
          </div>

          {/* Client Ledger */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Ledger *
            </label>
            <select
              value={formData.client_ledger_id}
              onChange={(e) => handleChange('client_ledger_id', e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.client_ledger_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a client</option>
              {ledgers.map((ledger) => (
                <option key={ledger.id} value={ledger.id}>
                  {ledger.client_name} - Balance: $
                  {ledger.current_balance.toFixed(2)}
                </option>
              ))}
            </select>
            {errors.client_ledger_id && (
              <p className="mt-1 text-sm text-red-600">{errors.client_ledger_id}</p>
            )}
            {selectedLedger && (
              <p className="mt-1 text-sm text-gray-600">
                Current balance: ${selectedLedger.current_balance.toFixed(2)}
              </p>
            )}
          </div>

          {/* Destination Ledger (for transfers) */}
          {formData.type === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Ledger *
              </label>
              <select
                value={formData.destination_ledger_id}
                onChange={(e) => handleChange('destination_ledger_id', e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.destination_ledger_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select destination client</option>
                {ledgers
                  .filter((l) => l.id !== formData.client_ledger_id)
                  .map((ledger) => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.client_name} - Balance: $
                      {ledger.current_balance.toFixed(2)}
                    </option>
                  ))}
              </select>
              {errors.destination_ledger_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.destination_ledger_id}
                </p>
              )}
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="E.g., Client retainer deposit, Settlement funds withdrawal"
              rows={3}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Required for IOLTA compliance and audit trail
            </p>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number (Optional)
            </label>
            <Input
              type="text"
              value={formData.reference_number}
              onChange={(e) => handleChange('reference_number', e.target.value)}
              placeholder="Check number, wire confirmation, etc."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              submitting || validationWarnings.some((w) => w.includes('BLOCKED'))
            }
            className="flex-1"
          >
            {submitting ? 'Creating Transaction...' : 'Create Transaction'}
          </Button>
        </div>
      </Card>
    </form>
  );
}
