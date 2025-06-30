import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MediAgent API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Audio processing endpoint
app.post('/api/process-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { language = 'auto' } = req.body;
    
    console.log(`Processing audio file: ${req.file.filename}, Language: ${language}`);
    
    // Simulate AI processing delay with realistic timing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock AI processing results with comprehensive medical data
    const result = {
      transcription: {
        text: generateMockTranscription(language),
        language: language === 'auto' ? 'en' : language,
        confidence: 0.94 + Math.random() * 0.05,
        duration: Math.floor(req.file.size / 1000) // Approximate duration based on file size
      },
      translation: language === 'ml' ? {
        originalText: "രോഗി നെഞ്ചുവേദനയും ശ്വാസതടസ്സവും അനുഭവിക്കുന്നു. രോഗലക്ഷണങ്ങൾ 2 മണിക്കൂർ മുമ്പ് ആരംഭിച്ചു.",
        translatedText: "Patient presents with chest pain and shortness of breath. Symptoms started 2 hours ago.",
        sourceLanguage: 'ml',
        targetLanguage: 'en',
        confidence: 0.92 + Math.random() * 0.05
      } : undefined,
      extractedData: generateMockExtractedData(),
      treatmentSuggestions: generateMockTreatmentSuggestions(),
      overallConfidence: 0.88 + Math.random() * 0.1
    };

    // Clean up uploaded file after processing
    setTimeout(() => {
      try {
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Error cleaning up file:', error);
      }
    }, 1000);

    res.json(result);
  } catch (error) {
    console.error('Audio processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process audio',
      message: error.message 
    });
  }
});

// Text processing endpoint
app.post('/api/process-text', async (req, res) => {
  try {
    const { text, language = 'auto' } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text provided' });
    }

    console.log(`Processing text input, Language: ${language}`);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = {
      transcription: {
        text: text,
        language: language === 'auto' ? detectLanguage(text) : language,
        confidence: 0.95,
        duration: 0
      },
      extractedData: extractDataFromText(text),
      treatmentSuggestions: generateTreatmentFromText(text),
      overallConfidence: 0.85 + Math.random() * 0.1
    };

    res.json(result);
  } catch (error) {
    console.error('Text processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process text',
      message: error.message 
    });
  }
});

// Patient data endpoints
app.post('/api/patients', (req, res) => {
  try {
    const patient = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    console.log('Created new patient:', patient.id);
    res.json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

app.get('/api/patients', (req, res) => {
  try {
    const patients = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1985-03-15',
        gender: 'Male',
        phone: '+1 (555) 123-4567',
        email: 'john.doe@email.com',
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2', 
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1992-07-22',
        gender: 'Female',
        phone: '+1 (555) 987-6543',
        email: 'jane.smith@email.com',
        createdAt: '2024-01-14T14:15:00Z'
      },
      {
        id: '3',
        firstName: 'Priya',
        lastName: 'Nair',
        dateOfBirth: '1988-11-08',
        gender: 'Female',
        phone: '+91 98765 43210',
        email: 'priya.nair@email.com',
        createdAt: '2024-01-13T09:20:00Z'
      }
    ];
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Reports endpoints
app.post('/api/reports', (req, res) => {
  try {
    const report = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    console.log('Created new report:', report.id);
    res.json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

app.get('/api/reports', (req, res) => {
  try {
    const reports = [
      {
        id: '1',
        patientName: 'John Doe',
        patientId: 'P001',
        type: 'consultation',
        date: '2024-01-15T10:30:00Z',
        status: 'completed',
        confidence: 94.5,
        transcriptionLength: 1250
      },
      {
        id: '2',
        patientName: 'Jane Smith', 
        patientId: 'P002',
        type: 'analysis',
        date: '2024-01-14T14:15:00Z',
        status: 'completed',
        confidence: 97.2,
        transcriptionLength: 890
      }
    ];
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Helper functions for mock data generation
function generateMockTranscription(language) {
  const transcriptions = [
    "Patient presents with chest pain and shortness of breath. Symptoms started 2 hours ago. No known allergies to medications. Currently taking aspirin 81mg daily for cardiovascular protection. Patient appears anxious and reports pain level 7 out of 10. Blood pressure is elevated at 150/95. Heart rate is 95 beats per minute. Patient has a history of hypertension and diabetes. Temperature is 98.6°F.",
    "Patient complains of severe headache and nausea for the past 3 days. No fever reported. Taking ibuprofen 400mg every 6 hours with minimal relief. Patient has a history of migraines. Blood pressure is normal at 120/80. No visual disturbances reported. Patient appears uncomfortable but alert.",
    "Patient reports persistent cough and fatigue for 1 week. Low-grade fever of 100.2°F. No shortness of breath at rest. Currently taking over-the-counter cough suppressant. No known allergies. Patient is a non-smoker. Chest sounds clear on examination. Heart rate is 88 bpm.",
    "Patient presents for routine diabetes follow-up. Blood glucose levels have been elevated recently. Currently taking metformin 500mg twice daily. Patient reports good adherence to diabetic diet. Blood pressure is well controlled at 125/78. No diabetic complications noted. HbA1c due for update."
  ];
  
  return transcriptions[Math.floor(Math.random() * transcriptions.length)];
}

function generateMockExtractedData() {
  const symptoms = [
    ["Chest pain", "Shortness of breath", "Anxiety", "Elevated blood pressure"],
    ["Severe headache", "Nausea", "Discomfort"],
    ["Persistent cough", "Fatigue", "Low-grade fever"],
    ["Elevated blood glucose", "Good medication adherence"]
  ];
  
  const conditions = [
    ["Acute chest pain", "Hypertensive episode", "Possible cardiac event"],
    ["Migraine headache", "Tension headache"],
    ["Upper respiratory infection", "Viral syndrome"],
    ["Type 2 diabetes", "Hyperglycemia"]
  ];
  
  const medications = [
    ["Aspirin 81mg daily", "Metformin 500mg twice daily", "Lisinopril 10mg daily"],
    ["Ibuprofen 400mg PRN", "Previous migraine medications"],
    ["Over-the-counter cough suppressant"],
    ["Metformin 500mg twice daily"]
  ];
  
  const index = Math.floor(Math.random() * symptoms.length);
  
  return {
    patientName: ["John Doe", "Jane Smith", "Michael Johnson", "Sarah Wilson"][index],
    symptoms: symptoms[index],
    diagnosedConditions: conditions[index],
    medicalHistory: ["Hypertension", "Type 2 Diabetes", "Cardiovascular disease"],
    allergies: ["No known drug allergies"],
    medications: medications[index],
    timeline: "Symptoms onset: 2-3 hours ago, Progressive symptoms",
    doctorNotes: "Patient appears in mild distress. Vital signs stable. Requires further evaluation and monitoring.",
    vitals: {
      bloodPressure: "150/95 mmHg",
      heartRate: "95 bpm",
      temperature: "98.6°F"
    }
  };
}

function generateMockTreatmentSuggestions() {
  return {
    medications: [
      "Nitroglycerin 0.4mg sublingual PRN chest pain",
      "Metoprolol 25mg twice daily for BP control",
      "Atorvastatin 20mg daily for cholesterol management",
      "Continue current diabetes medications"
    ],
    labTests: [
      "12-lead ECG immediately",
      "Cardiac enzymes (Troponin I, CK-MB)",
      "Complete blood count (CBC)",
      "Basic metabolic panel (BMP)",
      "Lipid profile",
      "HbA1c for diabetes monitoring",
      "Chest X-ray"
    ],
    followUpDuration: "24-48 hours for cardiac evaluation, 1 week for medication adjustment",
    lifestyleAdvice: [
      "Avoid strenuous physical activity until cleared by cardiologist",
      "Monitor blood pressure daily",
      "Follow diabetic diet and medication regimen",
      "Seek immediate medical attention if chest pain worsens",
      "Schedule cardiology consultation within 1 week"
    ]
  };
}

function detectLanguage(text) {
  const malayalamPattern = /[\u0D00-\u0D7F]/;
  const hindiPattern = /[\u0900-\u097F]/;
  const tamilPattern = /[\u0B80-\u0BFF]/;
  const teluguPattern = /[\u0C00-\u0C7F]/;
  
  if (malayalamPattern.test(text)) return 'ml';
  if (hindiPattern.test(text)) return 'hi';
  if (tamilPattern.test(text)) return 'ta';
  if (teluguPattern.test(text)) return 'te';
  
  return 'en';
}

function extractDataFromText(text) {
  const lowerText = text.toLowerCase();
  
  // Simple keyword extraction
  const symptoms = [];
  if (lowerText.includes('pain')) symptoms.push('Pain');
  if (lowerText.includes('fever')) symptoms.push('Fever');
  if (lowerText.includes('cough')) symptoms.push('Cough');
  if (lowerText.includes('headache')) symptoms.push('Headache');
  if (lowerText.includes('nausea')) symptoms.push('Nausea');
  
  return {
    patientName: "Patient Name Not Specified",
    symptoms: symptoms.length > 0 ? symptoms : ["General consultation"],
    diagnosedConditions: ["Assessment pending"],
    medicalHistory: ["History to be reviewed"],
    allergies: ["No allergies mentioned"],
    medications: ["No medications mentioned"],
    timeline: "Timeline not specified",
    doctorNotes: text.substring(0, 200) + (text.length > 200 ? '...' : '')
  };
}

function generateTreatmentFromText(text) {
  return {
    medications: ["Symptomatic treatment as appropriate"],
    labTests: ["Basic metabolic panel", "Complete blood count"],
    followUpDuration: "1-2 weeks for routine follow-up",
    lifestyleAdvice: ["Maintain healthy diet", "Regular exercise as tolerated", "Adequate rest"]
  };
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MediAgent API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧠 AI Processing: http://localhost:${PORT}/api/process-audio`);
  console.log(`📝 Text Processing: http://localhost:${PORT}/api/process-text`);
});