import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  Search,
  Eye,
  Share,
  Printer,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Brain,
  Trash2
} from 'lucide-react';
import { database, MedicalReport } from '../lib/database';
import { AIService } from '../lib/ai-service';

export function ReportsPage() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'draft' | 'reviewed'>('all');
  const [filterLanguage, setFilterLanguage] = useState<'all' | 'en' | 'ml' | 'hi' | 'ta' | 'te'>('all');
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const allReports = database.getReports();
    setReports(allReports);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.consultationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.transcription.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || report.status === filterType;
    const matchesLanguage = filterLanguage === 'all' || report.language === filterLanguage;
    
    return matchesSearch && matchesType && matchesLanguage;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const downloadReport = (report: MedicalReport) => {
    const reportContent = AIService.generatePDFReport({
      consultationId: report.consultationId,
      transcription: {
        text: report.transcription,
        language: report.language,
        confidence: report.confidence,
        duration: 0
      },
      extractedData: report.extractedData,
      treatmentSuggestions: report.treatmentSuggestions,
      overallConfidence: report.confidence
    });
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediagent-report-${report.consultationId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteReport = async (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        // Note: We'll need to add a delete method to the database service
        const updatedReports = reports.filter(r => r.id !== reportId);
        setReports(updatedReports);
        setSelectedReport(null);
        // In a real implementation, you'd call database.deleteReport(reportId)
      } catch (error) {
        console.error('Error deleting report:', error);
        alert('Error deleting report. Please try again.');
      }
    }
  };

  const stats = {
    totalReports: reports.length,
    completedToday: reports.filter(r => {
      const today = new Date().toDateString();
      return r.status === 'completed' && new Date(r.createdAt).toDateString() === today;
    }).length,
    averageConfidence: reports.length > 0 
      ? Math.round(reports.reduce((sum, r) => sum + r.confidence, 0) / reports.length * 100)
      : 0,
    processingTime: '2.3s'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Reports</h1>
        <p className="text-gray-600">View and manage AI-generated medical reports and analysis.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { 
            label: 'Total Reports', 
            value: stats.totalReports, 
            icon: FileText, 
            color: 'blue' 
          },
          { 
            label: 'Completed Today', 
            value: stats.completedToday, 
            icon: TrendingUp, 
            color: 'green' 
          },
          { 
            label: 'Avg. Confidence', 
            value: `${stats.averageConfidence}%`, 
            icon: BarChart3, 
            color: 'purple' 
          },
          { 
            label: 'Avg. Processing', 
            value: stats.processingTime, 
            icon: Clock, 
            color: 'orange' 
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 bg-${stat.color}-100 rounded-xl`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
              </div>
              <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient name, consultation ID, or content..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="reviewed">Reviewed</option>
            </select>
            
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value as any)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="all">All Languages</option>
              <option value="en">English</option>
              <option value="ml">Malayalam</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Patient</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Consultation ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Language</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Confidence</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReports.map((report, index) => (
                <motion.tr
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {report.patientName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{report.patientName}</p>
                        <p className="text-sm text-gray-600">Patient ID: {report.patientId || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm text-gray-900">{report.consultationId}</p>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleTimeString()}
                    </p>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800">
                      {report.language.toUpperCase()}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(report.status)}`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${report.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(report.confidence * 100)}%
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadReport(report)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Download Report"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Report"
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

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No reports found</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchTerm ? 'Try adjusting your search terms' : 'Reports will appear here after processing consultations'}
            </p>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">🧠 Medical Report</h2>
                  <p className="text-gray-600">
                    {selectedReport.patientName} • {new Date(selectedReport.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => downloadReport(selectedReport)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                    title="Download Report"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                    title="Print Report"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-8">
                {/* Report Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <h4 className="font-medium text-blue-900 mb-1">Consultation ID</h4>
                      <p className="text-blue-700 font-mono text-sm">{selectedReport.consultationId}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                      <h4 className="font-medium text-green-900 mb-1">Confidence</h4>
                      <p className="text-green-700">{Math.round(selectedReport.confidence * 100)}%</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl">
                      <h4 className="font-medium text-purple-900 mb-1">Language</h4>
                      <p className="text-purple-700">{selectedReport.language.toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                {/* Extracted Data */}
                {selectedReport.extractedData && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Medical Data</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedReport.extractedData.symptoms && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">🩺 Symptoms</h4>
                          <div className="space-y-2">
                            {selectedReport.extractedData.symptoms.map((symptom: string, index: number) => (
                              <div key={index} className="bg-red-50 text-red-800 px-3 py-2 rounded-lg text-sm">
                                {symptom}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedReport.extractedData.diagnosedConditions && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">💊 Diagnosed Conditions</h4>
                          <div className="space-y-2">
                            {selectedReport.extractedData.diagnosedConditions.map((condition: string, index: number) => (
                              <div key={index} className="bg-purple-50 text-purple-800 px-3 py-2 rounded-lg text-sm">
                                {condition}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedReport.extractedData.medications && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">💉 Medications</h4>
                          <div className="space-y-2">
                            {selectedReport.extractedData.medications.map((medication: string, index: number) => (
                              <div key={index} className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-sm">
                                {medication}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedReport.extractedData.allergies && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">🚨 Allergies</h4>
                          <div className="space-y-2">
                            {selectedReport.extractedData.allergies.map((allergy: string, index: number) => (
                              <div key={index} className="bg-yellow-50 text-yellow-800 px-3 py-2 rounded-lg text-sm">
                                {allergy}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Treatment Suggestions */}
                {selectedReport.treatmentSuggestions && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🧠 AI Treatment Suggestions</h3>
                    <div className="space-y-4">
                      {selectedReport.treatmentSuggestions.medications && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">💊 Recommended Medications</h4>
                          <ul className="space-y-2">
                            {selectedReport.treatmentSuggestions.medications.map((medication: string, index: number) => (
                              <li key={index} className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                <span className="text-gray-700">{medication}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {selectedReport.treatmentSuggestions.labTests && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">🧪 Recommended Lab Tests</h4>
                          <ul className="space-y-2">
                            {selectedReport.treatmentSuggestions.labTests.map((test: string, index: number) => (
                              <li key={index} className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                <span className="text-gray-700">{test}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Transcription */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📎 Consultation Transcript</h3>
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <p className="text-gray-900 leading-relaxed">{selectedReport.transcription}</p>
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