import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, ArrowRight, Check, User, GraduationCap, FileText } from 'lucide-react';
import API_URL from '../config/api';

const ApplyMBBS = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Phase 1: Personal Details
  const [formData, setFormData] = useState({
    // Personal Details
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    mobile: '',
    whatsapp: '',
    email: '',
    gender: '',
    nationality: '',
    aadhar: '',

    // Family Details
    fatherTitle: 'Mr.',
    fatherName: '',
    fatherMobile: '',
    fatherOccupation: '',
    motherTitle: 'Mrs.',
    motherName: '',
    motherMobile: '',
    motherOccupation: '',

    // Address
    address: '',
    city: '',
    pincode: '',
    state: '',
    country: '',

    // Phase 2: Academic Details
    school10Name: '',
    board10: '',
    percentage10: '',
    year10: '',
    school12Name: '',
    board12: '',
    percentage12: '',
    year12: '',

    // NEET Scores (array for multiple scores)
    neetScores: [{ year: '', score: '' }],

    // Other Exam
    otherExamName: '',
    otherExamDetails: '',

    // Phase 3: Documents & Preferences
    preferredCountry: '',
    preferredUniversity: '',
    uploadDocuments: '',
    documents: {
      marksheet10: null,
      marksheet12: null,
      neetScorecard: null,
      aadharFront: null,
      aadharBack: null,
      photograph: null
    },
    agreeToTerms: false,

    // Course details
    course: 'MBBS',
    source: 'MBBS Application Form'
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addNEETScore = () => {
    setFormData(prev => ({
      ...prev,
      neetScores: [...prev.neetScores, { year: '', score: '' }]
    }));
  };

  const removeNEETScore = (index) => {
    if (formData.neetScores.length > 1) {
      setFormData(prev => ({
        ...prev,
        neetScores: prev.neetScores.filter((_, i) => i !== index)
      }));
    }
  };

  const handleNEETScoreChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      neetScores: prev.neetScores.map((score, i) =>
        i === index ? { ...score, [field]: value } : score
      )
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Required';
    if (!formData.mobile.trim()) newErrors.mobile = 'Required';
    else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = 'Must be 10 digits';
    if (formData.whatsapp && !/^\d{10}$/.test(formData.whatsapp)) newErrors.whatsapp = 'Must be 10 digits';
    if (!formData.email.trim()) newErrors.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.gender) newErrors.gender = 'Required';
    if (!formData.nationality) newErrors.nationality = 'Required';
    if (!formData.aadhar.trim()) newErrors.aadhar = 'Required';

    if (!formData.fatherName.trim()) newErrors.fatherName = 'Required';
    if (!formData.fatherMobile.trim()) newErrors.fatherMobile = 'Required';
    else if (!/^\d{10}$/.test(formData.fatherMobile)) newErrors.fatherMobile = 'Must be 10 digits';
    if (!formData.fatherOccupation) newErrors.fatherOccupation = 'Required';

    if (!formData.motherName.trim()) newErrors.motherName = 'Required';
    if (formData.motherMobile && !/^\d{10}$/.test(formData.motherMobile)) newErrors.motherMobile = 'Must be 10 digits';
    if (!formData.motherOccupation) newErrors.motherOccupation = 'Required';

    if (!formData.address.trim()) newErrors.address = 'Required';
    if (!formData.city.trim()) newErrors.city = 'Required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Required';
    if (!formData.state.trim()) newErrors.state = 'Required';
    if (!formData.country.trim()) newErrors.country = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.school10Name.trim()) newErrors.school10Name = 'Required';
    if (!formData.board10.trim()) newErrors.board10 = 'Required';
    if (!formData.percentage10.trim()) newErrors.percentage10 = 'Required';
    if (!formData.year10.trim()) newErrors.year10 = 'Required';

    if (!formData.school12Name.trim()) newErrors.school12Name = 'Required';
    if (!formData.board12.trim()) newErrors.board12 = 'Required';
    if (!formData.percentage12.trim()) newErrors.percentage12 = 'Required';
    if (!formData.year12.trim()) newErrors.year12 = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (!formData.preferredCountry.trim()) newErrors.preferredCountry = 'Required';
    if (!formData.preferredUniversity.trim()) newErrors.preferredUniversity = 'Required';
    if (!formData.uploadDocuments) newErrors.uploadDocuments = 'Required';
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
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

  const handleNext = () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep !== 3) {
      handleNext();
      return;
    }

    // Validate step 3 before submitting
    if (!validateStep3()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare FormData for file upload
      const submitData = new FormData();

      // Personal Details
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('dateOfBirth', formData.dateOfBirth);
      submitData.append('mobile', formData.mobile);
      submitData.append('whatsapp', formData.whatsapp);
      submitData.append('email', formData.email);
      submitData.append('gender', formData.gender);
      submitData.append('nationality', formData.nationality);
      submitData.append('aadhar', formData.aadhar);

      // Family Details
      submitData.append('fatherTitle', formData.fatherTitle);
      submitData.append('fatherName', formData.fatherName);
      submitData.append('fatherMobile', formData.fatherMobile);
      submitData.append('fatherOccupation', formData.fatherOccupation);
      submitData.append('motherTitle', formData.motherTitle);
      submitData.append('motherName', formData.motherName);
      submitData.append('motherMobile', formData.motherMobile);
      submitData.append('motherOccupation', formData.motherOccupation);

      // Address
      submitData.append('address', formData.address);
      submitData.append('city', formData.city);
      submitData.append('pincode', formData.pincode);
      submitData.append('state', formData.state);
      submitData.append('country', formData.country);

      // Academic Details - 10th
      submitData.append('school10Name', formData.school10Name);
      submitData.append('board10', formData.board10);
      submitData.append('percentage10', formData.percentage10);
      submitData.append('year10', formData.year10);

      // Academic Details - 12th
      submitData.append('school12Name', formData.school12Name);
      submitData.append('board12', formData.board12);
      submitData.append('percentage12', formData.percentage12);
      submitData.append('year12', formData.year12);

      // NEET Scores
      submitData.append('neetScores', JSON.stringify(formData.neetScores.filter(s => s.year || s.score)));

      // Other Exam
      submitData.append('otherExamName', formData.otherExamName);
      submitData.append('otherExamDetails', formData.otherExamDetails);

      // Preferences
      submitData.append('preferredCountry', formData.preferredCountry);
      submitData.append('preferredUniversity', formData.preferredUniversity);
      submitData.append('uploadDocuments', formData.uploadDocuments);

      // Append document files
      if (formData.documents.marksheet10) {
        submitData.append('marksheet10', formData.documents.marksheet10);
      }
      if (formData.documents.marksheet12) {
        submitData.append('marksheet12', formData.documents.marksheet12);
      }
      if (formData.documents.neetScorecard) {
        submitData.append('neetScorecard', formData.documents.neetScorecard);
      }
      if (formData.documents.aadharFront) {
        submitData.append('aadharFront', formData.documents.aadharFront);
      }
      if (formData.documents.aadharBack) {
        submitData.append('aadharBack', formData.documents.aadharBack);
      }
      if (formData.documents.photograph) {
        submitData.append('photograph', formData.documents.photograph);
      }

      // Course Metadata
      submitData.append('course', formData.course);
      submitData.append('source', formData.source);

      const response = await fetch(`${API_URL}/student-applications`, {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        alert('Submission failed: ' + (data.message || 'Please try again'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Details', icon: User },
    { number: 2, title: 'Academic Details', icon: GraduationCap },
    { number: 3, title: 'Documents Upload', icon: FileText }
  ];

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-green-500 to-green-600 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={48} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your MBBS application has been successfully submitted. Our team will contact you soon.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl">
              <Sparkles className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-white">Pulse Education</h1>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">MBBS Application Form</h2>
          <p className="text-white/80">Complete all steps to submit your application</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCompleted ? 'bg-green-500' : isActive ? 'bg-white' : 'bg-white/30'
                    }`}>
                      {isCompleted ? (
                        <Check className={`text-white`} size={24} />
                      ) : (
                        <Icon className={`${isActive ? 'text-purple-600' : 'text-white'}`} size={24} />
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-white/70'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 rounded ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-white/30'
                    }`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Personal Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First + Middle Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.firstName ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter first and middle name"
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.dateOfBirth ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.mobile ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="10 Digits"
                      maxLength="10"
                    />
                    {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      WhatsApp No.
                    </label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.whatsapp ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="10 Digits"
                      maxLength="10"
                    />
                    {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.email ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="you@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.gender ? 'border-red-500' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Select Gender</option>
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.nationality ? 'border-red-500' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Select Nationality</option>
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.aadhar ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter Aadhar number"
                      maxLength="12"
                    />
                    {errors.aadhar && <p className="text-red-500 text-xs mt-1">{errors.aadhar}</p>}
                  </div>
                </div>

                {/* Family Details */}
                <h4 className="text-xl font-bold text-gray-900 mt-8 mb-4">Family Details</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Father's Title
                    </label>
                    <select
                      name="fatherTitle"
                      value={formData.fatherTitle}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Father's Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.fatherName ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter father's name"
                    />
                    {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Father's Mobile No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="fatherMobile"
                      value={formData.fatherMobile}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.fatherMobile ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="10 Digits"
                      maxLength="10"
                    />
                    {errors.fatherMobile && <p className="text-red-500 text-xs mt-1">{errors.fatherMobile}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Father's Occupation <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="fatherOccupation"
                      value={formData.fatherOccupation}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.fatherOccupation ? 'border-red-500' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Select Occupation</option>
                      <option value="Government Service">Government Service</option>
                      <option value="Private Service">Private Service</option>
                      <option value="Business">Business</option>
                      <option value="Farmer">Farmer</option>
                      <option value="Retired">Retired</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.fatherOccupation && <p className="text-red-500 text-xs mt-1">{errors.fatherOccupation}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mother's Title
                    </label>
                    <select
                      name="motherTitle"
                      value={formData.motherTitle}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    >
                      <option value="Mrs.">Mrs.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mother's Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.motherName ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter mother's name"
                    />
                    {errors.motherName && <p className="text-red-500 text-xs mt-1">{errors.motherName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mother's Mobile No.
                    </label>
                    <input
                      type="tel"
                      name="motherMobile"
                      value={formData.motherMobile}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.motherMobile ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="10 Digits (Optional)"
                      maxLength="10"
                    />
                    {errors.motherMobile && <p className="text-red-500 text-xs mt-1">{errors.motherMobile}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mother's Occupation <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="motherOccupation"
                      value={formData.motherOccupation}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.motherOccupation ? 'border-red-500' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Select Occupation</option>
                      <option value="Government Service">Government Service</option>
                      <option value="Private Service">Private Service</option>
                      <option value="Business">Business</option>
                      <option value="Homemaker">Homemaker</option>
                      <option value="Retired">Retired</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.motherOccupation && <p className="text-red-500 text-xs mt-1">{errors.motherOccupation}</p>}
                  </div>
                </div>

                {/* Address Details */}
                <h4 className="text-xl font-bold text-gray-900 mt-8 mb-4">Address Details</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address (as per passport) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="3"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.address ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter full address"
                    ></textarea>
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.city ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter city"
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pin Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.pincode ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter pin code"
                      maxLength="6"
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.country ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter country"
                    />
                    {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Academic Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Academic Details</h3>

                {/* 10th Details */}
                <h4 className="text-xl font-bold text-gray-900 mb-4">10th Standard</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      School Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="school10Name"
                      value={formData.school10Name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.school10Name ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter school name"
                    />
                    {errors.school10Name && <p className="text-red-500 text-xs mt-1">{errors.school10Name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Board <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="board10"
                      value={formData.board10}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.board10 ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="e.g., CBSE, ICSE, State Board"
                    />
                    {errors.board10 && <p className="text-red-500 text-xs mt-1">{errors.board10}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Percentage <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="percentage10"
                      value={formData.percentage10}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.percentage10 ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="e.g., 85.5"
                    />
                    {errors.percentage10 && <p className="text-red-500 text-xs mt-1">{errors.percentage10}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Year of Passing <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="year10"
                      value={formData.year10}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.year10 ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="e.g., 2020"
                      maxLength="4"
                    />
                    {errors.year10 && <p className="text-red-500 text-xs mt-1">{errors.year10}</p>}
                  </div>
                </div>

                {/* 12th Details */}
                <h4 className="text-xl font-bold text-gray-900 mt-8 mb-4">12th Standard</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      School Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="school12Name"
                      value={formData.school12Name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.school12Name ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter school name"
                    />
                    {errors.school12Name && <p className="text-red-500 text-xs mt-1">{errors.school12Name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Board <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="board12"
                      value={formData.board12}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.board12 ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="e.g., CBSE, ICSE, State Board"
                    />
                    {errors.board12 && <p className="text-red-500 text-xs mt-1">{errors.board12}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Percentage <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="percentage12"
                      value={formData.percentage12}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.percentage12 ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="e.g., 85.5"
                    />
                    {errors.percentage12 && <p className="text-red-500 text-xs mt-1">{errors.percentage12}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Year of Passing <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="year12"
                      value={formData.year12}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.year12 ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="e.g., 2022"
                      maxLength="4"
                    />
                    {errors.year12 && <p className="text-red-500 text-xs mt-1">{errors.year12}</p>}
                  </div>
                </div>

                {/* NEET Exam Details */}
                <h4 className="text-xl font-bold text-gray-900 mt-8 mb-4">NEET Exam & Score</h4>
                {formData.neetScores.map((neetScore, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Exam Year
                        </label>
                        <select
                          value={neetScore.year}
                          onChange={(e) => handleNEETScoreChange(index, 'year', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        >
                          <option value="">Select Year</option>
                          {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          NEET Score
                        </label>
                        <input
                          type="text"
                          value={neetScore.score}
                          onChange={(e) => handleNEETScoreChange(index, 'score', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                          placeholder="Enter NEET score"
                        />
                      </div>
                    </div>

                    {formData.neetScores.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNEETScore(index)}
                        className="mt-3 text-red-600 hover:text-red-700 font-semibold text-sm"
                      >
                        Remove Score
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addNEETScore}
                  className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
                >
                  + Add Previous Score
                </button>

                {/* Other Exam */}
                <h4 className="text-xl font-bold text-gray-900 mt-8 mb-4">Other Exam (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Exam Name
                    </label>
                    <input
                      type="text"
                      name="otherExamName"
                      value={formData.otherExamName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      placeholder="e.g., JEE, SAT, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Exam Details
                    </label>
                    <input
                      type="text"
                      name="otherExamDetails"
                      value={formData.otherExamDetails}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      placeholder="Score, year, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Documents & Preferences */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Preferences & Documents</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preferred Country for MBBS <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="preferredCountry"
                      value={formData.preferredCountry}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.preferredCountry ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter Country Name"
                    />
                    {errors.preferredCountry && <p className="text-red-500 text-xs mt-1">{errors.preferredCountry}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preferred University <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="preferredUniversity"
                      value={formData.preferredUniversity}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.preferredUniversity ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter University Name"
                    />
                    {errors.preferredUniversity && <p className="text-red-500 text-xs mt-1">{errors.preferredUniversity}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Do you want to upload your documents? <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="uploadDocuments"
                      value={formData.uploadDocuments}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                        errors.uploadDocuments ? 'border-red-500' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Select Option</option>
                      <option value="Yes">Yes, I want to upload now</option>
                      <option value="No">No, I will upload later</option>
                    </select>
                    {errors.uploadDocuments && <p className="text-red-500 text-xs mt-1">{errors.uploadDocuments}</p>}
                  </div>
                </div>

                {/* Document Upload Section */}
                {formData.uploadDocuments === 'Yes' && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 space-y-4">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="text-green-600" size={24} />
                      Upload Your Documents
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          10th Mark Sheet
                        </label>
                        <input
                          type="file"
                          onChange={(e) => handleFileChange(e, 'marksheet10')}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                        {formData.documents.marksheet10 && (
                          <p className="text-xs text-green-600 mt-1">✓ {formData.documents.marksheet10.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          12th Mark Sheet
                        </label>
                        <input
                          type="file"
                          onChange={(e) => handleFileChange(e, 'marksheet12')}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                        {formData.documents.marksheet12 && (
                          <p className="text-xs text-green-600 mt-1">✓ {formData.documents.marksheet12.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          NEET Score Card
                        </label>
                        <input
                          type="file"
                          onChange={(e) => handleFileChange(e, 'neetScorecard')}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                        {formData.documents.neetScorecard && (
                          <p className="text-xs text-green-600 mt-1">✓ {formData.documents.neetScorecard.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Aadhar Card Front
                        </label>
                        <input
                          type="file"
                          onChange={(e) => handleFileChange(e, 'aadharFront')}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                        {formData.documents.aadharFront && (
                          <p className="text-xs text-green-600 mt-1">✓ {formData.documents.aadharFront.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Aadhar Card Back
                        </label>
                        <input
                          type="file"
                          onChange={(e) => handleFileChange(e, 'aadharBack')}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                        {formData.documents.aadharBack && (
                          <p className="text-xs text-green-600 mt-1">✓ {formData.documents.aadharBack.name}</p>
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
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload JPG/ JPEG/ PNG/ PDF</p>
                        {formData.documents.photograph && (
                          <p className="text-xs text-green-600 mt-1">✓ {formData.documents.photograph.name}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mt-4">
                      <strong>Note:</strong> Accepted formats: PDF, JPG, JPEG, PNG (Maximum upload size: 10MB per file)
                    </p>
                  </div>
                )}

                {formData.uploadDocuments === 'No' && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <FileText className="text-blue-600 mt-1" size={24} />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Document Upload Information</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          You can upload your documents later. Our team will contact you for the following documents:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          <li>10th Mark Sheet</li>
                          <li>12th Mark Sheet</li>
                          <li>NEET Score Card</li>
                          <li>Aadhar Card Front</li>
                          <li>Aadhar Card Back</li>
                          <li>Passport Size Photo</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms and Conditions */}
                <div className="border-t-2 border-gray-200 pt-6">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleCheckboxChange}
                      className="w-5 h-5 mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="text-gray-700">
                        I agree to the{' '}
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert('Terms & Conditions:\n\n1. All information provided must be accurate and truthful.\n2. Any false information may lead to application rejection.\n3. Document verification will be conducted.\n4. Processing fees are non-refundable.\n5. Pulse Education reserves the right to accept or reject any application.\n\nFor complete terms, please contact our team.');
                          }}
                          className="text-purple-600 hover:text-purple-700 font-semibold underline"
                        >
                          terms and conditions
                        </a>
                        <span className="text-red-500"> *</span>
                      </span>
                      {errors.agreeToTerms && (
                        <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms}</p>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeft size={20} />
                Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Next
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Submit Application
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-white hover:text-white/80 font-semibold text-sm inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApplyMBBS;
