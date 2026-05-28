import { supabase } from '../lib/supabase'

export const getByDate = async (date) => {
  const { data, error } = await supabase.from('receivables').select('*').eq('date', date)
  if (error) throw error
  return data
}

export const create = async (payload) => {
  const { data, error } = await supabase.from('receivables').insert(payload).select().single()
  if (error) throw error
  return data
}

export const update = async (id, payload) => {
  const { data, error } = await supabase.from('receivables').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const remove = async (id) => {
  const { error } = await supabase.from('receivables').delete().eq('id', id)
  if (error) throw error
}
