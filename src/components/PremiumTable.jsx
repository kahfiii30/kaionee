export default function PremiumTable({ columns, data, renderRow, keyExtractor }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                Tidak ada data
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>
    </div>
  )
}
