import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Plus, Search, DollarSign, Users, Calendar,
  Loader2, AlertCircle, CheckCircle2, Filter, CreditCard, Receipt, TrendingUp, TrendingDown
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { CLUB_CONFIG } from './../../components/ClubConfig';

const DEFAULT_FEE = CLUB_CONFIG.finance.defaultMatchFee;

export default function MatchFeeManager() {
  const [showAddMatchFeeDialog, setShowAddMatchFeeDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [paymentData, setPaymentData] = useState({ player_id: '', amount: '', payment_method: 'Cash', notes: '' });
  const [filterPlayer, setFilterPlayer] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterMatch, setFilterMatch] = useState('all');
  const queryClient = useQueryClient();

  const { data: charges = [], isLoading: chargesLoading } = useQuery({
    queryKey: ['playerCharges'],
    queryFn: () => api.entities.PlayerCharge.list('-charge_date'),
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['playerPayments'],
    queryFn: () => api.entities.PlayerPayment.list('-payment_date'),
  });

  const transactionsLoading = chargesLoading || paymentsLoading;

  const { data: players } = useQuery({
    queryKey: ['teamPlayers'],
    queryFn: () => api.entities.TeamPlayer.list('player_name'),
    initialData: [],
  });

  const { data: matches } = useQuery({
    queryKey: ['completedMatches'],
    queryFn: () => api.entities.TournamentMatch.filter({ status: 'completed' }, '-match_date'),
    initialData: [],
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data) => api.entities.PlayerPayment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerPayments'] });
    },
  });

  const bulkCreateChargesMutation = useMutation({
    mutationFn: (records) => api.entities.PlayerCharge.bulkCreate(records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerCharges'] });
      setShowAddMatchFeeDialog(false);
      setSelectedMatch(null);
      toast.success('Match fees recorded for all players');
    },
  });

  // Calculate player balances from ledger
  const playerBalances = useMemo(() => {
    const balances = {};
    
    // Initialize all players
    players.forEach(p => {
      balances[p.id] = { 
        name: p.player_name, 
        balance: 0, 
        totalFees: 0, 
        totalPayments: 0,
        matchesPlayed: 0
      };
    });

    // Process charges (match fees)
    charges.filter(c => !c.voided && c.charge_type === 'match_fee').forEach(c => {
      if (!balances[c.player_id]) {
        balances[c.player_id] = { name: 'Unknown', balance: 0, totalFees: 0, totalPayments: 0, matchesPlayed: 0 };
      }
      balances[c.player_id].balance -= c.amount || 0;
      balances[c.player_id].totalFees += c.amount || 0;
      balances[c.player_id].matchesPlayed += 1;
    });

    // Process payments
    payments.forEach(p => {
      if (!balances[p.player_id]) {
        balances[p.player_id] = { name: 'Unknown', balance: 0, totalFees: 0, totalPayments: 0, matchesPlayed: 0 };
      }
      balances[p.player_id].balance += p.amount || 0;
      balances[p.player_id].totalPayments += p.amount || 0;
    });

    return balances;
  }, [charges, payments, players]);

  // Stats
  const stats = useMemo(() => {
    const totalOwed = Object.values(playerBalances)
      .filter(p => p.balance < 0)
      .reduce((sum, p) => sum + Math.abs(p.balance), 0);
    
    const totalCredit = Object.values(playerBalances)
      .filter(p => p.balance > 0)
      .reduce((sum, p) => sum + p.balance, 0);
    
    const totalCollected = Object.values(playerBalances)
      .reduce((sum, p) => sum + p.totalPayments, 0);
    
    const playersOwing = Object.values(playerBalances).filter(p => p.balance < 0).length;
    const playersWithCredit = Object.values(playerBalances).filter(p => p.balance > 0).length;

    return { totalOwed, totalCredit, totalCollected, playersOwing, playersWithCredit };
  }, [playerBalances]);

  // Combine charges and payments into transactions for display
  const transactions = useMemo(() => {
    const chargeItems = charges.filter(c => !c.voided && c.charge_type === 'match_fee').map(c => ({
      id: c.id,
      player_id: c.player_id,
      player_name: players.find(p => p.id === c.player_id)?.player_name || 'Unknown',
      transaction_type: 'match_fee',
      amount: c.amount,
      transaction_date: c.charge_date,
      match_id: c.reference_id,
      match_info: c.description,
    }));
    const paymentItems = payments.map(p => ({
      id: p.id,
      player_id: p.player_id,
      player_name: players.find(pl => pl.id === p.player_id)?.player_name || 'Unknown',
      transaction_type: 'payment',
      amount: p.amount,
      transaction_date: p.payment_date,
      payment_method: p.payment_method,
      notes: p.notes,
    }));
    return [...chargeItems, ...paymentItems].sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  }, [charges, payments, players]);

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesPlayer = filterPlayer === 'all' || t.player_id === filterPlayer;
    const matchesType = filterType === 'all' || t.transaction_type === filterType;
    const matchesMatch = filterMatch === 'all' || !t.match_id || t.match_id === filterMatch;
    return matchesPlayer && matchesType && matchesMatch;
  });

  const handleCreateMatchFees = () => {
    if (!selectedMatch) return;
    const match = matches.find(m => m.id === selectedMatch);
    const existingForMatch = charges
      .filter(c => c.reference_id === selectedMatch && c.charge_type === 'match_fee')
      .map(c => c.player_id);
    
    const newRecords = players
      .filter(p => !existingForMatch.includes(p.id))
      .map(player => ({
        player_id: player.id,
        charge_type: 'match_fee',
        amount: DEFAULT_FEE,
        description: `${match.team1_name} vs ${match.team2_name} - ${match.match_date && isValid(new Date(match.match_date)) ? format(new Date(match.match_date), 'dd MMM yyyy') : 'Date TBD'}`,
        charge_date: match.match_date && isValid(new Date(match.match_date)) ? format(new Date(match.match_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        reference_type: 'TournamentMatch',
        reference_id: selectedMatch,
      }));

    if (newRecords.length === 0) {
      toast.info('All players already have fees recorded for this match');
      return;
    }
    
    bulkCreateChargesMutation.mutate(newRecords);
  };

  const handleAddPayment = () => {
    if (!paymentData.player_id || !paymentData.amount) {
      toast.error('Please select a player and enter an amount');
      return;
    }
    
    createPaymentMutation.mutate({
      player_id: paymentData.player_id,
      amount: parseFloat(paymentData.amount),
      payment_method: paymentData.payment_method,
      notes: paymentData.notes,
      payment_date: format(new Date(), 'yyyy-MM-dd')
    }, {
      onSuccess: () => {
        setShowAddPaymentDialog(false);
        setPaymentData({ player_id: '', amount: '', payment_method: 'Cash', notes: '' });
        toast.success('Payment recorded successfully');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Outstanding</p>
                <p className="text-3xl font-bold text-amber-800">£{stats.totalOwed}</p>
                <p className="text-xs text-amber-600 mt-1">{stats.playersOwing} players owe</p>
              </div>
              <TrendingDown className="w-10 h-10 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Total Collected</p>
                <p className="text-3xl font-bold text-emerald-800">£{stats.totalCollected}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Credit Balance</p>
                <p className="text-3xl font-bold text-blue-800">£{stats.totalCredit}</p>
                <p className="text-xs text-blue-600 mt-1">{stats.playersWithCredit} players prepaid</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Transactions</p>
                <p className="text-3xl font-bold text-purple-800">{transactions.length}</p>
              </div>
              <Receipt className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="balances" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="balances">Player Balances</TabsTrigger>
            <TabsTrigger value="ledger">Transaction Ledger</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  <CreditCard className="w-4 h-4 mr-2" /> Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Player</Label>
                    <Select value={paymentData.player_id} onValueChange={(v) => setPaymentData({ ...paymentData, player_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map(p => {
                          const balance = playerBalances[p.id]?.balance || 0;
                          return (
                            <SelectItem key={p.id} value={p.id}>
                              {p.player_name} {balance < 0 ? `(owes £${Math.abs(balance)})` : balance > 0 ? `(+£${balance} credit)` : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (£)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentData.payment_method} onValueChange={(v) => setPaymentData({ ...paymentData, payment_method: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                      placeholder="e.g., Advance payment for season"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setShowAddPaymentDialog(false)}>Cancel</Button>
                    <Button 
                      onClick={handleAddPayment} 
                      disabled={createPaymentMutation.isPending}
                      className="bg-emerald-700 hover:bg-emerald-800"
                    >
                      {createPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Record Payment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddMatchFeeDialog} onOpenChange={setShowAddMatchFeeDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-700 hover:bg-purple-800">
                  <Plus className="w-4 h-4 mr-2" /> Add Match Fees
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Match Fees</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Select Match</Label>
                    <Select value={selectedMatch || ''} onValueChange={setSelectedMatch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a completed match" />
                      </SelectTrigger>
                      <SelectContent>
                        {matches.map(match => {
                          const matchDate = match.match_date ? new Date(match.match_date) : null;
                          return (
                            <SelectItem key={match.id} value={match.id}>
                              {match.team1_name} vs {match.team2_name} - {matchDate && isValid(matchDate) ? format(matchDate, 'MMM d, yyyy') : 'Date TBD'}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-slate-500">
                    This will deduct £{DEFAULT_FEE} from each player's balance for this match.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddMatchFeeDialog(false)}>Cancel</Button>
                    <Button 
                      onClick={handleCreateMatchFees} 
                      disabled={!selectedMatch || bulkCreateChargesMutation.isPending}
                      className="bg-purple-700 hover:bg-purple-800"
                    >
                      {bulkCreateChargesMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Record Fees
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Player Balances Tab */}
        <TabsContent value="balances">
          <Card>
            <CardHeader>
              <CardTitle>Player Balances</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(playerBalances).length === 0 ? (
                <div className="text-center py-8 text-slate-500">No player data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Player</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Matches</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Fees</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Paid</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Balance</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(playerBalances)
                        .filter(([_, data]) => data.matchesPlayed > 0 || data.totalPayments > 0)
                        .sort((a, b) => a[1].balance - b[1].balance)
                        .map(([playerId, data]) => (
                        <tr key={playerId} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium">{data.name}</td>
                          <td className="py-3 px-4 text-right">{data.matchesPlayed}</td>
                          <td className="py-3 px-4 text-right text-red-600">£{data.totalFees}</td>
                          <td className="py-3 px-4 text-right text-emerald-600">£{data.totalPayments}</td>
                          <td className={`py-3 px-4 text-right font-bold ${
                            data.balance < 0 ? 'text-red-600' : data.balance > 0 ? 'text-emerald-600' : 'text-slate-600'
                          }`}>
                            {data.balance < 0 ? `-£${Math.abs(data.balance)}` : data.balance > 0 ? `+£${data.balance}` : '£0'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {data.balance < 0 ? (
                              <Badge className="bg-red-100 text-red-800">Owes £{Math.abs(data.balance)}</Badge>
                            ) : data.balance > 0 ? (
                              <Badge className="bg-emerald-100 text-emerald-800">£{data.balance} Credit</Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-600">Settled</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction Ledger Tab */}
        <TabsContent value="ledger">
          {/* Filters */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Select value={filterPlayer} onValueChange={setFilterPlayer}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Players" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Players</SelectItem>
                      {players.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.player_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="match_fee">Match Fees</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterMatch} onValueChange={setFilterMatch}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="All Matches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Matches</SelectItem>
                    {matches.map(m => {
                      const matchDate = m.match_date ? new Date(m.match_date) : null;
                      return (
                        <SelectItem key={m.id} value={m.id}>
                          {m.team1_name} vs {m.team2_name} - {matchDate && isValid(matchDate) ? format(matchDate, 'MMM d') : 'Date TBD'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ledger Table */}
          <Card>
            <CardContent className="p-0">
              {transactionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No transactions found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Player</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Details</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map(t => {
                        const txDate = t.transaction_date ? new Date(t.transaction_date) : null;
                        return (
                        <tr key={t.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-600">
                            {txDate && isValid(txDate) ? format(txDate, 'MMM d, yyyy') : '-'}
                          </td>
                          <td className="py-3 px-4 font-medium">{t.player_name}</td>
                          <td className="py-3 px-4">
                            {t.transaction_type === 'match_fee' ? (
                              <Badge variant="outline" className="text-red-700 border-red-200">Match Fee</Badge>
                            ) : (
                              <Badge variant="outline" className="text-emerald-700 border-emerald-200">Payment</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {t.transaction_type === 'match_fee' ? t.match_info : (t.payment_method || '')}
                            {t.notes && <span className="text-slate-400 ml-2">({t.notes})</span>}
                          </td>
                          <td className={`py-3 px-4 text-right font-medium ${
                            t.transaction_type === 'payment' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {t.transaction_type === 'payment' ? '+' : '-'}£{Math.abs(t.amount)}
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}