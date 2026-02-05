import { useState, useEffect } from 'react';
import { GraduationCap, Search, Filter, Eye, X, Mail, Phone, Calendar, MapPin, FileText, Award, Globe, User2, Users2, CheckCircle2, Clock, XCircle, AlertCircle, FileWarning, Download, Edit2, Trash2, Plus } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import API_URL from '../config/api';

const StudentApplications = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    course: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0
  });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    whatsapp: '',
    dateOfBirth: '',
    gender: '',
    course: 'MBBS',
    preferredCountry: '',
    preferredUniversity: '',
    status: 'Pending'
  });

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [filters, pagination.offset]);

  const fetchApplications = async () => {
    try {
      setLoading(true);

      // Determine which endpoint to call based on course filter
      if (filters.course === 'Other') {
        // Fetch only Other Courses applications
        const response = await fetch(`${API_URL}/other-courses-applications`);
        const data = await response.json();

        if (data.success) {
          let apps = data.data.map(app => ({ ...app, course: 'Other Courses', _appType: 'other' }));

          // Apply search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            apps = apps.filter(app =>
              app.first_middle_name?.toLowerCase().includes(searchLower) ||
              app.last_name?.toLowerCase().includes(searchLower) ||
              app.email?.toLowerCase().includes(searchLower) ||
              app.mobile?.includes(filters.search)
            );
          }

          setApplications(apps);
          setPagination(prev => ({ ...prev, total: apps.length }));
        }
      } else if (filters.course === 'MBBS') {
        // Fetch only MBBS applications
        const params = new URLSearchParams({
          limit: pagination.limit,
          offset: pagination.offset,
          search: filters.search || ''
        });

        const response = await fetch(`${API_URL}/student-applications?${params}`);
        const data = await response.json();

        if (data.success) {
          const apps = data.data.map(app => ({ ...app, course: app.course || 'MBBS', _appType: 'mbbs' }));
          setApplications(apps);
          setPagination(prev => ({ ...prev, total: data.pagination.total }));
        }
      } else {
        // Fetch both MBBS and Other Courses applications
        const [mbbsRes, otherRes] = await Promise.all([
          fetch(`${API_URL}/student-applications`),
          fetch(`${API_URL}/other-courses-applications`)
        ]);

        const [mbbsData, otherData] = await Promise.all([
          mbbsRes.json(),
          otherRes.json()
        ]);

        let allApps = [];
        if (mbbsData.success) {
          const mbbsApps = mbbsData.data.map(app => ({ ...app, course: app.course || 'MBBS', _appType: 'mbbs' }));
          allApps = [...mbbsApps];
        }
        if (otherData.success) {
          const otherApps = otherData.data.map(app => ({ ...app, course: 'Other Courses', _appType: 'other' }));
          allApps = [...allApps, ...otherApps];
        }

        // Apply search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          allApps = allApps.filter(app =>
            app.first_name?.toLowerCase().includes(searchLower) ||
            app.first_middle_name?.toLowerCase().includes(searchLower) ||
            app.last_name?.toLowerCase().includes(searchLower) ||
            app.email?.toLowerCase().includes(searchLower) ||
            app.mobile?.includes(filters.search)
          );
        }

        setApplications(allApps);
        setPagination(prev => ({ ...prev, total: allApps.length }));
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch stats from both MBBS and Other Courses
      const [mbbsStatsRes, otherStatsRes] = await Promise.all([
        fetch(`${API_URL}/student-applications/stats/overview`),
        fetch(`${API_URL}/other-courses-applications/stats/overview`)
      ]);

      const [mbbsStatsData, otherStatsData] = await Promise.all([
        mbbsStatsRes.json(),
        otherStatsRes.json()
      ]);

      // Combine stats from both
      const combinedStats = {
        total_applications: 0,
        today_applications: 0,
        this_week_applications: 0,
        this_month_applications: 0
      };

      if (mbbsStatsData.success) {
        combinedStats.total_applications += mbbsStatsData.data.total_applications || 0;
        combinedStats.today_applications += mbbsStatsData.data.today_applications || 0;
        combinedStats.this_week_applications += mbbsStatsData.data.this_week_applications || 0;
        combinedStats.this_month_applications += mbbsStatsData.data.this_month_applications || 0;
      }

      if (otherStatsData.success) {
        combinedStats.total_applications += otherStatsData.data.total_applications || 0;
        combinedStats.today_applications += otherStatsData.data.today_applications || 0;
        combinedStats.this_week_applications += otherStatsData.data.this_week_applications || 0;
        combinedStats.this_month_applications += otherStatsData.data.this_month_applications || 0;
      }

      setStats(combinedStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
    }
  };

  const handleViewDetails = async (application) => {
    try {
      // Determine which endpoint to use based on application type
      const endpoint = application._appType === 'other'
        ? `${API_URL}/other-courses-applications`
        : `${API_URL}/student-applications/${application.id}`;

      // For Other Courses, we need to find the specific application from the list
      // since the endpoint doesn't support fetching by ID yet
      if (application._appType === 'other') {
        setSelectedApplication(application);
        setShowDetails(true);
      } else {
        const response = await fetch(endpoint);
        const data = await response.json();
        if (data.success) {
          setSelectedApplication(data.data);
          setShowDetails(true);
        }
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/student-applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        fetchApplications();
        if (selectedApplication && selectedApplication.id === applicationId) {
          setSelectedApplication(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Approved': 'bg-green-100 text-green-700 border-green-200',
      'Rejected': 'bg-red-100 text-red-700 border-red-200',
      'Documents Required': 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Pending': <Clock size={16} />,
      'Approved': <CheckCircle2 size={16} />,
      'Rejected': <XCircle size={16} />,
      'Documents Required': <FileWarning size={16} />
    };
    return icons[status] || <Clock size={16} />;
  };

  // Edit application handler
  const handleEditApplication = (application) => {
    setEditFormData({ ...application });
    setEditModalOpen(true);
    setShowDetails(false);
  };

  const handleUpdateApplication = async () => {
    if (!editFormData) return;

    try {
      const endpoint = editFormData._appType === 'other'
        ? `${API_URL}/other-courses-applications/${editFormData.id}`
        : `${API_URL}/student-applications/${editFormData.id}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      const result = await response.json();
      if (result.success) {
        alert('✓ Application updated successfully!');
        setEditModalOpen(false);
        setEditFormData(null);
        fetchApplications();
      } else {
        alert('Failed to update application: ' + result.message);
      }
    } catch (err) {
      console.error('Error updating application:', err);
      alert('Error updating application. Check console for details.');
    }
  };

  // Delete application handler
  const handleDeleteApplication = async (applicationId, appType) => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    try {
      const endpoint = appType === 'other'
        ? `${API_URL}/other-courses-applications/${applicationId}`
        : `${API_URL}/student-applications/${applicationId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        alert('✓ Application deleted successfully!');
        setShowDetails(false);
        fetchApplications();
      } else {
        alert('Failed to delete application: ' + result.message);
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Error deleting application. Check console for details.');
    }
  };

  // Add new student handler
  const handleAddStudent = async (e) => {
    e.preventDefault();

    try {
      const endpoint = newStudent.course === 'MBBS'
        ? `${API_URL}/student-applications`
        : `${API_URL}/other-courses-applications`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });

      const result = await response.json();
      if (result.success) {
        alert('✓ Student added successfully!');
        setAddModalOpen(false);
        setNewStudent({
          firstName: '',
          lastName: '',
          email: '',
          mobile: '',
          whatsapp: '',
          dateOfBirth: '',
          gender: '',
          course: 'MBBS',
          preferredCountry: '',
          preferredUniversity: '',
          status: 'Pending'
        });
        fetchApplications();
      } else {
        alert('Failed to add student: ' + result.message);
      }
    } catch (err) {
      console.error('Error adding student:', err);
      alert('Error adding student. Check console for details.');
    }
  };

  const generatePDF = (application) => {
    const doc = new jsPDF();

    // Header - Professional styling
    doc.setFillColor(139, 92, 246); // Purple
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT APPLICATION FORM', 105, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Medical Education Admission', 105, 23, { align: 'center' });

    // Application ID
    doc.setFontSize(10);
    doc.text(`Application ID: ${application.id}`, 105, 30, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    let yPos = 45;

    // Personal Information Section
    doc.setFillColor(243, 244, 246);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 92, 246);
    doc.text('PERSONAL INFORMATION', 15, yPos + 5);
    doc.setTextColor(0, 0, 0);
    yPos += 12;

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        ['Full Name', `${application.first_name || application.first_middle_name || ''} ${application.last_name || ''}`.trim()],
        ['Father\'s Name', `${application.father_title || ''} ${application.father_name || ''}`.trim() || 'N/A'],
        ['Mother\'s Name', `${application.mother_title || ''} ${application.mother_name || ''}`.trim() || 'N/A'],
        ['Date of Birth', application.date_of_birth ? new Date(application.date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'],
        ['Gender', application.gender || 'N/A'],
        ['Nationality', application.nationality || 'N/A'],
        ['Email', application.email || 'N/A'],
        ['Phone', application.mobile || 'N/A'],
        ['WhatsApp', application.whatsapp || 'N/A'],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, textColor: [75, 85, 99] },
        1: { cellWidth: 120 }
      },
      margin: { left: 15 }
    });

    yPos = doc.lastAutoTable.finalY + 8;

    // Address Section
    doc.setFillColor(243, 244, 246);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 92, 246);
    doc.text('ADDRESS DETAILS', 15, yPos + 5);
    doc.setTextColor(0, 0, 0);
    yPos += 12;

    autoTable(doc, {
      startY: yPos,
      body: [
        ['Address', application.address || 'N/A'],
        ['City', application.city || 'N/A'],
        ['Pincode', application.pincode || 'N/A'],
        ['State', application.state || 'N/A'],
        ['Country', application.country || 'N/A'],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, textColor: [75, 85, 99] },
        1: { cellWidth: 120 }
      },
      margin: { left: 15 }
    });

    yPos = doc.lastAutoTable.finalY + 8;

    // Academic Information Section
    doc.setFillColor(243, 244, 246);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 92, 246);
    doc.text('ACADEMIC INFORMATION', 15, yPos + 5);
    doc.setTextColor(0, 0, 0);
    yPos += 12;

    // Build academic info based on application type
    const academicBody = [
      ['10th School', application.school_10_name || 'N/A'],
      ['10th Board', application.board_10 || 'N/A'],
      ['10th Percentage', application.percentage_10 ? `${application.percentage_10}%` : 'N/A'],
      ['10th Year of Passing', application.year_10 || 'N/A'],
    ];

    // Add 11th details for Other Courses if available
    if (application._appType === 'other' && application.school_11_name) {
      academicBody.push(
        ['11th School', application.school_11_name || 'N/A'],
        ['11th Board', application.board_11 || 'N/A'],
        ['11th Percentage', application.percentage_11 ? `${application.percentage_11}%` : 'N/A'],
        ['11th Year of Passing', application.year_11 || 'N/A']
      );
    }

    // Add 12th details
    academicBody.push(
      ['12th Status', application.school_12_status || 'N/A'],
      ['12th School', application.school_12_name || 'N/A'],
      ['12th Board', application.board_12 || 'N/A'],
      ['12th Percentage', application.percentage_12 ? `${application.percentage_12}%` : 'N/A'],
      ['12th Year of Passing', application.year_12 || 'N/A']
    );

    // Add UG, PG details for Other Courses
    if (application._appType === 'other') {
      academicBody.push(
        ['UG Status', application.ug_status || 'N/A'],
        ['UG Degree', application.ug_degree || 'N/A'],
        ['UG College', application.ug_college || 'N/A'],
        ['UG Percentage', application.ug_percentage ? `${application.ug_percentage}%` : 'N/A'],
        ['UG Year', application.ug_year || 'N/A'],
        ['PG Status', application.pg_status || 'N/A'],
        ['PG Degree', application.pg_degree || 'N/A'],
        ['PG College', application.pg_college || 'N/A'],
        ['PG Percentage', application.pg_percentage ? `${application.pg_percentage}%` : 'N/A'],
        ['PG Year', application.pg_year || 'N/A']
      );

      // English exam
      if (application.english_exam === 'Yes') {
        academicBody.push(
          ['English Exam', application.english_exam_type || 'N/A'],
          ['English Exam Year', application.english_exam_year || 'N/A']
        );
      }

      // Entrance exams
      if (application.entrance_exam === 'Yes' && application.entrance_exams) {
        try {
          const exams = typeof application.entrance_exams === 'string' ? JSON.parse(application.entrance_exams) : application.entrance_exams;
          const examsList = exams.map(e => `${e.examName}: ${e.score}`).join(', ');
          academicBody.push(['Entrance Exams', examsList]);
        } catch (e) {
          academicBody.push(['Entrance Exams', 'N/A']);
        }
      }

      // Gap year
      if (application.gap_between_education === 'Yes') {
        academicBody.push(
          ['Gap Years', application.total_gap_years || 'N/A'],
          ['Gap Reason', application.gap_reason || 'N/A']
        );
      }
    } else {
      // NEET scores for MBBS
      academicBody.push(
        ['NEET Scores', application.neet_scores ? (typeof application.neet_scores === 'string' ? application.neet_scores : JSON.stringify(application.neet_scores)) : 'N/A']
      );
    }

    autoTable(doc, {
      startY: yPos,
      body: academicBody,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, textColor: [75, 85, 99] },
        1: { cellWidth: 120 }
      },
      margin: { left: 15 }
    });

    // Check if we need a new page
    if (doc.lastAutoTable.finalY > 220) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos = doc.lastAutoTable.finalY + 8;
    }

    // Course & University Preferences
    doc.setFillColor(243, 244, 246);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 92, 246);
    doc.text('COURSE & UNIVERSITY PREFERENCES', 15, yPos + 5);
    doc.setTextColor(0, 0, 0);
    yPos += 12;

    // Different preferences based on application type
    const preferencesBody = application._appType === 'other' ? [
      ['Selected Course', application.course || 'N/A'],
      ['Degree Name', application.degree_name || 'N/A'],
      ['Branch/Stream', application.branch_stream || 'N/A'],
      ['Preferred Countries', application.preferred_countries || 'N/A'],
      ['Max Budget', application.max_budget || 'N/A'],
      ['Work Experience', application.work_experience + (application.work_experience === 'Yes' && application.work_duration ? ` (${application.work_duration})` : '') || 'N/A'],
    ] : [
      ['Preferred Course', application.course || 'N/A'],
      ['Preferred University', application.preferred_university || 'N/A'],
      ['Preferred Country', application.preferred_country || 'N/A'],
    ];

    autoTable(doc, {
      startY: yPos,
      body: preferencesBody,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, textColor: [75, 85, 99] },
        1: { cellWidth: 120 }
      },
      margin: { left: 15 }
    });

    yPos = doc.lastAutoTable.finalY + 8;

    // Passport Information (Only for Other Courses)
    if (application._appType === 'other') {
      doc.setFillColor(243, 244, 246);
      doc.rect(10, yPos, 190, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 92, 246);
      doc.text('PASSPORT INFORMATION', 15, yPos + 5);
      doc.setTextColor(0, 0, 0);
      yPos += 12;

      autoTable(doc, {
        startY: yPos,
        body: [
          ['Passport Status', application.passport_status || 'N/A'],
          ['Passport Number', application.passport_number || 'N/A'],
          ['Issue Date', application.passport_issue_date ? new Date(application.passport_issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'],
          ['Expiry Date', application.passport_expiry_date ? new Date(application.passport_expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'],
          ['File Number', application.file_number || 'N/A'],
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60, textColor: [75, 85, 99] },
          1: { cellWidth: 120 }
        },
        margin: { left: 15 }
      });

      yPos = doc.lastAutoTable.finalY + 8;

      // Visa Information (Only for Other Courses)
      doc.setFillColor(243, 244, 246);
      doc.rect(10, yPos, 190, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 92, 246);
      doc.text('VISA INFORMATION', 15, yPos + 5);
      doc.setTextColor(0, 0, 0);
      yPos += 12;

      const visaBody = [
        ['Visa Applied Prior', application.visa_applied_prior || 'N/A']
      ];

      if (application.visa_applied_prior === 'Yes') {
        visaBody.push(
          ['Country', application.visa_country_name || 'N/A'],
          ['Number of Times', application.visa_how_many_times || 'N/A']
        );
      }

      visaBody.push(['Previous Visa Refusal', application.previous_visa_refusal || 'N/A']);

      if (application.previous_visa_refusal === 'Yes') {
        visaBody.push(
          ['Refusal Country', application.refusal_country_name || 'N/A'],
          ['Refusal Reason', application.refusal_reason || 'N/A']
        );
      }

      if (application.comments) {
        visaBody.push(['Additional Comments', application.comments]);
      }

      autoTable(doc, {
        startY: yPos,
        body: visaBody,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60, textColor: [75, 85, 99] },
          1: { cellWidth: 120 }
        },
        margin: { left: 15 }
      });

      yPos = doc.lastAutoTable.finalY + 8;
    }

    // Document Upload Status
    doc.setFillColor(243, 244, 246);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 92, 246);
    doc.text('DOCUMENT CHECKLIST', 15, yPos + 5);
    doc.setTextColor(0, 0, 0);
    yPos += 12;

    // Different documents based on application type
    const documents = [
      { name: '10th Marksheet', status: application.document_marksheet_10 ? '✓ Uploaded' : '✗ Not Uploaded' },
      { name: '12th Marksheet', status: application.document_marksheet_12 ? '✓ Uploaded' : '✗ Not Uploaded' },
      { name: 'Aadhar Card (Front)', status: application.document_aadhar_front ? '✓ Uploaded' : '✗ Not Uploaded' },
      { name: 'Aadhar Card (Back)', status: application.document_aadhar_back ? '✓ Uploaded' : '✗ Not Uploaded' },
      { name: 'Passport Photo', status: application.document_photograph ? '✓ Uploaded' : '✗ Not Uploaded' },
    ];

    // Add MBBS-specific documents
    if (application._appType !== 'other') {
      documents.splice(2, 0, { name: 'NEET Scorecard', status: application.document_neet_scorecard ? '✓ Uploaded' : '✗ Not Uploaded' });
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Document', 'Status']],
      body: documents.map(doc => [doc.name, doc.status]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 90, halign: 'center' }
      },
      margin: { left: 15 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Application submitted on ${new Date(application.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        15,
        285
      );
      doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });

      // Footer line
      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(0.5);
      doc.line(15, 282, 195, 282);
    }

    // Save the PDF
    doc.save(`Application_${application.first_name || application.first_middle_name || 'Student'}_${application.last_name || ''}_${application.id}.pdf`);
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
            <GraduationCap size={28} className="text-purple-600 md:w-9 md:h-9" />
            Student Applications
          </h1>
          <p className="text-gray-500 text-sm md:text-base mt-1">Manage and track all student course applications</p>
        </div>
        <button
          onClick={() => {
            console.log('Button clicked! Opening modal...');
            setAddModalOpen(true);
          }}
          className="px-4 md:px-6 py-2 md:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium shadow-md hover:shadow-lg text-sm md:text-base"
        >
          <Plus size={20} />
          Add New Student
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-5 border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GraduationCap size={20} className="text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.total_applications}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Total Applications</p>
            <p className="text-xs text-gray-400 mt-1">All submitted forms</p>
          </div>

          <div className="bg-white rounded-xl p-5 border-2 border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.pending}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-xs text-gray-400 mt-1">Awaiting review</p>
          </div>

          <div className="bg-white rounded-xl p-5 border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar size={20} className="text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.this_week_applications}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">This Week</p>
            <p className="text-xs text-gray-400 mt-1">Last 7 days</p>
          </div>

          <div className="bg-white rounded-xl p-5 border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.approved}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Approved</p>
            <p className="text-xs text-gray-400 mt-1">Successfully verified</p>
          </div>

          <div className="bg-white rounded-xl p-5 border-2 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileWarning size={20} className="text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.documents_required}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Docs Required</p>
            <p className="text-xs text-gray-400 mt-1">Need more info</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, mobile..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
            />
          </div>

<select
            value={filters.course}
            onChange={(e) => handleFilterChange('course', e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
          >
            <option value="">All Courses</option>
            <option value="MBBS">MBBS</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Applications List</h3>
          <p className="text-sm text-gray-500 mt-1">
            Showing {applications.length} of {pagination.total} applications
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <GraduationCap size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No applications found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                <tr className="border-b-2 border-purple-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Student Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Academic Info</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Preferences</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {applications.map((application) => (
                  <tr key={`${application._appType}-${application.id}`} className="hover:bg-purple-50/50 transition-all duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {(application.first_name || application.first_middle_name || '').charAt(0)}{(application.last_name || '').charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 text-sm">
                            {application.first_name || application.first_middle_name} {application.last_name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Mail size={12} />
                            <span className="truncate">{application.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <Phone size={12} />
                            {application.mobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold">
                            {application.course}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">10th:</span> {application.percentage_10}% ({application.year_10})
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">12th:</span> {application.percentage_12}% ({application.year_12})
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {application._appType === 'other' ? (
                          <>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                              <Globe size={14} className="text-purple-600" />
                              {application.preferred_countries || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-2">
                              {application.degree_name || 'N/A'}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                              <Globe size={14} className="text-purple-600" />
                              {application.preferred_country}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-2">
                              {application.preferred_university}
                            </div>
                          </>
                        )}
                        <div className="text-xs text-gray-400">
                          Docs: {application.upload_documents === 'Yes' ? '✓ Uploaded' : '⊗ Pending'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(application.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(application.created_at).toLocaleDateString('en-IN', { year: 'numeric' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewDetails(application)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md text-xs font-semibold"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && applications.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {Math.floor(pagination.offset / pagination.limit) + 1} of{' '}
              {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              onClick={handleNextPage}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
                  {(selectedApplication.first_name || selectedApplication.first_middle_name || '').charAt(0)}{(selectedApplication.last_name || '').charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedApplication.first_name || selectedApplication.first_middle_name} {selectedApplication.last_name}
                  </h2>
                  <p className="text-purple-100 text-sm flex items-center gap-2">
                    <span>ID: #{selectedApplication.id}</span>
                    <span>•</span>
                    <span>{selectedApplication.course}</span>
                    <span>•</span>
                    <span>{selectedApplication.nationality}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditApplication(selectedApplication)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-all border-2 border-white/30 font-semibold text-sm"
                  title="Edit Application"
                >
                  <Edit2 size={18} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteApplication(selectedApplication.id, selectedApplication._appType)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/90 backdrop-blur-sm hover:bg-red-600 rounded-lg transition-all border-2 border-red-400/50 font-semibold text-sm"
                  title="Delete Application"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
                <button
                  onClick={() => generatePDF(selectedApplication)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-all border-2 border-white/30 font-semibold text-sm"
                  title="Download Application PDF"
                >
                  <Download size={18} />
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setActiveTab('personal');
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50 px-6 shrink-0">
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'personal'
                      ? 'border-purple-600 text-purple-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User2 size={16} />
                    Personal Details
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('family')}
                  className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'family'
                      ? 'border-purple-600 text-purple-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users2 size={16} />
                    Family & Address
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('academic')}
                  className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'academic'
                      ? 'border-purple-600 text-purple-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Award size={16} />
                    Academic Records
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'preferences'
                      ? 'border-purple-600 text-purple-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe size={16} />
                    Preferences
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'documents'
                      ? 'border-purple-600 text-purple-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    Documents
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8 overflow-y-auto flex-1 bg-gray-50">

              {/* Personal Details Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of Birth</label>
                        <p className="font-semibold text-gray-900 mt-1">{new Date(selectedApplication.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender</label>
                        <p className="font-semibold text-gray-900 mt-1">{selectedApplication.gender}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nationality</label>
                        <p className="font-semibold text-gray-900 mt-1">{selectedApplication.nationality}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                          <Mail size={14} />
                          Email Address
                        </label>
                        <p className="font-semibold text-gray-900 mt-1 break-all">{selectedApplication.email}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                          <Phone size={14} />
                          Mobile Number
                        </label>
                        <p className="font-semibold text-gray-900 mt-1">{selectedApplication.mobile}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">WhatsApp Number</label>
                        <p className="font-semibold text-gray-900 mt-1">{selectedApplication.whatsapp || 'Not Provided'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aadhar Number</label>
                        <p className="font-semibold text-gray-900 mt-1">{selectedApplication.aadhar}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Passport Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Passport Status</label>
                        <p className="font-semibold text-gray-900 mt-1">
                          <span className={`inline-block px-3 py-1 rounded-lg text-sm ${
                            selectedApplication.passport_status === 'Available' ? 'bg-green-100 text-green-700' :
                            selectedApplication.passport_status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {selectedApplication.passport_status}
                          </span>
                        </p>
                      </div>
                      {selectedApplication.passport_number && (
                        <>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Passport Number</label>
                            <p className="font-semibold text-gray-900 mt-1">{selectedApplication.passport_number}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Issuance Date</label>
                            <p className="font-semibold text-gray-900 mt-1">{selectedApplication.passport_issuance_date ? new Date(selectedApplication.passport_issuance_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expiry Date</label>
                            <p className="font-semibold text-gray-900 mt-1">{selectedApplication.passport_expiry_date ? new Date(selectedApplication.passport_expiry_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </>
                      )}
                      {selectedApplication.file_number && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">File Number</label>
                          <p className="font-semibold text-gray-900 mt-1">{selectedApplication.file_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Family & Address Tab */}
              {activeTab === 'family' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm border-2 border-blue-200">
                      <h3 className="text-lg font-bold text-blue-900 mb-4 pb-2 border-b border-blue-300">Father's Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Full Name</label>
                          <p className="font-bold text-gray-900 mt-1 text-lg">{selectedApplication.father_title} {selectedApplication.father_name}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Mobile Number</label>
                          <p className="font-semibold text-gray-900 mt-1">{selectedApplication.father_mobile}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Occupation</label>
                          <p className="font-semibold text-gray-900 mt-1">{selectedApplication.father_occupation}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 shadow-sm border-2 border-pink-200">
                      <h3 className="text-lg font-bold text-pink-900 mb-4 pb-2 border-b border-pink-300">Mother's Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Full Name</label>
                          <p className="font-bold text-gray-900 mt-1 text-lg">{selectedApplication.mother_title} {selectedApplication.mother_name}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Mobile Number</label>
                          <p className="font-semibold text-gray-900 mt-1">{selectedApplication.mother_mobile || 'Not Provided'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Occupation</label>
                          <p className="font-semibold text-gray-900 mt-1">{selectedApplication.mother_occupation || 'Not Provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
                      <MapPin size={20} className="text-purple-600" />
                      Residential Address
                    </h3>
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-900 text-lg mb-2">{selectedApplication.address}</p>
                      <p className="text-gray-700 font-medium">
                        {selectedApplication.city}, {selectedApplication.state} - {selectedApplication.pincode}
                      </p>
                      <p className="text-gray-600 font-medium mt-1">{selectedApplication.country}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Academic Records Tab */}
              {activeTab === 'academic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm border-2 border-green-200">
                      <h3 className="text-lg font-bold text-green-900 mb-4 pb-2 border-b border-green-300">10th Standard</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">School Name</label>
                          <p className="font-semibold text-gray-900 mt-1">{selectedApplication.school_10_name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Board</label>
                            <p className="font-semibold text-gray-900 mt-1">{selectedApplication.board_10}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Year</label>
                            <p className="font-semibold text-gray-900 mt-1">{selectedApplication.year_10}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Percentage</label>
                          <p className="font-bold text-green-900 text-2xl mt-1">{selectedApplication.percentage_10}%</p>
                        </div>
                      </div>
                    </div>

                    {selectedApplication._appType === 'other' && selectedApplication.school_11_name && (
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow-sm border-2 border-yellow-200">
                        <h3 className="text-lg font-bold text-yellow-900 mb-4 pb-2 border-b border-yellow-300">11th Standard</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">School Name</label>
                            <p className="font-semibold text-gray-900 mt-1">{selectedApplication.school_11_name}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Board</label>
                              <p className="font-semibold text-gray-900 mt-1">{selectedApplication.board_11 || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Year</label>
                              <p className="font-semibold text-gray-900 mt-1">{selectedApplication.year_11 || 'N/A'}</p>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Percentage</label>
                            <p className="font-bold text-yellow-900 text-2xl mt-1">{selectedApplication.percentage_11 || 'N/A'}%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm border-2 border-blue-200">
                      <h3 className="text-lg font-bold text-blue-900 mb-4 pb-2 border-b border-blue-300">12th Standard</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Status</label>
                          <p className="font-semibold text-gray-900 mt-1">{selectedApplication.school_12_status || 'N/A'}</p>
                        </div>
                        {selectedApplication.school_12_name && (
                          <>
                            <div>
                              <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">School Name</label>
                              <p className="font-semibold text-gray-900 mt-1">{selectedApplication.school_12_name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Board</label>
                                <p className="font-semibold text-gray-900 mt-1">{selectedApplication.board_12 || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Year</label>
                                <p className="font-semibold text-gray-900 mt-1">{selectedApplication.year_12 || 'N/A'}</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Percentage</label>
                              <p className="font-bold text-blue-900 text-2xl mt-1">{selectedApplication.percentage_12 || 'N/A'}%</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Other Courses - UG, PG, Other Course Details */}
                  {selectedApplication._appType === 'other' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* UG Details */}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm border-2 border-purple-200">
                          <h3 className="text-lg font-bold text-purple-900 mb-4 pb-2 border-b border-purple-300">Undergraduate (UG)</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Status</label>
                              <p className="font-semibold text-gray-900 mt-1">{selectedApplication.ug_status || 'N/A'}</p>
                            </div>
                            {selectedApplication.ug_degree && (
                              <>
                                <div>
                                  <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Degree</label>
                                  <p className="font-semibold text-gray-900 mt-1">{selectedApplication.ug_degree}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">College</label>
                                  <p className="font-semibold text-gray-900 mt-1">{selectedApplication.ug_college || 'N/A'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Percentage</label>
                                    <p className="font-bold text-purple-900 text-xl mt-1">{selectedApplication.ug_percentage || 'N/A'}%</p>
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Year</label>
                                    <p className="font-semibold text-gray-900 mt-1">{selectedApplication.ug_year || 'N/A'}</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* PG Details */}
                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 shadow-sm border-2 border-pink-200">
                          <h3 className="text-lg font-bold text-pink-900 mb-4 pb-2 border-b border-pink-300">Postgraduate (PG)</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Status</label>
                              <p className="font-semibold text-gray-900 mt-1">{selectedApplication.pg_status || 'N/A'}</p>
                            </div>
                            {selectedApplication.pg_degree && (
                              <>
                                <div>
                                  <label className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Degree</label>
                                  <p className="font-semibold text-gray-900 mt-1">{selectedApplication.pg_degree}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-pink-700 uppercase tracking-wide">College</label>
                                  <p className="font-semibold text-gray-900 mt-1">{selectedApplication.pg_college || 'N/A'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Percentage</label>
                                    <p className="font-bold text-pink-900 text-xl mt-1">{selectedApplication.pg_percentage || 'N/A'}%</p>
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Year</label>
                                    <p className="font-semibold text-gray-900 mt-1">{selectedApplication.pg_year || 'N/A'}</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Any Other Course */}
                      {selectedApplication.any_other_course === 'Yes' && selectedApplication.other_course_name && (
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 shadow-sm border-2 border-indigo-200">
                          <h3 className="text-lg font-bold text-indigo-900 mb-4 pb-2 border-b border-indigo-300">Other Course</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Course Name</label>
                              <p className="font-semibold text-gray-900 mt-1">{selectedApplication.other_course_name}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">College/Institute</label>
                              <p className="font-semibold text-gray-900 mt-1">{selectedApplication.other_course_college || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Percentage</label>
                              <p className="font-bold text-indigo-900 text-xl mt-1">{selectedApplication.other_course_percentage || 'N/A'}%</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Year</label>
                              <p className="font-semibold text-gray-900 mt-1">{selectedApplication.other_course_year || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gap in Education */}
                      {selectedApplication.gap_between_education === 'Yes' && (
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 shadow-sm border-2 border-orange-200">
                          <h3 className="text-lg font-bold text-orange-900 mb-4 pb-2 border-b border-orange-300">Gap in Education</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Total Gap Years</label>
                              <p className="font-bold text-orange-900 text-2xl mt-1">{selectedApplication.total_gap_years || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Reason</label>
                              <p className="font-semibold text-gray-900 mt-1">{selectedApplication.gap_reason || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* English Exam */}
                      {selectedApplication.english_exam === 'Yes' && (
                        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 shadow-sm border-2 border-teal-200">
                          <h3 className="text-lg font-bold text-teal-900 mb-4 pb-2 border-b border-teal-300">English Proficiency Exam</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Exam Type</label>
                              <p className="font-semibold text-gray-900 mt-1">{selectedApplication.english_exam_type || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Year</label>
                              <p className="font-semibold text-gray-900 mt-1">{selectedApplication.english_exam_year || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Entrance Exams */}
                      {selectedApplication.entrance_exam === 'Yes' && selectedApplication.entrance_exams && (
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 shadow-sm border-2 border-red-200">
                          <h3 className="text-lg font-bold text-red-900 mb-4 pb-2 border-b border-red-300">Entrance Examinations</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(() => {
                              try {
                                const exams = typeof selectedApplication.entrance_exams === 'string'
                                  ? JSON.parse(selectedApplication.entrance_exams)
                                  : selectedApplication.entrance_exams;
                                return exams.map((exam, idx) => (
                                  <div key={idx} className="bg-white p-4 rounded-lg border-2 border-red-200">
                                    <label className="text-xs font-semibold text-red-700 uppercase tracking-wide">{exam.examName}</label>
                                    <p className="font-bold text-red-900 text-2xl mt-2">{exam.score}</p>
                                    <p className="text-xs text-gray-600 mt-1">Score</p>
                                  </div>
                                ));
                              } catch (e) {
                                return <p className="text-gray-500">No entrance exam data</p>;
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedApplication.neet_scores && selectedApplication.neet_scores.length > 0 && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm border-2 border-purple-200">
                      <h3 className="text-lg font-bold text-purple-900 mb-4 pb-2 border-b border-purple-300">NEET Examination Scores</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedApplication.neet_scores.map((neet, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-lg border-2 border-purple-200">
                            <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Year {neet.year}</label>
                            <p className="font-bold text-purple-900 text-3xl mt-2">{neet.score}</p>
                            <p className="text-xs text-gray-600 mt-1">Total Score</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApplication.other_exam_name && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Other Examinations</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Exam Name</label>
                          <p className="font-semibold text-gray-900 mt-1">{selectedApplication.other_exam_name}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</label>
                          <p className="font-medium text-gray-700 mt-1">{selectedApplication.other_exam_details || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Course Preferences</h3>

                    {selectedApplication._appType === 'other' ? (
                      // Other Courses Application View
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selected Course</label>
                            <p className="font-bold text-purple-900 text-xl mt-2">{selectedApplication.course}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Degree Name</label>
                            <p className="font-semibold text-gray-900 text-lg mt-2">{selectedApplication.degree_name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch/Stream</label>
                            <p className="font-semibold text-gray-900 text-lg mt-2">{selectedApplication.branch_stream || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                              <Globe size={14} />
                              Preferred Countries
                            </label>
                            <p className="font-semibold text-gray-900 text-lg mt-2">{selectedApplication.preferred_countries || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Max Budget</label>
                            <p className="font-semibold text-gray-900 text-lg mt-2">{selectedApplication.max_budget || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Work Experience</label>
                            <p className="font-semibold text-gray-900 text-lg mt-2">
                              {selectedApplication.work_experience}
                              {selectedApplication.work_experience === 'Yes' && selectedApplication.work_duration && (
                                <span className="text-purple-600"> ({selectedApplication.work_duration})</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Visa Information */}
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-bold text-gray-900 mb-3">Visa Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Visa Applied Prior</label>
                              <p className="font-semibold text-gray-900 text-lg mt-2">
                                {selectedApplication.visa_applied_prior}
                                {selectedApplication.visa_applied_prior === 'Yes' && (
                                  <span className="block text-sm text-purple-600 mt-1">
                                    {selectedApplication.visa_country_name} ({selectedApplication.visa_how_many_times} times)
                                  </span>
                                )}
                              </p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Previous Visa Refusal</label>
                              <p className="font-semibold text-gray-900 text-lg mt-2">
                                {selectedApplication.previous_visa_refusal}
                                {selectedApplication.previous_visa_refusal === 'Yes' && (
                                  <span className="block text-sm text-red-600 mt-1">
                                    {selectedApplication.refusal_country_name}: {selectedApplication.refusal_reason}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Comments */}
                        {selectedApplication.comments && (
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Additional Comments</label>
                            <p className="text-gray-900 mt-2">{selectedApplication.comments}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      // MBBS Application View
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selected Course</label>
                            <p className="font-bold text-purple-900 text-2xl mt-2">{selectedApplication.course}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                              <Globe size={14} />
                              Preferred Country
                            </label>
                            <p className="font-bold text-purple-900 text-2xl mt-2">{selectedApplication.preferred_country}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {selectedApplication._appType !== 'other' && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm border-2 border-purple-200">
                      <h3 className="text-lg font-bold text-purple-900 mb-4 pb-2 border-b border-purple-300">Preferred University</h3>
                      <p className="font-bold text-gray-900 text-xl">{selectedApplication.preferred_university}</p>
                      <p className="text-sm text-gray-600 mt-2">Student's first choice for enrollment</p>
                    </div>
                  )}

                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Document Upload Preference</h3>
                    <div className={`p-4 rounded-xl ${selectedApplication.upload_documents === 'Yes' ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'}`}>
                      <p className="font-semibold text-lg">
                        {selectedApplication.upload_documents === 'Yes' ? '✓ Student will upload documents' : '⊗ Documents not uploaded by student'}
                      </p>
                      <p className="text-sm mt-1 text-gray-600">
                        {selectedApplication.upload_documents === 'Yes'
                          ? 'Student has chosen to upload required documents'
                          : 'Student opted not to upload documents - You can upload documents on their behalf below'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center justify-between">
                      <span>Document Management</span>
                      <span className="text-xs font-normal text-gray-500">Upload documents on behalf of the student</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        // Define documents based on application type
                        const mbbsDocuments = [
                          { key: 'document_marksheet_10', label: '10th Marksheet', color: 'green' },
                          { key: 'document_marksheet_12', label: '12th Marksheet', color: 'green' },
                          { key: 'document_neet_scorecard', label: 'NEET Scorecard', color: 'purple' },
                          { key: 'document_aadhar_front', label: 'Aadhar Card (Front)', color: 'blue' },
                          { key: 'document_aadhar_back', label: 'Aadhar Card (Back)', color: 'blue' },
                          { key: 'document_photograph', label: 'Passport Size Photograph', color: 'pink' },
                        ];

                        const otherCoursesDocuments = [
                          { key: 'document_marksheet_10', label: '10th Marksheet', color: 'green' },
                          { key: 'document_marksheet_12', label: '12th Marksheet', color: 'green' },
                          { key: 'document_ug_degree', label: 'UG Degree Certificate', color: 'blue' },
                          { key: 'document_pg_degree', label: 'PG Degree Certificate', color: 'blue' },
                          { key: 'document_aadhar_card', label: 'Aadhar Card', color: 'cyan' },
                          { key: 'document_passport_front', label: 'Passport (Front)', color: 'indigo' },
                          { key: 'document_passport_back', label: 'Passport (Back)', color: 'indigo' },
                          { key: 'document_photograph', label: 'Passport Size Photograph', color: 'pink' },
                          { key: 'document_english_exam_cert', label: 'English Exam Certificate', color: 'orange' },
                          { key: 'document_entrance_exam_scorecard', label: 'Entrance Exam Scorecard', color: 'purple' },
                          { key: 'document_work_exp_certificate', label: 'Work Experience Certificate', color: 'teal' },
                        ];

                        const documents = selectedApplication._appType === 'other'
                          ? otherCoursesDocuments
                          : mbbsDocuments;

                        return documents;
                      })().map(doc => (
                        <div
                          key={doc.key}
                          className={`p-4 rounded-lg border-2 ${
                            selectedApplication[doc.key]
                              ? 'bg-green-50 border-green-300'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className={`font-semibold ${selectedApplication[doc.key] ? 'text-green-900' : 'text-gray-700'}`}>
                                {doc.label}
                              </p>
                              <p className={`text-xs mt-1 font-medium ${selectedApplication[doc.key] ? 'text-green-700' : 'text-gray-500'}`}>
                                {selectedApplication[doc.key] ? '✓ Uploaded' : '⊗ Not Uploaded'}
                              </p>
                            </div>
                            {selectedApplication[doc.key] ? (
                              <CheckCircle2 size={24} className="text-green-600" />
                            ) : (
                              <XCircle size={24} className="text-gray-400" />
                            )}
                          </div>

                          {/* Upload Button */}
                          <div className="mt-3">
                            <label
                              htmlFor={`upload-${doc.key}-${selectedApplication.id}`}
                              className={`block w-full text-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                selectedApplication[doc.key]
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                              }`}
                            >
                              {selectedApplication[doc.key] ? 'Replace Document' : 'Upload Document'}
                            </label>
                            <input
                              id={`upload-${doc.key}-${selectedApplication.id}`}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  try {
                                    // Create FormData
                                    const formData = new FormData();
                                    formData.append('document', file);
                                    formData.append('documentType', doc.key);

                                    // Determine the correct endpoint based on application type
                                    const endpoint = selectedApplication._appType === 'other'
                                      ? `${API_URL}/other-courses-applications/${selectedApplication.id}/upload-document`
                                      : `${API_URL}/student-applications/${selectedApplication.id}/upload-document`;

                                    // Upload file
                                    const response = await fetch(endpoint, {
                                      method: 'PATCH',
                                      body: formData
                                    });

                                    const data = await response.json();

                                    if (data.success) {
                                      alert(`✓ ${doc.label} uploaded successfully!`);

                                      // Update the selectedApplication state immediately
                                      setSelectedApplication(prev => ({
                                        ...prev,
                                        [doc.key]: data.filePath
                                      }));

                                      // Also refresh the applications list
                                      fetchApplications();
                                    } else {
                                      alert(`Failed to upload: ${data.message}`);
                                    }
                                  } catch (error) {
                                    console.error('Upload error:', error);
                                    alert('Error uploading document. Please try again.');
                                  }
                                }
                              }}
                            />
                          </div>

                          {/* View/Download Button (if document exists) */}
                          {selectedApplication[doc.key] && (
                            <button
                              onClick={() => {
                                // Open document in new tab
                                const documentPath = selectedApplication[doc.key];
                                const documentUrl = `${API_URL.replace('/api', '')}/${documentPath}`;
                                window.open(documentUrl, '_blank');
                              }}
                              className="mt-2 w-full px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-50 transition-all"
                            >
                              View Document
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-900 font-medium mb-2">
                        <strong>Admin Document Upload Guide:</strong>
                      </p>
                      <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                        <li>Upload documents on behalf of students who chose not to upload initially</li>
                        <li>Accepted formats: PDF, JPG, JPEG, PNG (Max size: 10MB per file)</li>
                        <li>Documents can be replaced anytime by uploading a new file</li>
                        <li>Click "View Document" to open uploaded files in a new tab</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {editModalOpen && editFormData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-2 border-white/30">
                    <Edit2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Edit Application</h2>
                    <p className="text-purple-100 text-sm">Update student application details</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditFormData(null);
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Personal Details */}
              <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                <h3 className="text-md font-bold text-purple-900 mb-3">👤 Personal Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{editFormData._appType === 'other' ? 'First + Middle Name' : 'First Name'}</label>
                    <input type="text" value={editFormData._appType === 'other' ? (editFormData.first_middle_name || '') : (editFormData.first_name || '')} onChange={(e) => setEditFormData({...editFormData, [editFormData._appType === 'other' ? 'first_middle_name' : 'first_name']: e.target.value})} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                    <input type="text" value={editFormData.last_name || ''} onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
                    <input type="date" value={editFormData.date_of_birth || ''} onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                    <select value={editFormData.gender || ''} onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nationality</label>
                    <input type="text" value={editFormData.nationality || ''} onChange={(e) => setEditFormData({ ...editFormData, nationality: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Aadhar Number</label>
                    <input type="text" value={editFormData.aadhar || ''} onChange={(e) => setEditFormData({ ...editFormData, aadhar: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Passport Number</label>
                    <input type="text" value={editFormData.passport_number || ''} onChange={(e) => setEditFormData({ ...editFormData, passport_number: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                <h3 className="text-md font-bold text-blue-900 mb-3">📞 Contact Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile</label>
                    <input type="text" value={editFormData.mobile || ''} onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp</label>
                    <input type="text" value={editFormData.whatsapp || ''} onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" value={editFormData.email || ''} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Family Details */}
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                <h3 className="text-md font-bold text-green-900 mb-3">👨‍👩‍👦 Family Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Father Name</label>
                    <input type="text" value={editFormData.father_name || ''} onChange={(e) => setEditFormData({ ...editFormData, father_name: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Father Mobile</label>
                    <input type="text" value={editFormData.father_mobile || ''} onChange={(e) => setEditFormData({ ...editFormData, father_mobile: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mother Name</label>
                    <input type="text" value={editFormData.mother_name || ''} onChange={(e) => setEditFormData({ ...editFormData, mother_name: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mother Mobile</label>
                    <input type="text" value={editFormData.mother_mobile || ''} onChange={(e) => setEditFormData({ ...editFormData, mother_mobile: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
                <h3 className="text-md font-bold text-yellow-900 mb-3">📍 Address</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                    <textarea value={editFormData.address || ''} onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} rows="2" className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-yellow-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                    <input type="text" value={editFormData.city || ''} onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-yellow-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                    <input type="text" value={editFormData.pincode || ''} onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-yellow-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                    <input type="text" value={editFormData.state || ''} onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-yellow-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
                    <input type="text" value={editFormData.country || ''} onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-yellow-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* 10th Standard */}
              <div className="bg-pink-50 p-4 rounded-xl border-2 border-pink-200">
                <h3 className="text-md font-bold text-pink-900 mb-3">📚 10th Standard</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">School Name</label>
                    <input type="text" value={editFormData.school_10_name || ''} onChange={(e) => setEditFormData({ ...editFormData, school_10_name: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Board</label>
                    <input type="text" value={editFormData.board_10 || ''} onChange={(e) => setEditFormData({ ...editFormData, board_10: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Percentage</label>
                    <input type="text" value={editFormData.percentage_10 || ''} onChange={(e) => setEditFormData({ ...editFormData, percentage_10: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Year</label>
                    <input type="text" value={editFormData.year_10 || ''} onChange={(e) => setEditFormData({ ...editFormData, year_10: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* 12th Standard */}
              <div className="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-200">
                <h3 className="text-md font-bold text-indigo-900 mb-3">📚 12th Standard</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">School Name</label>
                    <input type="text" value={editFormData.school_12_name || ''} onChange={(e) => setEditFormData({ ...editFormData, school_12_name: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Board</label>
                    <input type="text" value={editFormData.board_12 || ''} onChange={(e) => setEditFormData({ ...editFormData, board_12: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Percentage</label>
                    <input type="text" value={editFormData.percentage_12 || ''} onChange={(e) => setEditFormData({ ...editFormData, percentage_12: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Year</label>
                    <input type="text" value={editFormData.year_12 || ''} onChange={(e) => setEditFormData({ ...editFormData, year_12: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* UG Details - Only for Other Courses */}
              {editFormData._appType === 'other' && (
                <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                  <h3 className="text-md font-bold text-purple-900 mb-3">🎓 UG Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">UG Status</label>
                      <select value={editFormData.ug_status || ''} onChange={(e) => setEditFormData({ ...editFormData, ug_status: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none">
                        <option value="">Select</option>
                        <option value="Completed">Completed</option>
                        <option value="Pursuing">Pursuing</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">UG Degree</label>
                      <input type="text" value={editFormData.ug_degree || ''} onChange={(e) => setEditFormData({ ...editFormData, ug_degree: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">UG College</label>
                      <input type="text" value={editFormData.ug_college || ''} onChange={(e) => setEditFormData({ ...editFormData, ug_college: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">UG Percentage</label>
                      <input type="text" value={editFormData.ug_percentage || ''} onChange={(e) => setEditFormData({ ...editFormData, ug_percentage: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">UG Year</label>
                      <input type="text" value={editFormData.ug_year || ''} onChange={(e) => setEditFormData({ ...editFormData, ug_year: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* PG Details - Only for Other Courses */}
              {editFormData._appType === 'other' && (
                <div className="bg-pink-50 p-4 rounded-xl border-2 border-pink-200">
                  <h3 className="text-md font-bold text-pink-900 mb-3">🎓 PG Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">PG Status</label>
                      <select value={editFormData.pg_status || ''} onChange={(e) => setEditFormData({ ...editFormData, pg_status: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 outline-none">
                        <option value="">Select</option>
                        <option value="Completed">Completed</option>
                        <option value="Pursuing">Pursuing</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">PG Degree</label>
                      <input type="text" value={editFormData.pg_degree || ''} onChange={(e) => setEditFormData({ ...editFormData, pg_degree: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">PG College</label>
                      <input type="text" value={editFormData.pg_college || ''} onChange={(e) => setEditFormData({ ...editFormData, pg_college: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">PG Percentage</label>
                      <input type="text" value={editFormData.pg_percentage || ''} onChange={(e) => setEditFormData({ ...editFormData, pg_percentage: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">PG Year</label>
                      <input type="text" value={editFormData.pg_year || ''} onChange={(e) => setEditFormData({ ...editFormData, pg_year: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences */}
              <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
                <h3 className="text-md font-bold text-orange-900 mb-3">🎯 Preferences</h3>
                <div className="grid grid-cols-2 gap-3">
                  {editFormData._appType === 'other' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Course</label>
                        <input type="text" value={editFormData.course || ''} onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Degree Name</label>
                        <input type="text" value={editFormData.degree_name || ''} onChange={(e) => setEditFormData({ ...editFormData, degree_name: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Branch/Stream</label>
                        <input type="text" value={editFormData.branch_stream || ''} onChange={(e) => setEditFormData({ ...editFormData, branch_stream: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Countries</label>
                        <input type="text" value={editFormData.preferred_countries || ''} onChange={(e) => setEditFormData({ ...editFormData, preferred_countries: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Max Budget</label>
                        <input type="text" value={editFormData.max_budget || ''} onChange={(e) => setEditFormData({ ...editFormData, max_budget: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Work Experience</label>
                        <select value={editFormData.work_experience || ''} onChange={(e) => setEditFormData({ ...editFormData, work_experience: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none">
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      {editFormData.work_experience === 'Yes' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Work Duration</label>
                          <input type="text" value={editFormData.work_duration || ''} onChange={(e) => setEditFormData({ ...editFormData, work_duration: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none" placeholder="e.g., 2 years" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Country</label>
                        <input type="text" value={editFormData.preferred_country || ''} onChange={(e) => setEditFormData({ ...editFormData, preferred_country: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred University</label>
                        <input type="text" value={editFormData.preferred_university || ''} onChange={(e) => setEditFormData({ ...editFormData, preferred_university: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none" />
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditFormData(null);
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateApplication}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Student Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-2 border-white/30">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Add New Student</h2>
                    <p className="text-purple-100 text-sm">Create a new student application</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAddModalOpen(false);
                    setNewStudent({
                      firstName: '',
                      lastName: '',
                      email: '',
                      mobile: '',
                      whatsapp: '',
                      dateOfBirth: '',
                      gender: '',
                      course: 'MBBS',
                      preferredCountry: '',
                      preferredUniversity: '',
                      status: 'Pending'
                    });
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddStudent} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Personal Details */}
              <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                <h3 className="text-md font-bold text-purple-900 mb-3">👤 Personal Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={newStudent.firstName}
                      onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newStudent.lastName}
                      onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={newStudent.dateOfBirth}
                      onChange={(e) => setNewStudent({...newStudent, dateOfBirth: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                    <select
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent({...newStudent, gender: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                <h3 className="text-md font-bold text-blue-900 mb-3">📞 Contact Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={newStudent.mobile}
                      onChange={(e) => setNewStudent({...newStudent, mobile: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      value={newStudent.whatsapp}
                      onChange={(e) => setNewStudent({...newStudent, whatsapp: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                <h3 className="text-md font-bold text-green-900 mb-3">🎓 Course Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Course *</label>
                    <select
                      value={newStudent.course}
                      onChange={(e) => setNewStudent({...newStudent, course: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none"
                    >
                      <option value="MBBS">MBBS</option>
                      <option value="Other">Other Courses</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                    <select
                      value={newStudent.status}
                      onChange={(e) => setNewStudent({...newStudent, status: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Country</label>
                    <input
                      type="text"
                      value={newStudent.preferredCountry}
                      onChange={(e) => setNewStudent({...newStudent, preferredCountry: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none"
                      placeholder="e.g. Russia, Georgia"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred University</label>
                    <input
                      type="text"
                      value={newStudent.preferredUniversity}
                      onChange={(e) => setNewStudent({...newStudent, preferredUniversity: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none"
                      placeholder="University name"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setAddModalOpen(false);
                    setNewStudent({
                      firstName: '',
                      lastName: '',
                      email: '',
                      mobile: '',
                      whatsapp: '',
                      dateOfBirth: '',
                      gender: '',
                      course: 'MBBS',
                      preferredCountry: '',
                      preferredUniversity: '',
                      status: 'Pending'
                    });
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentApplications;
