import React, { useState } from 'react';
import { ArrowLeft, Send, Sparkles, Download, Eye, Code, Play, Zap, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkflowGenerator } from '../lib/workflow-generator';
import { workflowOperations } from '../lib/supabase';
import { n8nClient } from '../lib/n8n-client';
import { VisualFlowBuilder } from './VisualFlowBuilder';

interface CreateWorkflowPageProps {
  onBack: () => void;
  currentUserId: string | null;
}

export function CreateWorkflowPage({ onBack, currentUserId }: CreateWorkflowPageProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showJson, setShowJson] = useState(false);
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const examples = [
    "Every day at 9am, summarize latest AI news and send it to my Slack.",
    "When I receive an email with 'urgent' in the subject, send me a text message.",
    "Every Monday, analyze my website traffic and email me a report.",
    "When someone fills out my contact form, add them to my CRM and send a welcome email.",
    "Every hour, check my server status and alert me if anything is down.",
    "Daily at 6pm, backup my database and upload to cloud storage."
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const generatedResult = await WorkflowGenerator.generateFromPrompt(prompt);
      setResult(generatedResult);
    } catch (error) {
      console.error('Error generating workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!result) return;

    if (!currentUserId) {
      // Demo mode - just show success message
      console.log('Demo: Workflow saved as draft');
      onBack();
      return;
    }

    try {
      await workflowOperations.createWorkflow({
        user_id: currentUserId,
        title: result.title,
        prompt_text: prompt,
        agent_config: {
          goal: result.summary,
          tools: result.tools,
          schedule: result.schedule
        },
        n8n_json: result.n8nWorkflow,
        status: 'draft'
      });
      
      onBack();
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  const handleDeploy = async () => {
    if (!result) return;

    if (!currentUserId) {
      // Demo mode - simulate deployment
      console.log('Demo: Workflow deployed to n8n');
      setDeploying(true);
      setTimeout(() => {
        setDeploying(false);
        onBack();
      }, 2000);
      return;
    }

    setDeploying(true);
    try {
      // First save to database
      const workflow = await workflowOperations.createWorkflow({
        user_id: currentUserId,
        title: result.title,
        prompt_text: prompt,
        agent_config: {
          goal: result.summary,
          tools: result.tools,
          schedule: result.schedule
        },
        n8n_json: result.n8nWorkflow,
        status: 'active'
      });

      // Then deploy to n8n
      const deployResult = await n8nClient.createWorkflow({
        name: result.title,
        nodes: result.n8nWorkflow.nodes || [],
        connections: result.n8nWorkflow.connections || {},
        active: true,
      });
      
      if (deployResult) {
        // Update workflow with n8n ID
        await workflowOperations.updateWorkflow(workflow.id, {
          status: 'active',
          agent_config: {
            ...workflow.agent_config,
            n8nWorkflowId: deployResult.id
          }
        });
      }
      
      onBack();
    } catch (error) {
      console.error('Error deploying workflow:', error);
    } finally {
      setDeploying(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    WorkflowGenerator.downloadWorkflow(result.n8nWorkflow, result.title);
  };

  const handleTestRun = async () => {
    if (!result) return;
    
    try {
      // Simulate a test execution
      const execution = await n8nClient.executeWorkflow('test-workflow', {
        message: 'Test execution from AutoFlow',
        timestamp: new Date().toISOString()
      });
      
      console.log('Test execution result:', execution);
    } catch (error) {
      console.error('Test execution failed:', error);
    }
  };

  const handleOpenVisualBuilder = () => {
    setShowVisualBuilder(true);
  };

  const handleSaveFromVisualBuilder = (workflow: any) => {
    setResult({
      ...result,
      n8nWorkflow: workflow
    });
    setShowVisualBuilder(false);
  };

  if (showVisualBuilder) {
    return (
      <VisualFlowBuilder
        workflow={result?.n8nWorkflow}
        onSave={handleSaveFromVisualBuilder}
        onClose={() => setShowVisualBuilder(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-muted hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-6 neural-pulse">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-light text-gradient mb-4">Create Workflow</h1>
            <p className="text-muted text-lg">Describe what you want to automate in plain English</p>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-subtle" />
              <span className="text-green-400 text-sm">n8n Integration Active</span>
            </div>
            {!currentUserId && (
              <div className="flex items-center justify-center space-x-2 mt-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-subtle" />
                <span className="text-blue-400 text-sm">Demo Mode - Try all features</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong p-8 rounded-3xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-4">
                  What do you want this workflow to automate?
                </label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Every day at 9am, summarize latest AI news and send it to my Slack."
                    className="w-full h-32 px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all resize-none"
                    required
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="absolute bottom-4 right-4 p-3 btn-primary rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Examples */}
              <div>
                <p className="text-sm text-muted mb-3">Try these examples:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {examples.map((example, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={() => setPrompt(example)}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl text-left text-sm text-white/80 hover:bg-white/10 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 inline mr-2 text-blue-400" />
                      {example}
                    </motion.button>
                  ))}
                </div>
              </div>
            </form>
          </motion.div>

          {/* Results Section */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Generated Summary */}
                <div className="glass-strong p-8 rounded-3xl">
                  <h2 className="text-xl font-medium text-white mb-6">Generated n8n Workflow</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted mb-2">Title</h3>
                      <p className="text-white">{result.title}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted mb-2">Tools</h3>
                      <div className="flex flex-wrap gap-1">
                        {result.tools.map((tool: string, index: number) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted mb-2">Schedule</h3>
                      <p className="text-white">{result.schedule || 'Manual trigger'}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-muted mb-2">Summary</h3>
                    <p className="text-white/90">{result.summary}</p>
                  </div>

                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-medium">n8n Ready</span>
                    </div>
                    <p className="text-sm text-white/80">
                      This workflow is compatible with n8n and ready for deployment. 
                      It includes {result.n8nWorkflow.nodes?.length || 0} nodes and proper connections.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleOpenVisualBuilder}
                      className="btn-primary px-6 py-3 rounded-2xl font-medium flex items-center space-x-2"
                    >
                      <Palette className="w-4 h-4" />
                      <span>Visual Editor</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTestRun}
                      className="btn-secondary px-6 py-3 rounded-2xl font-medium flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Test Run</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveDraft}
                      className="btn-secondary px-6 py-3 rounded-2xl font-medium"
                    >
                      Save as Draft
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDeploy}
                      disabled={deploying}
                      className="btn-primary px-6 py-3 rounded-2xl font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deploying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Deploying...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Deploy to n8n</span>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownload}
                      className="btn-secondary px-6 py-3 rounded-2xl font-medium flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download JSON</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowJson(!showJson)}
                      className="btn-secondary px-6 py-3 rounded-2xl font-medium flex items-center space-x-2"
                    >
                      <Code className="w-4 h-4" />
                      <span>{showJson ? 'Hide' : 'View'} JSON</span>
                    </motion.button>
                  </div>
                </div>

                {/* JSON Viewer */}
                <AnimatePresence>
                  {showJson && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="glass-strong p-6 rounded-3xl overflow-hidden"
                    >
                      <h3 className="text-lg font-medium text-white mb-4">n8n Workflow JSON</h3>
                      <pre className="bg-black/30 p-4 rounded-2xl text-sm text-white/90 overflow-x-auto max-h-96 overflow-y-auto">
                        {JSON.stringify(result.n8nWorkflow, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}