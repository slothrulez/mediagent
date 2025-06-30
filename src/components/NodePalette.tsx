import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Search, 
  Zap, 
  Globe, 
  Mail, 
  MessageSquare, 
  Database, 
  FileText,
  Code,
  Clock,
  Webhook,
  Settings
} from 'lucide-react';

interface NodePaletteProps {
  onAddNode: (nodeType: string, nodeConfig: any) => void;
  onClose: () => void;
}

const nodeCategories = [
  {
    name: 'Triggers',
    icon: Zap,
    nodes: [
      {
        type: 'n8n-nodes-base.manualTrigger',
        name: 'Manual Trigger',
        description: 'Manually trigger the workflow',
        icon: Zap,
        parameters: {}
      },
      {
        type: 'n8n-nodes-base.webhook',
        name: 'Webhook',
        description: 'Trigger via HTTP webhook',
        icon: Webhook,
        parameters: {
          httpMethod: 'POST',
          path: 'webhook',
          responseMode: 'onReceived'
        }
      },
      {
        type: 'n8n-nodes-base.cron',
        name: 'Schedule',
        description: 'Trigger on schedule',
        icon: Clock,
        parameters: {
          rule: {
            minute: 0,
            hour: 9,
            dayOfMonth: '*',
            month: '*',
            dayOfWeek: '*'
          }
        }
      }
    ]
  },
  {
    name: 'Communication',
    icon: MessageSquare,
    nodes: [
      {
        type: 'n8n-nodes-base.slack',
        name: 'Slack',
        description: 'Send messages to Slack',
        icon: MessageSquare,
        parameters: {
          operation: 'postMessage',
          channel: '#general'
        }
      },
      {
        type: 'n8n-nodes-base.emailSend',
        name: 'Send Email',
        description: 'Send email messages',
        icon: Mail,
        parameters: {
          toEmail: '',
          subject: '',
          text: ''
        }
      },
      {
        type: 'n8n-nodes-base.discord',
        name: 'Discord',
        description: 'Send messages to Discord',
        icon: MessageSquare,
        parameters: {
          operation: 'sendMessage'
        }
      }
    ]
  },
  {
    name: 'Data & APIs',
    icon: Globe,
    nodes: [
      {
        type: 'n8n-nodes-base.httpRequest',
        name: 'HTTP Request',
        description: 'Make HTTP requests to APIs',
        icon: Globe,
        parameters: {
          method: 'GET',
          url: '',
          options: {}
        }
      },
      {
        type: 'n8n-nodes-base.postgres',
        name: 'PostgreSQL',
        description: 'Query PostgreSQL database',
        icon: Database,
        parameters: {
          operation: 'select'
        }
      },
      {
        type: 'n8n-nodes-base.googleSheets',
        name: 'Google Sheets',
        description: 'Read/write Google Sheets',
        icon: FileText,
        parameters: {
          operation: 'read'
        }
      }
    ]
  },
  {
    name: 'Logic & Flow',
    icon: Settings,
    nodes: [
      {
        type: 'n8n-nodes-base.if',
        name: 'IF Condition',
        description: 'Conditional branching',
        icon: Settings,
        parameters: {
          conditions: {
            boolean: [],
            number: [],
            string: []
          }
        }
      },
      {
        type: 'n8n-nodes-base.function',
        name: 'Function',
        description: 'Execute custom JavaScript',
        icon: Code,
        parameters: {
          functionCode: 'return items;'
        }
      },
      {
        type: 'n8n-nodes-base.wait',
        name: 'Wait',
        description: 'Pause workflow execution',
        icon: Clock,
        parameters: {
          unit: 'seconds',
          amount: 1
        }
      }
    ]
  }
];

export function NodePalette({ onAddNode, onClose }: NodePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = nodeCategories.map(category => ({
    ...category,
    nodes: category.nodes.filter(node =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl max-h-[80vh] glass-strong rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-light text-white">Add Node</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search nodes..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex h-96">
          {/* Categories Sidebar */}
          <div className="w-64 border-r border-white/10 p-4">
            <h3 className="text-sm font-medium text-muted mb-4">Categories</h3>
            <div className="space-y-2">
              {nodeCategories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.name;
                const hasNodes = filteredCategories.find(c => c.name === category.name)?.nodes.length || 0;
                
                return (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(isSelected ? null : category.name)}
                    disabled={hasNodes === 0}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                        : hasNodes > 0
                        ? 'hover:bg-white/5 text-white'
                        : 'text-muted/50 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{category.name}</span>
                    <span className="ml-auto text-xs bg-white/10 px-2 py-1 rounded-lg">
                      {hasNodes}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nodes Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {filteredCategories.map((category) => {
              if (selectedCategory && selectedCategory !== category.name) return null;
              
              return (
                <div key={category.name} className="mb-6">
                  <h4 className="text-lg font-medium text-white mb-4">{category.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.nodes.map((node) => {
                      const Icon = node.icon;
                      
                      return (
                        <motion.button
                          key={node.type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onAddNode(node.type, node)}
                          className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 hover:border-white/20 transition-all group"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                              <Icon className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-white mb-1">{node.name}</h5>
                              <p className="text-sm text-muted">{node.description}</p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted mx-auto mb-4" />
                <p className="text-muted">No nodes found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}