/**
 * CSV Export Utility
 * Converts data to CSV format and triggers download
 */

export interface CSVExportOptions {
  filename?: string;
  delimiter?: string;
}

/**
 * Escape CSV field values
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return "";
  }

  const stringValue = String(field);

  // If field contains comma, quotes, or newlines, wrap in quotes and escape internal quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  options: CSVExportOptions = {},
): string {
  if (!data || data.length === 0) {
    return "";
  }

  const delimiter = options.delimiter || ",";

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const headerRow = headers.map(escapeCSVField).join(delimiter);

  // Create data rows
  const dataRows = data.map((row) => {
    return headers.map((header) => escapeCSVField(row[header])).join(delimiter);
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join("\n");
}

/**
 * Trigger CSV file download in browser
 */
export function downloadCSV(
  csvContent: string,
  filename: string = "export.csv",
): void {
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export array of objects to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: CSVExportOptions = {},
): void {
  const csvContent = arrayToCSV(data, options);
  const filename =
    options.filename || `export_${new Date().toISOString().split("T")[0]}.csv`;
  downloadCSV(csvContent, filename);
}
