import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  ConnectionMode,
  Panel,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Save, 
  Download, 
  Settings, 
  Zap, 
  Plus,
  Code,
  Eye,
  RotateCcw,
  Share,
  Bug
} from 'lucide-react';
import { N8nWorkflow, N8nNode, n8nClient } from '../lib/n8n-client';
import { NodePalette } from './NodePalette';
import { NodePropertiesPanel } from './NodePropertiesPanel';
import { ExecutionPanel } from './ExecutionPanel';

interface VisualFlowBuilderProps {
  workflow?: N8nWorkflow;
  onSave?: (workflow: N8nWorkflow) => void;
  onExecute?: (workflow: N8nWorkflow) => void;
  onClose?: () => void;
}

const nodeTypes = {
  // We'll use default nodes for now, but can create custom ones later
};

const edgeTypes = {
  // Custom edge types can be added here
};

function FlowBuilder({ workflow, onSave, onExecute, onClose }: VisualFlowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<any>(null);
  const { project } = useReactFlow();

  // Initialize workflow if provided
  useEffect(() => {
    if (workflow) {
      const flowNodes = workflow.nodes.map((n8nNode: N8nNode) => ({
        id: n8nNode.id,
        type: 'default',
        position: { x: n8nNode.position[0], y: n8nNode.position[1] },
        data: {
          label: n8nNode.name,
          type: n8nNode.type,
          parameters: n8nNode.parameters,
          n8nNode,
        },
        style: {
          background: getNodeColor(n8nNode.type),
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          color: 'white',
          fontSize: '12px',
          padding: '10px',
        },
      }));

      const flowEdges = convertN8nConnectionsToEdges(workflow.connections);
      
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [workflow, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      animated: true,
    }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = useCallback((nodeType: string, nodeConfig: any) => {
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds) return;

    const position = project({
      x: reactFlowBounds.width / 2,
      y: reactFlowBounds.height / 2,
    });

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'default',
      position,
      data: {
        label: nodeConfig.name || nodeType,
        type: nodeType,
        parameters: nodeConfig.parameters || {},
        n8nNode: {
          id: `node-${Date.now()}`,
          name: nodeConfig.name || nodeType,
          type: nodeType,
          typeVersion: 1,
          position: [position.x, position.y],
          parameters: nodeConfig.parameters || {},
        },
      },
      style: {
        background: getNodeColor(nodeType),
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        color: 'white',
        fontSize: '12px',
        padding: '10px',
      },
    };

    setNodes((nds) => nds.concat(newNode));
    setShowNodePalette(false);
  }, [project, setNodes]);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: { ...node.data, ...newData },
            }
          : node
      )
    );
  }, [setNodes]);

  const handleSave = useCallback(() => {
    const n8nWorkflow: N8nWorkflow = {
      id: workflow?.id,
      name: workflow?.name || 'Untitled Workflow',
      nodes: nodes.map((node) => ({
        ...node.data.n8nNode,
        position: [node.position.x, node.position.y],
      })),
      connections: convertEdgesToN8nConnections(edges),
      active: workflow?.active || false,
      settings: workflow?.settings || {},
    };

    onSave?.(n8nWorkflow);
  }, [nodes, edges, workflow, onSave]);

  const handleExecute = useCallback(async () => {
    if (!workflow?.id) {
      console.error('Cannot execute workflow without ID');
      return;
    }

    setIsExecuting(true);
    setShowExecutionPanel(true);

    try {
      const execution = await n8nClient.executeWorkflow(workflow.id);
      setExecutionResults(execution);
    } catch (error) {
      console.error('Execution failed:', error);
      setExecutionResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsExecuting(false);
    }
  }, [workflow]);

  const handleExport = useCallback(() => {
    const n8nWorkflow: N8nWorkflow = {
      id: workflow?.id,
      name: workflow?.name || 'Untitled Workflow',
      nodes: nodes.map((node) => ({
        ...node.data.n8nNode,
        position: [node.position.x, node.position.y],
      })),
      connections: convertEdgesToN8nConnections(edges),
      active: false,
      settings: workflow?.settings || {},
    };

    const dataStr = JSON.stringify(n8nWorkflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${n8nWorkflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [nodes, edges, workflow]);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative">
      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 glass border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-medium text-white">
              {workflow?.name || 'Visual Flow Builder'}
            </h1>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-subtle" />
              <span className="text-green-400 text-sm">n8n Connected</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNodePalette(true)}
              className="btn-secondary px-4 py-2 rounded-xl flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Node</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="btn-secondary px-4 py-2 rounded-xl flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExecute}
              disabled={isExecuting}
              className="btn-primary px-4 py-2 rounded-xl flex items-center space-x-2 disabled:opacity-50"
            >
              {isExecuting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isExecuting ? 'Running...' : 'Execute'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="btn-secondary px-4 py-2 rounded-xl flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </motion.button>

            {onClose && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="btn-secondary px-4 py-2 rounded-xl"
              >
                Close
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div ref={reactFlowWrapper} className="w-full h-full pt-20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-transparent"
        >
          <Background 
            color="rgba(255, 255, 255, 0.1)" 
            gap={20} 
            size={1}
            variant="dots" 
          />
          <Controls 
            className="bg-white/10 border border-white/20 rounded-xl"
            showInteractive={false}
          />
          <MiniMap 
            className="bg-white/10 border border-white/20 rounded-xl"
            nodeColor="rgba(59, 130, 246, 0.8)"
            maskColor="rgba(0, 0, 0, 0.5)"
          />
          
          {/* Custom Panel for Quick Actions */}
          <Panel position="bottom-right" className="mb-4 mr-4">
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExecutionPanel(!showExecutionPanel)}
                className="p-3 glass rounded-xl border border-white/20 text-white hover:bg-white/10"
              >
                <Bug className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 glass rounded-xl border border-white/20 text-white hover:bg-white/10"
              >
                <Share className="w-5 h-5" />
              </motion.button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Palette Modal */}
      <AnimatePresence>
        {showNodePalette && (
          <NodePalette
            onAddNode={addNode}
            onClose={() => setShowNodePalette(false)}
          />
        )}
      </AnimatePresence>

      {/* Node Properties Panel */}
      <AnimatePresence>
        {selectedNode && (
          <NodePropertiesPanel
            node={selectedNode}
            onUpdateNode={updateNodeData}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </AnimatePresence>

      {/* Execution Panel */}
      <AnimatePresence>
        {showExecutionPanel && (
          <ExecutionPanel
            execution={executionResults}
            isExecuting={isExecuting}
            onClose={() => setShowExecutionPanel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function VisualFlowBuilder(props: VisualFlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilder {...props} />
    </ReactFlowProvider>
  );
}

// Helper functions
function getNodeColor(nodeType: string): string {
  if (nodeType.includes('trigger')) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  if (nodeType.includes('webhook')) return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
  if (nodeType.includes('http')) return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
  if (nodeType.includes('email')) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  if (nodeType.includes('slack')) return 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)';
  if (nodeType.includes('function')) return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
}

function convertN8nConnectionsToEdges(connections: Record<string, any>): Edge[] {
  const edges: Edge[] = [];
  
  Object.entries(connections).forEach(([sourceNodeName, nodeConnections]) => {
    if (nodeConnections.main) {
      nodeConnections.main.forEach((outputConnections: any[], outputIndex: number) => {
        outputConnections.forEach((connection, connectionIndex) => {
          edges.push({
            id: `edge-${sourceNodeName}-${connection.node}-${outputIndex}-${connectionIndex}`,
            source: sourceNodeName,
            target: connection.node,
            type: 'smoothstep',
            style: { stroke: '#3b82f6', strokeWidth: 2 },
            animated: true,
          });
        });
      });
    }
  });
  
  return edges;
}

function convertEdgesToN8nConnections(edges: Edge[]): Record<string, any> {
  const connections: Record<string, any> = {};
  
  edges.forEach((edge) => {
    if (!connections[edge.source]) {
      connections[edge.source] = { main: [[]] };
    }
    
    connections[edge.source].main[0].push({
      node: edge.target,
      type: 'main',
      index: 0,
    });
  });
  
  return connections;
}