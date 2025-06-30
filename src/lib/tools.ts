import { Tool } from '../types';

export const availableTools: Tool[] = [
  {
    name: 'WebSearch',
    description: 'Search the web for information using DuckDuckGo',
    input_format: { query: 'string' },
    output_format: { results: 'array', summary: 'string' },
    endpoint: '/api/tools/websearch',
    enabled: true
  },
  {
    name: 'EmailGenerator',
    description: 'Generate professional emails based on context',
    input_format: { context: 'string', tone: 'string', recipient: 'string' },
    output_format: { subject: 'string', body: 'string' },
    endpoint: '/api/tools/email',
    enabled: true
  },
  {
    name: 'DataAnalyzer',
    description: 'Analyze and summarize data patterns',
    input_format: { data: 'object', analysis_type: 'string' },
    output_format: { insights: 'array', summary: 'string' },
    endpoint: '/api/tools/analyze',
    enabled: true
  },
  {
    name: 'TaskPlanner',
    description: 'Break down complex goals into actionable tasks',
    input_format: { goal: 'string', constraints: 'array' },
    output_format: { tasks: 'array', timeline: 'string' },
    endpoint: '/api/tools/planner',
    enabled: true
  }
];

export async function executeTool(toolName: string, input: any): Promise<any> {
  const tool = availableTools.find(t => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool ${toolName} not found`);
  }

  // Mock implementation for demo purposes
  switch (toolName) {
    case 'WebSearch':
      return mockWebSearch(input.query);
    case 'EmailGenerator':
      return mockEmailGenerator(input);
    case 'DataAnalyzer':
      return mockDataAnalyzer(input);
    case 'TaskPlanner':
      return mockTaskPlanner(input);
    default:
      throw new Error(`Tool ${toolName} not implemented`);
  }
}

// Mock implementations
function mockWebSearch(query: string) {
  const mockResults = [
    {
      title: `${query} - Leading Solutions`,
      url: 'https://example.com/1',
      snippet: `Comprehensive guide to ${query} with expert insights and recommendations.`
    },
    {
      title: `Top 10 ${query} Tools for 2024`,
      url: 'https://example.com/2',
      snippet: `Discover the best ${query} tools that professionals are using this year.`
    },
    {
      title: `${query} Best Practices`,
      url: 'https://example.com/3',
      snippet: `Learn industry best practices for implementing ${query} effectively.`
    }
  ];

  return {
    results: mockResults,
    summary: `Found ${mockResults.length} relevant results for "${query}". The search reveals current trends and popular solutions in this domain.`
  };
}

function mockEmailGenerator(input: any) {
  const { context, tone = 'professional', recipient = 'colleague' } = input;
  
  return {
    subject: `Re: ${context} - Next Steps`,
    body: `Dear ${recipient},

I hope this email finds you well. I wanted to follow up on our discussion regarding ${context}.

Based on my analysis, I've identified several key opportunities that could benefit our objectives. I believe we should consider moving forward with a strategic approach that leverages current market trends.

Would you be available for a brief call this week to discuss the details? I'm confident we can create significant value through this initiative.

Best regards,
AI Agent`
  };
}

function mockDataAnalyzer(input: any) {
  return {
    insights: [
      'Data shows 23% increase in efficiency metrics',
      'Identified 3 key optimization opportunities',
      'Trend analysis suggests positive trajectory'
    ],
    summary: 'Analysis reveals strong performance indicators with clear areas for improvement and growth potential.'
  };
}

function mockTaskPlanner(input: any) {
  const { goal } = input;
  
  return {
    tasks: [
      `Research current state of ${goal}`,
      `Identify key stakeholders and requirements`,
      `Develop implementation strategy`,
      `Create timeline and milestones`,
      `Execute and monitor progress`
    ],
    timeline: '2-3 weeks for complete implementation'
  };
}