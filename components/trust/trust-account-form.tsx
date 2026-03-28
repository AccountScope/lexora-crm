/**
 * Trust Account Form Component
 * Create or edit trust accounts
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface TrustAccountFormProps {
  account?: {
    id: string;
    name: string;
    bank_name: string;
    account_number_last4: string;
    routing_number: string;
    account_type: string;
    opening_balance: number;
    opening_date: string;
  };
  onSuccess?: () => void;
}

export default function TrustAccountForm({ account, onSuccess }: TrustAccountFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: account?.name || '',
    bank_name: account?.bank_name || '',
    account_number_last4: account?.account_number_last4 || '',
    routing_number: account?.routing_number || '',
    account_type: account?.account_type || 'checking',
    opening_balance: account?.opening_balance || 0,
    opening_date: account?.opening_date || new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (!formData.bank_name.trim()) {
      newErrors.bank_name = 'Bank name is required';
    }

    if (!formData.account_number_last4.trim()) {
      newErrors.account_number_last4 = 'Account number (last 4) is required';
    } else if (!/^\d{4}$/.test(formData.account_number_last4)) {
      newErrors.account_number_last4 = 'Must be exactly 4 digits';
    }

    if (formData.routing_number && !/^\d{9}$/.test(formData.routing_number)) {
      newErrors.routing_number = 'Routing number must be 9 digits';
    }

    if (formData.opening_balance < 0) {
      newErrors.opening_balance = 'Opening balance cannot be negative';
    }

    if (!formData.opening_date) {
      newErrors.opening_date = 'Opening date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const url = account
        ? `/api/trust/accounts/${account.id}`
        : '/api/trust/accounts';
      const method = account ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save trust account');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/trust-accounting/accounts');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save trust account');
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(field: string, value: any) {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {account ? 'Edit Trust Account' : 'Create Trust Account'}
        </h2>

        <div className="space-y-6">
          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Client Trust Account - Bank of America"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name *
            </label>
            <Input
              type="text"
              value={formData.bank_name}
              onChange={(e) => handleChange('bank_name', e.target.value)}
              placeholder="e.g., Bank of America"
              className={errors.bank_name ? 'border-red-500' : ''}
            />
            {errors.bank_name && (
              <p className="mt-1 text-sm text-red-600">{errors.bank_name}</p>
            )}
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number (Last 4 Digits) *
              </label>
              <Input
                type="text"
                maxLength={4}
                value={formData.account_number_last4}
                onChange={(e) =>
                  handleChange('account_number_last4', e.target.value.replace(/\D/g, ''))
                }
                placeholder="1234"
                className={errors.account_number_last4 ? 'border-red-500' : ''}
              />
              {errors.account_number_last4 && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.account_number_last4}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                For security, only last 4 digits
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Routing Number (Optional)
              </label>
              <Input
                type="text"
                maxLength={9}
                value={formData.routing_number}
                onChange={(e) =>
                  handleChange('routing_number', e.target.value.replace(/\D/g, ''))
                }
                placeholder="123456789"
                className={errors.routing_number ? 'border-red-500' : ''}
              />
              {errors.routing_number && (
                <p className="mt-1 text-sm text-red-600">{errors.routing_number}</p>
              )}
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type *
            </label>
            <select
              value={formData.account_type}
              onChange={(e) => handleChange('account_type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </div>

          {/* Opening Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Balance *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.opening_balance}
                onChange={(e) =>
                  handleChange('opening_balance', parseFloat(e.target.value) || 0)
                }
                className={errors.opening_balance ? 'border-red-500' : ''}
              />
              {errors.opening_balance && (
                <p className="mt-1 text-sm text-red-600">{errors.opening_balance}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Date *
              </label>
              <Input
                type="date"
                value={formData.opening_date}
                onChange={(e) => handleChange('opening_date', e.target.value)}
                className={errors.opening_date ? 'border-red-500' : ''}
              />
              {errors.opening_date && (
                <p className="mt-1 text-sm text-red-600">{errors.opening_date}</p>
              )}
            </div>
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
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting
              ? 'Saving...'
              : account
              ? 'Update Trust Account'
              : 'Create Trust Account'}
          </Button>
        </div>
      </Card>
    </form>
  );
}
