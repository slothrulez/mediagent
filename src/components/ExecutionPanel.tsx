import React from 'react';
import { motion } from 'framer-motion';
import { X, Play, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ExecutionPanelProps {
  execution: any;
  isExecuting: boolean;
  onClose: () => void;
}

export function ExecutionPanel({ execution, isExecuting, onClose }: ExecutionPanelProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'running':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default:
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 300 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 300 }}
      className="fixed bottom-0 left-0 right-0 h-96 glass-strong border-t border-white/10 z-40 overflow-y-auto"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Play className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Execution Log</h3>
              <p className="text-sm text-muted">
                {isExecuting ? 'Running...' : execution ? 'Completed' : 'No execution data'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isExecuting ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Executing workflow...</p>
              <p className="text-muted text-sm mt-2">This may take a few moments</p>
            </div>
          </div>
        ) : execution ? (
          <div className="space-y-4">
            {/* Execution Summary */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(execution.finished ? (execution.data?.resultData?.error ? 'error' : 'success') : 'running')}
                  <div>
                    <h4 className="font-medium text-white">Execution #{execution.id?.slice(-8) || 'demo'}</h4>
                    <p className="text-sm text-muted">
                      {execution.startedAt ? format(new Date(execution.startedAt), 'MMM d, HH:mm:ss') : 'Just now'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                  getStatusColor(execution.finished ? (execution.data?.resultData?.error ? 'error' : 'success') : 'running')
                }`}>
                  {execution.finished ? (execution.data?.resultData?.error ? 'Failed' : 'Success') : 'Running'}
                </span>
              </div>

              {execution.data?.resultData?.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium">Error</p>
                      <p className="text-red-300 text-sm mt-1">{execution.data.resultData.error.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Node Execution Results */}
            {execution.data?.resultData?.runData && (
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-muted">Node Execution Results</h5>
                {Object.entries(execution.data.resultData.runData).map(([nodeName, nodeData]: [string, any]) => (
                  <div key={nodeName} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="font-medium text-white">{nodeName}</h6>
                      <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-lg">
                        Completed
                      </span>
                    </div>
                    
                    {nodeData[0]?.data?.main?.[0] && (
                      <div>
                        <p className="text-xs text-muted mb-2">Output Data:</p>
                        <pre className="bg-black/30 p-3 rounded-lg text-xs text-white/80 overflow-x-auto max-h-32">
                          {JSON.stringify(nodeData[0].data.main[0], null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Mock execution for demo */}
            {execution.message && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-green-400 font-medium">Success</p>
                    <p className="text-green-300 text-sm mt-1">{execution.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Play className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-muted">No execution data available</p>
            <p className="text-sm text-muted/70 mt-2">Run the workflow to see execution results</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}