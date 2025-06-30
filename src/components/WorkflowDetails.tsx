import React, { useState, useEffect } from 'react';
import { Workflow, AuditLog } from '../types';
import { auditLogOperations, workflowOperations } from '../lib/supabase';
import { ArrowLeft, Play, Pause, Download, Code, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { WorkflowGenerator } from '../lib/workflow-generator';

interface WorkflowDetailsProps {
  workflow: Workflow;
  onBack: () => void;
}

export function WorkflowDetails({ workflow, onBack }: WorkflowDetailsProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showJson, setShowJson] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [workflow.id]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const logs = await auditLogOperations.getWorkflowLogs(workflow.id);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunNow = async () => {
    try {
      // Simulate workflow execution
      const log: Omit<AuditLog, 'id'> = {
        workflow_id: workflow.id,
        timestamp: new Date().toISOString(),
        output: { message: 'Workflow executed successfully', steps: workflow.agent_config.tools.length },
        success: true,
        message: 'Manual execution completed'
      };

      await auditLogOperations.addAuditLog(log);
      await workflowOperations.updateWorkflow(workflow.id, {
        last_run: new Date().toISOString()
      });
      
      loadAuditLogs();
    } catch (error) {
      console.error('Error running workflow:', error);
    }
  };

  const handleDownload = () => {
    WorkflowGenerator.downloadWorkflow(workflow.n8n_json, workflow.title);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <div className="max-w-6xl mx-auto p-6">
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
          
          <div className="glass-strong p-8 rounded-3xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-light text-white mb-2">{workflow.title}</h1>
                <p className="text-muted">Workflow ID: {workflow.id.slice(-8)}</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                  workflow.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  workflow.status === 'draft' ? 'bg-gray-500/20 text-gray-400' :
                  workflow.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-white/5 rounded-2xl">
                <h3 className="text-sm text-muted mb-1">Status</h3>
                <p className="text-lg font-light text-white">{workflow.status}</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-2xl">
                <h3 className="text-sm text-muted mb-1">Tools</h3>
                <p className="text-lg font-light text-white">{workflow.agent_config.tools.length}</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-2xl">
                <h3 className="text-sm text-muted mb-1">Runs</h3>
                <p className="text-lg font-light text-white">{auditLogs.length}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl">
                <h3 className="text-sm text-muted mb-1">Success Rate</h3>
                <p className="text-lg font-light text-white">
                  {auditLogs.length > 0 
                    ? Math.round((auditLogs.filter(log => log.success).length / auditLogs.length) * 100)
                    : 0
                  }%
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRunNow}
                className="btn-primary px-6 py-3 rounded-2xl font-medium flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Run Now</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="btn-secondary px-6 py-3 rounded-2xl font-medium flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
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
        </motion.div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration */}
          <div className="glass-strong p-8 rounded-3xl">
            <h2 className="text-xl font-medium text-white mb-6">Configuration</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted mb-2">Goal</h3>
                <p className="text-white/90">{workflow.agent_config.goal}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted mb-2">Original Prompt</h3>
                <p className="text-white/90 bg-white/5 p-4 rounded-xl">{workflow.prompt_text}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted mb-2">Tools</h3>
                <div className="flex flex-wrap gap-2">
                  {workflow.agent_config.tools.map((tool, index) => (
                    <span
                      key={index}
                      className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-lg"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {workflow.agent_config.schedule && (
                <div>
                  <h3 className="text-sm font-medium text-muted mb-2">Schedule</h3>
                  <p className="text-white/90">{workflow.agent_config.schedule}</p>
                </div>
              )}
            </div>
          </div>

          {/* Execution History */}
          <div className="glass-strong p-8 rounded-3xl">
            <h2 className="text-xl font-medium text-white mb-6">Execution History</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-muted mx-auto mb-4" />
                <p className="text-muted">No executions yet</p>
                <p className="text-sm text-muted/70 mt-2">Run the workflow to see execution history</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {auditLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-2xl border ${
                      log.success 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : 'bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {log.success ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-sm font-medium ${
                          log.success ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <span className="text-sm text-muted">
                        {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-white/90 text-sm">{log.message}</p>
                    {log.output && (
                      <pre className="text-xs text-muted mt-2 bg-black/20 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.output, null, 2)}
                      </pre>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* JSON Viewer */}
        <AnimatePresence>
          {showJson && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 glass-strong p-8 rounded-3xl overflow-hidden"
            >
              <h2 className="text-xl font-medium text-white mb-6">n8n Workflow JSON</h2>
              <pre className="bg-black/30 p-6 rounded-2xl text-sm text-white/90 overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(workflow.n8n_json, null, 2)}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}