/**
 * Trust Account Reconciliation Page
 * Monthly reconciliation & three-way reconciliation
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

interface TrustAccount {
  id: string;
  name: string;
  current_balance: number;
  last_reconciled_at: string | null;
}

interface ThreeWayReport {
  trust_account_id: string;
  trust_account_name: string;
  book_balance: string;
  ledger_total: string;
  difference: string;
  is_balanced: boolean;
  client_ledgers: Array<{
    client_name: string;
    balance: string;
  }>;
}

export default function ReconciliationPage() {
  const [accounts, setAccounts] = useState<TrustAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [report, setReport] = useState<ThreeWayReport | null>(null);
  const [bankBalance, setBankBalance] = useState<string>('');
  const [reconciliationDate, setReconciliationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchThreeWayReport();
    }
  }, [selectedAccount]);

  async function fetchAccounts() {
    try {
      const response = await fetch('/api/trust/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      setAccounts(data.accounts || []);
      if (data.accounts.length > 0) {
        setSelectedAccount(data.accounts[0].id);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  }

  async function fetchThreeWayReport() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/trust/reconciliation/three-way?accountId=${selectedAccount}`
      );
      if (!response.ok) throw new Error('Failed to fetch report');
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error('Error fetching three-way report:', error);
    } finally {
      setLoading(false);
    }
  }

  async function submitReconciliation() {
    if (!selectedAccount || !bankBalance) {
      alert('Please enter bank statement balance');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/trust/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trust_account_id: selectedAccount,
          reconciliation_date: reconciliationDate,
          bank_statement_balance: bankBalance
        })
      });

      if (!response.ok) throw new Error('Failed to submit reconciliation');

      alert('Reconciliation completed successfully!');
      fetchAccounts();
      fetchThreeWayReport();
      setBankBalance('');
    } catch (error) {
      console.error('Error submitting reconciliation:', error);
      alert('Failed to submit reconciliation');
    } finally {
      setSubmitting(false);
    }
  }

  function formatCurrency(amount: string | number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  }

  function exportReport() {
    if (!report) return;

    const csv = [
      ['Client Name', 'Balance'].join(','),
      ...report.client_ledgers.map((ledger) =>
        [ledger.client_name, ledger.balance].join(',')
      ),
      ['', ''],
      ['Total Client Ledgers', report.ledger_total],
      ['Trust Account Balance', report.book_balance],
      ['Difference', report.difference],
      ['Status', report.is_balanced ? 'Balanced' : 'Out of Balance']
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `three-way-reconciliation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const selectedAccountData = accounts.find((a) => a.id === selectedAccount);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Trust Account Reconciliation"
        description="IOLTA Compliance & Three-Way Reconciliation"
      />

      {/* Account Selection */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trust Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            {selectedAccountData?.last_reconciled_at && (
              <p className="text-sm text-gray-600 mt-2">
                Last reconciled:{' '}
                {new Date(selectedAccountData.last_reconciled_at).toLocaleDateString()}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reconciliation Date
            </label>
            <input
              type="date"
              value={reconciliationDate}
              onChange={(e) => setReconciliationDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Three-Way Reconciliation Report */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reconciliation report...</p>
        </div>
      ) : report ? (
        <>
          {/* Status Banner */}
          <Card
            className={`p-6 mb-8 ${
              report.is_balanced
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-4">
              {report.is_balanced ? (
                <CheckCircle className="h-12 w-12 text-green-600" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-red-600" />
              )}
              <div className="flex-1">
                <h2
                  className={`text-2xl font-bold ${
                    report.is_balanced ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {report.is_balanced ? 'Account Balanced ✓' : 'Discrepancy Detected'}
                </h2>
                <p className={report.is_balanced ? 'text-green-700' : 'text-red-700'}>
                  {report.is_balanced
                    ? 'Trust account balance matches sum of client ledgers'
                    : `Difference: ${formatCurrency(report.difference)}`}
                </p>
              </div>
              <Button variant="outline" onClick={exportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </Card>

          {/* Three-Way Reconciliation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-2">Trust Account Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(report.book_balance)}
              </p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-2">Sum of Client Ledgers</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(report.ledger_total)}
              </p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-2">Difference</p>
              <p
                className={`text-3xl font-bold ${
                  report.is_balanced ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(report.difference)}
              </p>
            </Card>
          </div>

          {/* Client Ledgers Breakdown */}
          <Card className="mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Client Ledgers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.client_ledgers.map((ledger, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ledger.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                        {formatCurrency(ledger.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                      {formatCurrency(report.ledger_total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Bank Reconciliation */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Bank Statement Reconciliation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Statement Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bankBalance}
                  onChange={(e) => setBankBalance(e.target.value)}
                  placeholder="Enter bank balance"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Book Balance
                </label>
                <input
                  type="text"
                  value={formatCurrency(report.book_balance)}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>

            {bankBalance && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700 mb-2">
                  Difference:{' '}
                  <span className="font-semibold">
                    {formatCurrency(
                      parseFloat(bankBalance) - parseFloat(report.book_balance)
                    )}
                  </span>
                </p>
                {Math.abs(
                  parseFloat(bankBalance) - parseFloat(report.book_balance)
                ) > 0.01 && (
                  <p className="text-sm text-amber-600">
                    ⚠️ Bank balance does not match book balance. Review transactions.
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={submitReconciliation}
              disabled={!bankBalance || submitting}
              className="w-full"
            >
              {submitting ? 'Submitting...' : 'Complete Reconciliation'}
            </Button>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-gray-600">Select a trust account to view reconciliation</p>
        </Card>
      )}
    </div>
  );
}
