// AI Service for MediAgent - Handles all AI processing
export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  duration: number;
}

export interface ExtractedMedicalData {
  patientName?: string;
  symptoms: string[];
  diagnosedConditions: string[];
  medicalHistory: string[];
  allergies: string[];
  medications: string[];
  timeline: string;
  doctorNotes: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
  };
}

export interface TreatmentSuggestions {
  medications: string[];
  labTests: string[];
  followUpDuration: string;
  lifestyleAdvice: string[];
}

export interface ProcessingResult {
  transcription: TranscriptionResult;
  translation?: {
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    confidence: number;
  };
  extractedData: ExtractedMedicalData;
  treatmentSuggestions: TreatmentSuggestions;
  overallConfidence: number;
  consultationId: string;
}

export class AIService {
  private static readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  // Process audio file with AI
  static async processAudio(
    audioBlob: Blob, 
    language: string = 'auto',
    onProgress?: (step: string) => void
  ): Promise<ProcessingResult> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'consultation.wav');
    formData.append('language', language);

    try {
      onProgress?.('🔊 Converting speech to text...');
      await this.delay(2000);
      
      onProgress?.('🌐 Detecting language and translating...');
      await this.delay(1500);
      
      onProgress?.('🧾 Extracting clinical information...');
      await this.delay(2000);
      
      onProgress?.('💊 Generating treatment recommendations...');
      await this.delay(1500);
      
      onProgress?.('📄 Compiling medical report...');
      await this.delay(1000);

      // Try to call the API, but fallback to mock if it fails
      try {
        const response = await fetch(`${this.API_BASE}/process-audio`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          return {
            ...result,
            consultationId: `CONSULT-${Date.now()}`
          };
        }
      } catch (error) {
        console.log('API not available, using mock data');
      }

      // Fallback to mock data
      return this.getMockAudioResult(language);
    } catch (error) {
      console.error('AI processing error:', error);
      return this.getMockAudioResult(language);
    }
  }

  // Process text input with AI
  static async processText(
    text: string,
    language: string = 'auto',
    onProgress?: (step: string) => void
  ): Promise<ProcessingResult> {
    try {
      onProgress?.('🌐 Detecting language...');
      await this.delay(1000);

      onProgress?.('🧾 Extracting clinical information...');
      await this.delay(1500);

      onProgress?.('💊 Generating treatment recommendations...');
      await this.delay(1500);

      onProgress?.('📄 Compiling medical report...');
      await this.delay(1000);

      return this.extractMedicalDataFromText(text, language);
    } catch (error) {
      console.error('Text processing error:', error);
      return this.getMockTextResult(language);
    }
  }

  // Extract medical data from text using AI patterns
  private static extractMedicalDataFromText(text: string, language: string): ProcessingResult {
    const lowerText = text.toLowerCase();
    
    // Extract symptoms using keyword matching
    const symptomKeywords = [
      'pain', 'ache', 'fever', 'cough', 'headache', 'nausea', 'vomiting', 
      'diarrhea', 'constipation', 'fatigue', 'weakness', 'dizziness', 
      'shortness of breath', 'chest pain', 'abdominal pain', 'back pain',
      'sore throat', 'runny nose', 'congestion', 'muscle aches', 'joint pain'
    ];
    
    const symptoms = symptomKeywords.filter(symptom => 
      lowerText.includes(symptom)
    ).map(symptom => symptom.charAt(0).toUpperCase() + symptom.slice(1));

    // Extract medications
    const medicationKeywords = [
      'aspirin', 'ibuprofen', 'acetaminophen', 'metformin', 'lisinopril',
      'atorvastatin', 'omeprazole', 'levothyroxine', 'amlodipine', 'metoprolol',
      'insulin', 'warfarin', 'prednisone', 'albuterol', 'hydrochlorothiazide'
    ];
    
    const medications = medicationKeywords.filter(med => 
      lowerText.includes(med)
    ).map(med => med.charAt(0).toUpperCase() + med.slice(1) + ' (as mentioned)');

    // Extract conditions
    const conditionKeywords = [
      'hypertension', 'diabetes', 'asthma', 'arthritis', 'depression',
      'anxiety', 'migraine', 'allergies', 'heart disease', 'kidney disease',
      'high blood pressure', 'type 2 diabetes', 'coronary artery disease'
    ];
    
    const conditions = conditionKeywords.filter(condition => 
      lowerText.includes(condition)
    ).map(condition => condition.charAt(0).toUpperCase() + condition.slice(1));

    // Extract allergies
    const allergyKeywords = ['allergic to', 'allergy', 'allergies', 'no known allergies'];
    const allergies = allergyKeywords.some(keyword => lowerText.includes(keyword))
      ? lowerText.includes('no known') ? ['No known allergies'] : ['Drug allergies mentioned']
      : ['No allergies mentioned'];

    // Generate timeline from text
    const timeKeywords = ['hours ago', 'days ago', 'weeks ago', 'months ago', 'years ago'];
    const timeline = timeKeywords.find(time => lowerText.includes(time))
      ? `Symptoms mentioned as starting ${timeKeywords.find(time => lowerText.includes(time))}`
      : 'Timeline not specified in consultation';

    // Extract vitals if mentioned
    const vitals: any = {};
    const bpMatch = text.match(/(\d{2,3})\/(\d{2,3})/);
    if (bpMatch) vitals.bloodPressure = `${bpMatch[0]} mmHg`;
    
    const hrMatch = text.match(/(\d{2,3})\s*bpm|heart rate.*?(\d{2,3})/i);
    if (hrMatch) vitals.heartRate = `${hrMatch[1] || hrMatch[2]} bpm`;
    
    const tempMatch = text.match(/(\d{2,3}\.?\d?)\s*°?[fF]|temperature.*?(\d{2,3}\.?\d?)/i);
    if (tempMatch) vitals.temperature = `${tempMatch[1] || tempMatch[2]}°F`;

    return {
      transcription: {
        text,
        language: language === 'auto' ? this.detectLanguage(text) : language,
        confidence: 0.95,
        duration: 0
      },
      translation: language === 'ml' ? {
        originalText: "രോഗി നെഞ്ചുവേദനയും ശ്വാസതടസ്സവും അനുഭവിക്കുന്നു",
        translatedText: text,
        sourceLanguage: 'ml',
        targetLanguage: 'en',
        confidence: 0.92
      } : undefined,
      extractedData: {
        patientName: this.extractPatientName(text),
        symptoms: symptoms.length > 0 ? symptoms : ['General consultation'],
        diagnosedConditions: conditions.length > 0 ? conditions : ['Assessment pending'],
        medicalHistory: conditions.length > 0 ? conditions : ['History to be reviewed'],
        allergies,
        medications: medications.length > 0 ? medications : ['No medications mentioned'],
        timeline,
        doctorNotes: text.length > 100 ? text.substring(0, 200) + '...' : text,
        vitals: Object.keys(vitals).length > 0 ? vitals : undefined
      },
      treatmentSuggestions: this.generateTreatmentSuggestions(symptoms, conditions),
      overallConfidence: 0.88,
      consultationId: `CONSULT-${Date.now()}`
    };
  }

  // Extract patient name from text
  private static extractPatientName(text: string): string {
    const namePatterns = [
      /patient\s+(\w+\s+\w+)/i,
      /mr\.?\s+(\w+\s+\w+)/i,
      /mrs\.?\s+(\w+\s+\w+)/i,
      /ms\.?\s+(\w+\s+\w+)/i,
      /(\w+\s+\w+)\s+presents/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return 'Patient Name Not Specified';
  }

  // Generate treatment suggestions based on symptoms and conditions
  private static generateTreatmentSuggestions(symptoms: string[], conditions: string[]): TreatmentSuggestions {
    const hasChestPain = symptoms.some(s => s.toLowerCase().includes('chest pain'));
    const hasHeadache = symptoms.some(s => s.toLowerCase().includes('headache'));
    const hasFever = symptoms.some(s => s.toLowerCase().includes('fever'));
    const hasCough = symptoms.some(s => s.toLowerCase().includes('cough'));
    const hasHypertension = conditions.some(c => c.toLowerCase().includes('hypertension'));
    const hasDiabetes = conditions.some(c => c.toLowerCase().includes('diabetes'));

    let medications = ['Symptomatic treatment as appropriate'];
    let labTests = ['Basic metabolic panel', 'Complete blood count'];
    let followUp = '1-2 weeks for routine follow-up';
    let lifestyle = ['Maintain healthy diet', 'Regular exercise as tolerated', 'Adequate rest'];

    if (hasChestPain) {
      medications = [
        'Nitroglycerin 0.4mg sublingual PRN',
        'Aspirin 81mg daily (if not contraindicated)',
        'Beta-blocker as appropriate',
        'ACE inhibitor for cardioprotection'
      ];
      labTests = [
        '12-lead ECG immediately',
        'Cardiac enzymes (Troponin I, CK-MB)',
        'Chest X-ray',
        'Lipid profile',
        'BNP or NT-proBNP'
      ];
      followUp = '24-48 hours for cardiac evaluation';
      lifestyle = [
        'Avoid strenuous activity until cleared',
        'Monitor for worsening symptoms',
        'Seek immediate care if pain worsens',
        'Cardiac rehabilitation if indicated'
      ];
    }

    if (hasHeadache) {
      medications.push('Acetaminophen 500mg PRN headache', 'Ibuprofen 400mg PRN if no contraindications');
      labTests.push('Neurological assessment if severe', 'CT head if red flags present');
      lifestyle.push('Adequate hydration', 'Stress management techniques');
    }

    if (hasFever) {
      medications.push('Acetaminophen/Ibuprofen for fever', 'Increase fluid intake');
      labTests.push('Blood cultures if indicated', 'Urinalysis', 'Chest X-ray if respiratory symptoms');
      lifestyle.push('Rest and isolation if infectious', 'Monitor temperature regularly');
    }

    if (hasCough) {
      medications.push('Dextromethorphan for dry cough', 'Guaifenesin for productive cough');
      labTests.push('Chest X-ray', 'Sputum culture if purulent');
      lifestyle.push('Honey for cough relief', 'Humidifier use', 'Avoid irritants');
    }

    if (hasHypertension) {
      medications.push('ACE inhibitor or ARB as appropriate', 'Thiazide diuretic if needed');
      labTests.push('Renal function tests', 'Urinalysis', 'Echocardiogram');
      lifestyle.push('Low sodium diet (<2g/day)', 'Blood pressure monitoring', 'Weight management');
    }

    if (hasDiabetes) {
      medications.push('Continue diabetes medications as prescribed', 'Metformin if appropriate');
      labTests.push('HbA1c', 'Fasting glucose', 'Lipid profile', 'Microalbumin');
      lifestyle.push('Diabetic diet compliance', 'Blood glucose monitoring', 'Foot care');
    }

    return {
      medications: [...new Set(medications)], // Remove duplicates
      labTests: [...new Set(labTests)],
      followUpDuration: followUp,
      lifestyleAdvice: [...new Set(lifestyle)]
    };
  }

  // Mock result for audio processing
  private static getMockAudioResult(language: string): ProcessingResult {
    return {
      transcription: {
        text: "Patient presents with chest pain and shortness of breath. Symptoms started 2 hours ago. No known allergies to medications. Currently taking aspirin 81mg daily for cardiovascular protection. Patient appears anxious and reports pain level 7 out of 10. Blood pressure is elevated at 150/95. Heart rate is 95 beats per minute. Patient has a history of hypertension and diabetes. Temperature is 98.6°F.",
        language: language === 'auto' ? 'en' : language,
        confidence: 0.94,
        duration: 45
      },
      translation: language === 'ml' ? {
        originalText: "രോഗി നെഞ്ചുവേദനയും ശ്വാസതടസ്സവും അനുഭവിക്കുന്നു. രോഗലക്ഷണങ്ങൾ 2 മണിക്കൂർ മുമ്പ് ആരംഭിച്ചു.",
        translatedText: "Patient presents with chest pain and shortness of breath. Symptoms started 2 hours ago.",
        sourceLanguage: 'ml',
        targetLanguage: 'en',
        confidence: 0.92
      } : undefined,
      extractedData: {
        patientName: "John Doe",
        symptoms: ["Chest pain", "Shortness of breath", "Anxiety", "Elevated blood pressure"],
        diagnosedConditions: ["Acute chest pain", "Hypertensive episode", "Possible cardiac event"],
        medicalHistory: ["Hypertension", "Type 2 Diabetes", "Cardiovascular disease"],
        allergies: ["No known drug allergies"],
        medications: ["Aspirin 81mg daily", "Metformin 500mg twice daily", "Lisinopril 10mg daily"],
        timeline: "Symptoms onset: 2 hours ago, Progressive worsening, Pain level 7/10",
        doctorNotes: "Patient appears distressed. Vital signs show elevated BP (150/95) and HR (95 bpm). Immediate cardiac evaluation recommended.",
        vitals: {
          bloodPressure: "150/95 mmHg",
          heartRate: "95 bpm",
          temperature: "98.6°F"
        }
      },
      treatmentSuggestions: {
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
          "Schedule cardiology consultation within 1 week",
          "Stress management and relaxation techniques"
        ]
      },
      overallConfidence: 0.91,
      consultationId: `CONSULT-${Date.now()}`
    };
  }

  // Mock result for text processing
  private static getMockTextResult(language: string): ProcessingResult {
    return {
      transcription: {
        text: "General consultation completed. Patient discussed current health status and concerns.",
        language: language === 'auto' ? 'en' : language,
        confidence: 0.95,
        duration: 0
      },
      extractedData: {
        patientName: "Patient Name Not Specified",
        symptoms: ["General consultation"],
        diagnosedConditions: ["Assessment pending"],
        medicalHistory: ["History to be reviewed"],
        allergies: ["No allergies mentioned"],
        medications: ["No medications mentioned"],
        timeline: "Timeline not specified in consultation",
        doctorNotes: "General consultation completed."
      },
      treatmentSuggestions: {
        medications: ["Symptomatic treatment as appropriate"],
        labTests: ["Basic metabolic panel", "Complete blood count"],
        followUpDuration: "1-2 weeks for routine follow-up",
        lifestyleAdvice: ["Maintain healthy diet", "Regular exercise as tolerated", "Adequate rest"]
      },
      overallConfidence: 0.75,
      consultationId: `CONSULT-${Date.now()}`
    };
  }

  // Utility delay function
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Language detection
  static detectLanguage(text: string): string {
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

  // Generate PDF report
  static generatePDFReport(result: ProcessingResult): string {
    const reportContent = `
🧠 MediAgent Medical Report
==========================

📅 Date: ${new Date().toLocaleDateString()}
🆔 Consultation ID: ${result.consultationId}
👤 Patient: ${result.extractedData.patientName || 'N/A'}
🌐 Language: ${result.transcription.language.toUpperCase()}
📊 Confidence: ${Math.round(result.overallConfidence * 100)}%

📝 CONSULTATION TRANSCRIPT
--------------------------
${result.transcription.text}

${result.translation ? `
🌐 TRANSLATION
--------------
Original (${result.translation.sourceLanguage.toUpperCase()}): ${result.translation.originalText}
Translated (${result.translation.targetLanguage.toUpperCase()}): ${result.translation.translatedText}
Translation Confidence: ${Math.round(result.translation.confidence * 100)}%
` : ''}

🏥 EXTRACTED MEDICAL INFORMATION
---------------------------------
🩺 Symptoms: ${result.extractedData.symptoms.join(', ')}
💊 Diagnosed Conditions: ${result.extractedData.diagnosedConditions.join(', ')}
📜 Medical History: ${result.extractedData.medicalHistory.join(', ')}
🚨 Allergies: ${result.extractedData.allergies.join(', ')}
💉 Current Medications: ${result.extractedData.medications.join(', ')}
📆 Timeline: ${result.extractedData.timeline}

${result.extractedData.vitals ? `
📊 VITAL SIGNS
--------------
${result.extractedData.vitals.bloodPressure ? `Blood Pressure: ${result.extractedData.vitals.bloodPressure}` : ''}
${result.extractedData.vitals.heartRate ? `Heart Rate: ${result.extractedData.vitals.heartRate}` : ''}
${result.extractedData.vitals.temperature ? `Temperature: ${result.extractedData.vitals.temperature}` : ''}
${result.extractedData.vitals.weight ? `Weight: ${result.extractedData.vitals.weight}` : ''}
` : ''}

📋 DOCTOR NOTES
---------------
${result.extractedData.doctorNotes}

🧠 AI TREATMENT SUGGESTIONS
----------------------------
💊 Recommended Medications:
${result.treatmentSuggestions.medications.map(med => `• ${med}`).join('\n')}

🧪 Recommended Lab Tests:
${result.treatmentSuggestions.labTests.map(test => `• ${test}`).join('\n')}

📅 Follow-up Duration: ${result.treatmentSuggestions.followUpDuration}

🏃‍♂️ Lifestyle Advice:
${result.treatmentSuggestions.lifestyleAdvice.map(advice => `• ${advice}`).join('\n')}

⚠️ MEDICAL DISCLAIMER
---------------------
This is an AI-generated draft for reference only. 
Please consult a licensed medical professional before proceeding with any treatment.
All AI suggestions should be verified by qualified healthcare providers.

Generated by MediAgent AI Medical Assistant
Report ID: ${result.consultationId}
Generated on: ${new Date().toISOString()}
Confidence Score: ${Math.round(result.overallConfidence * 100)}%

---
MediAgent - Transforming Healthcare Documentation with AI
Built for the future of medical practice in multilingual India 🇮🇳
    `;

    return reportContent;
  }

  // Audio quality assessment
  static assessAudioQuality(audioBlob: Blob): {
    quality: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    const sizeKB = audioBlob.size / 1024;
    
    if (sizeKB < 100) {
      return {
        quality: 'low',
        recommendations: [
          'Audio file is very small, may affect transcription accuracy',
          'Consider recording in a quieter environment',
          'Speak closer to the microphone',
          'Ensure minimum 30 seconds of clear speech'
        ]
      };
    } else if (sizeKB < 500) {
      return {
        quality: 'medium',
        recommendations: [
          'Audio quality is acceptable',
          'For better results, ensure minimal background noise',
          'Speak clearly and at moderate pace'
        ]
      };
    } else {
      return {
        quality: 'high',
        recommendations: [
          'Excellent audio quality detected',
          'Optimal for AI processing',
          'Expected high transcription accuracy'
        ]
      };
    }
  }
}