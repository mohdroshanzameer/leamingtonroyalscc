import React from 'react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Edit, Trash2, ArrowUpCircle, ArrowDownCircle, FileText, RefreshCw } from 'lucide-react';

export default function TransactionList({ transactions, onEdit, onDelete }) {
  const categoryColors = {
    'Membership Fees': 'bg-blue-100 text-blue-800',
    'Sponsorship': 'bg-purple-100 text-purple-800',
    'Match Revenue': 'bg-emerald-100 text-emerald-800',
    'Merchandise Sales': 'bg-pink-100 text-pink-800',
    'Donations': 'bg-amber-100 text-amber-800',
    'Event Income': 'bg-cyan-100 text-cyan-800',
    'Player Wages': 'bg-red-100 text-red-800',
    'Equipment': 'bg-orange-100 text-orange-800',
    'Ground Maintenance': 'bg-lime-100 text-lime-800',
    'Utilities': 'bg-slate-100 text-slate-800',
    'Travel & Transport': 'bg-indigo-100 text-indigo-800',
    'Catering': 'bg-rose-100 text-rose-800',
    'Marketing': 'bg-violet-100 text-violet-800',
    'Insurance': 'bg-teal-100 text-teal-800',
    'Medical': 'bg-fuchsia-100 text-fuchsia-800',
    'Coaching': 'bg-sky-100 text-sky-800',
    'Administration': 'bg-stone-100 text-stone-800',
    'Other': 'bg-gray-100 text-gray-800',
  };

  const statusColors = {
    'Pending': 'bg-amber-100 text-amber-800',
    'Completed': 'bg-emerald-100 text-emerald-800',
    'Cancelled': 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.type === 'Income' ? (
                        <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={transaction.type === 'Income' ? 'text-emerald-700' : 'text-red-700'}>
                        {transaction.type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {format(new Date(transaction.date), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={categoryColors[transaction.category] || 'bg-slate-100 text-slate-800'}>
                        {transaction.category}
                      </Badge>
                      {transaction.is_recurring && (
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600" title="Recurring" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">{transaction.description || '-'}</p>
                      {(transaction.paid_to || transaction.received_from) && (
                        <p className="text-xs text-slate-500">
                          {transaction.type === 'Expense' ? `Paid to: ${transaction.paid_to}` : `From: ${transaction.received_from}`}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${transaction.type === 'Income' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {transaction.type === 'Income' ? '+' : '-'}£{transaction.amount?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[transaction.status]}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {transaction.receipt_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={transaction.receipt_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 text-slate-500" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => onEdit(transaction)}>
                        <Edit className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(transaction.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}