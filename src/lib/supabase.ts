import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Patient operations
export const patientOperations = {
  async createPatient(patient: any) {
    const { data, error } = await supabase
      .from('patients')
      .insert([patient])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getPatients(userId: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async updatePatient(id: string, updates: any) {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Audio recording operations
export const audioOperations = {
  async saveRecording(recording: any) {
    const { data, error } = await supabase
      .from('audio_recordings')
      .insert([recording])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getRecordings(userId: string) {
    const { data, error } = await supabase
      .from('audio_recordings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// Medical report operations
export const reportOperations = {
  async saveReport(report: any) {
    const { data, error } = await supabase
      .from('medical_reports')
      .insert([report])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getReports(userId: string) {
    const { data, error } = await supabase
      .from('medical_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};