import { Workflow } from '../types';

export interface N8nConnection {
  baseUrl: string;
  apiKey?: string;
  connected: boolean;
}

export interface N8nWorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  startedAt: string;
  finishedAt?: string;
  data?: any;
  error?: string;
}

export class N8nIntegration {
  private connection: N8nConnection;

  constructor(baseUrl: string = 'http://localhost:5678', apiKey?: string) {
    this.connection = {
      baseUrl,
      apiKey,
      connected: false
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.connection.baseUrl}/rest/active`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      this.connection.connected = response.ok;
      return this.connection.connected;
    } catch (error) {
      console.error('n8n connection test failed:', error);
      this.connection.connected = false;
      return false;
    }
  }

  async deployWorkflow(workflow: Workflow): Promise<{ success: boolean; n8nWorkflowId?: string; error?: string }> {
    try {
      // First, create the workflow in n8n
      const createResponse = await fetch(`${this.connection.baseUrl}/rest/workflows`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: workflow.title,
          nodes: workflow.n8n_json.nodes || [],
          connections: workflow.n8n_json.connections || {},
          active: workflow.status === 'active',
          settings: workflow.n8n_json.settings || {}
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create workflow: ${createResponse.statusText}`);
      }

      const createdWorkflow = await createResponse.json();

      // If the workflow should be active, activate it
      if (workflow.status === 'active') {
        await this.activateWorkflow(createdWorkflow.id);
      }

      return {
        success: true,
        n8nWorkflowId: createdWorkflow.id
      };
    } catch (error) {
      console.error('Failed to deploy workflow to n8n:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async activateWorkflow(n8nWorkflowId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.connection.baseUrl}/rest/workflows/${n8nWorkflowId}/activate`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to activate workflow:', error);
      return false;
    }
  }

  async deactivateWorkflow(n8nWorkflowId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.connection.baseUrl}/rest/workflows/${n8nWorkflowId}/deactivate`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to deactivate workflow:', error);
      return false;
    }
  }

  async executeWorkflow(n8nWorkflowId: string, inputData?: any): Promise<N8nWorkflowExecution | null> {
    try {
      const response = await fetch(`${this.connection.baseUrl}/rest/workflows/${n8nWorkflowId}/execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ data: inputData || {} })
      });

      if (!response.ok) {
        throw new Error(`Failed to execute workflow: ${response.statusText}`);
      }

      const execution = await response.json();
      
      return {
        id: execution.id,
        workflowId: n8nWorkflowId,
        status: execution.finished ? (execution.data.resultData.error ? 'error' : 'success') : 'running',
        startedAt: execution.startedAt,
        finishedAt: execution.stoppedAt,
        data: execution.data,
        error: execution.data.resultData.error?.message
      };
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      return null;
    }
  }

  async getWorkflowExecutions(n8nWorkflowId: string, limit: number = 10): Promise<N8nWorkflowExecution[]> {
    try {
      const response = await fetch(
        `${this.connection.baseUrl}/rest/executions?filter={"workflowId":"${n8nWorkflowId}"}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get executions: ${response.statusText}`);
      }

      const executions = await response.json();
      
      return executions.data.map((exec: any) => ({
        id: exec.id,
        workflowId: n8nWorkflowId,
        status: exec.finished ? (exec.data.resultData.error ? 'error' : 'success') : 'running',
        startedAt: exec.startedAt,
        finishedAt: exec.stoppedAt,
        data: exec.data,
        error: exec.data.resultData.error?.message
      }));
    } catch (error) {
      console.error('Failed to get workflow executions:', error);
      return [];
    }
  }

  async deleteWorkflow(n8nWorkflowId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.connection.baseUrl}/rest/workflows/${n8nWorkflowId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      return false;
    }
  }

  getConnectionStatus(): N8nConnection {
    return { ...this.connection };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.connection.apiKey) {
      headers['X-N8N-API-KEY'] = this.connection.apiKey;
    }

    return headers;
  }

  // Mock mode for demo purposes when n8n is not available
  static createMockInstance(): N8nIntegration {
    const mock = new N8nIntegration();
    mock.connection.connected = true;

    // Override methods with mock implementations
    mock.testConnection = async () => true;
    mock.deployWorkflow = async (workflow) => ({
      success: true,
      n8nWorkflowId: `mock-${Date.now()}`
    });
    mock.activateWorkflow = async () => true;
    mock.deactivateWorkflow = async () => true;
    mock.executeWorkflow = async (id) => ({
      id: `exec-${Date.now()}`,
      workflowId: id,
      status: 'success',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      data: { message: 'Mock execution completed successfully' }
    });
    mock.getWorkflowExecutions = async () => [];
    mock.deleteWorkflow = async () => true;

    return mock;
  }
}

// Global n8n instance
export const n8nClient = N8nIntegration.createMockInstance();