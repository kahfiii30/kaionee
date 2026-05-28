import { supabase } from '../lib/supabase'

export const getDailySummary = async (date) => {
  // Fetch all required data for a single day to build the dashboard summary
  const [
    expensesRes,
    vehiclesRes,
    receivablesRes,
    debtsRes,
    lossesRes,
    banksRes,
    globalTxsRes
  ] = await Promise.all([
    supabase.from('daily_expenses').select('amount').eq('date', date),
    supabase.from('vehicle_stocks').select('vehicle_type, status, estimated_sell_price').eq('date', date),
    supabase.from('receivables').select('amount, paid_amount, status').eq('date', date),
    supabase.from('debts').select('amount, paid_amount, status').eq('date', date),
    supabase.from('losses').select('amount').eq('date', date),
    supabase.from('bank_accounts').select('closing_balance').eq('date', date),
    supabase.from('bank_transactions').select('transaction_type, amount').eq('date', date).is('bank_account_id', null)
  ])

  return {
    expenses: expensesRes.data || [],
    vehicles: vehiclesRes.data || [],
    receivables: receivablesRes.data || [],
    debts: debtsRes.data || [],
    losses: lossesRes.data || [],
    banks: banksRes.data || [],
    globalTransactions: globalTxsRes.data || []
  }
}

export const getRangeReport = async (startDate, endDate) => {
  const { data, error } = await supabase
    .from('daily_snapshots')
    .select(`
      date,
      daily_expenses (amount),
      vehicle_stocks (vehicle_type, estimated_sell_price, status),
      receivables (amount, paid_amount, status),
      debts (amount, paid_amount, status),
      losses (amount),
      bank_accounts (closing_balance)
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) throw error
  return data
}
