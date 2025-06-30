import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Settings, Code, Eye, Save } from 'lucide-react';
import { Node } from 'reactflow';
import Editor from '@monaco-editor/react';

interface NodePropertiesPanelProps {
  node: Node;
  onUpdateNode: (nodeId: string, newData: any) => void;
  onClose: () => void;
}

export function NodePropertiesPanel({ node, onUpdateNode, onClose }: NodePropertiesPanelProps) {
  const [parameters, setParameters] = useState(node.data.parameters || {});
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeValue, setCodeValue] = useState('');

  useEffect(() => {
    setParameters(node.data.parameters || {});
    
    // Initialize code editor for function nodes
    if (node.data.type === 'n8n-nodes-base.function') {
      setCodeValue(node.data.parameters?.functionCode || 'return items;');
    }
  }, [node]);

  const handleParameterChange = (key: string, value: any) => {
    const newParameters = { ...parameters, [key]: value };
    setParameters(newParameters);
    
    onUpdateNode(node.id, {
      parameters: newParameters,
      n8nNode: {
        ...node.data.n8nNode,
        parameters: newParameters,
      },
    });
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCodeValue(value);
      handleParameterChange('functionCode', value);
    }
  };

  const renderParameterInput = (key: string, value: any) => {
    const inputType = typeof value;
    
    switch (inputType) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleParameterChange(key, e.target.checked)}
              className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30"
            />
            <span className="text-sm text-white">{key}</span>
          </label>
        );
      
      case 'number':
        return (
          <div>
            <label className="block text-sm font-medium text-muted mb-2">{key}</label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleParameterChange(key, parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
            />
          </div>
        );
      
      case 'object':
        return (
          <div>
            <label className="block text-sm font-medium text-muted mb-2">{key}</label>
            <textarea
              value={JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleParameterChange(key, parsed);
                } catch (error) {
                  // Invalid JSON, don't update
                }
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all font-mono text-sm"
              rows={4}
            />
          </div>
        );
      
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-muted mb-2">{key}</label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleParameterChange(key, e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
            />
          </div>
        );
    }
  };

  const getNodeTypeFields = () => {
    const nodeType = node.data.type;
    
    switch (nodeType) {
      case 'n8n-nodes-base.webhook':
        return [
          { key: 'httpMethod', label: 'HTTP Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] },
          { key: 'path', label: 'Path', type: 'text' },
          { key: 'responseMode', label: 'Response Mode', type: 'select', options: ['onReceived', 'lastNode'] },
        ];
      
      case 'n8n-nodes-base.slack':
        return [
          { key: 'operation', label: 'Operation', type: 'select', options: ['postMessage', 'updateMessage'] },
          { key: 'channel', label: 'Channel', type: 'text' },
          { key: 'text', label: 'Message Text', type: 'textarea' },
        ];
      
      case 'n8n-nodes-base.emailSend':
        return [
          { key: 'toEmail', label: 'To Email', type: 'text' },
          { key: 'subject', label: 'Subject', type: 'text' },
          { key: 'text', label: 'Message', type: 'textarea' },
        ];
      
      case 'n8n-nodes-base.httpRequest':
        return [
          { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
          { key: 'url', label: 'URL', type: 'text' },
          { key: 'body', label: 'Body', type: 'textarea' },
        ];
      
      case 'n8n-nodes-base.cron':
        return [
          { key: 'rule.minute', label: 'Minute', type: 'text' },
          { key: 'rule.hour', label: 'Hour', type: 'text' },
          { key: 'rule.dayOfMonth', label: 'Day of Month', type: 'text' },
          { key: 'rule.month', label: 'Month', type: 'text' },
          { key: 'rule.dayOfWeek', label: 'Day of Week', type: 'text' },
        ];
      
      default:
        return [];
    }
  };

  const nodeFields = getNodeTypeFields();

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 bottom-0 w-96 glass-strong border-l border-white/10 z-40 overflow-y-auto"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">{node.data.label}</h3>
              <p className="text-sm text-muted">{node.data.type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setShowCodeEditor(false)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              !showCodeEditor
                ? 'bg-white/10 text-white'
                : 'text-muted hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Settings
          </button>
          {node.data.type === 'n8n-nodes-base.function' && (
            <button
              onClick={() => setShowCodeEditor(true)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                showCodeEditor
                  ? 'bg-white/10 text-white'
                  : 'text-muted hover:text-white'
              }`}
            >
              <Code className="w-4 h-4 inline mr-2" />
              Code
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!showCodeEditor ? (
          <div className="space-y-6">
            {/* Node Name */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Node Name</label>
              <input
                type="text"
                value={node.data.label}
                onChange={(e) => onUpdateNode(node.id, { label: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
              />
            </div>

            {/* Type-specific fields */}
            {nodeFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-muted mb-2">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={getNestedValue(parameters, field.key) || ''}
                    onChange={(e) => setNestedValue(field.key, e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option} className="bg-gray-800">
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={getNestedValue(parameters, field.key) || ''}
                    onChange={(e) => setNestedValue(field.key, e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    value={getNestedValue(parameters, field.key) || ''}
                    onChange={(e) => setNestedValue(field.key, e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                  />
                )}
              </div>
            ))}

            {/* Raw parameters for debugging */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Raw Parameters</label>
              <pre className="bg-black/30 p-3 rounded-xl text-xs text-white/80 overflow-x-auto">
                {JSON.stringify(parameters, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">Function Code</h4>
              <div className="flex space-x-2">
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <Eye className="w-4 h-4 text-muted" />
                </button>
                <button className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors">
                  <Save className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>
            
            <div className="h-96 border border-white/10 rounded-xl overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={codeValue}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
            
            <div className="text-xs text-muted">
              <p>Available variables: <code>items</code>, <code>$node</code>, <code>$workflow</code></p>
              <p>Return an array of items to pass to the next node.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  function setNestedValue(path: string, value: any) {
    const keys = path.split('.');
    const newParameters = { ...parameters };
    let current = newParameters;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    handleParameterChange('', newParameters);
  }
}