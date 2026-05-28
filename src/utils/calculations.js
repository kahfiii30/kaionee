export const calculateTotal = (data, field) => {
  if (!data) return 0
  return data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0)
}

export const calculateProfit = (estimatedSell, purchase) => {
  return (Number(estimatedSell) || 0) - (Number(purchase) || 0)
}
