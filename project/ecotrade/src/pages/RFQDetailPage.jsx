import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { rfqAPI } from '../api/rfqAPI';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { hasFeature, FEATURE_KEYS } from '../config/planFeatures';
import CADFileViewer from '../components/CADFileViewer';
import { getWorkpieceFileUrl } from '../utils/fileUtils';
import { ArrowLeft, FileText, Zap } from 'lucide-react';

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
        showSuccess('RFQ request submitted successfully!');
        setShowRequestModal(false);
        fetchRFQ();
      }
    } catch (error) {
      showError('Failed to request RFQ: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <button
          onClick={() => navigate('/rfqs-pool')}
          className="flex items-center text-gray-600 hover:text-[#4881F8] mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to RFQ Pool
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{rfq.title}</h1>
            <p className="text-gray-600">RFQ #{rfq._id.toString().slice(-6)}</p>
          </div>
          {rfq.status === 'OPEN_FOR_REQUESTS' || rfq.status === 'REQUESTS_PENDING' ? (
            canRequest ? (
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-6 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors"
              >
                Request RFQ
              </button>
            ) : (
              <button
                onClick={() => navigate('/pricing')}
                className="px-6 py-2 bg-gray-100 text-gray-500 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
              >
                Upgrade to Request <Zap size={14} className="fill-current" />
              </button>
            )
          ) : (
            <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
              {rfq.status.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['overview', 'workpieces', 'buyer'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-[#4881F8] text-[#4881F8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">RFQ Summary</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">RFQ Deadline</label>
                  <p className="text-gray-900">{new Date(rfq.rfqDeadline).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Target Delivery Date</label>
                  <p className="text-gray-900">
                    {rfq.targetDeliveryDate ? new Date(rfq.targetDeliveryDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Preferred Currency</label>
                  <p className="text-gray-900">{rfq.preferredCurrency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Shipping Terms</label>
                  <p className="text-gray-900">{rfq.shippingTerms}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Country</label>
                  <p className="text-gray-900">{rfq.country} {rfq.region && `• ${rfq.region}`}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Communication Language</label>
                  <p className="text-gray-900">{rfq.communicationLanguage}</p>
                </div>
              </div>
            </div>

            {rfq.workpieces?.[0] && getWorkpieceFileUrl(rfq.workpieces[0]) && (
              <div>
                <h4 className="font-semibold mb-3">3D Model Preview</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <CADFileViewer workpiece={rfq.workpieces[0]} height="400px" backgroundColor="#111827" />
                </div>
              </div>
            )}

            {rfq.requestJustification && (
              <div>
                <h4 className="font-semibold mb-2">Request Justification</h4>
                <p className="text-gray-700">{rfq.requestJustification}</p>
              </div>
            )}

            {rfq.requiredCertificates && rfq.requiredCertificates.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Required Certificates</h4>
                <div className="flex flex-wrap gap-2">
                  {rfq.requiredCertificates.map((cert, i) => (
                    <span key={i} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {cert.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {rfq.notes && (
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-gray-700">{rfq.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'workpieces' && (
          <div className="space-y-6">
            {rfq.workpieces?.map((workpiece, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Workpiece {index + 1}</h3>
                
                <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                  <CADFileViewer workpiece={workpiece} height="400px" backgroundColor="#f9fafb" />
                </div>

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
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dimensions</label>
                    <p className="text-gray-900">
                      {workpiece.dimensions.length} × {workpiece.dimensions.width} × {workpiece.dimensions.height} mm
                      {workpiece.dimensions.diameter > 0 && ` (D: ${workpiece.dimensions.diameter}mm)`}
                    </p>
                  </div>
                </div>

                {workpiece.extraFiles && workpiece.extraFiles.length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Additional Files</label>
                    <div className="space-y-2">
                      {workpiece.extraFiles.map((file, i) => (
                        <a
                          key={i}
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-[#4881F8] hover:underline"
                        >
                          <FileText size={16} className="mr-2" />
                          File {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'buyer' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Buyer Snapshot</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Company Name</label>
                <p className="text-gray-900">{rfq.buyerId?.companyName || 'Masked'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Country</label>
                <p className="text-gray-900">{rfq.buyerId?.country || 'Masked'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Region</label>
                <p className="text-gray-900">{rfq.buyerId?.region || rfq.region || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Industry</label>
                <p className="text-gray-900">{rfq.buyerId?.industryVertical || 'Masked'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Request RFQ Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Request RFQ</h3>
            <form onSubmit={handleRequestRFQ} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposed Lead Time (days) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={requestData.proposedLeadTime}
                  onChange={(e) => setRequestData(prev => ({ ...prev, proposedLeadTime: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={requestData.message}
                  onChange={(e) => setRequestData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  placeholder="Add a message to the buyer..."
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestData.technologyMatch}
                    onChange={(e) => setRequestData(prev => ({ ...prev, technologyMatch: e.target.checked }))}
                    className="w-4 h-4 text-[#4881F8] border-gray-300 rounded focus:ring-[#4881F8]"
                  />
                  <span className="text-sm text-gray-700">Technology matches my capabilities</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestData.materialMatch}
                    onChange={(e) => setRequestData(prev => ({ ...prev, materialMatch: e.target.checked }))}
                    className="w-4 h-4 text-[#4881F8] border-gray-300 rounded focus:ring-[#4881F8]"
                  />
                  <span className="text-sm text-gray-700">Material matches my capabilities</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFQDetailPage;

