"use client";

import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export/csv";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ExportButtonProps {
  data: any[];
  filename?: string;
  disabled?: boolean;
  className?: string;
}

export function ExportButton({
  data,
  filename,
  disabled = false,
  className = "",
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      setIsExporting(true);

      // Generate filename with timestamp if not provided
      const exportFilename =
        filename ||
        `guest_posts_export_${new Date().toISOString().split("T")[0]}.csv`;

      // Export to CSV
      exportToCSV(data, { filename: exportFilename });

      toast.success(`Exported ${data.length} records successfully`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || isExporting || !data || data.length === 0}
      className={className}
    >
      <Download className="w-4 h-4 mr-2" />
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
