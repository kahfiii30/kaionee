import { supabase } from '../lib/supabase'

export const getAccountsByDate = async (date) => {
  const { data, error } = await supabase.from('bank_accounts').select('*').eq('date', date)
  if (error) throw error
  return data
}

export const createAccount = async (payload) => {
  const { data, error } = await supabase.from('bank_accounts').insert({
    ...payload,
    closing_balance: payload.opening_balance // initially same
  }).select().single()
  if (error) throw error
  return data
}

export const updateAccount = async (id, payload) => {
  const { data, error } = await supabase.from('bank_accounts').update(payload).eq('id', id).select().single()
  if (error) throw error
  await recalculateAccountBalance(id)
  return data
}

export const deleteAccount = async (id) => {
  const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
  if (error) throw error
}

export const getTransactionsByDate = async (date) => {
  const { data, error } = await supabase.from('bank_transactions').select(`
    *,
    bank_accounts (bank_name, account_number)
  `).eq('date', date).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const createTransaction = async (payload) => {
  const { data, error } = await supabase.from('bank_transactions').insert(payload).select().single()
  if (error) throw error
  await recalculateAccountBalance(payload.bank_account_id)
  return data
}

export const updateTransaction = async (id, payload) => {
  const { data: oldTx } = await supabase.from('bank_transactions').select('bank_account_id').eq('id', id).single()
  const { data, error } = await supabase.from('bank_transactions').update(payload).eq('id', id).select().single()
  if (error) throw error
  
  await recalculateAccountBalance(data.bank_account_id)
  if (oldTx && oldTx.bank_account_id !== data.bank_account_id) {
    await recalculateAccountBalance(oldTx.bank_account_id)
  }
  return data
}

export const deleteTransaction = async (id) => {
  const { data: tx } = await supabase.from('bank_transactions').select('bank_account_id').eq('id', id).single()
  const { error } = await supabase.from('bank_transactions').delete().eq('id', id)
  if (error) throw error
  if (tx) await recalculateAccountBalance(tx.bank_account_id)
}

export const createTransfer = async ({ date, fromAccountId, toAccountId, amount, description }) => {
  // Generate a random UUID for transfer group (in browser we can use crypto.randomUUID if available, else just let supabase return one, 
  // but we need it to group them. Let's insert one first, then get ID or just rely on two separate txs)
  const transferGroupId = crypto.randomUUID ? crypto.randomUUID() : null
  
  const txs = [
    {
      date,
      bank_account_id: fromAccountId,
      transaction_type: 'Keluar',
      category: 'Transfer',
      description,
      amount,
      related_account_id: toAccountId,
      transfer_group_id: transferGroupId
    },
    {
      date,
      bank_account_id: toAccountId,
      transaction_type: 'Masuk',
      category: 'Transfer',
      description,
      amount,
      related_account_id: fromAccountId,
      transfer_group_id: transferGroupId
    }
  ]

  const { error } = await supabase.from('bank_transactions').insert(txs)
  if (error) throw error

  await recalculateAccountBalance(fromAccountId)
  await recalculateAccountBalance(toAccountId)
}

export const recalculateAccountBalance = async (accountId) => {
  if (!accountId) return

  // 1. Get account
  const { data: account } = await supabase.from('bank_accounts').select('opening_balance').eq('id', accountId).single()
  if (!account) return

  // 2. Get all transactions
  const { data: txs } = await supabase.from('bank_transactions').select('amount, transaction_type').eq('bank_account_id', accountId)
  
  let balance = Number(account.opening_balance) || 0
  if (txs) {
    txs.forEach(tx => {
      if (tx.transaction_type === 'Masuk') balance += Number(tx.amount)
      else if (tx.transaction_type === 'Keluar') balance -= Number(tx.amount)
    })
  }

  // 3. Update closing balance
  await supabase.from('bank_accounts').update({ closing_balance: balance }).eq('id', accountId)
}

export const recalculateAllAccountsByDate = async (date) => {
  const { data: accounts } = await supabase.from('bank_accounts').select('id').eq('date', date)
  if (accounts) {
    for (const acc of accounts) {
      await recalculateAccountBalance(acc.id)
    }
  }
}
