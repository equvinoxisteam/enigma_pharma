import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rfqAPI } from '../api/rfqAPI';
import { chatAPI } from '../api/chatAPI';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import CADFileViewer from '../components/CADFileViewer';
import { ArrowLeft, FileText, MessageSquare, Package, Truck, CheckCircle, Send, Upload } from 'lucide-react';

const AcceptedRFQDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [productionStatus, setProductionStatus] = useState('');
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingData, setShippingData] = useState({
    trackingId: '',
    carrier: '',
    shippingDate: ''
  });

  useEffect(() => {
    fetchRFQ();
    if (activeTab === 'chat' || activeTab === 'production') {
      fetchChatMessages();
    }
  }, [id, activeTab]);

  const fetchRFQ = async () => {
    setLoading(true);
    try {
      const response = await rfqAPI.getById(id);
      setRfq(response.data);
      setProductionStatus(response.data.productionStatus || 'NOT_STARTED');
    } catch (error) {
      showError('Failed to load RFQ: ' + (error.response?.data?.message || error.message));
      navigate('/accepted-rfqs');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const response = await chatAPI.getMessages(id);
      setChatMessages(response.data || []);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await chatAPI.sendMessage(id, newMessage);
      setNewMessage('');
      fetchChatMessages();
    } catch (error) {
      showError('Failed to send message');
    }
  };

  const handleStartProduction = async () => {
    try {
      await rfqAPI.updateStatus(id, {
        status: 'IN_PRODUCTION',
        productionStatus: 'IN_PRODUCTION'
      });
      showSuccess('Production started!');
      fetchRFQ();
    } catch (error) {
      showError('Failed to start production');
    }
  };

  const handleUpdateProductionStatus = async (status) => {
    try {
      await rfqAPI.updateStatus(id, {
        productionStatus: status
      });
      showSuccess('Production status updated');
      setProductionStatus(status);
      fetchRFQ();
    } catch (error) {
      showError('Failed to update status');
    }
  };

  const handleMarkShipped = async (e) => {
    e.preventDefault();
    try {
      await rfqAPI.updateStatus(id, {
        status: 'SHIPPED',
        trackingInfo: {
          trackingId: shippingData.trackingId,
          carrier: shippingData.carrier,
          shippingDate: new Date(shippingData.shippingDate)
        }
      });
      showSuccess('RFQ marked as shipped!');
      setShowShippingModal(false);
      fetchRFQ();
    } catch (error) {
      showError('Failed to mark as shipped');
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

  if (!rfq) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'workpieces', label: 'Workpieces', show: true },
    { id: 'production', label: 'Production & Chat', show: true },
    { id: 'logistics', label: 'Logistics', show: rfq.status === 'SHIPPED' || rfq.status === 'DELIVERED' }
  ].filter(tab => tab.show);

  return (
    <div className="w-full">
      <div className="mb-6">
        <button
          onClick={() => navigate('/accepted-rfqs')}
          className="flex items-center text-gray-600 hover:text-[#4881F8] mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Accepted RFQs
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{rfq.title}</h1>
            <p className="text-gray-600">
              Buyer: {rfq.buyerId?.companyName || 'N/A'} • RFQ #{rfq._id.toString().slice(-6)}
            </p>
          </div>
          {rfq.status === 'SUPPLIER_SELECTED' && productionStatus === 'NOT_STARTED' && (
            <button
              onClick={handleStartProduction}
              className="px-6 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors"
            >
              Start Production
            </button>
          )}
        </div>
      </div>

      {/* Status Stepper */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          {['SUPPLIER_SELECTED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'].map((status, index) => {
            const isActive = rfq.status === status;
            const isPast = ['SUPPLIER_SELECTED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'].indexOf(rfq.status) >= index;
            return (
              <React.Fragment key={status}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isPast ? 'bg-[#4881F8] text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`text-xs mt-2 ${isActive ? 'font-semibold text-[#4881F8]' : 'text-gray-600'}`}>
                    {status.replace('_', ' ')}
                  </span>
                </div>
                {index < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${isPast ? 'bg-[#4881F8]' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-[#4881F8] text-[#4881F8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Target Delivery Date</label>
                <p className="text-gray-900">
                  {rfq.targetDeliveryDate ? new Date(rfq.targetDeliveryDate).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Shipping Terms</label>
                <p className="text-gray-900">{rfq.shippingTerms}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Preferred Currency</label>
                <p className="text-gray-900">{rfq.preferredCurrency}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Country</label>
                <p className="text-gray-900">{rfq.country} {rfq.region && `• ${rfq.region}`}</p>
              </div>
            </div>
            {rfq.requestJustification && (
              <div>
                <h4 className="font-semibold mb-2">Request Justification</h4>
                <p className="text-gray-700">{rfq.requestJustification}</p>
              </div>
            )}
            {rfq.ndaFile && (
              <div>
                <h4 className="font-semibold mb-2">NDA Document</h4>
                <a
                  href={rfq.ndaFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-[#4881F8] hover:underline"
                >
                  <FileText size={16} className="mr-2" />
                  View NDA
                </a>
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
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'production' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Chat */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Chat</h3>
              <div className="border border-gray-200 rounded-lg h-96 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-gray-500 mt-8">No messages yet</p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.senderId._id === user._id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs p-3 rounded-lg ${
                          msg.senderId._id === user._id
                            ? 'bg-[#4881F8] text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.senderId._id === user._id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0]"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>

            {/* Production Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Production Timeline</h3>
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Production Status
                  </label>
                  <div className="space-y-2">
                    {['NOT_STARTED', 'QUALITY_CHECK', 'READY_TO_SHIP'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateProductionStatus(status)}
                        disabled={productionStatus === status || rfq.status !== 'IN_PRODUCTION'}
                        className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
                          productionStatus === status
                            ? 'bg-[#4881F8] text-white border-[#4881F8]'
                            : 'bg-white border-gray-300 hover:border-[#4881F8]'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {rfq.status === 'IN_PRODUCTION' && productionStatus === 'READY_TO_SHIP' && (
                  <button
                    onClick={() => setShowShippingModal(true)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Truck size={18} className="inline mr-2" />
                    Mark as Shipped
                  </button>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <div className="font-medium text-gray-900 mb-2">Current Status</div>
                    <div>{productionStatus.replace('_', ' ') || 'Not Started'}</div>
                    <div className="mt-2 text-xs">
                      Last updated: {new Date(rfq.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logistics' && (
          <div className="space-y-6">
            {rfq.trackingInfo && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Tracking Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tracking ID</label>
                    <p className="text-gray-900">{rfq.trackingInfo.trackingId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Carrier</label>
                    <p className="text-gray-900">{rfq.trackingInfo.carrier}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Shipping Date</label>
                    <p className="text-gray-900">
                      {rfq.trackingInfo.shippingDate ? new Date(rfq.trackingInfo.shippingDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {rfq.shippingDocs && rfq.shippingDocs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Shipping Documents</h3>
                <div className="space-y-2">
                  {rfq.shippingDocs.map((doc, i) => (
                    <a
                      key={i}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-[#4881F8] hover:underline"
                    >
                      <FileText size={16} className="mr-2" />
                      {doc.type} - {doc.url.split('/').pop()}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shipping Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Mark as Shipped</h3>
            <form onSubmit={handleMarkShipped} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking ID *
                </label>
                <input
                  type="text"
                  value={shippingData.trackingId}
                  onChange={(e) => setShippingData(prev => ({ ...prev, trackingId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carrier *
                </label>
                <input
                  type="text"
                  value={shippingData.carrier}
                  onChange={(e) => setShippingData(prev => ({ ...prev, carrier: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Date *
                </label>
                <input
                  type="date"
                  value={shippingData.shippingDate}
                  onChange={(e) => setShippingData(prev => ({ ...prev, shippingDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowShippingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0]"
                >
                  Mark as Shipped
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptedRFQDetailPage;

