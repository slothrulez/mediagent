import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Calendar,
  Phone,
  Mail,
  Heart,
  AlertTriangle,
  Pill,
  FileText,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { database, Patient } from '../lib/database';

export function PatientRecords() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'Male' | 'Female' | 'Other'>('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = () => {
    const allPatients = database.getPatients();
    setPatients(allPatients);
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm);
    
    const matchesFilter = filterGender === 'all' || patient.gender === filterGender;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (patient: Patient) => {
    const lastVisit = new Date(patient.updatedAt);
    const daysSinceVisit = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceVisit <= 7) return 'bg-green-100 text-green-800 border-green-200';
    if (daysSinceVisit <= 30) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (patient: Patient) => {
    const lastVisit = new Date(patient.updatedAt);
    const daysSinceVisit = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceVisit <= 7) return 'Recent';
    if (daysSinceVisit <= 30) return 'Active';
    return 'Inactive';
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const deletePatient = async (patientId: string) => {
    if (confirm('Are you sure you want to delete this patient record?')) {
      try {
        await database.deletePatient(patientId);
        loadPatients();
        setSelectedPatient(null);
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Error deleting patient. Please try again.');
      }
    }
  };

  const stats = {
    total: patients.length,
    recent: patients.filter(p => {
      const daysSinceVisit = Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceVisit <= 7;
    }).length,
    active: patients.filter(p => {
      const daysSinceVisit = Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceVisit <= 30;
    }).length,
    newThisMonth: patients.filter(p => {
      const createdDate = new Date(p.createdAt);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    }).length
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Records</h1>
            <p className="text-gray-600">Manage and view all patient information in one place.</p>
          </div>
          <Link
            to="/patient-form"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl font-semibold transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Patient</span>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patients by name, email, or phone..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value as any)}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Patients', value: stats.total, color: 'blue' },
          { label: 'Recent Visits', value: stats.recent, color: 'green' },
          { label: 'Active Patients', value: stats.active, color: 'purple' },
          { label: 'New This Month', value: stats.newThisMonth, color: 'orange' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.label}</h3>
            <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Patient</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Medical Info</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Last Visit</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPatients.map((patient, index) => (
                <motion.tr
                  key={patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-medium">
                        {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A'} years • {patient.gender}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{patient.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{patient.email}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium">{patient.bloodType || 'N/A'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {patient.allergies.slice(0, 2).map((allergy, i) => (
                          <span key={i} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                            {allergy}
                          </span>
                        ))}
                        {patient.allergies.length > 2 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            +{patient.allergies.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(patient.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(patient)}`}>
                      {getStatusLabel(patient)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                        title="Edit Patient"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deletePatient(patient.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Patient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No patients found</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchTerm ? 'Try adjusting your search terms' : 'Add your first patient to get started'}
            </p>
            {!searchTerm && (
              <Link
                to="/patient-form"
                className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Patient</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                    {selectedPatient.firstName.charAt(0)}{selectedPatient.lastName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h2>
                    <p className="text-gray-600">
                      {selectedPatient.dateOfBirth ? calculateAge(selectedPatient.dateOfBirth) : 'N/A'} years old • {selectedPatient.gender}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{selectedPatient.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{selectedPatient.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">
                        Born {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {selectedPatient.address && (
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 text-gray-400 mt-0.5">📍</div>
                        <span className="text-gray-900">{selectedPatient.address}</span>
                      </div>
                    )}
                  </div>

                  {selectedPatient.emergencyContact && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
                      <div className="space-y-2">
                        <p className="text-gray-700">{selectedPatient.emergencyContact}</p>
                        {selectedPatient.emergencyPhone && (
                          <p className="text-gray-700">{selectedPatient.emergencyPhone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Medical Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span className="font-medium text-gray-900">Blood Type: {selectedPatient.bloodType || 'Not specified'}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <span className="font-medium text-gray-900">Allergies</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.allergies.length > 0 ? (
                          selectedPatient.allergies.map((allergy, index) => (
                            <span key={index} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm">
                              {allergy}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No known allergies</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Pill className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-gray-900">Current Medications</span>
                      </div>
                      <div className="space-y-1">
                        {selectedPatient.medications.length > 0 ? (
                          selectedPatient.medications.map((medication, index) => (
                            <div key={index} className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-sm">
                              {medication}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No current medications</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-5 h-5 text-purple-500" />
                        <span className="font-medium text-gray-900">Medical History</span>
                      </div>
                      <div className="space-y-1">
                        {selectedPatient.medicalHistory.length > 0 ? (
                          selectedPatient.medicalHistory.map((condition, index) => (
                            <div key={index} className="bg-purple-50 text-purple-800 px-3 py-2 rounded-lg text-sm">
                              {condition}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No recorded medical history</span>
                        )}
                      </div>
                    </div>

                    {selectedPatient.insuranceProvider && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Insurance Information</h4>
                        <div className="space-y-1">
                          <p className="text-gray-700">Provider: {selectedPatient.insuranceProvider}</p>
                          {selectedPatient.insuranceNumber && (
                            <p className="text-gray-700">Number: {selectedPatient.insuranceNumber}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}