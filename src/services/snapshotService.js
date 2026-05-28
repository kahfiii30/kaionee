import { supabase } from '../lib/supabase'

export const ensureDailySnapshot = async (dateStr) => {
  try {
    // Check if snapshot exists for this date
    const { data: existing } = await supabase
      .from('daily_snapshots')
      .select('id')
      .eq('date', dateStr)
      .maybeSingle()

    if (existing) {
      return // Already exists, nothing to do
    }

    // Find the closest previous date
    const { data: previous } = await supabase
      .from('daily_snapshots')
      .select('date')
      .lt('date', dateStr)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    const previousDate = previous?.date

    // Create the new snapshot
    const { error: insertError } = await supabase
      .from('daily_snapshots')
      .insert({ date: dateStr, created_from_date: previousDate || null })
    
    if (insertError) throw insertError

    // If there is a previous date, copy data over
    if (previousDate) {
      await copyDataFromPreviousDate(previousDate, dateStr)
    }

  } catch (error) {
    console.error('Error ensuring daily snapshot:', error)
  }
}

const copyDataFromPreviousDate = async (prevDate, newDate) => {
  // 1. Copy bank_accounts
  const { data: banks } = await supabase.from('bank_accounts').select('*').eq('date', prevDate)
  if (banks && banks.length > 0) {
    const newBanks = banks.map(b => ({
      date: newDate,
      bank_name: b.bank_name,
      account_name: b.account_name,
      account_number: b.account_number,
      opening_balance: b.closing_balance,
      closing_balance: b.closing_balance, // Transactions haven't happened yet
      note: b.note,
      created_from_id: b.id
    }))
    await supabase.from('bank_accounts').insert(newBanks)
  }

  // 2. Copy vehicle_stocks
  const { data: vehicles } = await supabase.from('vehicle_stocks').select('*').eq('date', prevDate)
  if (vehicles && vehicles.length > 0) {
    const newVehicles = vehicles.map(v => {
      const { id, created_at, updated_at, date, ...rest } = v
      return { ...rest, date: newDate, created_from_id: id }
    })
    await supabase.from('vehicle_stocks').insert(newVehicles)
  }

  // 3. Copy receivables
  const { data: receivables } = await supabase.from('receivables').select('*').eq('date', prevDate)
  if (receivables && receivables.length > 0) {
    const newReceivables = receivables.map(r => {
      const { id, created_at, updated_at, date, ...rest } = r
      return { ...rest, date: newDate, created_from_id: id }
    })
    await supabase.from('receivables').insert(newReceivables)
  }

  // 4. Copy debts
  const { data: debts } = await supabase.from('debts').select('*').eq('date', prevDate)
  if (debts && debts.length > 0) {
    const newDebts = debts.map(d => {
      const { id, created_at, updated_at, date, ...rest } = d
      return { ...rest, date: newDate, created_from_id: id }
    })
    await supabase.from('debts').insert(newDebts)
  }

  // 5. Copy losses
  const { data: losses } = await supabase.from('losses').select('*').eq('date', prevDate)
  if (losses && losses.length > 0) {
    const newLosses = losses.map(l => {
      const { id, created_at, updated_at, date, ...rest } = l
      return { ...rest, date: newDate }
    })
    await supabase.from('losses').insert(newLosses)
  }

  // Note: We DO NOT copy daily_expenses or bank_transactions.
}
