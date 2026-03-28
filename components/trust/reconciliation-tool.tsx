/**
 * Reconciliation Tool Component
 * Interactive tool for monthly trust account reconciliation
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ReconciliationToolProps {
  trustAccountId: string;
  trustAccountName: string;
  currentBalance: number;
  onComplete?: () => void;
}

export default function ReconciliationTool({
  trustAccountId,
  trustAccountName,
  currentBalance,
  onComplete
}: ReconciliationToolProps) {
  const [bankBalance, setBankBalance] = useState<string>('');
  const [reconciliationDate, setReconciliationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!bankBalance) {
      alert('Please enter bank statement balance');
      return;
    }

    const difference = parseFloat(bankBalance) - currentBalance;

    if (Math.abs(difference) > 0.01) {
      const confirmed = confirm(
        `Warning: Bank balance (${formatCurrency(
          parseFloat(bankBalance)
        )}) does not match book balance (${formatCurrency(
          currentBalance
        )}).\n\nDifference: ${formatCurrency(
          difference
        )}\n\nDo you want to proceed with this reconciliation?`
      );

      if (!confirmed) return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/trust/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trust_account_id: trustAccountId,
          reconciliation_date: reconciliationDate,
          bank_statement_balance: parseFloat(bankBalance),
          notes
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit reconciliation');
      }

      alert('Reconciliation completed successfully!');
      
      if (onComplete) {
        onComplete();
      }

      // Reset form
      setBankBalance('');
      setNotes('');
    } catch (error: any) {
      alert(error.message || 'Failed to submit reconciliation');
    } finally {
      setSubmitting(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  const difference = bankBalance
    ? parseFloat(bankBalance) - currentBalance
    : null;
  const isDifferent = difference !== null && Math.abs(difference) > 0.01;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Bank Statement Reconciliation
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Trust Account Info */}
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 mb-1">Trust Account</p>
            <p className="font-semibold text-gray-900">{trustAccountName}</p>
            <p className="text-sm text-gray-600 mt-2">Current Book Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(currentBalance)}
            </p>
          </div>

          {/* Reconciliation Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reconciliation Date *
            </label>
            <Input
              type="date"
              value={reconciliationDate}
              onChange={(e) => setReconciliationDate(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Typically the end of the month
            </p>
          </div>

          {/* Bank Statement Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Statement Balance *
            </label>
            <Input
              type="number"
              step="0.01"
              value={bankBalance}
              onChange={(e) => setBankBalance(e.target.value)}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the ending balance from your bank statement
            </p>
          </div>

          {/* Difference Indicator */}
          {difference !== null && (
            <div
              className={`p-4 rounded-md ${
                isDifferent ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {isDifferent ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`font-semibold ${
                      isDifferent ? 'text-amber-900' : 'text-green-900'
                    }`}
                  >
                    {isDifferent ? 'Discrepancy Detected' : 'Balances Match'}
                  </p>
                  <p
                    className={`text-sm ${
                      isDifferent ? 'text-amber-700' : 'text-green-700'
                    }`}
                  >
                    {isDifferent ? (
                      <>
                        Difference: <strong>{formatCurrency(difference)}</strong>
                        <br />
                        Please review transactions and outstanding items before
                        proceeding.
                      </>
                    ) : (
                      'Bank balance matches book balance perfectly.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this reconciliation, outstanding checks, deposits in transit, etc."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Submitting...' : 'Complete Reconciliation'}
          </Button>
        </div>
      </form>

      {/* Compliance Reminder */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm font-semibold text-blue-900 mb-2">
          IOLTA Compliance Reminder
        </p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Reconciliation must be performed monthly</li>
          <li>• All discrepancies must be documented and investigated</li>
          <li>• Keep bank statements and reconciliation reports for audit</li>
        </ul>
      </div>
    </Card>
  );
}
