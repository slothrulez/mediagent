import React from 'react';
import { Workflow } from '../types';
import { Play, Pause, Download, Eye, Clock, Zap, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface WorkflowCardProps {
  workflow: Workflow;
  onView: (workflow: Workflow) => void;
  onRun: (workflow: Workflow) => void;
  onPause: (workflow: Workflow) => void;
  onDownload: (workflow: Workflow) => void;
}

const statusConfig = {
  draft: {
    color: 'text-gray-400',
    bg: 'bg-gray-500/20',
    icon: Clock,
    label: 'Draft'
  },
  active: {
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    icon: Zap,
    label: 'Active'
  },
  paused: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    icon: Pause,
    label: 'Paused'
  },
  error: {
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    icon: Clock,
    label: 'Error'
  }
};

export function WorkflowCard({ workflow, onView, onRun, onPause, onDownload }: WorkflowCardProps) {
  const config = statusConfig[workflow.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="card p-6 group relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white mb-2 line-clamp-2">{workflow.title}</h3>
          <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.label}
          </div>
        </div>

        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4 text-muted" />
        </button>
      </div>

      {/* Goal */}
      <div className="mb-4">
        <p className="text-sm text-white/80 line-clamp-2">{workflow.agent_config.goal}</p>
      </div>

      {/* Tools */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {workflow.agent_config.tools.slice(0, 3).map((tool, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 bg-white/10 text-white/70 text-xs rounded-lg"
            >
              {tool}
            </span>
          ))}
          {workflow.agent_config.tools.length > 3 && (
            <span className="inline-block px-2 py-1 bg-white/10 text-white/70 text-xs rounded-lg">
              +{workflow.agent_config.tools.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Schedule */}
      {workflow.agent_config.schedule && (
        <div className="mb-4">
          <p className="text-xs text-muted">
            Runs {workflow.agent_config.schedule}
          </p>
        </div>
      )}

      {/* Last run */}
      {workflow.last_run && (
        <div className="mb-4">
          <p className="text-xs text-muted">
            Last run: {format(new Date(workflow.last_run), 'MMM d, HH:mm')}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        {workflow.status === 'draft' || workflow.status === 'paused' ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRun(workflow)}
            className="flex-1 btn-primary py-2 rounded-xl text-sm font-medium flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Deploy</span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPause(workflow)}
            className="flex-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 py-2 rounded-xl text-sm font-medium flex items-center justify-center space-x-2 hover:bg-yellow-500/30 transition-colors"
          >
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </motion.button>
        )}
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onView(workflow)}
          className="px-4 py-2 btn-secondary rounded-xl text-sm font-medium"
        >
          <Eye className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onDownload(workflow)}
          className="px-4 py-2 btn-secondary rounded-xl text-sm font-medium"
        >
          <Download className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Activity indicator */}
      {workflow.status === 'active' && (
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