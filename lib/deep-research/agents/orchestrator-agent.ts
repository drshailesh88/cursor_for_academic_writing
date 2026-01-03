// Deep Research - Orchestrator Agent
// Central coordinator for all research agents

import {
  BaseAgent,
  RegisterAgent,
  type AgentConfig,
  type AgentContext,
  type AgentResult,
} from './base-agent';
import type {
  AgentType,
  ResearchSession,
  ResearchStatus,
  AgentState,
} from '../types';

/**
 * Orchestrator Agent Configuration
 */
const ORCHESTRATOR_CONFIG: AgentConfig = {
  type: 'orchestrator',
  name: 'Research Orchestrator',
  description: 'Coordinates all research agents and manages the overall research workflow',
  systemPrompt: `You are the Research Orchestrator, responsible for coordinating a multi-agent research system.

Your responsibilities:
1. Analyze research requests and determine the appropriate workflow
2. Delegate tasks to specialized agents in the correct order
3. Monitor progress and handle errors gracefully
4. Ensure all agents complete their work before synthesis
5. Manage the overall research session state

Workflow order:
1. Clarifier → Refine research topic
2. Perspective Analyst → Generate expert perspectives
3. Search Strategist → Create search strategies
4. Researcher (parallel) → Execute searches
5. Citation Analyst → Analyze citations and consensus
6. Synthesizer → Combine findings
7. Quality Reviewer → Review and iterate
8. Writer → Generate final report

Always prioritize research quality over speed.`,
  temperature: 0.3,
  maxTokens: 4000,
};

/**
 * Research workflow stage definition
 */
interface WorkflowStage {
  agent: AgentType;
  requiredInputs: string[];
  outputs: string[];
  canRunParallel: boolean;
  retryable: boolean;
  maxRetries: number;
}

/**
 * Orchestration plan for a research session
 */
interface OrchestrationPlan {
  stages: WorkflowStage[];
  currentStageIndex: number;
  completedStages: string[];
  failedStages: string[];
}

/**
 * Result from orchestrator execution
 */
interface OrchestratorResult {
  plan: OrchestrationPlan;
  nextAgent: AgentType | null;
  sessionStatus: ResearchStatus;
  agentStates: Map<AgentType, AgentState>;
}

/**
 * Orchestrator Agent
 *
 * The central coordinator for the Deep Research system. Manages the workflow
 * of all specialized agents, handles errors, and ensures research quality.
 */
@RegisterAgent('orchestrator')
export class OrchestratorAgent extends BaseAgent {
  private plan: OrchestrationPlan | null = null;
  private agentStates: Map<AgentType, AgentState> = new Map();

  constructor(sessionId: string) {
    super(ORCHESTRATOR_CONFIG, sessionId);
  }

  /**
   * Define the standard research workflow
   */
  private getWorkflowStages(): WorkflowStage[] {
    return [
      {
        agent: 'clarifier',
        requiredInputs: ['topic'],
        outputs: ['clarifications', 'refinedTopic'],
        canRunParallel: false,
        retryable: true,
        maxRetries: 2,
      },
      {
        agent: 'perspective_analyst',
        requiredInputs: ['refinedTopic', 'clarifications'],
        outputs: ['perspectives'],
        canRunParallel: false,
        retryable: true,
        maxRetries: 2,
      },
      {
        agent: 'search_strategist',
        requiredInputs: ['refinedTopic', 'perspectives'],
        outputs: ['searchStrategies'],
        canRunParallel: false,
        retryable: true,
        maxRetries: 2,
      },
      {
        agent: 'researcher',
        requiredInputs: ['searchStrategies'],
        outputs: ['sources', 'findings'],
        canRunParallel: true, // Multiple researcher instances
        retryable: true,
        maxRetries: 3,
      },
      {
        agent: 'citation_analyst',
        requiredInputs: ['sources'],
        outputs: ['citationGraph', 'consensus'],
        canRunParallel: false,
        retryable: true,
        maxRetries: 2,
      },
      {
        agent: 'synthesizer',
        requiredInputs: ['findings', 'perspectives', 'consensus'],
        outputs: ['synthesis'],
        canRunParallel: false,
        retryable: true,
        maxRetries: 3,
      },
      {
        agent: 'quality_reviewer',
        requiredInputs: ['synthesis', 'sources'],
        outputs: ['reviewFeedback', 'qualityScore'],
        canRunParallel: false,
        retryable: true,
        maxRetries: 2,
      },
      {
        agent: 'writer',
        requiredInputs: ['synthesis', 'reviewFeedback'],
        outputs: ['finalReport'],
        canRunParallel: false,
        retryable: true,
        maxRetries: 2,
      },
    ];
  }

  /**
   * Initialize orchestration plan for a new research session
   */
  private initializePlan(): OrchestrationPlan {
    return {
      stages: this.getWorkflowStages(),
      currentStageIndex: 0,
      completedStages: [],
      failedStages: [],
    };
  }

  /**
   * Determine the current status based on plan progress
   */
  private determineStatus(plan: OrchestrationPlan): ResearchStatus {
    if (plan.failedStages.length > 0) {
      return 'error';
    }

    const currentStage = plan.stages[plan.currentStageIndex];
    if (!currentStage) {
      return 'complete';
    }

    switch (currentStage.agent) {
      case 'clarifier':
        return 'clarifying';
      case 'perspective_analyst':
      case 'search_strategist':
        return 'planning';
      case 'researcher':
      case 'citation_analyst':
        return 'researching';
      case 'quality_reviewer':
        return 'reviewing';
      case 'synthesizer':
      case 'writer':
        return 'synthesizing';
      default:
        return 'researching';
    }
  }

  /**
   * Check if all required inputs for a stage are available
   */
  private hasRequiredInputs(stage: WorkflowStage, context: AgentContext): boolean {
    return stage.requiredInputs.every((input) => {
      return context.sharedMemory.has(input) ||
             context.previousAgentOutputs.has(input as AgentType);
    });
  }

  /**
   * Get the next agent to execute
   */
  private getNextAgent(plan: OrchestrationPlan, context: AgentContext): AgentType | null {
    if (plan.currentStageIndex >= plan.stages.length) {
      return null;
    }

    const currentStage = plan.stages[plan.currentStageIndex];

    // Check if we have all required inputs
    if (!this.hasRequiredInputs(currentStage, context)) {
      this.addMessage('assistant', `Waiting for required inputs for ${currentStage.agent}`);
      return null;
    }

    return currentStage.agent;
  }

  /**
   * Handle stage completion
   */
  public advanceToNextStage(): void {
    if (this.plan) {
      const currentStage = this.plan.stages[this.plan.currentStageIndex];
      if (currentStage) {
        this.plan.completedStages.push(currentStage.agent);
      }
      this.plan.currentStageIndex++;
    }
  }

  /**
   * Handle stage failure
   */
  public handleStageFailure(agentType: AgentType, error: string): boolean {
    if (!this.plan) return false;

    const currentStage = this.plan.stages[this.plan.currentStageIndex];
    if (!currentStage || currentStage.agent !== agentType) {
      return false;
    }

    this.addMessage('assistant', `Stage ${agentType} failed: ${error}`);

    // Check if we can retry
    const retryCount = this.plan.failedStages.filter(s => s === agentType).length;
    if (currentStage.retryable && retryCount < currentStage.maxRetries) {
      this.addMessage('assistant', `Retrying ${agentType} (attempt ${retryCount + 2})`);
      return true; // Will retry
    }

    this.plan.failedStages.push(agentType);
    return false; // Cannot retry
  }

  /**
   * Calculate overall progress percentage
   */
  private calculateProgress(plan: OrchestrationPlan): number {
    const totalStages = plan.stages.length;
    const completedStages = plan.completedStages.length;
    return Math.round((completedStages / totalStages) * 100);
  }

  /**
   * Execute the orchestrator
   */
  async execute(context: AgentContext): Promise<AgentResult<OrchestratorResult>> {
    this.updateStatus('working', 'Analyzing research workflow', 0);

    try {
      // Initialize or restore plan
      if (!this.plan) {
        this.plan = this.initializePlan();
        this.addMessage('system', this.config.systemPrompt);
        this.addMessage('user', `Research topic: ${context.session.topic}`);
        this.addMessage('assistant', 'Initialized research workflow with 8 stages');
      }

      // Update from previous agent outputs
      for (const [agentType, output] of context.previousAgentOutputs) {
        const stageIndex = this.plan.stages.findIndex(s => s.agent === agentType);
        if (stageIndex >= 0 && stageIndex === this.plan.currentStageIndex) {
          this.advanceToNextStage();
        }
        this.agentStates.set(agentType, {
          sessionId: context.session.id,
          agentType,
          status: 'complete',
          progress: 100,
          messages: [],
          lastUpdated: new Date() as any,
        });
      }

      // Determine next agent
      const nextAgent = this.getNextAgent(this.plan, context);
      const status = this.determineStatus(this.plan);
      const progress = this.calculateProgress(this.plan);

      this.updateStatus(
        nextAgent ? 'working' : 'complete',
        nextAgent ? `Delegating to ${nextAgent}` : 'Research complete',
        progress
      );

      const result: OrchestratorResult = {
        plan: this.plan,
        nextAgent,
        sessionStatus: status,
        agentStates: this.agentStates,
      };

      return {
        success: true,
        data: result,
        messages: this.messages,
        tokensUsed: 0, // Would be calculated from actual LLM usage
      };
    } catch (error) {
      this.updateStatus('error', `Orchestration failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: this.messages,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Get current orchestration plan
   */
  getPlan(): OrchestrationPlan | null {
    return this.plan;
  }

  /**
   * Check if research is complete
   */
  isComplete(): boolean {
    return this.plan !== null &&
           this.plan.currentStageIndex >= this.plan.stages.length &&
           this.plan.failedStages.length === 0;
  }

  /**
   * Get the workflow definition
   */
  getWorkflow(): Array<{ agentType: AgentType; order: number }> {
    return this.getWorkflowStages().map((stage, index) => ({
      agentType: stage.agent,
      order: index,
    }));
  }
}
