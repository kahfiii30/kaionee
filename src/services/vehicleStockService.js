import { supabase } from '../lib/supabase'

export const getByDate = async (date) => {
  const { data, error } = await supabase.from('vehicle_stocks').select('*').eq('date', date).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const create = async (payload, capitalLogs = []) => {
  // Generate a persistent group ID
  const groupId = crypto.randomUUID ? crypto.randomUUID() : null
  
  // Create vehicle with group ID
  const vehiclePayload = {
    ...payload,
    id: groupId,
    vehicle_group_id: groupId
  }

  const { data, error } = await supabase.from('vehicle_stocks').insert(vehiclePayload).select().single()
  if (error) throw error

  // Insert initial capital logs if any
  if (capitalLogs.length > 0 && groupId) {
    const logs = capitalLogs.map(log => ({
      ...log,
      vehicle_group_id: groupId,
      date: payload.date
    }))
    const { error: logsError } = await supabase.from('vehicle_capital_logs').insert(logs)
    if (logsError) throw logsError
  }

  return data
}

export const update = async (id, payload) => {
  const { data, error } = await supabase.from('vehicle_stocks').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const remove = async (id) => {
  const { error } = await supabase.from('vehicle_stocks').delete().eq('id', id)
  if (error) throw error
}

export const getCapitalLogs = async (vehicleGroupId) => {
  if (!vehicleGroupId) return []
  const { data, error } = await supabase
    .from('vehicle_capital_logs')
    .select('*')
    .eq('vehicle_group_id', vehicleGroupId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export const addCapitalLog = async (vehicleId, vehicleGroupId, payload) => {
  // 1. Insert the log
  const { data: newLog, error } = await supabase
    .from('vehicle_capital_logs')
    .insert({ ...payload, vehicle_group_id: vehicleGroupId })
    .select()
    .single()
  
  if (error) throw error

  // 2. Add amount to current vehicle's purchase_price
  // Fetch current vehicle
  const { data: vehicle, error: fetchErr } = await supabase
    .from('vehicle_stocks')
    .select('purchase_price')
    .eq('id', vehicleId)
    .single()
  
  if (fetchErr) throw fetchErr

  const newPrice = Number(vehicle.purchase_price) + Number(payload.amount)

  // Update vehicle
  const { error: updateErr } = await supabase
    .from('vehicle_stocks')
    .update({ purchase_price: newPrice })
    .eq('id', vehicleId)

  if (updateErr) throw updateErr

  return newLog
}

export const removeCapitalLog = async (logId, vehicleId, logAmount) => {
  // 1. Delete the log
  const { error } = await supabase.from('vehicle_capital_logs').delete().eq('id', logId)
  if (error) throw error

  // 2. Subtract amount from current vehicle's purchase_price
  const { data: vehicle, error: fetchErr } = await supabase
    .from('vehicle_stocks')
    .select('purchase_price')
    .eq('id', vehicleId)
    .single()
  
  if (fetchErr) throw fetchErr

  const newPrice = Number(vehicle.purchase_price) - Number(logAmount)

  const { error: updateErr } = await supabase
    .from('vehicle_stocks')
    .update({ purchase_price: newPrice })
    .eq('id', vehicleId)

  if (updateErr) throw updateErr
}
