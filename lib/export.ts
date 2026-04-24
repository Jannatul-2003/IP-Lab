import { Expenditure, Budget } from "@/types";
import { formatDate, formatCurrency } from "./utils";

/**
 * Export expenditures to CSV format
 */
export function exportToCSV(expenditures: Expenditure[], budgets: Budget[], filename = "expenditure-report.csv") {
  const headers = ["Date", "Category", "Description", "Amount (BDT)", "Budget"];
  
  const rows = expenditures.map((ex) => {
    const budget = budgets.find((b) => b.id === ex.budgetId);
    const budgetName = budget?.eventId ? "Event Budget" : "General Budget";
    return [
      formatDate(ex.expenseDate),
      ex.category || "—",
      ex.description || "—",
      ex.amountBdt.toString(),
      budgetName,
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadFile(blob, filename);
}

/**
 * Export expenditures to Excel-compatible format (TSV)
 */
export function exportToExcel(expenditures: Expenditure[], budgets: Budget[], filename = "expenditure-report.xlsx") {
  const headers = ["Date", "Category", "Description", "Amount (BDT)", "Budget"];
  
  const rows = expenditures.map((ex) => {
    const budget = budgets.find((b) => b.id === ex.budgetId);
    const budgetName = budget?.eventId ? "Event Budget" : "General Budget";
    return [
      formatDate(ex.expenseDate),
      ex.category || "—",
      ex.description || "—",
      ex.amountBdt.toString(),
      budgetName,
    ];
  });

  // Create TSV (Tab-Separated Values) which Excel opens natively
  const tsvContent = [
    headers.join("\t"),
    ...rows.map((row) => row.join("\t")),
  ].join("\n");

  const blob = new Blob([tsvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
  downloadFile(blob, filename.replace(".xlsx", ".xls"));
}

/**
 * Export expenditures to PDF format
 */
export function exportToPDF(expenditures: Expenditure[], budgets: Budget[], totalSpent: number, filename = "expenditure-report.pdf") {
  // Simple PDF generation using HTML to PDF conversion
  const html = generatePDFHTML(expenditures, budgets, totalSpent);
  
  // Create a temporary iframe to print to PDF
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    
    // Trigger print dialog
    setTimeout(() => {
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 250);
  }
}

/**
 * Generate HTML for PDF export
 */
function generatePDFHTML(expenditures: Expenditure[], budgets: Budget[], totalSpent: number): string {
  const rows = expenditures
    .map((ex) => {
      const budget = budgets.find((b) => b.id === ex.budgetId);
      const budgetName = budget?.eventId ? "Event Budget" : "General Budget";
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(ex.expenseDate)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${ex.category || "—"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${ex.description || "—"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">৳${ex.amountBdt.toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${budgetName}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Expenditure Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #1F3864; margin-bottom: 10px; }
        .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #1F3864; color: white; padding: 10px; text-align: left; font-weight: bold; }
        td { padding: 8px; }
        .total { font-weight: bold; font-size: 14px; margin-top: 20px; }
        .footer { margin-top: 30px; font-size: 11px; color: #999; }
      </style>
    </head>
    <body>
      <h1>CSEDU Students' Club — Expenditure Report</h1>
      <div class="meta">
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Term: 8</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th style="text-align: right;">Amount (BDT)</th>
            <th>Budget</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div class="total">
        Total Expenditure: ৳${totalSpent.toLocaleString()}
      </div>
      <div class="footer">
        <p>This is an official financial report of CSEDU Students' Club.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Helper to download a file
 */
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
