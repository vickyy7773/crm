import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Users, Loader } from 'lucide-react';
import API_URL from '../config/api';

const Import = () => {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCSV(selectedFile);
      setImportStatus(null);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  // Parse CSV file
  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');

      if (lines.length === 0) return;

      // Get headers from first line
      const csvHeaders = lines[0].split(',').map(h => h.trim());
      setHeaders(csvHeaders);

      // Parse data rows
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        csvHeaders.forEach((header, i) => {
          row[header.toLowerCase().replace(/\s+/g, '')] = values[i] || '';
        });
        return row;
      });

      setCsvData(data);
    };
    reader.readAsText(file);
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv') {
        setFile(droppedFile);
        parseCSV(droppedFile);
        setImportStatus(null);
      } else {
        alert('Please drop a valid CSV file');
      }
    }
  };

  // Import data to backend
  const handleImport = async () => {
    if (csvData.length === 0) {
      alert('No data to import');
      return;
    }

    setImporting(true);
    setImportStatus(null);

    try {
      const response = await fetch(`${API_URL}/leads/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leads: csvData }),
      });

      const result = await response.json();

      if (result.success) {
        setImportStatus({
          type: 'success',
          message: result.message,
          count: result.data.importedCount
        });
        // Clear the form after successful import
        setTimeout(() => {
          setFile(null);
          setCsvData([]);
          setHeaders([]);
        }, 3000);
      } else {
        setImportStatus({
          type: 'error',
          message: result.message || 'Import failed'
        });
      }
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Error: ${error.message}. Make sure the backend server is running on port 5000.`
      });
    } finally {
      setImporting(false);
    }
  };

  // Download sample CSV template
  const downloadTemplate = () => {
    const template = `name,phone,city,neet,course,destination,remark,source
John Doe,+1234567890,New York,520,MBBS,Russia,Interested in premium package,Facebook Ad
Jane Smith,+9876543210,Los Angeles,485,MBBS,Philippines,Looking for basic plan,Google Ad`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Import Data</h1>
        <p className="text-gray-600 text-lg">Import student leads from CSV files</p>
      </div>

      {/* Instructions Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-sm p-6 border border-blue-200 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="text-blue-600" size={20} />
          How to Import
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Download the CSV template below or prepare your CSV file</li>
          <li>Ensure your CSV has these columns: name, phone, city, neet, course, destination, remark, source</li>
          <li>Upload or drag & drop your CSV file</li>
          <li>Preview the data and click "Import to Database"</li>
        </ol>
        <button
          onClick={downloadTemplate}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
        >
          <Download size={16} />
          Download CSV Template
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upload CSV File</h2>

        <div
          className={`border-3 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-lg font-semibold text-gray-700 mb-2">
            Drag & drop your CSV file here
          </p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <label className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold cursor-pointer hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl">
            Browse Files
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600 font-semibold">
              <CheckCircle size={16} />
              {file.name} ({csvData.length} rows)
            </div>
          )}
        </div>
      </div>

      {/* Import Status */}
      {importStatus && (
        <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
          importStatus.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {importStatus.type === 'success' ? (
            <CheckCircle className="text-green-600" size={24} />
          ) : (
            <AlertCircle className="text-red-600" size={24} />
          )}
          <div>
            <p className={`font-semibold ${
              importStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {importStatus.message}
            </p>
            {importStatus.count && (
              <p className="text-sm text-green-600 mt-1">
                {importStatus.count} leads imported successfully!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Preview Section */}
      {csvData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Users size={24} />
              <div>
                <h2 className="text-xl font-bold">Data Preview</h2>
                <p className="text-sm text-purple-100">{csvData.length} leads ready to import</p>
              </div>
            </div>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Import to Database
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                  {headers.map((header, index) => (
                    <th key={index} className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 10).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-200 hover:bg-purple-50">
                    <td className="px-4 py-3 text-gray-600 font-semibold">{rowIndex + 1}</td>
                    {headers.map((header, colIndex) => (
                      <td key={colIndex} className="px-4 py-3 text-gray-800">
                        {row[header.toLowerCase().replace(/\s+/g, '')] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {csvData.length > 10 && (
            <div className="p-4 bg-gray-50 text-center text-sm text-gray-600">
              Showing first 10 of {csvData.length} rows
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Import;
