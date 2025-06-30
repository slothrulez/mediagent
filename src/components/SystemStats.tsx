import React from 'react';
import { Zap, Activity, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SystemStatsProps {
  stats: {
    total: number;
    running: number;
    completed: number;
    idle: number;
  };
}

export function SystemStats({ stats }: SystemStatsProps) {
  const statCards = [
    {
      icon: Zap,
      label: 'Total Workflows',
      value: stats.total,
      status: 'neutral'
    },
    {
      icon: Activity,
      label: 'Active',
      value: stats.running,
      status: stats.running > 0 ? 'active' : 'neutral'
    },
    {
      icon: CheckCircle,
      label: 'Completed Runs',
      value: stats.completed,
      status: 'neutral'
    },
    {
      icon: Clock,
      label: 'Drafts',
      value: stats.idle,
      status: 'neutral'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card p-6 magnetic"
        >
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${
              stat.status === 'active' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-white/10 text-muted'
            }`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-light text-white">
                {stat.value.toString().padStart(2, '0')}
              </p>
              <p className="text-sm text-muted">{stat.label}</p>
            </div>
          </div>
          
          {stat.status === 'active' && (
            <div className="absolute top-3 right-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-subtle" />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}