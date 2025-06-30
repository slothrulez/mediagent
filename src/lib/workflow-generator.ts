import { Workflow } from '../types';
import { n8nClient } from './n8n-client';

export interface WorkflowGenerationResult {
  title: string;
  summary: string;
  tools: string[];
  schedule?: string;
  n8nWorkflow: any;
}

export class WorkflowGenerator {
  static async generateFromPrompt(prompt: string): Promise<WorkflowGenerationResult> {
    // Analyze the prompt to extract key components
    const analysis = this.analyzePrompt(prompt);
    
    // Generate n8n workflow JSON
    const n8nWorkflow = this.generateN8nWorkflow(analysis);
    
    return {
      title: analysis.title,
      summary: analysis.summary,
      tools: analysis.tools,
      schedule: analysis.schedule,
      n8nWorkflow
    };
  }

  static async deployToN8n(workflow: Workflow): Promise<{ success: boolean; n8nWorkflowId?: string; error?: string }> {
    try {
      const result = await n8nClient.createWorkflow({
        name: workflow.title,
        nodes: workflow.n8n_json.nodes || [],
        connections: workflow.n8n_json.connections || {},
        active: workflow.status === 'active',
        settings: workflow.n8n_json.settings || {}
      });
      
      return {
        success: true,
        n8nWorkflowId: result.id
      };
    } catch (error) {
      console.error('Failed to deploy to n8n:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async executeWorkflow(n8nWorkflowId: string, inputData?: any) {
    try {
      const execution = await n8nClient.executeWorkflow(n8nWorkflowId, inputData);
      return execution;
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      return null;
    }
  }

  private static analyzePrompt(prompt: string) {
    const lowerPrompt = prompt.toLowerCase();
    
    // Extract schedule information
    let schedule = undefined;
    if (lowerPrompt.includes('every day') || lowerPrompt.includes('daily')) {
      schedule = 'daily at 9:00 AM';
    } else if (lowerPrompt.includes('every hour') || lowerPrompt.includes('hourly')) {
      schedule = 'every hour';
    } else if (lowerPrompt.includes('every week') || lowerPrompt.includes('weekly')) {
      schedule = 'weekly on Monday';
    } else if (lowerPrompt.includes('every month') || lowerPrompt.includes('monthly')) {
      schedule = 'monthly on the 1st';
    }

    // Extract tools based on keywords
    const tools = [];
    if (lowerPrompt.includes('slack') || lowerPrompt.includes('send message')) {
      tools.push('Slack');
    }
    if (lowerPrompt.includes('email') || lowerPrompt.includes('send email')) {
      tools.push('Email');
    }
    if (lowerPrompt.includes('news') || lowerPrompt.includes('search') || lowerPrompt.includes('web')) {
      tools.push('WebSearch');
    }
    if (lowerPrompt.includes('summarize') || lowerPrompt.includes('analyze')) {
      tools.push('TextAnalyzer');
    }
    if (lowerPrompt.includes('webhook') || lowerPrompt.includes('api')) {
      tools.push('HTTP Request');
    }
    if (lowerPrompt.includes('database') || lowerPrompt.includes('sql')) {
      tools.push('Database');
    }
    if (lowerPrompt.includes('file') || lowerPrompt.includes('csv') || lowerPrompt.includes('excel')) {
      tools.push('File Operations');
    }
    if (lowerPrompt.includes('twitter') || lowerPrompt.includes('social media')) {
      tools.push('Twitter');
    }
    if (lowerPrompt.includes('google sheets') || lowerPrompt.includes('spreadsheet')) {
      tools.push('Google Sheets');
    }

    // If no specific tools detected, add default ones
    if (tools.length === 0) {
      tools.push('HTTP Request', 'TextAnalyzer');
    }

    // Generate title and summary
    const title = this.generateTitle(prompt);
    const summary = this.generateSummary(prompt, tools, schedule);

    return {
      title,
      summary,
      tools,
      schedule
    };
  }

  private static generateTitle(prompt: string): string {
    // Extract action and subject from prompt
    const words = prompt.split(' ');
    if (words.length > 12) {
      return words.slice(0, 10).join(' ') + '...';
    }
    return prompt;
  }

  private static generateSummary(prompt: string, tools: string[], schedule?: string): string {
    let summary = `Automated workflow that ${prompt.toLowerCase()}`;
    
    if (schedule) {
      summary += ` running ${schedule}`;
    }
    
    if (tools.length > 0) {
      summary += ` using ${tools.slice(0, 3).join(', ')}`;
      if (tools.length > 3) {
        summary += ` and ${tools.length - 3} more tools`;
      }
    }
    
    return summary + '.';
  }

  private static generateN8nWorkflow(analysis: any): any {
    const nodes = [];
    const connections: any = {};
    let nodeId = 1;

    // Add trigger node
    let triggerNode;
    if (analysis.schedule) {
      triggerNode = {
        id: `node-${nodeId}`,
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.cron',
        typeVersion: 1,
        position: [250, 300],
        parameters: {
          rule: this.getScheduleRule(analysis.schedule)
        }
      };
    } else {
      triggerNode = {
        id: `node-${nodeId}`,
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: [250, 300],
        parameters: {}
      };
    }
    
    nodes.push(triggerNode);
    nodeId++;

    // Add tool nodes based on detected tools
    let xPosition = 450;
    let previousNodeName = triggerNode.name;
    
    analysis.tools.forEach((tool: string) => {
      const node = this.createToolNode(tool, nodeId++, [xPosition, 300]);
      if (node) {
        nodes.push(node);
        
        // Create connection from previous node to current node
        if (!connections[previousNodeName]) {
          connections[previousNodeName] = { main: [[]] };
        }
        connections[previousNodeName].main[0].push({
          node: node.name,
          type: 'main',
          index: 0
        });
        
        previousNodeName = node.name;
        xPosition += 200;
      }
    });

    return {
      name: analysis.title,
      nodes,
      connections,
      active: false,
      settings: {
        executionOrder: 'v1'
      },
      staticData: null,
      meta: {
        templateCredsSetupCompleted: true
      },
      pinData: {},
      versionId: `${Date.now()}`,
      id: `workflow-${Date.now()}`
    };
  }

  private static getScheduleRule(schedule: string): any {
    if (schedule.includes('daily')) {
      return {
        minute: 0,
        hour: 9,
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '*'
      };
    } else if (schedule.includes('hourly')) {
      return {
        minute: 0,
        hour: '*',
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '*'
      };
    } else if (schedule.includes('weekly')) {
      return {
        minute: 0,
        hour: 9,
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '1'
      };
    } else if (schedule.includes('monthly')) {
      return {
        minute: 0,
        hour: 9,
        dayOfMonth: '1',
        month: '*',
        dayOfWeek: '*'
      };
    }
    
    return {
      minute: 0,
      hour: 9,
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*'
    };
  }

  private static createToolNode(tool: string, id: number, position: [number, number]): any {
    const baseNode = {
      id: `node-${id}`,
      typeVersion: 1,
      position
    };

    switch (tool) {
      case 'Slack':
        return {
          ...baseNode,
          name: 'Send Slack Message',
          type: 'n8n-nodes-base.slack',
          parameters: {
            operation: 'postMessage',
            channel: '#general',
            text: '={{$json["message"] || "Automated message from AutoFlow"}}'
          }
        };
      
      case 'Email':
        return {
          ...baseNode,
          name: 'Send Email',
          type: 'n8n-nodes-base.emailSend',
          parameters: {
            toEmail: 'user@example.com',
            subject: '={{$json["subject"] || "AutoFlow Notification"}}',
            text: '={{$json["content"] || $json["message"]}}'
          }
        };
      
      case 'WebSearch':
        return {
          ...baseNode,
          name: 'Web Search',
          type: 'n8n-nodes-base.httpRequest',
          parameters: {
            url: 'https://api.duckduckgo.com/',
            method: 'GET',
            qs: {
              q: '={{$json["query"] || "latest news"}}',
              format: 'json',
              no_html: '1',
              skip_disambig: '1'
            }
          }
        };
      
      case 'TextAnalyzer':
        return {
          ...baseNode,
          name: 'Analyze Text',
          type: 'n8n-nodes-base.function',
          parameters: {
            functionCode: `
              const text = items[0].json.text || items[0].json.content || '';
              const words = text.split(' ');
              const summary = words.slice(0, 50).join(' ') + (words.length > 50 ? '...' : '');
              
              return [{
                json: {
                  summary,
                  wordCount: words.length,
                  characterCount: text.length,
                  analyzedAt: new Date().toISOString(),
                  sentiment: text.toLowerCase().includes('good') || text.toLowerCase().includes('great') ? 'positive' : 'neutral'
                }
              }];
            `
          }
        };
      
      case 'HTTP Request':
        return {
          ...baseNode,
          name: 'HTTP Request',
          type: 'n8n-nodes-base.httpRequest',
          parameters: {
            url: 'https://api.example.com/webhook',
            method: 'POST',
            body: {
              message: '={{$json["message"]}}',
              timestamp: '={{new Date().toISOString()}}'
            }
          }
        };

      case 'Database':
        return {
          ...baseNode,
          name: 'Database Query',
          type: 'n8n-nodes-base.postgres',
          parameters: {
            operation: 'select',
            query: 'SELECT * FROM data WHERE created_at > NOW() - INTERVAL \'1 day\''
          }
        };

      case 'File Operations':
        return {
          ...baseNode,
          name: 'Read File',
          type: 'n8n-nodes-base.readBinaryFile',
          parameters: {
            filePath: '/tmp/data.csv'
          }
        };

      case 'Twitter':
        return {
          ...baseNode,
          name: 'Post Tweet',
          type: 'n8n-nodes-base.twitter',
          parameters: {
            operation: 'tweet',
            text: '={{$json["message"] || "Automated post from AutoFlow"}}'
          }
        };

      case 'Google Sheets':
        return {
          ...baseNode,
          name: 'Update Google Sheet',
          type: 'n8n-nodes-base.googleSheets',
          parameters: {
            operation: 'append',
            sheetId: 'your-sheet-id',
            range: 'A:Z',
            values: '={{[$json]}}'
          }
        };
      
      default:
        return null;
    }
  }

  static exportWorkflowAsJSON(workflow: any): string {
    return JSON.stringify(workflow, null, 2);
  }

  static downloadWorkflow(workflow: any, filename: string) {
    const json = this.exportWorkflowAsJSON(workflow);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async importWorkflowFromJSON(jsonString: string): Promise<any> {
    try {
      const workflow = JSON.parse(jsonString);
      
      // Validate basic n8n workflow structure
      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        throw new Error('Invalid workflow: missing nodes array');
      }
      
      if (!workflow.connections || typeof workflow.connections !== 'object') {
        throw new Error('Invalid workflow: missing connections object');
      }
      
      return workflow;
    } catch (error) {
      throw new Error(`Failed to parse workflow JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}