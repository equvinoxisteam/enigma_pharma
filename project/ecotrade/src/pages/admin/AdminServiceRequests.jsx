import React, { useState, useEffect } from 'react';
import { DollarSign, Wrench, Recycle, Eye, Trash2, ListFilter as Filter, RefreshCw, Bell, ExternalLink } from 'lucide-react';
import Button from '../../components/ui/Button';
import serviceRequestAPI from '../../api/serviceRequestAPI';
import stockNotificationAPI from '../../api/stockNotificationAPI';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

const AdminServiceRequests = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sell');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const tabs = [
    { id: 'sell', label: 'Sell Requests', icon: DollarSign, color: 'blue' },
    { id: 'repair', label: 'Repair Requests', icon: Wrench, color: 'orange' },
    { id: 'recycle', label: 'Recycle Requests', icon: Recycle, color: 'purple' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'teal' }
  ];

  useEffect(() => {
    fetchRequests();
  }, [activeTab, filterStatus]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      if (activeTab === 'notifications') {
        const params = {}; // could support filters in future
        const result = await stockNotificationAPI.getAll(params);
        setRequests(result.notifications || []);
      } else {
        const params = filterStatus !== 'all' ? { status: filterStatus } : {};
        const result = await serviceRequestAPI[activeTab].getAll(params);
        setRequests(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      showToast('Failed to fetch requests', 'error');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      // Only applicable for service requests
      if (activeTab === 'notifications') return;
      const result = await serviceRequestAPI[activeTab].update(id, { status: newStatus });

      if (result.success) {
        fetchRequests();
        showToast('Status updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      let result;
      if (activeTab === 'notifications') {
        result = await stockNotificationAPI.delete(id);
      } else {
        result = await serviceRequestAPI[activeTab].delete(id);
      }

      if (result.success) {
        fetchRequests();
        showToast('Request deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      showToast('Failed to delete request', 'error');
    }
  };

  const handleMarkNotified = async (id) => {
    if (!confirm('Mark this notification as notified?')) return;
    try {
      const result = await stockNotificationAPI.markNotified(id);
      if (result.success) {
        fetchRequests();
        showToast('Marked as notified', 'success');
      }
    } catch (error) {
      console.error('Error marking notified:', error);
      showToast('Failed to mark notified', 'error');
    }
  };

  const getStatusOptions = () => {
    switch (activeTab) {
      case 'sell':
        return ['pending', 'reviewed', 'quoted', 'accepted', 'rejected', 'completed'];
      case 'repair':
        return ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
      case 'recycle':
        return ['pending', 'scheduled', 'picked-up', 'completed', 'cancelled'];
      default:
        return [];
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-blue-100 text-blue-800',
      quoted: 'bg-indigo-100 text-indigo-800',
      'in-progress': 'bg-orange-100 text-orange-800',
      'picked-up': 'bg-teal-100 text-teal-800',
      accepted: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderRequestCard = (request) => {
    // For notifications
    if (activeTab === 'notifications') {
      const notifyStatus = request.notified ? 'Notified' : 'Pending';
      const notifyStatusColor = request.notified 
        ? 'bg-green-100 text-green-800' 
        : 'bg-yellow-100 text-yellow-800';

      return (
        <div key={request._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700"><strong>Email:</strong> {request.email}</p>
              <p className="text-sm text-gray-600"><strong>Phone:</strong> {request.phone || 'N/A'}</p>
              {request.product && (
                <button
                  onClick={() => navigate(`/product/${request.product._id}`)}
                  className="block w-full text-left p-3 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-700">{request.product.name}</p>
                      {request.product.sku && <p className="text-xs text-blue-600">SKU: {request.product.sku}</p>}
                    </div>
                    <ExternalLink className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                </button>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Requested: {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${notifyStatusColor}`}>
              {notifyStatus}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedRequest(request);
                setIsViewModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMarkNotified(request._id)}
              className="text-emerald-600 hover:text-emerald-700"
              disabled={request.notified}
            >
              Mark Notified
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(request._id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    // For service requests (original logic)
    return (
    <div key={request._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{request.name}</h3>
          <p className="text-sm text-gray-600">{request.email}</p>
          <p className="text-sm text-gray-600">{request.phone}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
          {request.status}
        </span>
      </div>

      {activeTab === 'sell' && (
        <div className="mb-4 text-sm text-gray-700">
          <p><strong>Device:</strong> {request.brand} {request.model}</p>
          <p><strong>Type:</strong> {request.deviceType}</p>
          <p><strong>Condition:</strong> {request.condition}</p>
          {request.expectedPrice && <p><strong>Expected Price:</strong> ₹{request.expectedPrice}</p>}
        </div>
      )}

      {activeTab === 'repair' && (
        <div className="mb-4 text-sm text-gray-700">
          <p><strong>Device:</strong> {request.brand} {request.model}</p>
          <p><strong>Urgency:</strong> {request.urgency}</p>
          <p><strong>Problem:</strong> {request.problemDescription?.substring(0, 100)}...</p>
        </div>
      )}

      {activeTab === 'recycle' && (
        <div className="mb-4 text-sm text-gray-700">
          <p><strong>Type:</strong> {request.userType}</p>
          {request.companyName && <p><strong>Company:</strong> {request.companyName}</p>}
          <p><strong>Pickup Date:</strong> {new Date(request.pickupDate).toLocaleDateString()}</p>
          <p><strong>Items:</strong> {request.ewasteItems?.substring(0, 100)}...</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedRequest(request);
            setIsViewModalOpen(true);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>

        {activeTab !== 'notifications' ? (
          <>
            <select
              value={request.status}
              onChange={(e) => handleStatusUpdate(request._id, e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              {getStatusOptions().map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(request._id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
  };

  return (
    <div className="p-4 sm:p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Requests Management</h1>
        <Button onClick={fetchRequests} variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />}>
          Refresh
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setFilterStatus('all');
                  }}
                  className={`flex items-center gap-2 py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab !== 'notifications' && (
            <div className="flex items-center gap-4 mb-6">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                {getStatusOptions().map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="mb-4">
                {activeTab === 'sell' && <DollarSign className="h-12 w-12 mx-auto text-gray-300" />}
                {activeTab === 'repair' && <Wrench className="h-12 w-12 mx-auto text-gray-300" />}
                {activeTab === 'recycle' && <Recycle className="h-12 w-12 mx-auto text-gray-300" />}
              </div>
              <p className="text-lg font-medium">No {activeTab} requests found</p>
              <p className="text-sm">Requests will appear here when customers submit them</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map(renderRequestCard)}
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {activeTab === 'notifications' ? 'Notification Request Details' : 'Request Details'}
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {activeTab === 'notifications' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.phone || 'N/A'}</p>
                  </div>
                </div>

                {selectedRequest.product && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium text-blue-700 mb-2">Product Requested</label>
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">{selectedRequest.product.name}</p>
                      {selectedRequest.product.sku && <p className="text-gray-600">SKU: {selectedRequest.product.sku}</p>}
                      {selectedRequest.product.price && <p className="text-gray-600">Price: ₹{selectedRequest.product.price}</p>}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notification Status</label>
                  <p className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedRequest.notified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {selectedRequest.notified ? 'Notified' : 'Pending'}
                    </span>
                  </p>
                </div>

                {selectedRequest.notificationChannels && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notification Channels</label>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>Email: {selectedRequest.notificationChannels.email ? '✓' : '✗'}</p>
                      <p>SMS: {selectedRequest.notificationChannels.sms ? '✓' : '✗'}</p>
                      <p>WhatsApp: {selectedRequest.notificationChannels.whatsapp ? '✓' : '✗'}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleMarkNotified(selectedRequest._id)}
                    variant="primary"
                    disabled={selectedRequest.notified}
                  >
                    Mark as Notified
                  </Button>
                  <Button
                    onClick={() => {
                      handleDelete(selectedRequest._id);
                      setIsViewModalOpen(false);
                    }}
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </p>
                  </div>
                </div>

                <>
                  {activeTab === 'sell' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                          <p>{selectedRequest.addressLine1}</p>
                          {selectedRequest.addressLine2 && <p>{selectedRequest.addressLine2}</p>}
                          <p>{selectedRequest.city}, {selectedRequest.state} - {selectedRequest.pincode}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Device Type</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedRequest.deviceType}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Brand</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedRequest.brand}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Model</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedRequest.model}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Condition</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedRequest.condition}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Purchase Year</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedRequest.purchaseYear}</p>
                        </div>
                        {selectedRequest.expectedPrice && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Expected Price</label>
                            <p className="mt-1 text-sm text-gray-900">₹{selectedRequest.expectedPrice}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Problem Description</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.problemDescription}</p>
                      </div>
                      {selectedRequest.accessories && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Accessories</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedRequest.accessories}</p>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'repair' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Service Address</label>
                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                          <p>{selectedRequest.addressLine1}</p>
                          {selectedRequest.addressLine2 && <p>{selectedRequest.addressLine2}</p>}
                          <p>{selectedRequest.city}, {selectedRequest.state} - {selectedRequest.pincode}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Device Type</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedRequest.deviceType}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Brand</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedRequest.brand}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Model</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedRequest.model}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Urgency</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedRequest.urgency}</p>
                        </div>
                        {selectedRequest.warrantyStatus && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Warranty Status</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedRequest.warrantyStatus}</p>
                          </div>
                        )}
                        {selectedRequest.preferredDate && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Preferred Date</label>
                            <p className="mt-1 text-sm text-gray-900">{new Date(selectedRequest.preferredDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Problem Description</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.problemDescription}</p>
                      </div>
                    </>
                  )}

                  {activeTab === 'recycle' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">User Type</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedRequest.userType}</p>
                        </div>
                        {selectedRequest.companyName && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Company Name</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedRequest.companyName}</p>
                          </div>
                        )}
                        {selectedRequest.gstNumber && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">GST Number</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedRequest.gstNumber}</p>
                          </div>
                        )}
                        {selectedRequest.estimatedQuantity && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Estimated Quantity</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedRequest.estimatedQuantity}</p>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Pickup Date</label>
                          <p className="mt-1 text-sm text-gray-900">{new Date(selectedRequest.pickupDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pickup Address</label>
                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                          <p>{selectedRequest.addressLine1}</p>
                          {selectedRequest.addressLine2 && <p>{selectedRequest.addressLine2}</p>}
                          <p>{selectedRequest.city}, {selectedRequest.state} - {selectedRequest.pincode}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">E-Waste Items</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.ewasteItems}</p>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>

                  {selectedRequest.adminNotes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRequest.adminNotes}</p>
                    </div>
                  )}
                </>

                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceRequests;