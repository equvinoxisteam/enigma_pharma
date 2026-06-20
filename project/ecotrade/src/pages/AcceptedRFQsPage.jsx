import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { rfqAPI } from '../api/rfqAPI';
import { useToast } from '../contexts/ToastContext';
import { FileText, Filter, CheckCircle, Factory, Package, Clock, Truck } from 'lucide-react';

const AcceptedRFQsPage = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const statusOptions = [
    'SUPPLIER_SELECTED',
    'IN_PRODUCTION',
    'SHIPPED',
    'DELIVERED'
  ];

  useEffect(() => {
    fetchRFQs();
  }, [filters, pagination.page]);

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const response = await rfqAPI.getAcceptedRFQs({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setRfqs(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      showError('Failed to load RFQs: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'SUPPLIER_SELECTED': { color: 'bg-green-100 text-green-800', label: 'Selected' },
      'IN_PRODUCTION': { color: 'bg-purple-100 text-purple-800', label: 'In Production' },
      'SHIPPED': { color: 'bg-indigo-100 text-indigo-800', label: 'Shipped' },
      'DELIVERED': { color: 'bg-teal-100 text-teal-800', label: 'Delivered' }
    };
    const statusInfo = statusMap[status] || statusMap['SUPPLIER_SELECTED'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Accepted RFQs</h1>
        <p className="text-gray-600">Manage your accepted manufacturing jobs</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RFQ List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4 w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : rfqs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <CheckCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No accepted RFQs</h3>
          <p className="text-gray-600 mb-4">Browse the RFQ pool to find opportunities</p>
          <Link
            to="/rfqs-pool"
            className="inline-block px-6 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors"
          >
            Browse RFQ Pool
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {rfqs.map((rfq) => (
              <Link
                key={rfq._id}
                to={`/accepted-rfqs/${rfq._id}`}
                className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-[#4881F8] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{rfq.title}</h3>
                      {getStatusBadge(rfq.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Buyer: {rfq.buyerId?.companyName || 'N/A'} • {rfq.buyerId?.country || ''}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  {rfq.workpieces?.[0] && (
                    <>
                      <div className="flex items-center text-sm text-gray-600">
                        <Factory size={16} className="mr-2" />
                        {rfq.workpieces[0].technology?.replace('_', ' ')} • {rfq.workpieces[0].material}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Package size={16} className="mr-2" />
                        Qty: {rfq.workpieces[0].quantity}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock size={16} className="mr-2" />
                        {rfq.targetDeliveryDate 
                          ? `Due: ${new Date(rfq.targetDeliveryDate).toLocaleDateString()}`
                          : 'No delivery date'
                        }
                      </div>
                      {rfq.trackingInfo?.trackingId && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Truck size={16} className="mr-2" />
                          Tracking: {rfq.trackingInfo.trackingId}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {rfq.productionStatus && rfq.productionStatus !== 'NOT_STARTED' && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Production Status: <span className="font-medium">{rfq.productionStatus.replace('_', ' ')}</span>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AcceptedRFQsPage;

