import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { rfqAPI } from '../api/rfqAPI';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { hasFeature, FEATURE_KEYS } from '../config/planFeatures';
import CADFileViewer from '../components/CADFileViewer';
import { getWorkpieceFileUrl, normalizeFileUrl, getFileKind } from '../utils/fileUtils';

const RFQDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const canRequest = hasFeature(user, FEATURE_KEYS.RFQ_RESPOND);
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    message: '',
    proposedLeadTime: 30,
    technologyMatch: false,
    materialMatch: false
  });

  const visibilityTier = rfq?.visibilityTier || 'FULL';
  const isPreview = visibilityTier !== 'FULL';
  const isFreePreview = visibilityTier === 'FREE_PREVIEW';
  const isPaidPreview = visibilityTier === 'PAID_PREVIEW';

  useEffect(() => {
    fetchRFQ();
  }, [id]);

  useEffect(() => {
    if (searchParams.get('request') === 'true' && canRequest) {
      setShowRequestModal(true);
    }
  }, [searchParams, canRequest]);

  const fetchRFQ = async () => {
    setLoading(true);
    try {
      const response = await rfqAPI.getById(id);
      setRfq(response.data);
    } catch (error) {
      showError('Failed to load RFQ: ' + (error.response?.data?.message || error.message));
      navigate('/rfqs-pool');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRFQ = async (e) => {
    e.preventDefault();
    try {
      const response = await rfqAPI.requestRFQ(id, requestData);
      if (response.success) {
        showSuccess('RFQ request submitted successfully');
        setShowRequestModal(false);
        fetchRFQ();
      }
    } catch (error) {
      showError('Failed to request RFQ: ' + (error.response?.data?.message || error.message));
    }
  };

  const stlWorkpieces = (rfq?.workpieces || []).filter((wp) => {
    const url = getWorkpieceFileUrl(wp);
    return url && getFileKind(url) === 'stl';
  });

  if (loading) {
    return (
      <div className="w-full animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!rfq) return null;

  return (
    <div className="w-full">
      <div className="mb-6">
        <button type="button" onClick={() => navigate('/rfqs-pool')} className="text-sm font-semibold text-gray-500 hover:text-[#4881F8] mb-4">
          ← Back to RFQ Pool
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-[#01364a]">{rfq.title}</h1>
            <p className="text-gray-500">RFQ #{rfq._id.toString().slice(-6)}</p>
          </div>
          {rfq.status === 'OPEN_FOR_REQUESTS' || rfq.status === 'REQUESTS_PENDING' ? (
            canRequest ? (
              <button type="button" onClick={() => setShowRequestModal(true)} className="px-6 py-2.5 bg-[#4881F8] text-white rounded-xl font-bold hover:bg-[#3b6fe0]">
                Request RFQ
              </button>
            ) : (
              <Link to="/pricing" className="px-6 py-2.5 bg-[#01364a] text-white rounded-xl font-bold text-center">
                Upgrade to request
              </Link>
            )
          ) : (
            <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold">
              {rfq.status.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      {isPreview && (
        <div className={`mb-6 rounded-xl border p-4 text-sm ${isFreePreview ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
          {isFreePreview && (
            <p><strong>View-only preview.</strong> Upgrade to Standard or higher to send RFQ requests, view buyer details, and access NDA documents.</p>
          )}
          {isPaidPreview && (
            <p><strong>Limited preview until buyer accepts your bid.</strong> Only STL models, buyer snapshot, and NDA are visible. Full drawings and files unlock after supplier selection.</p>
          )}
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {['overview', 'workpieces', ...(isFreePreview ? [] : ['buyer'])].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-semibold text-sm capitalize ${
                activeTab === tab ? 'border-[#4881F8] text-[#4881F8]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-4 text-[#01364a]">RFQ Summary</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">RFQ Deadline</label>
                  <p className="text-gray-900">{new Date(rfq.rfqDeadline).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Target Delivery</label>
                  <p className="text-gray-900">{rfq.targetDeliveryDate ? new Date(rfq.targetDeliveryDate).toLocaleDateString() : 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Country</label>
                  <p className="text-gray-900">{rfq.country} {rfq.region && `• ${rfq.region}`}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Shipping Terms</label>
                  <p className="text-gray-900">{rfq.shippingTerms || '—'}</p>
                </div>
              </div>
            </div>

            {stlWorkpieces[0] && (
              <div>
                <h4 className="font-bold mb-3 text-[#01364a]">STL Preview</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <CADFileViewer workpiece={stlWorkpieces[0]} height="400px" backgroundColor="#111827" />
                </div>
              </div>
            )}

            {isPaidPreview && rfq.ndaFile && (
              <div className="rounded-xl border border-[#01364a]/10 bg-gray-50 p-4">
                <h4 className="font-bold mb-2 text-[#01364a]">NDA Document</h4>
                <p className="text-sm text-gray-600 mb-3">Review and accept the buyer NDA before proceeding with full production files.</p>
                <a href={normalizeFileUrl(rfq.ndaFile)} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-[#01364a] text-white rounded-lg text-sm font-semibold">
                  Download NDA
                </a>
              </div>
            )}

            {!isFreePreview && rfq.requiredCertificates?.length > 0 && (
              <div>
                <h4 className="font-bold mb-2">Required Certificates</h4>
                <div className="flex flex-wrap gap-2">
                  {rfq.requiredCertificates.map((cert, i) => (
                    <span key={i} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">{cert.replace('_', ' ')}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'workpieces' && (
          <div className="space-y-6">
            {(rfq.workpieces || []).map((workpiece, index) => {
              const fileUrl = getWorkpieceFileUrl(workpiece);
              const showStl = fileUrl && getFileKind(fileUrl) === 'stl';
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">Workpiece {index + 1}</h3>
                  {showStl ? (
                    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                      <CADFileViewer workpiece={workpiece} height="400px" backgroundColor="#f9fafb" />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4 p-4 bg-gray-50 rounded-lg">
                      {isPreview ? 'Additional CAD files are hidden until the buyer accepts your bid.' : 'No STL preview available for this workpiece.'}
                    </p>
                  )}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Technology</label>
                      <p className="text-gray-900">{workpiece.technology?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Material</label>
                      <p className="text-gray-900">{workpiece.material}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Quantity</label>
                      <p className="text-gray-900">{workpiece.quantity}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'buyer' && !isFreePreview && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-[#01364a]">Buyer Snapshot</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Company</label>
                <p className="text-gray-900">{rfq.buyerId?.companyName || '—'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Country</label>
                <p className="text-gray-900">{rfq.buyerId?.country || '—'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Region</label>
                <p className="text-gray-900">{rfq.buyerId?.region || rfq.region || '—'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Industry</label>
                <p className="text-gray-900">{rfq.buyerId?.industryVertical || '—'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-[#01364a]">Request RFQ</h3>
            <form onSubmit={handleRequestRFQ} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proposed lead time (days)</label>
                <input type="number" min="1" value={requestData.proposedLeadTime}
                  onChange={(e) => setRequestData((prev) => ({ ...prev, proposedLeadTime: parseInt(e.target.value, 10) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message (optional)</label>
                <textarea value={requestData.message} onChange={(e) => setRequestData((prev) => ({ ...prev, message: e.target.value }))}
                  rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Introduce your capabilities..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#4881F8] text-white rounded-lg font-semibold">Submit request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFQDetailPage;
