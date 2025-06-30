import { Agent, MemoryBlock, ReasoningStep, AuditTrail } from '../types';
import { memoryOperations, auditOperations } from './supabase';
import { executeTool } from './tools';
import { v4 as uuidv4 } from 'uuid';

export class ReasoningEngine {
  private agent: Agent;
  private isRunning: boolean = false;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log(`Starting reasoning engine for agent: ${this.agent.name}`);

    try {
      await this.reasoningLoop();
    } catch (error) {
      console.error('Reasoning engine error:', error);
      await this.logError(error as Error);
    } finally {
      this.isRunning = false;
    }
  }

  stop(): void {
    this.isRunning = false;
  }

  private async reasoningLoop(): Promise<void> {
    const maxIterations = 5; // Prevent infinite loops in demo
    let iteration = 0;

    while (this.isRunning && iteration < maxIterations) {
      iteration++;
      
      // Step 1: Plan
      const plan = await this.planStep();
      await this.logReasoningStep('plan', plan);

      // Step 2: Act
      const action = await this.actStep(plan);
      await this.logReasoningStep('act', action.description);

      // Step 3: Observe
      const observation = await this.observeStep(action.result);
      await this.logReasoningStep('observe', observation);

      // Step 4: Reflect
      const reflection = await this.reflectStep(plan, action, observation);
      await this.logReasoningStep('reflect', reflection);

      // Check if goal is achieved
      if (reflection.includes('goal achieved') || reflection.includes('completed')) {
        break;
      }

      // Brief pause between iterations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async planStep(): Promise<string> {
    const recentMemory = await memoryOperations.getAgentMemory(this.agent.id, 5);
    const currentGoal = this.agent.goals[0] || 'Complete assigned tasks';
    
    const plan = `Analyzing goal: "${currentGoal}". 
    Based on recent memory (${recentMemory.length} entries), I will:
    1. Use available tools: ${this.agent.tools.join(', ')}
    2. Gather relevant information
    3. Process and synthesize findings
    4. Store results for future reference`;

    await this.addMemoryBlock('rationale', plan);
    return plan;
  }

  private async actStep(plan: string): Promise<{ description: string; result: any }> {
    const availableTool = this.agent.tools[0] || 'WebSearch';
    const goal = this.agent.goals[0] || 'research task';
    
    try {
      const result = await executeTool(availableTool, { 
        query: goal,
        context: plan 
      });

      const description = `Executed ${availableTool} tool with query related to: ${goal}`;
      
      await this.addMemoryBlock('action', description);
      await this.addMemoryBlock('result', JSON.stringify(result));

      // Log audit trail
      await auditOperations.addAuditEntry({
        agent_id: this.agent.id,
        action: description,
        reasoning: `Selected ${availableTool} as most appropriate tool for current goal`,
        outcome: `Successfully retrieved ${result.results?.length || 'relevant'} results`,
        timestamp: new Date().toISOString(),
        explainability_score: 0.85
      });

      return { description, result };
    } catch (error) {
      const errorDescription = `Failed to execute ${availableTool}: ${error}`;
      await this.addMemoryBlock('action', errorDescription);
      return { description: errorDescription, result: null };
    }
  }

  private async observeStep(actionResult: any): Promise<string> {
    let observation: string;

    if (actionResult && actionResult.results) {
      observation = `Observed ${actionResult.results.length} results from tool execution. 
      Key findings: ${actionResult.summary || 'Data successfully retrieved and processed.'}
      Quality assessment: High relevance to current goal.`;
    } else {
      observation = `Tool execution completed but no specific results to analyze. 
      This may indicate need for different approach or tool selection.`;
    }

    await this.addMemoryBlock('observation', observation);
    return observation;
  }

  private async reflectStep(plan: string, action: any, observation: string): Promise<string> {
    const reflection = `Reflection on current iteration:
    - Plan execution: ${action.result ? 'Successful' : 'Partial'}
    - Data quality: ${action.result ? 'Good' : 'Needs improvement'}
    - Goal progress: Making steady progress toward completion
    - Next steps: ${action.result ? 'Continue with analysis and synthesis' : 'Try alternative approach'}
    - Confidence level: ${action.result ? '85%' : '60%'}
    
    ${this.agent.goals.length > 0 ? 'Goal achieved: Primary objective completed successfully.' : 'Continuing toward goal completion.'}`;

    await this.addMemoryBlock('rationale', reflection);
    return reflection;
  }

  private async logReasoningStep(stepType: ReasoningStep['step_type'], content: string): Promise<void> {
    const step: Omit<ReasoningStep, 'id'> = {
      agent_id: this.agent.id,
      step_type: stepType,
      content,
      timestamp: new Date().toISOString(),
      confidence: Math.random() * 0.3 + 0.7 // Random confidence between 0.7-1.0
    };

    // In a real implementation, this would be stored in the database
    console.log(`[${stepType.toUpperCase()}] ${this.agent.name}: ${content}`);
  }

  private async addMemoryBlock(type: MemoryBlock['type'], content: string): Promise<void> {
    await memoryOperations.addMemoryBlock({
      agent_id: this.agent.id,
      timestamp: new Date().toISOString(),
      content,
      type
    });
  }

  private async logError(error: Error): Promise<void> {
    await this.addMemoryBlock('observation', `Error occurred: ${error.message}`);
    
    await auditOperations.addAuditEntry({
      agent_id: this.agent.id,
      action: 'Error handling',
      reasoning: 'System encountered an error during reasoning process',
      outcome: `Error logged: ${error.message}`,
      timestamp: new Date().toISOString(),
      explainability_score: 1.0
    });
  }
}