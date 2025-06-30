import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Upload, 
  FileAudio, 
  Brain, 
  Languages,
  FileText,
  Download,
  Trash2,
  Volume2,
  Send,
  Mail,
  MessageSquare,
  Database,
  CheckCircle,
  AlertTriangle,
  Loader,
  Stethoscope,
  Save,
  User
} from 'lucide-react';
import { AIService, ProcessingResult } from '../lib/ai-service';
import { database } from '../lib/database';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

export function MediAgent() {
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
  });
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [manualText, setManualText] = useState('');
  const [activeTab, setActiveTab] = useState<'record' | 'upload' | 'text'>('record');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const languages = [
    { code: 'auto', name: 'Auto Detect' },
    { code: 'en', name: 'English' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
  ];

  const patients = database.getPatients();

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (recording.audioUrl) {
        URL.revokeObjectURL(recording.audioUrl);
      }
    };
  }, [recording.audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setRecording(prev => ({ ...prev, audioBlob: blob, audioUrl: url }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(prev => ({ ...prev, isRecording: true, isPaused: false }));

      intervalRef.current = setInterval(() => {
        setRecording(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording.isRecording) {
      mediaRecorderRef.current.stop();
      setRecording(prev => ({ ...prev, isRecording: false, isPaused: false }));
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recording.isRecording) {
      if (recording.isPaused) {
        mediaRecorderRef.current.resume();
        intervalRef.current = setInterval(() => {
          setRecording(prev => ({ ...prev, duration: prev.duration + 1 }));
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
      setRecording(prev => ({ ...prev, isPaused: !prev.isPaused }));
    }
  };

  const resetRecording = () => {
    if (recording.audioUrl) {
      URL.revokeObjectURL(recording.audioUrl);
    }
    setRecording({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
    });
    setUploadedFile(null);
    setManualText('');
    setProcessingResult(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setUploadedFile(file);
      resetRecording();
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const processInput = async () => {
    const audioToProcess = recording.audioBlob || uploadedFile;
    const textToProcess = manualText.trim();
    
    if (!audioToProcess && !textToProcess) {
      alert('Please record audio, upload a file, or enter text manually.');
      return;
    }

    setIsProcessing(true);
    
    try {
      let result: ProcessingResult;
      
      if (audioToProcess) {
        result = await AIService.processAudio(audioToProcess, selectedLanguage, setProcessingStep);
      } else {
        result = await AIService.processText(textToProcess, selectedLanguage, setProcessingStep);
      }
      
      setProcessingResult(result);
      
      // Save audio recording to database if applicable
      if (audioToProcess) {
        await database.createRecording({
          patientId: selectedPatient || undefined,
          fileName: uploadedFile?.name || 'recorded_consultation.wav',
          fileSize: audioToProcess.size,
          duration: recording.duration,
          language: selectedLanguage,
          status: 'completed'
        });
      }
      
    } catch (error) {
      console.error('Processing error:', error);
      alert('Error processing input. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const saveReport = async () => {
    if (!processingResult) return;
    
    try {
      const selectedPatientData = patients.find(p => p.id === selectedPatient);
      
      await database.createReport({
        patientId: selectedPatient || undefined,
        patientName: selectedPatientData ? 
          `${selectedPatientData.firstName} ${selectedPatientData.lastName}` : 
          processingResult.extractedData.patientName || 'Unknown Patient',
        consultationId: processingResult.consultationId,
        transcription: processingResult.transcription.text,
        extractedData: processingResult.extractedData,
        treatmentSuggestions: processingResult.treatmentSuggestions,
        confidence: processingResult.overallConfidence,
        language: processingResult.transcription.language,
        status: 'completed'
      });
      
      alert('Report saved to database successfully!');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report. Please try again.');
    }
  };

  const downloadReport = () => {
    if (!processingResult) return;
    
    const reportContent = AIService.generatePDFReport(processingResult);
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediagent-report-${processingResult.consultationId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendReport = (method: 'email' | 'whatsapp') => {
    if (!processingResult) return;
    
    const reportText = `🧠 MediAgent Report
    
🗓️ Date: ${new Date().toLocaleDateString()}
🆔 Consultation ID: ${processingResult.consultationId}
🧍 Patient: ${processingResult.extractedData.patientName || 'N/A'}

🩺 Symptoms: ${processingResult.extractedData.symptoms.join(', ')}
💊 Diagnosis: ${processingResult.extractedData.diagnosedConditions.join(', ')}
📜 Medical History: ${processingResult.extractedData.medicalHistory.join(', ')}
🚨 Allergies: ${processingResult.extractedData.allergies.join(', ')}
💉 Current Medications: ${processingResult.extractedData.medications.join(', ')}
📆 Timeline: ${processingResult.extractedData.timeline}

🧠 AI Treatment Suggestions:
Medications: ${processingResult.treatmentSuggestions.medications.join(', ')}
Lab Tests: ${processingResult.treatmentSuggestions.labTests.join(', ')}
Follow-up: ${processingResult.treatmentSuggestions.followUpDuration}

⚠️ This is not a final diagnosis. Please consult a medical professional.`;

    if (method === 'email') {
      const subject = `MediAgent Report - ${processingResult.consultationId}`;
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportText)}`;
      window.open(mailtoLink);
    } else if (method === 'whatsapp') {
      const whatsappLink = `https://wa.me/?text=${encodeURIComponent(reportText)}`;
      window.open(whatsappLink, '_blank');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MediAgent</h1>
            <p className="text-blue-600 font-medium">AI Medical Scribe + Treatment Assistant</p>
          </div>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Advanced AI-powered medical documentation system that converts consultations into structured EMR records 
          with treatment recommendations. Supports Malayalam, English, and other Indian languages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Patient Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Patient Selection
            </h3>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select Patient (Optional)</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} - {patient.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Language Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Languages className="w-5 h-5 mr-2" />
              Language Settings
            </h3>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          {/* Input Method Tabs */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
              {[
                { id: 'record', label: 'Record Audio', icon: Mic },
                { id: 'upload', label: 'Upload File', icon: Upload },
                { id: 'text', label: 'Manual Text', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Record Audio Tab */}
            {activeTab === 'record' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={recording.isRecording ? stopRecording : startRecording}
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
                        recording.isRecording 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {recording.isRecording ? (
                        <Square className="w-8 h-8" />
                      ) : (
                        <Mic className="w-8 h-8" />
                      )}
                    </motion.button>
                    
                    {recording.isRecording && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 rounded-full border-4 border-red-300 opacity-75"
                      />
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-2xl font-mono font-bold text-gray-900">
                      {formatDuration(recording.duration)}
                    </p>
                    <p className="text-gray-600 mt-1">
                      {recording.isRecording 
                        ? (recording.isPaused ? 'Paused' : 'Recording consultation...') 
                        : 'Click to start recording'
                      }
                    </p>
                  </div>
                </div>

                {recording.isRecording && (
                  <div className="flex justify-center space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={pauseRecording}
                      className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
                    >
                      {recording.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                      <span>{recording.isPaused ? 'Resume' : 'Pause'}</span>
                    </motion.button>
                  </div>
                )}

                {recording.audioUrl && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Recorded Consultation</h4>
                      <button
                        onClick={resetRecording}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <audio ref={audioRef} controls className="w-full">
                      <source src={recording.audioUrl} type="audio/wav" />
                    </audio>
                  </div>
                )}
              </div>
            )}

            {/* Upload File Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <div
                  onClick={triggerFileUpload}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-all hover:border-gray-400 hover:bg-gray-50"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div>
                    <p className="text-gray-900 font-medium mb-1">
                      Click to select an audio file
                    </p>
                    <p className="text-gray-500 text-sm">
                      Supports WAV, MP3, M4A, OGG formats
                    </p>
                  </div>
                </div>

                {uploadedFile && (
                  <div className="p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <FileAudio className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">{uploadedFile.name}</p>
                        <p className="text-sm text-green-700">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual Text Tab */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Enter consultation notes manually... (e.g., Patient presents with chest pain and shortness of breath...)"
                  className="w-full h-40 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
                <p className="text-sm text-gray-500">
                  Enter the consultation transcript manually if you don't have audio to upload.
                </p>
              </div>
            )}
          </div>

          {/* Process Button */}
          {(recording.audioBlob || uploadedFile || manualText.trim()) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={processInput}
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Processing with AI...</span>
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  <span>Generate Medical Report</span>
                </>
              )}
            </motion.button>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-blue-800 font-medium">{processingStep}</span>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <AnimatePresence>
            {processingResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Report Header */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">🧠 MediAgent Report</h3>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        {Math.round(processingResult.overallConfidence * 100)}% Confidence
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Date:</span>
                      <span className="ml-2 text-gray-900">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Consultation ID:</span>
                      <span className="ml-2 text-gray-900">{processingResult.consultationId}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Patient:</span>
                      <span className="ml-2 text-gray-900">{processingResult.extractedData.patientName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Language:</span>
                      <span className="ml-2 text-gray-900">{processingResult.transcription.language.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Extracted Medical Data */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">📋 Extracted Medical Information</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">🩺 Symptoms:</h5>
                      <div className="flex flex-wrap gap-2">
                        {processingResult.extractedData.symptoms.map((symptom, index) => (
                          <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">💊 Diagnosed Conditions:</h5>
                      <div className="flex flex-wrap gap-2">
                        {processingResult.extractedData.diagnosedConditions.map((condition, index) => (
                          <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-sm">
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">📜 Medical History:</h5>
                      <div className="flex flex-wrap gap-2">
                        {processingResult.extractedData.medicalHistory.map((history, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm">
                            {history}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">🚨 Allergies:</h5>
                      <div className="flex flex-wrap gap-2">
                        {processingResult.extractedData.allergies.map((allergy, index) => (
                          <span key={index} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">💉 Current Medications:</h5>
                      <div className="flex flex-wrap gap-2">
                        {processingResult.extractedData.medications.map((medication, index) => (
                          <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm">
                            {medication}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">📆 Timeline:</h5>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{processingResult.extractedData.timeline}</p>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">📝 Doctor Notes:</h5>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{processingResult.extractedData.doctorNotes}</p>
                    </div>
                  </div>
                </div>

                {/* AI Treatment Suggestions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">🧠 AI Treatment Suggestions</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">💊 Recommended Medications:</h5>
                      <ul className="space-y-2">
                        {processingResult.treatmentSuggestions.medications.map((medication, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <span className="text-gray-700">{medication}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">🧪 Recommended Lab Tests:</h5>
                      <ul className="space-y-2">
                        {processingResult.treatmentSuggestions.labTests.map((test, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <span className="text-gray-700">{test}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">📅 Follow-up Duration:</h5>
                      <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{processingResult.treatmentSuggestions.followUpDuration}</p>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">🏃‍♂️ Lifestyle Advice:</h5>
                      <ul className="space-y-2">
                        {processingResult.treatmentSuggestions.lifestyleAdvice.map((advice, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                            <span className="text-gray-700">{advice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <p className="text-yellow-800 text-sm">
                        <strong>⚠️ Medical Disclaimer:</strong> This is an AI-generated draft for reference only. 
                        Please consult a licensed medical professional before proceeding with any treatment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transcription */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">📎 Consultation Transcript</h4>
                  
                  {processingResult.translation && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Original (Malayalam):</h5>
                      <div className="bg-orange-50 p-4 rounded-xl">
                        <p className="text-gray-900">{processingResult.translation.originalText}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">English Translation:</h5>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-gray-900 leading-relaxed">{processingResult.transcription.text}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">📤 Export & Share Options</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={saveReport}
                      className="flex items-center justify-center space-x-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save to Database</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={downloadReport}
                      className="flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Report</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sendReport('email')}
                      className="flex items-center justify-center space-x-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send via Email</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sendReport('whatsapp')}
                      className="flex items-center justify-center space-x-2 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send via WhatsApp</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}