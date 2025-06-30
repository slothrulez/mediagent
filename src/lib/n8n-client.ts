import axios, { AxiosInstance } from 'axios';

export interface N8nCredentials {
  baseUrl: string;
  apiKey?: string;
  email?: string;
  password?: string;
}

export interface N8nWorkflow {
  id?: string;
  name: string;
  nodes: N8nNode[];
  connections: Record<string, any>;
  active: boolean;
  settings?: Record<string, any>;
  staticData?: Record<string, any>;
  meta?: Record<string, any>;
  pinData?: Record<string, any>;
  versionId?: string;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  webhookId?: string;
  disabled?: boolean;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: string;
  stoppedAt?: string;
  workflowData: N8nWorkflow;
  data: {
    resultData: {
      runData: Record<string, any>;
      error?: {
        message: string;
        stack: string;
      };
    };
  };
}

export class N8nClient {
  private client: AxiosInstance;
  private credentials: N8nCredentials;
  private isConnected: boolean = false;

  constructor(credentials: N8nCredentials) {
    this.credentials = credentials;
    this.client = axios.create({
      baseURL: credentials.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      if (this.credentials.apiKey) {
        config.headers['X-N8N-API-KEY'] = this.credentials.apiKey;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('n8n API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/rest/active');
      this.isConnected = response.status === 200;
      return this.isConnected;
    } catch (error) {
      console.error('n8n connection test failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async authenticate(): Promise<boolean> {
    if (this.credentials.apiKey) {
      return this.testConnection();
    }

    if (this.credentials.email && this.credentials.password) {
      try {
        const response = await this.client.post('/rest/login', {
          email: this.credentials.email,
          password: this.credentials.password,
        });

        if (response.data && response.data.data) {
          // Store session cookie or token if needed
          this.isConnected = true;
          return true;
        }
      } catch (error) {
        console.error('n8n authentication failed:', error);
      }
    }

    return false;
  }

  // Workflow Management
  async createWorkflow(workflow: Omit<N8nWorkflow, 'id'>): Promise<N8nWorkflow> {
    const response = await this.client.post('/rest/workflows', workflow);
    return response.data.data;
  }

  async getWorkflows(): Promise<N8nWorkflow[]> {
    const response = await this.client.get('/rest/workflows');
    return response.data.data;
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    const response = await this.client.get(`/rest/workflows/${id}`);
    return response.data.data;
  }

  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    const response = await this.client.patch(`/rest/workflows/${id}`, workflow);
    return response.data.data;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.client.delete(`/rest/workflows/${id}`);
  }

  async activateWorkflow(id: string): Promise<void> {
    await this.client.post(`/rest/workflows/${id}/activate`);
  }

  async deactivateWorkflow(id: string): Promise<void> {
    await this.client.post(`/rest/workflows/${id}/deactivate`);
  }

  // Execution Management
  async executeWorkflow(id: string, inputData?: Record<string, any>): Promise<N8nExecution> {
    const response = await this.client.post(`/rest/workflows/${id}/execute`, {
      data: inputData || {},
    });
    return response.data.data;
  }

  async getExecutions(workflowId?: string, limit: number = 20): Promise<N8nExecution[]> {
    const params = new URLSearchParams();
    if (workflowId) params.append('workflowId', workflowId);
    params.append('limit', limit.toString());

    const response = await this.client.get(`/rest/executions?${params}`);
    return response.data.data;
  }

  async getExecution(id: string): Promise<N8nExecution> {
    const response = await this.client.get(`/rest/executions/${id}`);
    return response.data.data;
  }

  async stopExecution(id: string): Promise<void> {
    await this.client.post(`/rest/executions/${id}/stop`);
  }

  async deleteExecution(id: string): Promise<void> {
    await this.client.delete(`/rest/executions/${id}`);
  }

  // Node Types
  async getNodeTypes(): Promise<any[]> {
    const response = await this.client.get('/rest/node-types');
    return response.data.data;
  }

  // Credentials Management
  async getCredentialTypes(): Promise<any[]> {
    const response = await this.client.get('/rest/credential-types');
    return response.data.data;
  }

  async createCredential(credential: any): Promise<any> {
    const response = await this.client.post('/rest/credentials', credential);
    return response.data.data;
  }

  async getCredentials(): Promise<any[]> {
    const response = await this.client.get('/rest/credentials');
    return response.data.data;
  }

  // Webhooks
  async getWebhookUrl(workflowId: string, nodeId: string): Promise<string> {
    return `${this.credentials.baseUrl}/webhook/${workflowId}/${nodeId}`;
  }

  // Health Check
  async getHealth(): Promise<{ status: string; [key: string]: any }> {
    const response = await this.client.get('/healthz');
    return response.data;
  }

  // Connection Status
  getConnectionStatus(): { connected: boolean; baseUrl: string } {
    return {
      connected: this.isConnected,
      baseUrl: this.credentials.baseUrl,
    };
  }

  // Utility Methods
  generateNodeId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  validateWorkflow(workflow: N8nWorkflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!workflow.name || workflow.name.trim() === '') {
      errors.push('Workflow name is required');
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Check for trigger node
    const hasTrigger = workflow.nodes.some(node => 
      node.type.includes('trigger') || node.type.includes('webhook')
    );
    if (!hasTrigger) {
      errors.push('Workflow must have a trigger node');
    }

    // Validate node connections
    const nodeIds = new Set(workflow.nodes.map(node => node.id));
    for (const [sourceNode, connections] of Object.entries(workflow.connections)) {
      if (!nodeIds.has(sourceNode)) {
        errors.push(`Connection references non-existent node: ${sourceNode}`);
      }
      
      if (connections.main) {
        for (const outputConnections of connections.main) {
          for (const connection of outputConnections) {
            if (!nodeIds.has(connection.node)) {
              errors.push(`Connection references non-existent target node: ${connection.node}`);
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Default n8n client instance
const defaultCredentials: N8nCredentials = {
  baseUrl: import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678',
  apiKey: import.meta.env.VITE_N8N_API_KEY,
  email: import.meta.env.VITE_N8N_EMAIL,
  password: import.meta.env.VITE_N8N_PASSWORD,
};

export const n8nClient = new N8nClient(defaultCredentials);

// Mock client for demo mode
export class MockN8nClient extends N8nClient {
  constructor() {
    super({ baseUrl: 'http://localhost:5678' });
    this.isConnected = true;
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async authenticate(): Promise<boolean> {
    return true;
  }

  async createWorkflow(workflow: Omit<N8nWorkflow, 'id'>): Promise<N8nWorkflow> {
    return {
      ...workflow,
      id: `mock-workflow-${Date.now()}`,
    };
  }

  async getWorkflows(): Promise<N8nWorkflow[]> {
    return [];
  }

  async executeWorkflow(id: string, inputData?: Record<string, any>): Promise<N8nExecution> {
    return {
      id: `mock-execution-${Date.now()}`,
      finished: true,
      mode: 'manual',
      startedAt: new Date().toISOString(),
      stoppedAt: new Date().toISOString(),
      workflowData: {} as N8nWorkflow,
      data: {
        resultData: {
          runData: {
            'Start': [{
              data: {
                main: [[{ json: { message: 'Mock execution completed successfully' } }]]
              }
            }]
          }
        }
      }
    };
  }

  async getExecutions(): Promise<N8nExecution[]> {
    return [];
  }

  getConnectionStatus() {
    return {
      connected: true,
      baseUrl: 'http://localhost:5678 (Mock Mode)',
    };
  }
}

export const mockN8nClient = new MockN8nClient();