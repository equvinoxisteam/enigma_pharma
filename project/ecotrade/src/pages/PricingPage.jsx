import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authAPI } from '../api/authAPI';
import { Check, Info, Shield, Zap, Sparkles, Building, Play, Star, ArrowRight, MessageSquare } from 'lucide-react';
import Button from '../components/ui/Button';

const PricingPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      price: '₹0',
      period: '/yr',
      description: 'For discovery and basic visibility',
      features: [
        'Basic search rank',
        'Basic company profile',
        'Limited AI matching',
        'No capacity display',
        'No video/slides visibility',
        'View RFQ Pool (View-only)'
      ],
      cta: 'Current Plan',
      popular: false,
      color: 'gray'
    },
    {
      id: 'STANDARD',
      name: 'Standard',
      price: '₹1,71,000',
      period: '/yr',
      description: 'Essential access for active manufacturers',
      features: [
        'Basic search rank',
        'Basic company profile',
        'Capacity display included',
        'Full AI-matching access',
        'Request & Accept RFQs',
        'Basic discovery tools'
      ],
      cta: 'Upgrade Now',
      popular: false,
      color: 'blue'
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: '₹2,61,000',
      period: '/yr',
      description: 'High visibility and verified trust',
      features: [
        'High search rank',
        'Enhanced profile with media',
        'Capacity display included',
        'Full AI-matching access',
        'Video & slides visibility',
        'Verified badge',
        'Priority support'
      ],
      cta: 'Upgrade Now',
      popular: true,
      color: 'indigo'
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: '₹15,75,000',
      period: '/yr',
      description: 'Top placement & concierge support',
      features: [
        'Top slot search rank (#1)',
        'Enhanced & highlighted profile',
        'Capacity display included',
        'Full AI-matching access',
        'Video & slides full visibility',
        'Verified + highlighted badge',
        'Exclusive corporate RFQs',
        'Priority matching with top buyers'
      ],
      cta: 'Upgrade Now',
      popular: false,
      color: 'purple'
    }
  ];

  const handleUpgradeRequest = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      await authAPI.requestUpgrade({
        planType: selectedPlan.id,
        planName: selectedPlan.id,
        message: requestMessage
      });
      showSuccess(`Request for ${selectedPlan.name} plan submitted! Our team will contact you for payment.`);
      setShowModal(false);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = user?.subscription?.planType || 'FREE';

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#01364a] mb-4 tracking-tighter">Manufacturer & Hybrid Plans</h1>
        <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto font-medium">
          Hybrid accounts combine manufacturer + buyer features under one login, with the same pricing as manufacturer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`relative flex flex-col bg-white rounded-2xl sm:rounded-[2.5rem] border-2 transition-all duration-300 ${
              plan.popular ? 'border-[#4881F8] lg:scale-105 shadow-2xl z-10' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#4881F8] text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                Most Popular
              </div>
            )}

            <div className="p-8 pb-4">
              <h3 className="text-2xl font-black text-[#01364a] mb-1">{plan.name}</h3>
              <p className="text-sm text-gray-400 font-medium mb-6 line-clamp-1">{plan.description}</p>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-black text-[#01364a]">{plan.price}</span>
                <span className="text-gray-400 font-bold ml-1">{plan.period}</span>
              </div>
            </div>

            <div className="px-8 pb-8 flex-1">
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-bold text-gray-600">
                    <Check size={18} className="text-blue-500 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 pt-0">
              <button
                onClick={() => {
                  if (plan.id === currentPlan) return;
                  setSelectedPlan(plan);
                  setShowModal(true);
                }}
                disabled={plan.id === currentPlan}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${
                  plan.id === currentPlan 
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : plan.popular
                    ? 'bg-[#4881F8] text-white hover:bg-blue-600 shadow-xl shadow-blue-500/20'
                    : 'bg-[#01364a] text-white hover:bg-blue-950'
                }`}
              >
                {plan.id === currentPlan ? 'Current Plan' : 'Upgrade Now'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Buyer Section */}
      <div className="bg-[#01364a] rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 lg:p-12 text-white overflow-hidden relative mb-12 sm:mb-20">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="lg:max-w-xl text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-6 tracking-tight">Buyer Plan (Always Free)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Unlimited RFQ Publishing',
                'Full AI-Matching Access',
                'RFQ Management & Analytics',
                'Manufacturer List Building',
                'Vendor Block-listing',
                'Real-time Chat Support'
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 font-bold opacity-90">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-emerald-400" />
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-96 bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10">
            <h3 className="text-xl font-bold mb-4">Architecture Team?</h3>
            <p className="text-gray-300 text-sm font-medium mb-6">
              Get dedicated support for tender-scale procurement, custom API integrations, and white-glove onboarding for your team.
            </p>
            <a
              href="mailto:support@equvinoxis.com?subject=Enterprise%20Architecture%20Team%20Inquiry"
              className="block w-full py-4 bg-white text-[#01364a] rounded-xl font-black hover:bg-gray-100 transition-colors text-center"
            >
              Talk to Architecture Team
            </a>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-20 opacity-10 pointer-events-none">
          <Building size={300} />
        </div>
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#01364a]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-lg p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-[#01364a] mb-2 tracking-tight">Request Upgrade</h2>
              <p className="text-gray-500 font-bold mb-6">Plan: <span className="text-[#4881F8]">{selectedPlan?.name}</span></p>
              
              <div className="mb-6">
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Message to Admin</label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Tell us about your company or requirements..."
                  className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:outline-none transition-all h-32 font-medium"
                ></textarea>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpgradeRequest}
                  disabled={loading}
                  className="flex-1 py-4 bg-[#4881F8] text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
