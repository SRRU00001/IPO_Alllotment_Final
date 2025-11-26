import { useState } from 'react';
import { Download, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import type { IpoRow, IpoRowInput } from '../types';

interface CsvImportExportProps {
  rows: IpoRow[];
  onImport: (rows: IpoRowInput[]) => Promise<void>;
  ipoList: string[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function CsvImportExport({ rows, onImport, ipoList }: CsvImportExportProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<IpoRowInput[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const exportToCsv = () => {
    const headers = [
      'Name',
      'PAN',
      'IPO Name',
      'Applied By',
      'Allotment Status',
      'Amount Applied',
      'Amount Reverted',
      'Notes',
      'Created At',
    ];

    const csvData = rows.map(row => [
      row.name,
      row.pan,
      row.ipoName,
      row.appliedBy,
      row.ipoAllotmentStatus,
      row.amountApplied,
      row.amountReverted,
      row.notes || '',
      row.createdAt,
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ipo-lots-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvFile = (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const parsed = lines.map(line => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current);
          return result.map(cell => cell.trim());
        });
        resolve(parsed);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const validateRow = (row: IpoRowInput, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!row.name.trim()) {
      errors.push({ row: rowIndex, field: 'Name', message: 'Name is required' });
    }

    if (!row.pan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(row.pan)) {
      errors.push({ row: rowIndex, field: 'PAN', message: 'Invalid PAN format' });
    }

    if (!row.ipoName || !ipoList.includes(row.ipoName)) {
      errors.push({ row: rowIndex, field: 'IPO Name', message: 'IPO does not exist' });
    }

    if (!['online', 'offline', 'broker'].includes(row.appliedBy.toLowerCase())) {
      errors.push({ row: rowIndex, field: 'Applied By', message: 'Invalid value' });
    }

    if (!['Pending', 'Allotted', 'Not Allotted', 'Refund Received'].includes(row.ipoAllotmentStatus)) {
      errors.push({ row: rowIndex, field: 'Status', message: 'Invalid status' });
    }

    if (isNaN(row.amountApplied) || row.amountApplied < 0) {
      errors.push({ row: rowIndex, field: 'Amount Applied', message: 'Invalid amount' });
    }

    if (isNaN(row.amountReverted) || row.amountReverted < 0) {
      errors.push({ row: rowIndex, field: 'Amount Reverted', message: 'Invalid amount' });
    }

    if (row.amountReverted > row.amountApplied) {
      errors.push({ row: rowIndex, field: 'Amount Reverted', message: 'Cannot exceed applied amount' });
    }

    return errors;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setParsedRows([]);
    setValidationErrors([]);

    try {
      const parsed = await parseCsvFile(file);
      if (parsed.length < 2) {
        setValidationErrors([{ row: 0, field: 'File', message: 'CSV file is empty or invalid' }]);
        return;
      }

      const dataRows = parsed.slice(1);
      const errors: ValidationError[] = [];
      const validRows: IpoRowInput[] = [];

      dataRows.forEach((row, index) => {
        if (row.length < 7) {
          errors.push({ row: index + 2, field: 'Row', message: 'Missing required columns' });
          return;
        }

        const rowData: IpoRowInput = {
          name: row[0],
          pan: row[1].toUpperCase(),
          ipoName: row[2],
          appliedBy: row[3].toLowerCase(),
          ipoAllotmentStatus: row[4],
          amountApplied: parseFloat(row[5]) || 0,
          amountReverted: parseFloat(row[6]) || 0,
          notes: row[7] || '',
        };

        const rowErrors = validateRow(rowData, index + 2);
        errors.push(...rowErrors);

        if (rowErrors.length === 0) {
          validRows.push(rowData);
        }
      });

      setParsedRows(validRows);
      setValidationErrors(errors);
    } catch (error) {
      setValidationErrors([{ row: 0, field: 'File', message: 'Failed to parse CSV file' }]);
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      for (let i = 0; i < parsedRows.length; i++) {
        await onImport([parsedRows[i]]);
        setImportProgress(((i + 1) / parsedRows.length) * 100);
      }

      setIsImportModalOpen(false);
      setCsvFile(null);
      setParsedRows([]);
      setValidationErrors([]);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={exportToCsv}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setIsImportModalOpen(false)} />

            <div className="relative inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Import CSV</h3>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    CSV should have columns: Name, PAN, IPO Name, Applied By, Allotment Status, Amount Applied, Amount Reverted, Notes
                  </p>
                </div>

                {validationErrors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg max-h-60 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold text-red-900">Validation Errors ({validationErrors.length})</h4>
                    </div>
                    <ul className="space-y-1">
                      {validationErrors.slice(0, 10).map((error, idx) => (
                        <li key={idx} className="text-sm text-red-700">
                          Row {error.row}, {error.field}: {error.message}
                        </li>
                      ))}
                      {validationErrors.length > 10 && (
                        <li className="text-sm text-red-700 font-medium">
                          ...and {validationErrors.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {parsedRows.length > 0 && validationErrors.length === 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-medium text-green-900">
                        {parsedRows.length} valid row(s) ready to import
                      </p>
                    </div>
                  </div>
                )}

                {isImporting && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-center text-gray-600">
                      Importing... {Math.round(importProgress)}%
                    </p>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    disabled={isImporting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={parsedRows.length === 0 || validationErrors.length > 0 || isImporting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isImporting ? 'Importing...' : `Import ${parsedRows.length} Row(s)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
