import { useState } from 'react';
import { GraduationCap, ArrowLeft, ArrowRight, Check, Upload, Plus, Trash2 } from 'lucide-react';
import API_URL from '../config/api';

const ApplyOtherCourses = () => {

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Phase 1 - Personal & Family Details
    firstMiddleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    aadhar: '',
    passportStatus: '',
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    fileNumber: '',
    fatherTitle: 'Mr.',
    fatherName: '',
    fatherOccupation: '',
    motherTitle: 'Mrs.',
    motherName: '',
    motherOccupation: '',

    // Phase 2 - Academic Details
    school10Name: '',
    board10: '',
    percentage10: '',
    year10: '',
    school11Name: '',
    board11: '',
    percentage11: '',
    year11: '',
    school12Status: '',
    school12Name: '',
    board12: '',
    percentage12: '',
    year12: '',

    // UG Details
    ugStatus: '',
    ugDegree: '',
    ugCollege: '',
    ugPercentage: '',
    ugYear: '',

    // PG Details
    pgStatus: '',
    pgDegree: '',
    pgCollege: '',
    pgPercentage: '',
    pgYear: '',

    // Other Course
    anyOtherCourse: 'No',
    otherCourseName: '',
    otherCourseCollege: '',
    otherCoursePercentage: '',
    otherCourseYear: '',

    // Gap Year
    gapBetweenEducation: 'No',
    totalGapYears: '',
    gapReason: '',

    // English Exam
    englishExam: 'No',
    englishExamYear: '',
    englishExamType: '',

    // Entrance Exams (Dynamic Array)
    entranceExam: 'No',
    entranceExams: [{ examName: '', score: '' }],

    // Phase 3 - Course Preferences
    degreeName: '',
    branchStream: '',
    preferredCountries: '',
    maxBudget: '',

    // Work Experience
    workExperience: 'No',
    workDuration: '',

    // Visa History
    visaAppliedPrior: 'No',
    visaCountryName: '',
    visaHowManyTimes: '',

    previousVisaRefusal: 'No',
    refusalReason: '',
    refusalCountryName: '',

    comments: '',

    // Phase 4 - Contact & Address
    mobile: '',
    whatsapp: '',
    email: '',
    fatherMobile: '',
    motherMobile: '',
    address: '',
    city: '',
    pincode: '',
    state: '',
    country: '',

    // Phase 5 - Documents
    uploadDocuments: 'No, Already share on WhatsApp or Email',
    documents: {
      marksheet10: null,
      marksheet12: null,
      ugDegree: null,
      pgDegree: null,
      aadharCard: null,
      passportFront: null,
      passportBack: null,
      photograph: null,
      englishExamCert: null,
      entranceExamScorecard: null,
      workExpCertificate: null
    },
    agreeTerms: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e, documentType) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [documentType]: file
        }
      }));
    }
  };

  // Handle entrance exam array changes
  const handleEntranceExamChange = (index, field, value) => {
    const newExams = [...formData.entranceExams];
    newExams[index][field] = value;
    setFormData(prev => ({ ...prev, entranceExams: newExams }));
  };

  const addEntranceExam = () => {
    setFormData(prev => ({
      ...prev,
      entranceExams: [...prev.entranceExams, { examName: '', score: '' }]
    }));
  };

  const removeEntranceExam = (index) => {
    if (formData.entranceExams.length > 1) {
      const newExams = formData.entranceExams.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, entranceExams: newExams }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstMiddleName.trim()) newErrors.firstMiddleName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.nationality) newErrors.nationality = 'Nationality is required';
      if (!formData.aadhar.trim()) newErrors.aadhar = 'Aadhar number is required';
      if (formData.aadhar && !/^\d{12}$/.test(formData.aadhar)) {
        newErrors.aadhar = 'Aadhar must be 12 digits';
      }
      if (!formData.passportStatus) newErrors.passportStatus = 'Passport status is required';
      if (!formData.fatherName.trim()) newErrors.fatherName = 'Father name is required';
      if (!formData.fatherOccupation) newErrors.fatherOccupation = 'Father occupation is required';
      if (!formData.motherName.trim()) newErrors.motherName = 'Mother name is required';
    }

    if (step === 2) {
      if (!formData.school10Name.trim()) newErrors.school10Name = '10th school name is required';
      if (!formData.board10.trim()) newErrors.board10 = '10th board is required';
      if (!formData.percentage10) newErrors.percentage10 = '10th percentage is required';
      if (!formData.year10) newErrors.year10 = 'Year of passing is required';
      if (!formData.school12Status) newErrors.school12Status = '12th status is required';
      if (!formData.ugStatus) newErrors.ugStatus = 'UG status is required';
      if (!formData.pgStatus) newErrors.pgStatus = 'PG status is required';
    }

    if (step === 4) {
      if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
      if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
        newErrors.mobile = 'Must be 10 digits';
      }
      if (formData.whatsapp && !/^\d{10}$/.test(formData.whatsapp)) {
        newErrors.whatsapp = 'Must be 10 digits';
      }
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.fatherMobile.trim()) newErrors.fatherMobile = 'Father mobile is required';
      if (formData.fatherMobile && !/^\d{10}$/.test(formData.fatherMobile)) {
        newErrors.fatherMobile = 'Must be 10 digits';
      }
      if (formData.motherMobile && !/^\d{10}$/.test(formData.motherMobile)) {
        newErrors.motherMobile = 'Must be 10 digits';
      }
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.pincode.trim()) newErrors.pincode = 'Pin code is required';
      if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
        newErrors.pincode = 'Must be 6 digits';
      }
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.country.trim()) newErrors.country = 'Country is required';
    }

    if (step === 5) {
      if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(5)) return;
    setIsSubmitting(true);

    try {
      // Prepare FormData for file upload
      const submitData = new FormData();

      // Phase 1 - Personal & Family Details
      submitData.append('firstMiddleName', formData.firstMiddleName);
      submitData.append('lastName', formData.lastName);
      submitData.append('dateOfBirth', formData.dateOfBirth);
      submitData.append('gender', formData.gender);
      submitData.append('nationality', formData.nationality);
      submitData.append('aadhar', formData.aadhar);
      submitData.append('passportStatus', formData.passportStatus);
      submitData.append('passportNumber', formData.passportNumber);
      submitData.append('passportIssueDate', formData.passportIssueDate);
      submitData.append('passportExpiryDate', formData.passportExpiryDate);
      submitData.append('fileNumber', formData.fileNumber);
      submitData.append('fatherTitle', formData.fatherTitle);
      submitData.append('fatherName', formData.fatherName);
      submitData.append('fatherOccupation', formData.fatherOccupation);
      submitData.append('motherTitle', formData.motherTitle);
      submitData.append('motherName', formData.motherName);
      submitData.append('motherOccupation', formData.motherOccupation);

      // Phase 2 - Academic Details
      submitData.append('school10Name', formData.school10Name);
      submitData.append('board10', formData.board10);
      submitData.append('percentage10', formData.percentage10);
      submitData.append('year10', formData.year10);
      submitData.append('school11Name', formData.school11Name);
      submitData.append('board11', formData.board11);
      submitData.append('percentage11', formData.percentage11);
      submitData.append('year11', formData.year11);
      submitData.append('school12Status', formData.school12Status);
      submitData.append('school12Name', formData.school12Name);
      submitData.append('board12', formData.board12);
      submitData.append('percentage12', formData.percentage12);
      submitData.append('year12', formData.year12);

      // UG Details
      submitData.append('ugStatus', formData.ugStatus);
      submitData.append('ugDegree', formData.ugDegree);
      submitData.append('ugCollege', formData.ugCollege);
      submitData.append('ugPercentage', formData.ugPercentage);
      submitData.append('ugYear', formData.ugYear);

      // PG Details
      submitData.append('pgStatus', formData.pgStatus);
      submitData.append('pgDegree', formData.pgDegree);
      submitData.append('pgCollege', formData.pgCollege);
      submitData.append('pgPercentage', formData.pgPercentage);
      submitData.append('pgYear', formData.pgYear);

      // Other Course
      submitData.append('anyOtherCourse', formData.anyOtherCourse);
      submitData.append('otherCourseName', formData.otherCourseName);
      submitData.append('otherCourseCollege', formData.otherCourseCollege);
      submitData.append('otherCoursePercentage', formData.otherCoursePercentage);
      submitData.append('otherCourseYear', formData.otherCourseYear);

      // Gap Year
      submitData.append('gapBetweenEducation', formData.gapBetweenEducation);
      submitData.append('totalGapYears', formData.totalGapYears);
      submitData.append('gapReason', formData.gapReason);

      // English Exam
      submitData.append('englishExam', formData.englishExam);
      submitData.append('englishExamYear', formData.englishExamYear);
      submitData.append('englishExamType', formData.englishExamType);

      // Entrance Exams
      submitData.append('entranceExam', formData.entranceExam);
      submitData.append('entranceExams', JSON.stringify(formData.entranceExams));

      // Phase 3 - Course Preferences
      submitData.append('degreeName', formData.degreeName);
      submitData.append('branchStream', formData.branchStream);
      submitData.append('preferredCountries', formData.preferredCountries);
      submitData.append('maxBudget', formData.maxBudget);

      // Work Experience
      submitData.append('workExperience', formData.workExperience);
      submitData.append('workDuration', formData.workDuration);

      // Visa History
      submitData.append('visaAppliedPrior', formData.visaAppliedPrior);
      submitData.append('visaCountryName', formData.visaCountryName);
      submitData.append('visaHowManyTimes', formData.visaHowManyTimes);
      submitData.append('previousVisaRefusal', formData.previousVisaRefusal);
      submitData.append('refusalReason', formData.refusalReason);
      submitData.append('refusalCountryName', formData.refusalCountryName);
      submitData.append('comments', formData.comments);

      // Phase 4 - Contact & Address
      submitData.append('mobile', formData.mobile);
      submitData.append('whatsapp', formData.whatsapp);
      submitData.append('email', formData.email);
      submitData.append('fatherMobile', formData.fatherMobile);
      submitData.append('motherMobile', formData.motherMobile);
      submitData.append('address', formData.address);
      submitData.append('city', formData.city);
      submitData.append('pincode', formData.pincode);
      submitData.append('state', formData.state);
      submitData.append('country', formData.country);

      // Phase 5 - Documents
      submitData.append('uploadDocuments', formData.uploadDocuments);

      // Append document files
      if (formData.documents.marksheet10) {
        submitData.append('marksheet10', formData.documents.marksheet10);
      }
      if (formData.documents.marksheet12) {
        submitData.append('marksheet12', formData.documents.marksheet12);
      }
      if (formData.documents.ugDegree) {
        submitData.append('ugDegree', formData.documents.ugDegree);
      }
      if (formData.documents.pgDegree) {
        submitData.append('pgDegree', formData.documents.pgDegree);
      }
      if (formData.documents.aadharCard) {
        submitData.append('aadharCard', formData.documents.aadharCard);
      }
      if (formData.documents.passportFront) {
        submitData.append('passportFront', formData.documents.passportFront);
      }
      if (formData.documents.passportBack) {
        submitData.append('passportBack', formData.documents.passportBack);
      }
      if (formData.documents.photograph) {
        submitData.append('photograph', formData.documents.photograph);
      }
      if (formData.documents.englishExamCert) {
        submitData.append('englishExamCert', formData.documents.englishExamCert);
      }
      if (formData.documents.entranceExamScorecard) {
        submitData.append('entranceExamScorecard', formData.documents.entranceExamScorecard);
      }
      if (formData.documents.workExpCertificate) {
        submitData.append('workExpCertificate', formData.documents.workExpCertificate);
      }

      // Metadata
      submitData.append('course', 'Other Courses');
      submitData.append('source', 'Other Courses Application Form');

      const response = await fetch(`${API_URL}/other-courses-applications`, {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();
      if (data.success) {
        alert('Application submitted successfully! Our team will contact you soon.');
        window.location.reload();
      } else {
        alert(data.message || 'Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred while submitting the application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step < currentStep
                ? 'bg-green-500 text-white'
                : step === currentStep
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {step < currentStep ? <Check size={20} /> : step}
          </div>
          {step < 5 && (
            <div className={`w-12 h-1 mx-2 ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderPhase1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-purple-900 mb-4">Personal & Family Details</h3>

      {/* Personal Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            First + Middle Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstMiddleName"
            value={formData.firstMiddleName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none ${
              errors.firstMiddleName ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder="Enter first and middle name"
          />
          {errors.firstMiddleName && <p className="text-red-500 text-xs mt-1">{errors.firstMiddleName}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none ${
              errors.lastName ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder="Enter last name"
          />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none ${
              errors.dateOfBirth ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none ${
              errors.gender ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nationality <span className="text-red-500">*</span>
          </label>
          <select
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none ${
              errors.nationality ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <option value="">Select</option>
            <option value="Indian">Indian</option>
            <option value="Other">Other</option>
          </select>
          {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Aadhar Card Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="aadhar"
            value={formData.aadhar}
            onChange={handleChange}
            maxLength="12"
            className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none ${
              errors.aadhar ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder="12 digit Aadhar number"
          />
          {errors.aadhar && <p className="text-red-500 text-xs mt-1">{errors.aadhar}</p>}
        </div>
      </div>

      {/* Passport Information */}
      <div className="border-t-2 border-gray-200 pt-6 mt-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Passport Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Passport <span className="text-red-500">*</span>
            </label>
            <select
              name="passportStatus"
              value={formData.passportStatus}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none ${
                errors.passportStatus ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Select Option</option>
              <option value="Have Passport">Have Passport</option>
              <option value="Applied for Passport">Applied for Passport</option>
              <option value="Don't Have Passport">Don't Have Passport</option>
            </select>
            {errors.passportStatus && <p className="text-red-500 text-xs mt-1">{errors.passportStatus}</p>}
          </div>

          {formData.passportStatus === 'Have Passport' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Passport Number
                </label>
                <input
                  type="text"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="Enter passport number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  File Number
                </label>
                <input
                  type="text"
                  name="fileNumber"
                  value={formData.fileNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="Enter file number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Passport Issue Date
                </label>
                <input
                  type="date"
                  name="passportIssueDate"
                  value={formData.passportIssueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Passport Expiry Date
                </label>
                <input
                  type="date"
                  name="passportExpiryDate"
                  value={formData.passportExpiryDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Father Details */}
      <div className="border-t-2 border-gray-200 pt-6 mt-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Father's Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <select
              name="fatherTitle"
              value={formData.fatherTitle}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
            >
              <option value="Mr.">Mr.</option>
              <option value="Dr.">Dr.</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Father Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none ${
                errors.fatherName ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter father's name"
            />
            {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>}
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Father Occupation <span className="text-red-500">*</span>
            </label>
            <select
              name="fatherOccupation"
              value={formData.fatherOccupation}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none ${
                errors.fatherOccupation ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Select</option>
              <option value="Business">Business</option>
              <option value="Service">Service</option>
              <option value="Farmer">Farmer</option>
              <option value="Retired">Retired</option>
              <option value="Other">Other</option>
            </select>
            {errors.fatherOccupation && <p className="text-red-500 text-xs mt-1">{errors.fatherOccupation}</p>}
          </div>
        </div>
      </div>

      {/* Mother Details */}
      <div className="border-t-2 border-gray-200 pt-6 mt-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Mother's Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <select
              name="motherTitle"
              value={formData.motherTitle}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
            >
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mother Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="motherName"
              value={formData.motherName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none ${
                errors.motherName ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter mother's name"
            />
            {errors.motherName && <p className="text-red-500 text-xs mt-1">{errors.motherName}</p>}
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mother Occupation
            </label>
            <select
              name="motherOccupation"
              value={formData.motherOccupation}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
            >
              <option value="">Select</option>
              <option value="Housewife">Housewife</option>
              <option value="Business">Business</option>
              <option value="Service">Service</option>
              <option value="Retired">Retired</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPhase2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-purple-900 mb-4">Academic Details</h3>

      {/* 10th Class */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
        <h4 className="text-lg font-bold text-gray-800 mb-4">10th Class Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              10th School Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="school10Name"
              value={formData.school10Name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                errors.school10Name ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter school name"
            />
            {errors.school10Name && <p className="text-red-500 text-xs mt-1">{errors.school10Name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              10th Board <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="board10"
              value={formData.board10}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                errors.board10 ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="e.g., CBSE, State Board"
            />
            {errors.board10 && <p className="text-red-500 text-xs mt-1">{errors.board10}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              10th Percentage <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="percentage10"
              value={formData.percentage10}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="100"
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                errors.percentage10 ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="e.g., 85.5"
            />
            {errors.percentage10 && <p className="text-red-500 text-xs mt-1">{errors.percentage10}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Year of Passing 10th <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="year10"
              value={formData.year10}
              onChange={handleChange}
              min="1950"
              max="2030"
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                errors.year10 ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="e.g., 2020"
            />
            {errors.year10 && <p className="text-red-500 text-xs mt-1">{errors.year10}</p>}
          </div>
        </div>
      </div>

      {/* 11th Class (Optional) */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl">
        <h4 className="text-lg font-bold text-gray-800 mb-4">11th Class Details (Optional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">11th School Name</label>
            <input
              type="text"
              name="school11Name"
              value={formData.school11Name}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
              placeholder="Enter school name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">11th Board</label>
            <input
              type="text"
              name="board11"
              value={formData.board11}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
              placeholder="e.g., CBSE"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">11th Percentage</label>
            <input
              type="number"
              name="percentage11"
              value={formData.percentage11}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="100"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
              placeholder="e.g., 85.5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Passing 11th</label>
            <input
              type="number"
              name="year11"
              value={formData.year11}
              onChange={handleChange}
              min="1950"
              max="2030"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
              placeholder="e.g., 2021"
            />
          </div>
        </div>
      </div>

      {/* 12th Class */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
        <h4 className="text-lg font-bold text-gray-800 mb-4">12th Class Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              12th Status <span className="text-red-500">*</span>
            </label>
            <select
              name="school12Status"
              value={formData.school12Status}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                errors.school12Status ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Select Status</option>
              <option value="Pursuing">Pursuing</option>
              <option value="Completed">Completed</option>
              <option value="Not Applicable">Not Applicable</option>
            </select>
            {errors.school12Status && <p className="text-red-500 text-xs mt-1">{errors.school12Status}</p>}
          </div>

          {(formData.school12Status === 'Pursuing' || formData.school12Status === 'Completed') && (
            <>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">12th School Name</label>
                <input
                  type="text"
                  name="school12Name"
                  value={formData.school12Name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="Enter school name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">12th Board</label>
                <input
                  type="text"
                  name="board12"
                  value={formData.board12}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="e.g., CBSE"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">12th Percentage</label>
                <input
                  type="number"
                  name="percentage12"
                  value={formData.percentage12}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="e.g., 85.5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Passing 12th</label>
                <input
                  type="number"
                  name="year12"
                  value={formData.year12}
                  onChange={handleChange}
                  min="1950"
                  max="2030"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="e.g., 2022"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* UG Details */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl">
        <h4 className="text-lg font-bold text-gray-800 mb-4">College UG (Undergraduate) Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              College UG Status <span className="text-red-500">*</span>
            </label>
            <select
              name="ugStatus"
              value={formData.ugStatus}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                errors.ugStatus ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Select Option</option>
              <option value="Completed">Completed</option>
              <option value="Pursuing">Pursuing</option>
              <option value="Not Started">Not Started</option>
            </select>
            {errors.ugStatus && <p className="text-red-500 text-xs mt-1">{errors.ugStatus}</p>}
          </div>

          {(formData.ugStatus === 'Completed' || formData.ugStatus === 'Pursuing') && (
            <>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Degree/Course Name(UG)</label>
                <input
                  type="text"
                  name="ugDegree"
                  value={formData.ugDegree}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="e.g., B.Tech, BA, B.Com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">College / University</label>
                <input
                  type="text"
                  name="ugCollege"
                  value={formData.ugCollege}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="Enter college/university name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">UG Percentage</label>
                <input
                  type="number"
                  name="ugPercentage"
                  value={formData.ugPercentage}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="e.g., 75.5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Passing (UG)</label>
                <input
                  type="number"
                  name="ugYear"
                  value={formData.ugYear}
                  onChange={handleChange}
                  min="1950"
                  max="2030"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="e.g., 2024"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* PG Details */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl">
        <h4 className="text-lg font-bold text-gray-800 mb-4">College PG (Postgraduate) Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              College PG Status <span className="text-red-500">*</span>
            </label>
            <select
              name="pgStatus"
              value={formData.pgStatus}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                errors.pgStatus ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Select Option</option>
              <option value="Completed">Completed</option>
              <option value="Pursuing">Pursuing</option>
              <option value="Not Started">Not Started</option>
            </select>
            {errors.pgStatus && <p className="text-red-500 text-xs mt-1">{errors.pgStatus}</p>}
          </div>

          {(formData.pgStatus === 'Completed' || formData.pgStatus === 'Pursuing') && (
            <>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Degree/Course Name (PG)</label>
                <input
                  type="text"
                  name="pgDegree"
                  value={formData.pgDegree}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="e.g., M.Tech, MA, MBA"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">College / University</label>
                <input
                  type="text"
                  name="pgCollege"
                  value={formData.pgCollege}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="Enter college/university name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">PG Exam Percentage</label>
                <input
                  type="number"
                  name="pgPercentage"
                  value={formData.pgPercentage}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="e.g., 75.5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Passing (PG)</label>
                <input
                  type="number"
                  name="pgYear"
                  value={formData.pgYear}
                  onChange={handleChange}
                  min="1950"
                  max="2030"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="e.g., 2026"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Any Other Course */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Any Other Course <span className="text-red-500">*</span>
            </label>
            <select
              name="anyOtherCourse"
              value={formData.anyOtherCourse}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          {formData.anyOtherCourse === 'Yes' && (
            <>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Other Course Name</label>
                <input
                  type="text"
                  name="otherCourseName"
                  value={formData.otherCourseName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="Enter course name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">College / University</label>
                <input
                  type="text"
                  name="otherCourseCollege"
                  value={formData.otherCourseCollege}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="Enter college/university name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Percentage</label>
                <input
                  type="number"
                  name="otherCoursePercentage"
                  value={formData.otherCoursePercentage}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="e.g., 75.5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Passing</label>
                <input
                  type="number"
                  name="otherCourseYear"
                  value={formData.otherCourseYear}
                  onChange={handleChange}
                  min="1950"
                  max="2030"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="e.g., 2023"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gap Between Education */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Gap Between Education</label>
            <select
              name="gapBetweenEducation"
              value={formData.gapBetweenEducation}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          {formData.gapBetweenEducation === 'Yes' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Gap Year</label>
                <input
                  type="text"
                  name="totalGapYears"
                  value={formData.totalGapYears}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="e.g., 1 Year, 2 Years"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Gap</label>
                <input
                  type="text"
                  name="gapReason"
                  value={formData.gapReason}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="Enter reason"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* English Language Exam */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-700">Have you given English language exam</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="englishExam"
                value="Yes"
                checked={formData.englishExam === 'Yes'}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="englishExam"
                value="No"
                checked={formData.englishExam === 'No'}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
        </div>

        {formData.englishExam === 'Yes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Year</label>
              <input
                type="number"
                name="englishExamYear"
                value={formData.englishExamYear}
                onChange={handleChange}
                min="2000"
                max="2030"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                placeholder="e.g., 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Exam</label>
              <select
                name="englishExamType"
                value={formData.englishExamType}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
              >
                <option value="">Select Exam</option>
                <option value="IELTS">IELTS</option>
                <option value="TOEFL">TOEFL</option>
                <option value="PTE">PTE</option>
                <option value="Duolingo">Duolingo</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Entrance Exam */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-700">Have You given if any Entrance Exam</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="entranceExam"
                value="Yes"
                checked={formData.entranceExam === 'Yes'}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="entranceExam"
                value="No"
                checked={formData.entranceExam === 'No'}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
        </div>

        {formData.entranceExam === 'Yes' && (
          <div className="bg-green-50 p-4 rounded-xl space-y-4">
            {formData.entranceExams.map((exam, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border-2 border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Exam</label>
                    <select
                      value={exam.examName}
                      onChange={(e) => handleEntranceExamChange(index, 'examName', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
                    >
                      <option value="">Select Exam</option>
                      <option value="NEET">NEET</option>
                      <option value="JEE">JEE</option>
                      <option value="CAT">CAT</option>
                      <option value="GMAT">GMAT</option>
                      <option value="GRE">GRE</option>
                      <option value="SAT">SAT</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Score</label>
                    <input
                      type="text"
                      value={exam.score}
                      onChange={(e) => handleEntranceExamChange(index, 'score', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
                      placeholder="Enter score"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2">
                    {index === formData.entranceExams.length - 1 && (
                      <button
                        type="button"
                        onClick={addEntranceExam}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-semibold"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    )}
                    {formData.entranceExams.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEntranceExam(index)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-semibold"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPhase3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-purple-900 mb-4">Course Preferences & Additional Information</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Degree Name (Want to Pursue)
          </label>
          <input
            type="text"
            name="degreeName"
            value={formData.degreeName}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
            placeholder="Degree name you want to pursue"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Branch / Stream (Write 2 Preferences)
          </label>
          <input
            type="text"
            name="branchStream"
            value={formData.branchStream}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
            placeholder="Eg. Marketing, Finance, HR, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Country (Write 3 Preferences)
          </label>
          <input
            type="text"
            name="preferredCountries"
            value={formData.preferredCountries}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
            placeholder="Eg. Italy, UK, USA ... etc."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Max. Budget Per Year
          </label>
          <input
            type="text"
            name="maxBudget"
            value={formData.maxBudget}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
            placeholder="Eg. 10 Lacs"
          />
        </div>

        {/* Work Experience */}
        <div className="bg-purple-50 p-6 rounded-xl">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Work Experience</label>
            <select
              name="workExperience"
              value={formData.workExperience}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          {formData.workExperience === 'Yes' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total Duration</label>
              <input
                type="text"
                name="workDuration"
                value={formData.workDuration}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                placeholder="Eg. 2 Years"
              />
            </div>
          )}
        </div>

        {/* Visa Applied Prior */}
        <div className="bg-blue-50 p-6 rounded-xl">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Have You Applied For Any Visa Prior
            </label>
            <select
              name="visaAppliedPrior"
              value={formData.visaAppliedPrior}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          {formData.visaAppliedPrior === 'Yes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name of Country</label>
                <input
                  type="text"
                  name="visaCountryName"
                  value={formData.visaCountryName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="Eg. USA, China, UK"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">How Many Times</label>
                <input
                  type="text"
                  name="visaHowManyTimes"
                  value={formData.visaHowManyTimes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="Eg. 2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Previous Visa Refusal */}
        <div className="bg-red-50 p-6 rounded-xl">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Any Previous Visa Refusal
            </label>
            <select
              name="previousVisaRefusal"
              value={formData.previousVisaRefusal}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          {formData.previousVisaRefusal === 'Yes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                <input
                  type="text"
                  name="refusalReason"
                  value={formData.refusalReason}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="Enter reason"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country Name</label>
                <input
                  type="text"
                  name="refusalCountryName"
                  value={formData.refusalCountryName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                  placeholder="Enter country name"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Comments</label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none resize-none"
            placeholder="Any details you want to share which will help us to guide you better."
          />
        </div>
      </div>
    </div>
  );

  const renderPhase4 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-purple-900 mb-4">Contact & Address Details</h3>

      {/* Contact Information */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Contact Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mobile No. <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              maxLength="10"
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                errors.mobile ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="10 Digits"
            />
            {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Whatsapp No.
            </label>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              maxLength="10"
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                errors.whatsapp ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="10 Digits"
            />
            {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email ID <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                errors.email ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="your.email@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Father Mobile No. <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="fatherMobile"
              value={formData.fatherMobile}
              onChange={handleChange}
              maxLength="10"
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                errors.fatherMobile ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="10 Digit"
            />
            {errors.fatherMobile && <p className="text-red-500 text-xs mt-1">{errors.fatherMobile}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mother Mobile No.
            </label>
            <input
              type="tel"
              name="motherMobile"
              value={formData.motherMobile}
              onChange={handleChange}
              maxLength="10"
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                errors.motherMobile ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="10 Digit"
            />
            {errors.motherMobile && <p className="text-red-500 text-xs mt-1">{errors.motherMobile}</p>}
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Address Information</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address (as per passport) <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none resize-none bg-white ${
                errors.address ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter full address"
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                  errors.city ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter city"
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pin code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                maxLength="6"
                className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                  errors.pincode ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="6 Digit"
              />
              {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                  errors.state ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter state"
              />
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white ${
                  errors.country ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter country"
              />
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPhase5 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-purple-900 mb-4">Document Upload & Submission</h3>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Do you want to upload your documents
          </label>
          <select
            name="uploadDocuments"
            value={formData.uploadDocuments}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-white"
          >
            <option value="No, Already share on WhatsApp or Email">No, Already share on WhatsApp or Email</option>
            <option value="Yes, I want to upload now">Yes, I want to upload now</option>
          </select>
        </div>

        {formData.uploadDocuments === 'Yes, I want to upload now' && (
          <div className="bg-white p-6 rounded-xl border-2 border-purple-200">
            <h4 className="text-md font-bold text-gray-800 mb-4">Upload Your Documents</h4>
            <p className="text-sm text-gray-600 mb-4">
              Please upload the following documents (PDF, JPG, PNG format, max 5MB each):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  10th Marksheet
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'marksheet10')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                {formData.documents.marksheet10 && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.documents.marksheet10.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  12th Marksheet
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'marksheet12')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                {formData.documents.marksheet12 && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.documents.marksheet12.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  UG Degree/Marksheet
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'ugDegree')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                {formData.documents.ugDegree && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.documents.ugDegree.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PG Degree/Marksheet
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'pgDegree')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                {formData.documents.pgDegree && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.documents.pgDegree.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Aadhar Card
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'aadharCard')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                {formData.documents.aadharCard && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.documents.aadharCard.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Passport (Front)
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'passportFront')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                {formData.documents.passportFront && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.documents.passportFront.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Passport (Back)
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'passportBack')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                {formData.documents.passportBack && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.documents.passportBack.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Passport Size Photo
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'photograph')}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                {formData.documents.photograph && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.documents.photograph.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  English Exam Certificate
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'englishExamCert')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                {formData.documents.englishExamCert && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.documents.englishExamCert.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Entrance Exam Scorecard
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'entranceExamScorecard')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                {formData.documents.entranceExamScorecard && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.documents.entranceExamScorecard.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Work Experience Certificate
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'workExpCertificate')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                {formData.documents.workExpCertificate && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.documents.workExpCertificate.name}</p>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-4">
              <strong>Note:</strong> Accepted formats: PDF, JPG, JPEG, PNG (Maximum upload size: 10MB per file)
            </p>
          </div>
        )}

        <div className="border-t-2 border-gray-200 pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className={`w-5 h-5 mt-0.5 text-purple-600 rounded ${
                errors.agreeTerms ? 'border-red-500' : ''
              }`}
            />
            <div>
              <span className="text-sm font-semibold text-gray-700">
                I agree to the terms and conditions <span className="text-red-500">*</span>
              </span>
              <a
                href="#"
                className="block text-xs text-purple-600 hover:text-purple-700 underline mt-1"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Terms & Conditions will be displayed here');
                }}
              >
                Click to view our terms & conditions
              </a>
            </div>
          </label>
          {errors.agreeTerms && <p className="text-red-500 text-xs mt-1 ml-8">{errors.agreeTerms}</p>}
        </div>
      </div>

      <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
        <h4 className="text-lg font-bold text-green-900 mb-2">Ready to Submit?</h4>
        <p className="text-sm text-green-700">
          Please review all your information before submitting. Once submitted, our team will contact you within 24-48 hours.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap size={40} />
            <h1 className="text-4xl font-bold">Other Courses Application</h1>
          </div>
          <p className="text-purple-100 text-lg">
            Apply for International Education Programs - Step {currentStep} of 5
          </p>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderStepIndicator()}

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderPhase1()}
            {currentStep === 2 && renderPhase2()}
            {currentStep === 3 && renderPhase3()}
            {currentStep === 4 && renderPhase4()}
            {currentStep === 5 && renderPhase5()}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentStep === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <ArrowLeft size={20} />
                Previous
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  Next
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  <Check size={20} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyOtherCourses;
