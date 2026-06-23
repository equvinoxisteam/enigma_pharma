import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authAPI } from '../api/authAPI';
import { Check, Building } from 'lucide-react';

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
      description: 'Discovery and view-only access',
      rfqLimit: 'View pharma RFQ pool only — cannot submit bids',
      features: [
        'Basic search rank in CDMO pool',
        'Enigma Pharma anonymous profile (identity hidden)',
        'Limited AI matching (2 results)',
        'No GMP docs, gallery, or PDFs shown',
        'Browse Pharma RFQ Pool (view-only)',
        'View buyer invitations (accept requires paid plan)'
      ],
      cta: 'Current Plan',
      popular: false
    },
    {
      id: 'STANDARD',
      name: 'Standard',
      price: '₹3,42,000',
      period: '/yr',
      description: 'Essential access for active CDMO partners',
      rfqLimit: 'Up to 20 RFQ bids / year',
      features: [
        'Submit up to 20 RFQ bids per year',
        'Full CDMO company profile with images',
        'Capacity & batch scale on profile',
        'Full AI matching',
        'NDA & PDF documents visible after selection',
        'Bid on & accept pharma RFQs'
      ],
      cta: 'Request Upgrade',
      popular: false
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: '₹5,22,000',
      period: '/yr',
      description: 'High visibility and verified trust',
      rfqLimit: 'Up to 40 RFQ bids / year',
      features: [
        'Submit up to 40 RFQ bids per year',
        'Verified GMP badge on profile',
        'Enhanced profile with gallery & license docs',
        'High search rank in CDMO pool',
        'Full AI matching + document search',
        'Priority support'
      ],
      cta: 'Request Upgrade',
      popular: true
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: '₹15,75,000',
      period: '/yr',
      description: 'Top placement and concierge support',
      rfqLimit: 'Unlimited RFQ bids',
      features: [
        'Unlimited RFQ bids',
        'Top slot in CDMO search (#1 rank)',
        'Verified + highlighted GMP badge',
        'Full gallery, licenses & capacity',
        'Exclusive corporate pharma RFQs',
        'Concierge deals & priority buyer matching'
      ],
      cta: 'Request Upgrade',
      popular: false
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
      showSuccess(`Upgrade request for ${selectedPlan.name} submitted. Admin will review and activate your plan.`);
      setShowModal(false);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = user?.subscription?.planType || 'FREE';
  const isBuyerOnly = user?.userType === 'BUYER';

  return (
    <div className="w-full py-4 sm:py-6">
      <div className="text-center mb-10 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#01364a] mb-4 tracking-tighter">Enigma Pharma — Plans & Pricing</h1>
        <p className="text-base sm:text-xl text-gray-500 max-w-3xl mx-auto font-medium">
          Pharma buyers publish RFQs for free. CDMO partners browse and bid based on their plan.
          Admin approves upgrades — no online payment required.
        </p>
      </div>

      {!isBuyerOnly && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col bg-white rounded-2xl border-2 transition-all ${
                plan.popular ? 'border-[#4881F8] shadow-xl z-10' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#4881F8] text-white px-5 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Most Popular
                </div>
              )}

              <div className="p-6 pb-3">
                <h3 className="text-xl font-black text-[#01364a]">{plan.name}</h3>
                <p className="text-sm text-gray-400 mt-1 mb-4">{plan.description}</p>
                <div className="flex items-baseline mb-3">
                  <span className="text-3xl font-black text-[#01364a]">{plan.price}</span>
                  <span className="text-gray-400 font-bold ml-1 text-sm">{plan.period}</span>
                </div>
                <p className="text-xs font-bold text-[#4881F8] bg-blue-50 px-3 py-2 rounded-lg">{plan.rfqLimit}</p>
              </div>

              <div className="px-6 pb-6 flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => {
                    if (plan.id === currentPlan) return;
                    setSelectedPlan(plan);
                    setShowModal(true);
                  }}
                  disabled={plan.id === currentPlan}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    plan.id === currentPlan
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : plan.popular
                      ? 'bg-[#4881F8] text-white hover:bg-blue-600'
                      : 'bg-[#01364a] text-white hover:bg-black'
                  }`}
                >
                  {plan.id === currentPlan ? 'Current Plan' : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#01364a] rounded-2xl p-6 sm:p-10 text-white mb-12">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-black mb-4">Pharma Buyer — Always Free</h2>
            <p className="text-blue-100 mb-6 max-w-2xl">
              Sponsors and procurement teams publish unlimited pharma RFQs. CDMO partners cannot create RFQs — they bid on buyer projects.
              Hybrid accounts get buyer powers plus CDMO plan features.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Unlimited pharma RFQ publishing',
                'NDA-gated document workflow',
                'CDMO discovery & invitations',
                'RFQ management & chat',
                'Edit/delete RFQs before acceptance',
                'No subscription fee'
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm font-medium">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-80 bg-white/10 rounded-2xl p-6 border border-white/10">
            <Building size={32} className="mb-3 opacity-70" />
            <h3 className="font-bold mb-2">Enterprise buyers?</h3>
            <p className="text-sm text-blue-100 mb-4">Contact us for tender-scale procurement and dedicated support.</p>
            <a href="mailto:info@equvinoxis.com" className="block text-center py-3 bg-white text-[#01364a] rounded-xl font-bold text-sm">
              Contact Sales
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-600">
        <h3 className="font-bold text-[#01364a] mb-3">How upgrades work</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>Request a plan from this page (Standard, Pro, or Enterprise).</li>
          <li>Admin reviews and approves — your plan activates immediately.</li>
          <li>Admin can pause, deactivate, or schedule removal with a <strong>24-hour buffer</strong> before downgrade.</li>
          <li>RFQ request counts reset when a new paid plan period starts.</li>
        </ol>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-[#01364a] mb-2">Request {selectedPlan?.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedPlan?.rfqLimit}</p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Company details, GST, expected RFQ volume..."
              className="w-full p-4 border border-gray-200 rounded-xl h-28 mb-4 text-sm"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm">Cancel</button>
              <button onClick={handleUpgradeRequest} disabled={loading} className="flex-1 py-3 bg-[#4881F8] text-white rounded-xl font-bold text-sm">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
