export interface Agent {
  id: string;
  name: string;
  goals: string[];
  tools: string[];
  memory_id: string;
  ethics: string[];
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  title: string;
  prompt_text: string;
  agent_config: {
    goal: string;
    tools: string[];
    schedule?: string;
    triggers?: string[];
  };
  n8n_json: any;
  status: 'draft' | 'active' | 'paused' | 'error';
  last_run?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  workflow_id: string;
  timestamp: string;
  output: any;
  success: boolean;
  message: string;
}

export interface MemoryBlock {
  id: string;
  agent_id: string;
  timestamp: string;
  content: string;
  type: 'observation' | 'action' | 'result' | 'rationale' | 'goal';
  metadata?: Record<string, any>;
}

export interface GoalState {
  id: string;
  agent_id: string;
  current_goal: string;
  last_action: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  name: string;
  description: string;
  input_format: Record<string, string>;
  output_format: Record<string, string>;
  endpoint?: string;
  enabled: boolean;
}

export interface ReasoningStep {
  id: string;
  agent_id: string;
  step_type: 'plan' | 'act' | 'observe' | 'reflect';
  content: string;
  tool_used?: string;
  timestamp: string;
  confidence: number;
}

export interface AuditTrail {
  id: string;
  agent_id: string;
  action: string;
  reasoning: string;
  outcome: string;
  timestamp: string;
  explainability_score: number;
}