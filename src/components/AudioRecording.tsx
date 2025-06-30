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
  Volume2
} from 'lucide-react';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

interface ProcessingResult {
  transcription: string;
  translation?: string;
  extractedData: {
    diseases: string[];
    allergies: string[];
    medications: string[];
    symptoms: string[];
    timeline: string;
  };
  treatmentSuggestions: string[];
  confidence: number;
}

export function AudioRecording() {
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
  });
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  
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

      // Start duration timer
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

  const processAudio = async () => {
    const audioToProcess = recording.audioBlob || uploadedFile;
    if (!audioToProcess) return;

    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const mockResult: ProcessingResult = {
        transcription: "Patient presents with chest pain and shortness of breath. Symptoms started 2 hours ago. No known allergies. Currently taking aspirin 81mg daily. Patient appears anxious and reports pain level 7/10.",
        translation: selectedLanguage === 'ml' ? "Patient presents with chest pain and shortness of breath..." : undefined,
        extractedData: {
          diseases: ["Chest Pain", "Dyspnea"],
          allergies: ["No known allergies"],
          medications: ["Aspirin 81mg daily"],
          symptoms: ["Chest pain", "Shortness of breath", "Anxiety"],
          timeline: "Symptoms onset: 2 hours ago"
        },
        treatmentSuggestions: [
          "Obtain ECG immediately",
          "Check cardiac enzymes (Troponin)",
          "Consider chest X-ray",
          "Monitor vital signs closely",
          "Administer oxygen if SpO2 < 94%"
        ],
        confidence: 94.5
      };
      
      setProcessingResult(mockResult);
      setIsProcessing(false);
    }, 3000);
  };

  const downloadReport = () => {
    if (!processingResult) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      transcription: processingResult.transcription,
      translation: processingResult.translation,
      extractedData: processingResult.extractedData,
      treatmentSuggestions: processingResult.treatmentSuggestions,
      confidence: processingResult.confidence
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Audio Recording & Analysis</h1>
        <p className="text-gray-600">Record consultations or upload audio files for AI-powered medical transcription and analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recording Section */}
        <div className="space-y-6">
          {/* Language Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Settings</h3>
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

          {/* Recording Controls */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Record Audio</h3>
            
            <div className="text-center mb-6">
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
                    ? (recording.isPaused ? 'Paused' : 'Recording...') 
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
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition-all"
                >
                  {recording.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </motion.button>
              </div>
            )}

            {recording.audioUrl && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Recorded Audio</h4>
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

          {/* File Upload */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Audio File</h3>
            
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
              <div className="mt-4 p-4 bg-green-50 rounded-xl">
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

          {/* Process Button */}
          {(recording.audioBlob || uploadedFile) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={processAudio}
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing with AI...</span>
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  <span>Analyze with AI</span>
                </>
              )}
            </motion.button>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Processing</h3>
                  <p className="text-gray-600">Analyzing audio with advanced AI models...</p>
                  <div className="mt-4 space-y-2 text-sm text-gray-500">
                    <p>🎤 Transcribing speech...</p>
                    <p>🌐 Detecting language...</p>
                    <p>🧠 Extracting medical data...</p>
                    <p>💊 Generating treatment suggestions...</p>
                  </div>
                </div>
              </motion.div>
            )}

            {processingResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Confidence Score */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">AI Analysis Results</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-green-600">
                        {processingResult.confidence}% Confidence
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${processingResult.confidence}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                    />
                  </div>
                </div>

                {/* Transcription */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <Volume2 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Transcription</h3>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-900 leading-relaxed">{processingResult.transcription}</p>
                  </div>
                  
                  {processingResult.translation && (
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Languages className="w-4 h-4 text-green-600" />
                        <h4 className="font-medium text-gray-900">Translation</h4>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-gray-900 leading-relaxed">{processingResult.translation}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Extracted Medical Data */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Extracted Medical Data</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Diseases/Conditions</h4>
                      <div className="space-y-1">
                        {processingResult.extractedData.diseases.map((disease, index) => (
                          <span key={index} className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm mr-2 mb-1">
                            {disease}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Symptoms</h4>
                      <div className="space-y-1">
                        {processingResult.extractedData.symptoms.map((symptom, index) => (
                          <span key={index} className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-lg text-sm mr-2 mb-1">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Medications</h4>
                      <div className="space-y-1">
                        {processingResult.extractedData.medications.map((med, index) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm mr-2 mb-1">
                            {med}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Allergies</h4>
                      <div className="space-y-1">
                        {processingResult.extractedData.allergies.map((allergy, index) => (
                          <span key={index} className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm mr-2 mb-1">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                    <p className="text-gray-700">{processingResult.extractedData.timeline}</p>
                  </div>
                </div>

                {/* Treatment Suggestions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <Brain className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">AI Treatment Suggestions</h3>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg text-xs font-medium">
                      Beta
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {processingResult.treatmentSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-xl">
                        <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-gray-900 flex-1">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ These are AI-generated suggestions for reference only. Always use clinical judgment and follow established medical protocols.
                    </p>
                  </div>
                </div>

                {/* Download Report */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={downloadReport}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Complete Report</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}