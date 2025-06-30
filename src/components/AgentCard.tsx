import React from 'react';
import { Agent } from '../types';
import { Brain, Play, Pause, Square, Clock, Target, Wrench, Activity, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentCardProps {
  agent: Agent;
  onStart: (agent: Agent) => void;
  onStop: (agent: Agent) => void;
  onView: (agent: Agent) => void;
}

const statusConfig = {
  idle: {
    color: 'text-gray-400',
    bg: 'bg-gray-500/20',
    icon: Clock,
    label: 'Idle'
  },
  running: {
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    icon: Activity,
    label: 'Active'
  },
  paused: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    icon: Pause,
    label: 'Paused'
  },
  completed: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    icon: Target,
    label: 'Completed'
  },
  error: {
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    icon: Square,
    label: 'Error'
  }
};

export function AgentCard({ agent, onStart, onStop, onView }: AgentCardProps) {
  const config = statusConfig[agent.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="card p-6 group relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <motion.div
            animate={agent.status === 'running' ? { 
              scale: [1, 1.1, 1]
            } : {}}
            transition={agent.status === 'running' ? { 
              duration: 2, 
              repeat: Infinity 
            } : {}}
            className={`p-3 rounded-xl ${agent.status === 'running' ? 'bg-green-500/20' : 'bg-white/10'} neural-pulse`}
          >
            <Brain className={`w-5 h-5 ${agent.status === 'running' ? 'text-green-400' : 'text-muted'}`} />
          </motion.div>
          <div>
            <h3 className="text-lg font-medium text-white mb-1">{agent.name}</h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </div>
          </div>
        </div>

        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4 text-muted" />
        </button>
      </div>

      {/* Goals */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted mb-3 flex items-center">
          <Target className="w-4 h-4 mr-2" />
          Objectives
        </h4>
        <div className="space-y-2">
          {agent.goals.slice(0, 2).map((goal, index) => (
            <div
              key={index}
              className="p-3 bg-white/5 border border-white/10 rounded-xl"
            >
              <p className="text-sm text-white/90">{goal}</p>
            </div>
          ))}
          {agent.goals.length > 2 && (
            <p className="text-xs text-muted">+{agent.goals.length - 2} more objectives</p>
          )}
        </div>
      </div>

      {/* Tools */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted mb-3 flex items-center">
          <Wrench className="w-4 h-4 mr-2" />
          Tools
        </h4>
        <div className="flex flex-wrap gap-2">
          {agent.tools.map((tool, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 bg-white/10 text-white/80 text-xs rounded-lg"
            >
              {tool}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <AnimatePresence mode="wait">
          {agent.status === 'idle' || agent.status === 'paused' ? (
            <motion.button
              key="start"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStart(agent)}
              className="flex-1 btn-primary py-3 rounded-xl font-medium flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Execute</span>
            </motion.button>
          ) : agent.status === 'running' ? (
            <motion.button
              key="stop"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStop(agent)}
              className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-red-500/30 transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </motion.button>
          ) : (
            <motion.button
              key="disabled"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              disabled
              className="flex-1 btn-secondary py-3 rounded-xl cursor-not-allowed flex items-center justify-center space-x-2 opacity-50"
            >
              <StatusIcon className="w-4 h-4" />
              <span>{config.label}</span>
            </motion.button>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onView(agent)}
          className="px-4 py-3 btn-secondary rounded-xl font-medium"
        >
          View
        </motion.button>
      </div>

      {/* Activity indicator */}
      {agent.status === 'running' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent">
          <motion.div 
            className="h-full bg-green-400"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
    </motion.div>
  );
}