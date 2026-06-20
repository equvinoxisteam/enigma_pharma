import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ChevronLeft, Save, Loader as Loader2, Bell, BellOff, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Package, User, MapPin, CreditCard, Calendar, Clock, Truck, Circle as XCircle } from 'lucide-react';
import { updateOrderStatus } from '../../../../store/slices/orderSlice';
import { useToast } from '../../../../contexts/ToastContext';
import Button from '../../../../components/ui/Button';

const OrderDetails = ({ order, onClose }) => {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  
  const [selectedStatus, setSelectedStatus] = useState(order?.orderStatus || 'processing');
  const [adminNotes, setAdminNotes] = useState(order?.adminNotes || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // Helper function to get current order status
  const getOrderStatus = (order) => order?.orderStatus || 'processing';

  // Track changes to enable/disable save button
  useEffect(() => {
    const statusChanged = selectedStatus !== getOrderStatus(order);
    const notesChanged = adminNotes !== (order?.adminNotes || '');
    setHasUnsavedChanges(statusChanged || notesChanged);
  }, [selectedStatus, adminNotes, order]);

  // Reset form when order changes
  useEffect(() => {
    if (order) {
      setSelectedStatus(order.orderStatus || 'processing');
      setAdminNotes(order.adminNotes || '');
      setHasUnsavedChanges(false);
    }
  }, [order]);

  const handleStatusDropdownChange = (e) => {
    const newStatus = e.target.value;
    setSelectedStatus(newStatus);
  };

  const handleNotesChange = (e) => {
    setAdminNotes(e.target.value);
  };

  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges || statusUpdateLoading) return;

    setStatusUpdateLoading(true);
    
    try {
      const updateData = {
        id: order._id,
        status: selectedStatus,
        adminNotes: adminNotes.trim() || undefined
      };

      console.log('Updating order status:', updateData);
      
      const result = await dispatch(updateOrderStatus(updateData)).unwrap();
      
      console.log('Update result:', result);
      
      // Show success message with notification status
      if (result.notificationSent) {
        showSuccess(`Order status updated to ${selectedStatus}. Customer has been notified via email.`);
      } else if (result.notificationError) {
        showSuccess(`Order status updated to ${selectedStatus}. Email notification failed: ${result.notificationError}`);
      } else {
        showSuccess(`Order status updated to ${selectedStatus}.`);
      }
      
      setHasUnsavedChanges(false);
      
    } catch (error) {
      console.error('Status update failed:', error);
      showError(error.message || 'Failed to update order status');
      
      // Reset form to original values on error
      setSelectedStatus(getOrderStatus(order));
      setAdminNotes(order?.adminNotes || '');
      setHasUnsavedChanges(false);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-green-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const calculateSubtotal = () => {
    if (!order?.items) return 0;
    return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (!order) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Order not found</p>
        <Button variant="outline" onClick={onClose} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="mr-4 p-2 text-gray-600 hover:text-green-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600">Order #{order.orderId}</p>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && (
            <div className="flex items-center text-orange-600 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
              Unsaved changes
            </div>
          )}
          <Button
            variant={hasUnsavedChanges ? "primary" : "outline"}
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || statusUpdateLoading}
            leftIcon={statusUpdateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            className={hasUnsavedChanges ? "bg-orange-600 hover:bg-orange-700" : ""}
          >
            {statusUpdateLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Items
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item, index) => (
                <div key={`${item.product?._id || item.product || index}`} className="p-6">
                  <div className="flex items-start">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.product?.image || '/placeholder-image.jpg'}
                        alt={item.product?.name || 'Product'}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                    </div>
                    <div className="ml-6 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-medium text-gray-900">
                            {item.product?.name || 'Product Name'}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Quantity: {item.quantity || 0}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Price: ₹{(item.price || 0).toFixed(2)} each
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-base font-medium text-gray-900">
                            ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Shipping Address
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                <div className="flex items-start">
                  <User className="h-4 w-4 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
                    <p className="text-sm text-gray-600">{order.shippingAddress?.address}</p>
                    <p className="text-sm text-gray-600">
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
                    </p>
                    <p className="text-sm text-gray-600">{order.shippingAddress?.country}</p>
                  </div>
                </div>
                {order.shippingAddress?.phone && (
                  <div className="flex items-center">
                    <div className="h-4 w-4 text-gray-400 mr-3" />
                    <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Order Timeline
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Order Placed - Always shown */}
                <div className="flex items-start relative">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">Order Placed</p>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Completed</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Dynamic status timeline based on status history */}
                {order.statusHistory?.slice(1).map((statusItem, index) => {
                  const isLast = index === order.statusHistory.length - 2;
                  
                  return (
                    <div key={statusItem._id || index} className="flex items-start relative">
                      {/* Connecting line */}
                      {!isLast && (
                        <div className="absolute left-5 top-10 w-0.5 h-6 bg-gray-200"></div>
                      )}
                      
                      <div className={`flex-shrink-0 w-10 h-10 ${getStatusColor(statusItem.status).split(' ')[0]} rounded-full flex items-center justify-center border-2 border-gray-300`}>
                        {getStatusIcon(statusItem.status)}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {statusItem.status === 'processing' ? 'Order Processing' : 
                             statusItem.status === 'shipped' ? 'Order Shipped' :
                             statusItem.status === 'delivered' ? 'Order Delivered' :
                             statusItem.status === 'cancelled' ? 'Order Cancelled' :
                             statusItem.status}
                          </p>
                          <div className="flex items-center space-x-2">
                            {statusItem.customerNotified ? (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center">
                                <Bell className="h-3 w-3 mr-1" />
                                Notified
                              </span>
                            ) : statusItem.notificationSent === false ? (
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center">
                                <BellOff className="h-3 w-3 mr-1" />
                                Failed
                              </span>
                            ) : null}
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              Completed
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(statusItem.timestamp)}
                        </p>
                        {statusItem.updatedBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            Updated by: {statusItem.updatedBy.name || 'Admin'}
                          </p>
                        )}
                        {statusItem.notes && (
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Note: {statusItem.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Order Summary</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order ID</span>
                <span className="font-medium">#{order.orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order Date</span>
                <span className="font-medium">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Customer</span>
                <span className="font-medium">{order.user?.name || order.shippingAddress?.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal (incl. GST)</span>
                <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-base font-semibold">₹{order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                <p className="font-medium capitalize">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                  order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                </span>
              </div>
              {order.paymentId && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment ID</p>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded break-all">
                    {order.paymentId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status Update Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Update Status
                {statusUpdateLoading && <Loader2 className="h-4 w-4 ml-2 animate-spin text-green-600" />}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Current Status Display */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Current Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(getOrderStatus(order))}`}>
                  {getStatusIcon(getOrderStatus(order))}
                  <span className="ml-2 capitalize">{getOrderStatus(order)}</span>
                </span>
              </div>

              {/* Status Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={handleStatusDropdownChange}
                  disabled={statusUpdateLoading}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 disabled:opacity-50"
                >
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={handleNotesChange}
                  disabled={statusUpdateLoading}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 disabled:opacity-50"
                  placeholder="Add notes about this status change..."
                />
              </div>

              {/* Status Change Preview */}
              {selectedStatus !== getOrderStatus(order) && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-blue-800">
                      Status will change from <strong>{getOrderStatus(order)}</strong> to <strong>{selectedStatus}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Customer will be automatically notified via email when you save changes.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="font-medium">{order.user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-medium">{order.user?.email || order.shippingAddress?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="font-medium">{order.user?.phoneNumber || order.shippingAddress?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;