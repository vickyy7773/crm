import { useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, Users, FileText, X } from 'lucide-react';
import API_URL from '../config/api';

const BulkUpload = () => {
  const [activeTab, setActiveTab] = useState('raw'); // 'raw' or 'qualified'
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [source, setSource] = useState('');

  // Download sample CSV
  const downloadSample = () => {
    let csv;
    let filename;

    if (activeTab === 'raw') {
      csv = `name,father_name,phone,city,source
Rajesh Kumar,Suresh Kumar,9876543210,Udaipur,Google Ads
Priya Sharma,Ramesh Sharma,8765432109,Jaipur,Facebook
Amit Singh,Vijay Singh,7654321098,Delhi,Walk-in`;
      filename = 'raw_leads_sample.csv';
    } else {
      csv = `name,father_name,phone,course,score,city,source
John Doe,Robert Doe,9876543210,MBBS,520,Mumbai,Google Ads
Jane Smith,David Smith,8765432109,Other,75,Delhi,Facebook`;
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
      if (source.trim()) formData.append('source', source.trim());

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
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-4xl font-bold text-gray-900 flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
          <Upload size={24} className="text-purple-600 md:w-10 md:h-10" />
          Bulk Upload Leads
        </h1>
        <p className="text-gray-600 text-sm md:text-lg">Upload multiple leads at once using CSV</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 md:gap-4 mb-4 md:mb-6">
        <button
          onClick={() => {
            setActiveTab('raw');
            setFile(null);
            setResult(null);
          }}
          className={`flex-1 px-3 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-sm md:text-lg transition-all ${
            activeTab === 'raw'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
              : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-blue-400'
          }`}
        >
          📝 Raw Leads
          <p className="text-[10px] md:text-sm font-normal mt-0.5 md:mt-1 opacity-90">Name, Phone, City</p>
        </button>
        <button
          onClick={() => {
            setActiveTab('qualified');
            setFile(null);
            setResult(null);
          }}
          className={`flex-1 px-3 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-sm md:text-lg transition-all ${
            activeTab === 'qualified'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-purple-400'
          }`}
        >
          ⭐ Qualified Leads
          <p className="text-[10px] md:text-sm font-normal mt-0.5 md:mt-1 opacity-90">course, score, city...</p>
        </button>
      </div>

      {/* Instructions Card */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6 mb-4 md:mb-6 border border-gray-200">
        <h2 className="text-base md:text-xl font-bold text-gray-900 mb-2 md:mb-4 flex items-center gap-2">
          <FileText className={activeTab === 'raw' ? 'text-blue-600' : 'text-purple-600'} size={20} />
          Instructions
        </h2>
        {activeTab === 'raw' ? (
          <div className="space-y-2 md:space-y-3 text-xs md:text-base text-gray-700">
            <p className="flex items-start gap-2">
              <span className="font-bold text-blue-600">1.</span>
              Download the sample CSV file below
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-blue-600">2.</span>
              Add data with <strong>5 columns: name, father_name, phone, city, source</strong>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-blue-600">3.</span>
              Phone: 10 digits (no country code)
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-blue-600">4.</span>
              Source: optional (e.g. Google Ads, Facebook)
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-blue-600">5.</span>
              Upload and click "Upload Leads"
            </p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3 text-xs md:text-base text-gray-700">
            <p className="flex items-start gap-2">
              <span className="font-bold text-purple-600">1.</span>
              Download the sample CSV file below
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-purple-600">2.</span>
              <span>Columns: <strong>name, father_name, phone, course, score, city, source</strong></span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-purple-600">3.</span>
              <span><strong>course</strong> column mein <strong>MBBS</strong> ya <strong>Other</strong> likhein (case insensitive)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-purple-600">4.</span>
              <span>MBBS ke liye score = NEET marks, Other ke liye = exam score</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-purple-600">5.</span>
              Upload and click "Upload Leads"
            </p>
          </div>
        )}

        <button
          onClick={downloadSample}
          className={`mt-3 md:mt-4 flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base text-white rounded-lg font-semibold transition-all shadow-md ${
            activeTab === 'raw'
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          <Download size={16} className="md:w-5 md:h-5" />
          Download Sample CSV
        </button>
      </div>

      {/* Source Field */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-4 border border-gray-200">
        <label className="block text-sm md:text-base font-bold text-gray-800 mb-2">
          Source <span className="text-gray-400 font-normal text-xs md:text-sm">(optional — applies to all uploaded leads)</span>
        </label>
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g. Google Ads, Facebook, Indiamart, Walk-in..."
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none text-sm"
        />
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8 mb-4 md:mb-6 border border-gray-200">
        <h2 className="text-base md:text-xl font-bold text-gray-900 mb-3 md:mb-6">Upload CSV File</h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg md:rounded-xl p-6 md:p-12 text-center bg-gray-50 hover:border-purple-400 hover:bg-purple-50 transition-all">
          <Upload className="mx-auto mb-3 md:mb-4 text-gray-400" size={36} />

          {!file ? (
            <>
              <p className="text-sm md:text-lg font-semibold text-gray-700 mb-1 md:mb-2">
                Select CSV file to upload
              </p>
              <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">Only CSV files accepted</p>
              <label className="inline-block px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg md:rounded-xl font-bold cursor-pointer hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg">
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
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-center gap-2 md:gap-3 text-green-600">
                <CheckCircle size={20} className="md:w-6 md:h-6" />
                <span className="font-semibold text-sm md:text-lg truncate max-w-[150px] md:max-w-none">{file.name}</span>
                <button
                  onClick={() => setFile(null)}
                  className="p-1 hover:bg-red-100 rounded-full transition-all"
                >
                  <X size={18} className="text-red-600" />
                </button>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 md:px-8 py-2 md:py-3 text-sm md:text-base bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg md:rounded-xl font-bold hover:from-green-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Leads'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div className={`rounded-lg md:rounded-xl p-3 md:p-6 mb-4 md:mb-6 shadow-lg flex items-start gap-2 md:gap-4 ${
          result.type === 'success'
            ? 'bg-green-50 border-2 border-green-200'
            : 'bg-red-50 border-2 border-red-200'
        }`}>
          {result.type === 'success' ? (
            <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
          ) : (
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
          )}
          <div className="flex-1">
            <p className={`font-bold text-sm md:text-xl mb-1 md:mb-2 ${
              result.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.message}
            </p>
            {result.details && (
              <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm text-green-700">
                <p>✓ Total rows: {result.details.total}</p>
                <p>✓ Imported: {result.details.imported}</p>
                {result.details.duplicates > 0 && (
                  <p>⚠ Skipped: {result.details.duplicates}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className={`rounded-lg md:rounded-xl p-3 md:p-6 border ${activeTab === 'raw' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
        <h3 className={`font-bold text-sm md:text-base mb-2 flex items-center gap-2 ${activeTab === 'raw' ? 'text-blue-900' : 'text-purple-900'}`}>
          <Users size={16} className="md:w-5 md:h-5" />
          CSV Format Requirements
        </h3>
        {activeTab === 'raw' ? (
          <ul className="text-xs md:text-sm text-blue-800 space-y-0.5 md:space-y-1">
            <li>• Headers: <strong>name, father_name, phone, city, source</strong></li>
            <li>• Name, Phone: Required</li>
            <li>• Father Name, City, Source: Optional</li>
            <li>• Duplicates will be skipped</li>
          </ul>
        ) : (
          <ul className="text-xs md:text-sm text-purple-800 space-y-0.5 md:space-y-1">
            <li>• Headers: <strong>name, father_name, phone, course, score, city, source</strong></li>
            <li>• Name, Phone: Required</li>
            <li>• course: MBBS ya Other likhein</li>
            <li>• score: MBBS = NEET marks, Other = exam score</li>
            <li>• Father Name, City, Source: Optional</li>
            <li>• Duplicates will be skipped</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;
