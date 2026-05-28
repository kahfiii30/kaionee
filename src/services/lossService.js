import { supabase } from '../lib/supabase'

export const getByDate = async (date) => {
  const { data, error } = await supabase.from('losses').select('*').eq('date', date)
  if (error) throw error
  return data
}

export const create = async (payload) => {
  const { data, error } = await supabase.from('losses').insert(payload).select().single()
  if (error) throw error
  return data
}

export const update = async (id, payload) => {
  const { data, error } = await supabase.from('losses').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const remove = async (id) => {
  const { error } = await supabase.from('losses').delete().eq('id', id)
  if (error) throw error
}
