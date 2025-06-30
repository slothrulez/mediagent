import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Phone, Mail, MapPin, Heart, AlertTriangle, Pill, Save, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { database } from '../lib/database';

interface PatientData {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email: string;
    address: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  medicalInfo: {
    bloodType: string;
    allergies: string[];
    medications: string[];
    medicalHistory: string[];
    insuranceProvider: string;
    insuranceNumber: string;
  };
}

export function PatientForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [patientData, setPatientData] = useState<PatientData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
    },
    medicalInfo: {
      bloodType: '',
      allergies: [],
      medications: [],
      medicalHistory: [],
      insuranceProvider: '',
      insuranceNumber: '',
    },
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newCondition, setNewCondition] = useState('');

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

  const updatePersonalInfo = (field: string, value: string) => {
    setPatientData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const updateMedicalInfo = (field: string, value: string) => {
    setPatientData(prev => ({
      ...prev,
      medicalInfo: { ...prev.medicalInfo, [field]: value }
    }));
  };

  const addToArray = (field: 'allergies' | 'medications' | 'medicalHistory', value: string) => {
    if (value.trim()) {
      setPatientData(prev => ({
        ...prev,
        medicalInfo: {
          ...prev.medicalInfo,
          [field]: [...prev.medicalInfo[field], value.trim()]
        }
      }));
    }
  };

  const removeFromArray = (field: 'allergies' | 'medications' | 'medicalHistory', index: number) => {
    setPatientData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        [field]: prev.medicalInfo[field].filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await database.createPatient({
        firstName: patientData.personalInfo.firstName,
        lastName: patientData.personalInfo.lastName,
        dateOfBirth: patientData.personalInfo.dateOfBirth,
        gender: patientData.personalInfo.gender,
        phone: patientData.personalInfo.phone,
        email: patientData.personalInfo.email,
        address: patientData.personalInfo.address,
        emergencyContact: patientData.personalInfo.emergencyContact,
        emergencyPhone: patientData.personalInfo.emergencyPhone,
        bloodType: patientData.medicalInfo.bloodType,
        allergies: patientData.medicalInfo.allergies,
        medications: patientData.medicalInfo.medications,
        medicalHistory: patientData.medicalInfo.medicalHistory,
        insuranceProvider: patientData.medicalInfo.insuranceProvider,
        insuranceNumber: patientData.medicalInfo.insuranceNumber,
      });
      
      alert('Patient record created successfully!');
      navigate('/patients');
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Error creating patient record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { id: 1, title: 'Personal Information', icon: User },
    { id: 2, title: 'Medical Information', icon: Heart },
    { id: 3, title: 'Review & Save', icon: Save },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/patients"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patients</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Patient Registration</h1>
        <p className="text-gray-600">Add a new patient to the system with comprehensive medical information.</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-3 ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="hidden sm:block">
                    <p className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={patientData.personalInfo.firstName}
                  onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={patientData.personalInfo.lastName}
                  onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={patientData.personalInfo.dateOfBirth}
                  onChange={(e) => updatePersonalInfo('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  value={patientData.personalInfo.gender}
                  onChange={(e) => updatePersonalInfo('gender', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">Select Gender</option>
                  {genders.map((gender) => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={patientData.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={patientData.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={patientData.personalInfo.address}
                  onChange={(e) => updatePersonalInfo('address', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                <input
                  type="text"
                  value={patientData.personalInfo.emergencyContact}
                  onChange={(e) => updatePersonalInfo('emergencyContact', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={patientData.personalInfo.emergencyPhone}
                  onChange={(e) => updatePersonalInfo('emergencyPhone', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Medical Information */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Basic Medical Info */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <Heart className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900">Medical Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                  <select
                    value={patientData.medicalInfo.bloodType}
                    onChange={(e) => updateMedicalInfo('bloodType', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select Blood Type</option>
                    {bloodTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Provider</label>
                  <input
                    type="text"
                    value={patientData.medicalInfo.insuranceProvider}
                    onChange={(e) => updateMedicalInfo('insuranceProvider', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Number</label>
                  <input
                    type="text"
                    value={patientData.medicalInfo.insuranceNumber}
                    onChange={(e) => updateMedicalInfo('insuranceNumber', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Allergies</h3>
              </div>

              <div className="flex space-x-3 mb-4">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add allergy..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    addToArray('allergies', newAllergy);
                    setNewAllergy('');
                  }}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition-all"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {patientData.medicalInfo.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm"
                  >
                    <span>{allergy}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('allergies', index)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Medications */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <Pill className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Current Medications</h3>
              </div>

              <div className="flex space-x-3 mb-4">
                <input
                  type="text"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  placeholder="Add medication..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    addToArray('medications', newMedication);
                    setNewMedication('');
                  }}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {patientData.medicalInfo.medications.map((medication, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm"
                  >
                    <span>{medication}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('medications', index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Medical History */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <Heart className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Medical History</h3>
              </div>

              <div className="flex space-x-3 mb-4">
                <input
                  type="text"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="Add medical condition..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    addToArray('medicalHistory', newCondition);
                    setNewCondition('');
                  }}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {patientData.medicalInfo.medicalHistory.map((condition, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm"
                  >
                    <span>{condition}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('medicalHistory', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Save className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Review & Save</h2>
            </div>

            <div className="space-y-6">
              {/* Personal Info Summary */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="ml-2 text-gray-900">
                      {patientData.personalInfo.firstName} {patientData.personalInfo.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Date of Birth:</span>
                    <span className="ml-2 text-gray-900">{patientData.personalInfo.dateOfBirth}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Gender:</span>
                    <span className="ml-2 text-gray-900">{patientData.personalInfo.gender}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Phone:</span>
                    <span className="ml-2 text-gray-900">{patientData.personalInfo.phone}</span>
                  </div>
                </div>
              </div>

              {/* Medical Info Summary */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Blood Type:</span>
                    <span className="ml-2 text-gray-900">{patientData.medicalInfo.bloodType || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Allergies:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {patientData.medicalInfo.allergies.length > 0 ? (
                        patientData.medicalInfo.allergies.map((allergy, index) => (
                          <span key={index} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                            {allergy}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">None specified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Medications:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {patientData.medicalInfo.medications.length > 0 ? (
                        patientData.medicalInfo.medications.map((medication, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {medication}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">None specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all"
            >
              Next
            </button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Patient Record</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </form>
    </motion.div>
  );
}