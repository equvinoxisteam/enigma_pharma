import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { rfqAPI } from '../api/rfqAPI';
import { useToast } from '../contexts/ToastContext';
import { FileText, Search, Clock, CheckCircle, Pencil, MapPin, Globe, Trash2 } from 'lucide-react';
import { RFQFilesList, WorkpieceSummary } from '../components/RFQDetailsPanel';

const MyRFQsPage = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    technology: '',
    material: '',
    country: '',
    keyword: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const statusOptions = [
    'DRAFT',
    'OPEN_FOR_REQUESTS',
    'REQUESTS_PENDING',
    'SUPPLIER_SELECTED',
    'IN_PRODUCTION',
    'SHIPPED',
    'DELIVERED',
    'CLOSED'
  ];

  useEffect(() => {
    fetchRFQs();
  }, [filters, pagination.page]);

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const response = await rfqAPI.getMyRFQs({
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

  const handleDeleteRFQ = async (rfqId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this RFQ? This cannot be undone.')) return;
    try {
      const response = await rfqAPI.delete(rfqId);
      if (response.success) {
        showSuccess('RFQ deleted');
        fetchRFQs();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete RFQ');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'OPEN_FOR_REQUESTS': { color: 'bg-blue-100 text-blue-800', label: 'Open' },
      'REQUESTS_PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'SUPPLIER_SELECTED': { color: 'bg-green-100 text-green-800', label: 'Supplier Selected' },
      'IN_PRODUCTION': { color: 'bg-purple-100 text-purple-800', label: 'In Production' },
      'SHIPPED': { color: 'bg-indigo-100 text-indigo-800', label: 'Shipped' },
      'DELIVERED': { color: 'bg-teal-100 text-teal-800', label: 'Delivered' },
      'CLOSED': { color: 'bg-gray-100 text-gray-800', label: 'Closed' }
    };
    const statusInfo = statusMap[status] || statusMap['DRAFT'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">My RFQs</h1>
          <p className="text-gray-600">Manage your requests for quotation</p>
        </div>
        <Link
          to="/start-rfq"
          className="px-6 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors text-center w-full sm:w-auto"
        >
          Create New RFQ
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search RFQs..."
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="Technology"
              value={filters.technology}
              onChange={(e) => handleFilterChange('technology', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Material"
              value={filters.material}
              onChange={(e) => handleFilterChange('material', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
            />
          </div>
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
          <FileText size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No RFQs found</h3>
          <p className="text-gray-600 mb-4">Create your first RFQ to get started</p>
          <Link
            to="/start-rfq"
            className="inline-block px-6 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors"
          >
            Create RFQ
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {rfqs.map((rfq) => {
              const canEdit = ['DRAFT', 'OPEN_FOR_REQUESTS', 'REQUESTS_PENDING'].includes(rfq.status);
              return (
              <div
                key={rfq._id}
                className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 hover:border-[#4881F8] hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <Link to={`/my-rfqs/${rfq._id}`} className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{rfq.title}</h3>
                      {getStatusBadge(rfq.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      RFQ #{rfq._id.toString().slice(-6)} · Created {new Date(rfq.createdAt).toLocaleDateString()}
                    </p>
                    {rfq.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{rfq.description}</p>
                    )}
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canEdit && (
                      <>
                        <Link
                          to={`/my-rfqs/${rfq._id}?edit=1`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#4881F8] border border-[#4881F8] rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={14} />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRFQ(rfq._id, e)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </>
                    )}
                    <Link
                      to={`/my-rfqs/${rfq._id}`}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[#4881F8] rounded-lg hover:bg-[#3b6fe0] transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>

                <Link to={`/my-rfqs/${rfq._id}`} className="block">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock size={16} className="mr-2 flex-shrink-0" />
                      Deadline: {new Date(rfq.rfqDeadline).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin size={16} className="mr-2 flex-shrink-0" />
                      {rfq.country}{rfq.region ? `, ${rfq.region}` : ''}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe size={16} className="mr-2 flex-shrink-0" />
                      {rfq.shippingTerms} · {rfq.preferredCurrency}
                    </div>
                    {rfq.selectedManufacturerId && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle size={16} className="mr-2 text-green-600 flex-shrink-0" />
                        Supplier: {rfq.selectedManufacturerId?.companyName || 'Selected'}
                      </div>
                    )}
                  </div>

                  {rfq.workpieces?.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-2 mb-4">
                      {rfq.workpieces.map((wp, i) => (
                        <WorkpieceSummary key={i} workpiece={wp} index={i} />
                      ))}
                    </div>
                  )}

                  <div className="mb-3">
                    <RFQFilesList workpieces={rfq.workpieces} ndaFile={rfq.ndaFile} compact />
                  </div>

                  {rfq.requiredCertificates?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {rfq.requiredCertificates.map((cert) => (
                        <span key={cert} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                          {cert.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {rfq.status === 'REQUESTS_PENDING' && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center text-sm text-[#4881F8]">
                        <Clock size={16} className="mr-2" />
                        New manufacturer requests available
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            );})}
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

export default MyRFQsPage;

