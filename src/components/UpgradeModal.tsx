import React from 'react';
import { X, Check, Crown, Zap, Brain, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const features = [
    {
      icon: Brain,
      title: 'Unlimited Agents',
      description: 'Create and run unlimited autonomous agents simultaneously'
    },
    {
      icon: Zap,
      title: 'Advanced Tools',
      description: 'Access to premium tools and integrations for enhanced capabilities'
    },
    {
      icon: Shield,
      title: 'Priority Support',
      description: '24/7 priority support and dedicated account management'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-strong rounded-3xl shadow-2xl max-w-md w-full"
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-medium text-white">Upgrade to Pro</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-muted" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="text-3xl font-light text-white mb-2">
                $29<span className="text-lg font-normal text-muted">/month</span>
              </div>
              <p className="text-muted">Unlock the full potential of SynapseGrid</p>
            </div>

            <div className="space-y-4 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-xl flex-shrink-0 border border-green-500/30">
                    <feature.icon className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{feature.title}</h3>
                    <p className="text-sm text-muted">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-primary py-4 rounded-2xl font-medium"
              >
                Upgrade Now
              </motion.button>
              <button
                onClick={onClose}
                className="w-full btn-secondary py-4 rounded-2xl font-medium"
              >
                Maybe Later
              </button>
            </div>

            <p className="text-xs text-muted text-center mt-4">
              Cancel anytime. No hidden fees. 30-day money-back guarantee.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}