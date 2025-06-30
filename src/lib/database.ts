// Local database service for MediAgent
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bloodType?: string;
  allergies: string[];
  medications: string[];
  medicalHistory: string[];
  insuranceProvider?: string;
  insuranceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalReport {
  id: string;
  patientId?: string;
  patientName: string;
  consultationId: string;
  transcription: string;
  extractedData: any;
  treatmentSuggestions: any;
  confidence: number;
  language: string;
  status: 'draft' | 'completed' | 'reviewed';
  createdAt: string;
  updatedAt: string;
}

export interface AudioRecording {
  id: string;
  patientId?: string;
  fileName: string;
  fileSize: number;
  duration: number;
  language: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

class DatabaseService {
  private readonly PATIENTS_KEY = 'mediagent_patients';
  private readonly REPORTS_KEY = 'mediagent_reports';
  private readonly RECORDINGS_KEY = 'mediagent_recordings';

  // Patient operations
  async createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const patients = this.getPatients();
    const newPatient: Patient = {
      ...patientData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    patients.push(newPatient);
    this.savePatients(patients);
    return newPatient;
  }

  getPatients(): Patient[] {
    const stored = localStorage.getItem(this.PATIENTS_KEY);
    return stored ? JSON.parse(stored) : this.getDefaultPatients();
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    const patients = this.getPatients();
    const index = patients.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Patient not found');
    }
    
    patients[index] = {
      ...patients[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.savePatients(patients);
    return patients[index];
  }

  async deletePatient(id: string): Promise<void> {
    const patients = this.getPatients();
    const filtered = patients.filter(p => p.id !== id);
    this.savePatients(filtered);
  }

  // Medical report operations
  async createReport(reportData: Omit<MedicalReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalReport> {
    const reports = this.getReports();
    const newReport: MedicalReport = {
      ...reportData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    reports.push(newReport);
    this.saveReports(reports);
    return newReport;
  }

  getReports(): MedicalReport[] {
    const stored = localStorage.getItem(this.REPORTS_KEY);
    return stored ? JSON.parse(stored) : this.getDefaultReports();
  }

  async updateReport(id: string, updates: Partial<MedicalReport>): Promise<MedicalReport> {
    const reports = this.getReports();
    const index = reports.findIndex(r => r.id === id);
    
    if (index === -1) {
      throw new Error('Report not found');
    }
    
    reports[index] = {
      ...reports[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveReports(reports);
    return reports[index];
  }

  // Audio recording operations
  async createRecording(recordingData: Omit<AudioRecording, 'id' | 'createdAt'>): Promise<AudioRecording> {
    const recordings = this.getRecordings();
    const newRecording: AudioRecording = {
      ...recordingData,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    
    recordings.push(newRecording);
    this.saveRecordings(recordings);
    return newRecording;
  }

  getRecordings(): AudioRecording[] {
    const stored = localStorage.getItem(this.RECORDINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Search operations
  searchPatients(query: string): Patient[] {
    const patients = this.getPatients();
    const lowerQuery = query.toLowerCase();
    
    return patients.filter(patient => 
      patient.firstName.toLowerCase().includes(lowerQuery) ||
      patient.lastName.toLowerCase().includes(lowerQuery) ||
      patient.email.toLowerCase().includes(lowerQuery) ||
      patient.phone.includes(query)
    );
  }

  searchReports(query: string): MedicalReport[] {
    const reports = this.getReports();
    const lowerQuery = query.toLowerCase();
    
    return reports.filter(report => 
      report.patientName.toLowerCase().includes(lowerQuery) ||
      report.consultationId.toLowerCase().includes(lowerQuery) ||
      report.transcription.toLowerCase().includes(lowerQuery)
    );
  }

  // Statistics
  getStatistics() {
    const patients = this.getPatients();
    const reports = this.getReports();
    const recordings = this.getRecordings();
    
    const today = new Date().toDateString();
    const todayReports = reports.filter(r => 
      new Date(r.createdAt).toDateString() === today
    );
    
    const completedReports = reports.filter(r => r.status === 'completed');
    const avgConfidence = completedReports.length > 0 
      ? completedReports.reduce((sum, r) => sum + r.confidence, 0) / completedReports.length 
      : 0;

    return {
      totalPatients: patients.length,
      totalReports: reports.length,
      todayReports: todayReports.length,
      totalRecordings: recordings.length,
      averageConfidence: Math.round(avgConfidence * 100),
      completedReports: completedReports.length,
      pendingReports: reports.filter(r => r.status === 'draft').length
    };
  }

  // Private helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private savePatients(patients: Patient[]): void {
    localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(patients));
  }

  private saveReports(reports: MedicalReport[]): void {
    localStorage.setItem(this.REPORTS_KEY, JSON.stringify(reports));
  }

  private saveRecordings(recordings: AudioRecording[]): void {
    localStorage.setItem(this.RECORDINGS_KEY, JSON.stringify(recordings));
  }

  private getDefaultPatients(): Patient[] {
    return [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1985-03-15',
        gender: 'Male',
        phone: '+1 (555) 123-4567',
        email: 'john.doe@email.com',
        address: '123 Main St, City, State 12345',
        bloodType: 'A+',
        allergies: ['Penicillin'],
        medications: ['Aspirin 81mg daily', 'Lisinopril 10mg daily'],
        medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
        insuranceProvider: 'Blue Cross Blue Shield',
        insuranceNumber: 'BC123456789',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1992-07-22',
        gender: 'Female',
        phone: '+1 (555) 987-6543',
        email: 'jane.smith@email.com',
        address: '456 Oak Ave, City, State 12345',
        bloodType: 'O-',
        allergies: ['Latex'],
        medications: ['Birth Control'],
        medicalHistory: ['Asthma'],
        insuranceProvider: 'Aetna',
        insuranceNumber: 'AET987654321',
        createdAt: '2024-01-14T14:15:00Z',
        updatedAt: '2024-01-14T14:15:00Z'
      },
      {
        id: '3',
        firstName: 'Priya',
        lastName: 'Nair',
        dateOfBirth: '1988-11-08',
        gender: 'Female',
        phone: '+91 98765 43210',
        email: 'priya.nair@email.com',
        address: 'Kochi, Kerala, India',
        bloodType: 'B+',
        allergies: ['No known allergies'],
        medications: ['Vitamin D supplements'],
        medicalHistory: ['Migraine'],
        createdAt: '2024-01-13T09:20:00Z',
        updatedAt: '2024-01-13T09:20:00Z'
      }
    ];
  }

  private getDefaultReports(): MedicalReport[] {
    return [
      {
        id: '1',
        patientId: '1',
        patientName: 'John Doe',
        consultationId: 'CONSULT-1737518234567',
        transcription: 'Patient presents with chest pain and shortness of breath...',
        extractedData: {
          symptoms: ['Chest pain', 'Shortness of breath'],
          diagnosedConditions: ['Acute chest pain'],
          medications: ['Aspirin 81mg daily']
        },
        treatmentSuggestions: {
          medications: ['Nitroglycerin PRN'],
          labTests: ['ECG', 'Cardiac enzymes']
        },
        confidence: 0.94,
        language: 'en',
        status: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        patientId: '2',
        patientName: 'Jane Smith',
        consultationId: 'CONSULT-1737518234568',
        transcription: 'Patient reports worsening asthma symptoms...',
        extractedData: {
          symptoms: ['Wheezing', 'Shortness of breath'],
          diagnosedConditions: ['Asthma exacerbation'],
          medications: ['Albuterol inhaler']
        },
        treatmentSuggestions: {
          medications: ['Increase inhaler use'],
          labTests: ['Peak flow measurement']
        },
        confidence: 0.91,
        language: 'en',
        status: 'completed',
        createdAt: '2024-01-14T14:15:00Z',
        updatedAt: '2024-01-14T14:15:00Z'
      }
    ];
  }

  // Clear all data (for testing)
  clearAllData(): void {
    localStorage.removeItem(this.PATIENTS_KEY);
    localStorage.removeItem(this.REPORTS_KEY);
    localStorage.removeItem(this.RECORDINGS_KEY);
  }
}

export const database = new DatabaseService();