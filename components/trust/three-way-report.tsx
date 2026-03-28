/**
 * Three-Way Reconciliation Report Component
 * Most critical IOLTA compliance report
 */

'use client';

import { CheckCircle, AlertTriangle, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ThreeWayReportProps {
  report: {
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
    generated_at: string;
  };
}

export default function ThreeWayReport({ report }: ThreeWayReportProps) {
  function formatCurrency(amount: string | number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  }

  function exportToPDF() {
    window.print();
  }

  function exportToCSV() {
    const csv = [
      ['Three-Way Reconciliation Report'],
      ['Trust Account', report.trust_account_name],
      ['Generated', new Date(report.generated_at).toLocaleDateString()],
      [''],
      ['Client Name', 'Balance'],
      ...report.client_ledgers.map((ledger) => [
        ledger.client_name,
        ledger.balance
      ]),
      [''],
      ['Total Client Ledgers', report.ledger_total],
      ['Trust Account Balance', report.book_balance],
      ['Difference', report.difference],
      ['Status', report.is_balanced ? 'BALANCED' : 'OUT OF BALANCE']
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `three-way-reconciliation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Three-Way Reconciliation Report
          </h2>
          <p className="text-gray-600 mt-1">{report.trust_account_name}</p>
          <p className="text-sm text-gray-500 mt-1">
            Generated: {new Date(report.generated_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card
        className={`p-6 ${
          report.is_balanced
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center gap-4">
          {report.is_balanced ? (
            <CheckCircle className="h-12 w-12 text-green-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-12 w-12 text-red-600 flex-shrink-0" />
          )}
          <div>
            <h3
              className={`text-xl font-bold ${
                report.is_balanced ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {report.is_balanced
                ? '✓ Trust Account Balanced'
                : '⚠️ Reconciliation Discrepancy Detected'}
            </h3>
            <p className={report.is_balanced ? 'text-green-700' : 'text-red-700'}>
              {report.is_balanced
                ? 'Trust account balance matches the sum of all client ledgers'
                : `Difference of ${formatCurrency(report.difference)} detected. Investigate immediately.`}
            </p>
          </div>
        </div>
      </Card>

      {/* Summary Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Trust Account Balance</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(report.book_balance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Book balance</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Sum of Client Ledgers</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(report.ledger_total)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {report.client_ledgers.length} active ledgers
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
          <p className="text-xs text-gray-500 mt-1">
            {report.is_balanced ? 'Perfect match' : 'Requires investigation'}
          </p>
        </Card>
      </div>

      {/* Client Ledgers Breakdown */}
      <Card>
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">
            Client Ledger Breakdown
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Individual client balances in this trust account
          </p>
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
              {report.client_ledgers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                    No client ledgers found
                  </td>
                </tr>
              ) : (
                <>
                  {report.client_ledgers.map((ledger, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {ledger.client_name}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(ledger.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Total Client Ledgers
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">
                      {formatCurrency(report.ledger_total)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reconciliation Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Reconciliation Summary
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Trust Account Balance (A)</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(report.book_balance)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Sum of Client Ledgers (B)</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(report.ledger_total)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Difference (A - B)</span>
            <span
              className={`font-semibold ${
                report.is_balanced ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(report.difference)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Status</span>
            <span
              className={`font-semibold ${
                report.is_balanced ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {report.is_balanced ? '✓ BALANCED' : '⚠️ OUT OF BALANCE'}
            </span>
          </div>
        </div>
      </Card>

      {/* Compliance Notes */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-2">
          IOLTA Compliance Notes
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Three-way reconciliation must be performed monthly at minimum
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Trust account balance must ALWAYS equal the sum of client ledgers
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Any discrepancies must be investigated and resolved immediately
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>All reconciliation reports must be retained for audit purposes</span>
          </li>
        </ul>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          nav,
          button,
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
