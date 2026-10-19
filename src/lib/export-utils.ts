/**
 * Universal Client-side Export Utilities
 * Supports CSV, JSON, and Print / PDF Reports
 */

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) {
    alert("No data available to export.")
    return
  }

  const separator = ","
  const keys = Object.keys(rows[0])
  
  const csvContent =
    keys.map(k => `"${k.replace(/"/g, '""')}"`).join(separator) +
    "\n" +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = row[k] === null || row[k] === undefined ? "" : row[k]
            if (typeof cell === "object") {
              cell = JSON.stringify(cell)
            } else {
              cell = cell.toString()
            }
            cell = cell.replace(/"/g, '""')
            return `"${cell}"`
          })
          .join(separator)
      })
      .join("\n")

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  const dateStr = new Date().toISOString().split("T")[0]
  link.setAttribute("download", `${filename}_${dateStr}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToJSON(filename: string, data: any) {
  if (!data || (Array.isArray(data) && !data.length)) {
    alert("No data available to export.")
    return
  }

  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  const dateStr = new Date().toISOString().split("T")[0]
  link.setAttribute("download", `${filename}_${dateStr}.json`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function printData(title: string, headers: string[], rows: (string | number)[][]) {
  if (!rows || !rows.length) {
    alert("No data available to print.")
    return
  }

  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Please allow popups to print/save report.")
    return
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          p.meta { font-size: 12px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: 600; }
          tr:nth-child(even) { background-color: #fafafa; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p class="meta">Generated from ATTARWALA Admin on ${new Date().toLocaleString()} • ${rows.length} records</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map(r => `<tr>${r.map(c => `<td>${c ?? ""}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}
