import { useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, Users, FileText, X } from 'lucide-react';
import API_URL from '../config/api';

const BulkUpload = () => {
  const [activeTab, setActiveTab] = useState('raw'); // 'raw' or 'qualified'
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  // Download sample CSV
  const downloadSample = () => {
    let csv;
    let filename;

    if (activeTab === 'raw') {
      csv = `name,phone,city
Rajesh Kumar,9876543210,Udaipur
Priya Sharma,8765432109,Jaipur
Amit Singh,7654321098,Delhi`;
      filename = 'raw_leads_sample.csv';
    } else {
      csv = `name,phone,city,neet,course,destination,remark,source
John Doe,9876543210,New York,520,MBBS,Russia,Interested in premium package,Facebook Ad
Jane Smith,8765432109,Los Angeles,485,MBBS,Philippines,Looking for basic plan,Google Ad`;
      filename = 'qualified_leads_sample.csv';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setResult(null);
      } else {
        alert('Please select a CSV file only!');
      }
    }
  };

  // Upload to backend
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = activeTab === 'raw'
        ? `${API_URL}/leads/bulk-upload`
        : `${API_URL}/leads/import/file`;

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          type: 'success',
          message: `✓ Successfully uploaded ${data.imported || data.data?.importedCount || 0} leads!`,
          details: data
        });
        setFile(null);
      } else {
        setResult({
          type: 'error',
          message: data.message || 'Upload failed!'
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `Error: ${error.message}`
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <Upload size={40} className="text-purple-600" />
          Bulk Upload Leads
        </h1>
        <p className="text-gray-600 text-lg">Upload multiple leads at once using CSV file</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => {
            setActiveTab('raw');
            setFile(null);
            setResult(null);
          }}
          className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
            activeTab === 'raw'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
              : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-blue-400'
          }`}
        >
          📝 Raw Leads
          <p className="text-sm font-normal mt-1 opacity-90">Simple upload (Name, Phone, City)</p>
        </button>
        <button
          onClick={() => {
            setActiveTab('qualified');
            setFile(null);
            setResult(null);
          }}
          className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
            activeTab === 'qualified'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-purple-400'
          }`}
        >
          ⭐ Qualified Leads
          <p className="text-sm font-normal mt-1 opacity-90">Detailed upload (8 fields)</p>
        </button>
      </div>

      {/* Instructions Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className={activeTab === 'raw' ? 'text-blue-600' : 'text-purple-600'} size={24} />
          Instructions
        </h2>
        {activeTab === 'raw' ? (
          <div className="space-y-3 text-gray-700">
            <p className="flex items-start gap-2">
              <span className="font-bold text-blue-600">1.</span>
              Download the Raw Leads sample CSV file below
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-blue-600">2.</span>
              Add your leads data with <strong>3 columns: name, phone, city</strong>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-blue-600">3.</span>
              Phone numbers should be 10 digits (no country code)
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-blue-600">4.</span>
              Upload the CSV file and click "Upload Leads"
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-gray-700">
            <p className="flex items-start gap-2">
              <span className="font-bold text-purple-600">1.</span>
              Download the Qualified Leads sample CSV file below
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-purple-600">2.</span>
              Add your leads with <strong>8 columns: name, phone, city, neet, course, destination, remark, source</strong>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-purple-600">3.</span>
              All columns are required for qualified leads
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-purple-600">4.</span>
              Upload the CSV file and click "Upload Leads"
            </p>
          </div>
        )}

        <button
          onClick={downloadSample}
          className={`mt-4 flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-all shadow-md ${
            activeTab === 'raw'
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          <Download size={20} />
          Download Sample CSV ({activeTab === 'raw' ? 'Raw' : 'Qualified'})
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Upload CSV File</h2>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50 hover:border-purple-400 hover:bg-purple-50 transition-all">
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />

          {!file ? (
            <>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Select CSV file to upload
              </p>
              <p className="text-sm text-gray-500 mb-4">Only CSV files with name, phone, city columns</p>
              <label className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold cursor-pointer hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg">
                Choose File
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-green-600">
                <CheckCircle size={24} />
                <span className="font-semibold text-lg">{file.name}</span>
                <button
                  onClick={() => setFile(null)}
                  className="p-1 hover:bg-red-100 rounded-full transition-all"
                >
                  <X size={20} className="text-red-600" />
                </button>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Leads'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div className={`rounded-xl p-6 shadow-lg flex items-start gap-4 ${
          result.type === 'success'
            ? 'bg-green-50 border-2 border-green-200'
            : 'bg-red-50 border-2 border-red-200'
        }`}>
          {result.type === 'success' ? (
            <CheckCircle className="text-green-600 flex-shrink-0" size={32} />
          ) : (
            <AlertCircle className="text-red-600 flex-shrink-0" size={32} />
          )}
          <div className="flex-1">
            <p className={`font-bold text-xl mb-2 ${
              result.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.message}
            </p>
            {result.details && (
              <div className="space-y-1 text-sm text-green-700">
                <p>✓ Total rows in file: {result.details.total}</p>
                <p>✓ Successfully imported: {result.details.imported}</p>
                {result.details.duplicates > 0 && (
                  <p>⚠ Duplicates skipped: {result.details.duplicates}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className={`rounded-xl p-6 border ${activeTab === 'raw' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
        <h3 className={`font-bold mb-2 flex items-center gap-2 ${activeTab === 'raw' ? 'text-blue-900' : 'text-purple-900'}`}>
          <Users size={20} />
          CSV Format Requirements
        </h3>
        {activeTab === 'raw' ? (
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• First row must be headers: <strong>name,phone,city</strong></li>
            <li>• Name: Full name of the student (Required)</li>
            <li>• Phone: 10-digit mobile number (Required)</li>
            <li>• City: City name (Optional)</li>
            <li>• Duplicate phone numbers will be automatically skipped</li>
          </ul>
        ) : (
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• First row must be headers: <strong>name,phone,city,neet,course,destination,remark,source</strong></li>
            <li>• Name: Full name of the student (Required)</li>
            <li>• Phone: 10-digit mobile number (Required)</li>
            <li>• City: City name (Required)</li>
            <li>• NEET: NEET score (Required)</li>
            <li>• Course: MBBS or Other (Required)</li>
            <li>• Destination: Country name (Required)</li>
            <li>• Remark: Additional notes (Optional)</li>
            <li>• Source: Lead source (Optional)</li>
            <li>• Duplicate phone numbers will be automatically skipped</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;
