import React, { useState, useEffect } from 'react';
import { Agent, MemoryBlock, AuditTrail } from '../types';
import { memoryOperations, auditOperations } from '../lib/supabase';
import { Brain, Clock, FileText, Activity, Volume2, Video, ArrowLeft, Eye, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface AgentDetailsProps {
  agent: Agent;
  onBack: () => void;
}

export function AgentDetails({ agent, onBack }: AgentDetailsProps) {
  const [memory, setMemory] = useState<MemoryBlock[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>([]);
  const [activeTab, setActiveTab] = useState<'memory' | 'audit' | 'explain'>('memory');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentData();
  }, [agent.id]);

  const loadAgentData = async () => {
    try {
      setLoading(true);
      const [memoryData, auditData] = await Promise.all([
        memoryOperations.getAgentMemory(agent.id, 20),
        auditOperations.getAgentAudit(agent.id)
      ]);
      
      setMemory(memoryData);
      setAuditTrail(auditData);
    } catch (error) {
      console.error('Error loading agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateExplanation = () => {
    return `Agent Analysis: ${agent.name}

Mission Parameters:
• Primary objectives: ${agent.goals.join(' | ')}
• Tool arsenal: ${agent.tools.join(', ')}
• Ethics protocols: ${agent.ethics.join(', ')}

Cognitive Process:
1. Plan: Analyze current objective and available data
2. Execute: Deploy appropriate tools for information acquisition
3. Observe: Process and evaluate incoming data patterns
4. Reflect: Learn from outcomes and optimize future operations

Current Status: ${agent.status.toUpperCase()}
Memory Entries: ${memory.length} neural pathways active
Audit Trail: ${auditTrail.length} decision points logged

The agent maintains ethical guidelines and operates within defined parameters to ensure responsible autonomous operation.`;
  };

  const typeConfig = {
    observation: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Eye, label: 'Observation' },
    action: { color: 'text-green-400', bg: 'bg-green-500/20', icon: Activity, label: 'Action' },
    result: { color: 'text-purple-400', bg: 'bg-purple-500/20', icon: Target, label: 'Result' },
    rationale: { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: Brain, label: 'Rationale' },
    goal: { color: 'text-indigo-400', bg: 'bg-indigo-500/20', icon: Target, label: 'Goal' }
  };

  const tabs = [
    { id: 'memory', label: 'Memory', icon: FileText },
    { id: 'audit', label: 'Audit Trail', icon: Activity },
    { id: 'explain', label: 'Explainability', icon: Volume2 }
  ];

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
            <span>Back to Console</span>
          </button>
          
          <div className="glass-strong p-8 rounded-3xl">
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center neural-pulse">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-light text-white mb-2">{agent.name}</h1>
                <p className="text-muted">Agent ID: {agent.id.slice(-8)}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-white/5 rounded-2xl">
                <h3 className="text-sm text-muted mb-1">Status</h3>
                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                  agent.status === 'running' ? 'bg-green-500/20 text-green-400' :
                  agent.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {agent.status}
                </span>
              </div>
              
              <div className="p-4 bg-white/5 rounded-2xl">
                <h3 className="text-sm text-muted mb-1">Memory</h3>
                <p className="text-xl font-light text-white">{memory.length}</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-2xl">
                <h3 className="text-sm text-muted mb-1">Decisions</h3>
                <p className="text-xl font-light text-white">{auditTrail.length}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl">
                <h3 className="text-sm text-muted mb-1">Tools</h3>
                <p className="text-xl font-light text-white">{agent.tools.length}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10">
              <nav className="flex space-x-8">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-all ${
                      activeTab === id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-muted hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="glass-strong p-8 rounded-3xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                <Brain className="absolute inset-0 m-auto w-5 h-5 text-blue-400" />
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'memory' && (
                <motion.div
                  key="memory"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-medium text-white mb-6">Memory Timeline</h2>
                  {memory.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="w-12 h-12 text-muted mx-auto mb-4" />
                      <p className="text-muted">No memory blocks found</p>
                      <p className="text-sm text-muted/70 mt-2">Execute agent to generate memory</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {memory.map((entry, index) => {
                        const config = typeConfig[entry.type];
                        const Icon = config.icon;
                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-6 ${config.bg} border border-current/20 rounded-2xl`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 ${config.bg} rounded-lg`}>
                                  <Icon className={`w-4 h-4 ${config.color}`} />
                                </div>
                                <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                              </div>
                              <span className="text-sm text-muted flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {format(new Date(entry.timestamp), 'HH:mm:ss')}
                              </span>
                            </div>
                            <p className="text-white/90 leading-relaxed">{entry.content}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'audit' && (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-medium text-white mb-6">Decision Audit Trail</h2>
                  {auditTrail.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-muted mx-auto mb-4" />
                      <p className="text-muted">No audit entries found</p>
                      <p className="text-sm text-muted/70 mt-2">Agent decisions will be recorded here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {auditTrail.map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-green-400">{entry.action}</h3>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-green-400">
                                Confidence: {Math.round(entry.explainability_score * 100)}%
                              </span>
                              <span className="text-sm text-muted flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {format(new Date(entry.timestamp), 'HH:mm:ss')}
                              </span>
                            </div>
                          </div>
                          <p className="text-white/90 mb-3">{entry.reasoning}</p>
                          <p className="text-sm text-muted">Outcome: {entry.outcome}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'explain' && (
                <motion.div
                  key="explain"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <h2 className="text-xl font-medium text-white mb-6">Explainability Interface</h2>
                  
                  <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                    <h3 className="font-medium text-purple-400 mb-4">Agent Analysis Report</h3>
                    <pre className="text-white/90 whitespace-pre-wrap text-sm leading-relaxed font-mono">
                      {generateExplanation()}
                    </pre>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl"
                    >
                      <h4 className="font-medium text-green-400 mb-4 flex items-center">
                        <Volume2 className="w-4 h-4 mr-2" />
                        Audio Explanation
                      </h4>
                      <p className="text-muted mb-4 text-sm">
                        Generate audio narration using ElevenLabs synthesis
                      </p>
                      <button className="w-full btn-primary py-3 rounded-2xl font-medium">
                        Generate Audio
                      </button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl"
                    >
                      <h4 className="font-medium text-purple-400 mb-4 flex items-center">
                        <Video className="w-4 h-4 mr-2" />
                        Video Explanation
                      </h4>
                      <p className="text-muted mb-4 text-sm">
                        Create video visualization using Tavus AI
                      </p>
                      <button className="w-full btn-primary py-3 rounded-2xl font-medium">
                        Generate Video
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}