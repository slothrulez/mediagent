import React, { useState } from 'react';
import { X, Plus, Trash2, Brain, Target, Wrench, Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import { Agent } from '../types';
import { availableTools } from '../lib/tools';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAgent: (agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function CreateAgentModal({ isOpen, onClose, onCreateAgent }: CreateAgentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    goals: [''],
    tools: [] as string[],
    ethics: ['truthful', 'non-bias']
  });
  const [step, setStep] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'> = {
      name: formData.name,
      goals: formData.goals.filter(goal => goal.trim() !== ''),
      tools: formData.tools,
      memory_id: `mem://${formData.name.toLowerCase().replace(/\s+/g, '')}/memory`,
      ethics: formData.ethics,
      status: 'idle'
    };

    onCreateAgent(agent);
    
    // Reset form
    setFormData({
      name: '',
      goals: [''],
      tools: [],
      ethics: ['truthful', 'non-bias']
    });
    setStep(1);
    onClose();
  };

  const addGoal = () => {
    setFormData(prev => ({
      ...prev,
      goals: [...prev.goals, '']
    }));
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const updateGoal = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.map((goal, i) => i === index ? value : goal)
    }));
  };

  const toggleTool = (toolName: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(toolName)
        ? prev.tools.filter(t => t !== toolName)
        : [...prev.tools, toolName]
    }));
  };

  if (!isOpen) return null;

  const steps = [
    { id: 1, title: 'Agent Identity', icon: Brain },
    { id: 2, title: 'Objectives', icon: Target },
    { id: 3, title: 'Configuration', icon: Wrench }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden glass-strong rounded-3xl shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-white">Create Agent</h2>
                  <p className="text-sm text-muted">Step {step} of 3</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {/* Progress */}
            <div className="flex space-x-2">
              {steps.map((s) => (
                <div
                  key={s.id}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    s.id <= step ? 'bg-blue-500' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <Brain className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Agent Identity</h3>
                      <p className="text-muted">Define your agent's core identity</p>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-3">
                        Agent Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                        placeholder="e.g., Research Assistant, Data Analyzer"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <Target className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Objectives</h3>
                      <p className="text-muted">Define what your agent should accomplish</p>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-3">
                        Primary Goals
                      </label>
                      <div className="space-y-3">
                        {formData.goals.map((goal, index) => (
                          <div key={index} className="flex space-x-3">
                            <input
                              type="text"
                              value={goal}
                              onChange={(e) => updateGoal(index, e.target.value)}
                              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                              placeholder="e.g., Analyze market trends for Q4 2024"
                            />
                            {formData.goals.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeGoal(index)}
                                className="p-3 text-red-400 hover:bg-red-500/20 rounded-2xl transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addGoal}
                          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Goal</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <Wrench className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Configuration</h3>
                      <p className="text-muted">Select tools and capabilities</p>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-3">
                        Available Tools
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        {availableTools.map((tool) => (
                          <motion.label
                            key={tool.name}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${
                              formData.tools.includes(tool.name)
                                ? 'border-blue-500/50 bg-blue-500/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.tools.includes(tool.name)}
                              onChange={() => toggleTool(tool.name)}
                              className="sr-only"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-white">{tool.name}</div>
                              <div className="text-sm text-muted">{tool.description}</div>
                            </div>
                            {formData.tools.includes(tool.name) && (
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </motion.label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-3 flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Ethics Protocols
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {formData.ethics.map((ethic, index) => (
                          <span
                            key={index}
                            className="inline-block px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm"
                          >
                            {ethic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                className="flex items-center space-x-2 px-6 py-3 btn-secondary rounded-2xl font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{step > 1 ? 'Previous' : 'Cancel'}</span>
              </button>
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !formData.name}
                  className="flex items-center space-x-2 px-6 py-3 btn-primary rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!formData.name || formData.tools.length === 0}
                  className="flex items-center space-x-2 px-8 py-3 btn-primary rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Create Agent</span>
                  <Brain className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}