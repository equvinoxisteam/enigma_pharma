import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Factory, Star, MapPin, CheckCircle, Mail, Eye, X } from 'lucide-react';
import { invitationAPI } from '../api/invitationAPI';
import { rfqAPI } from '../api/rfqAPI';
import { profileAPI } from '../api/profileAPI';
import { useToast } from '../contexts/ToastContext';

const MyManufacturersPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [availableRFQs, setAvailableRFQs] = useState([]);

  useEffect(() => {
    fetchManufacturers();
    if (showInviteModal) {
      fetchAvailableRFQs();
    }
  }, [showInviteModal]);

  const fetchManufacturers = async () => {
    setLoading(true);
    try {
      // Get manufacturers from completed RFQs
      const myRFQs = await rfqAPI.getMyRFQs({ status: 'CLOSED' });
      const completedRFQs = myRFQs.data || [];
      
      // Extract unique manufacturers
      const manufacturerMap = new Map();
      completedRFQs.forEach(rfq => {
        if (rfq.selectedManufacturerId) {
          const mfrId = rfq.selectedManufacturerId._id || rfq.selectedManufacturerId;
          if (!manufacturerMap.has(mfrId)) {
            manufacturerMap.set(mfrId, {
              ...rfq.selectedManufacturerId,
              lastRFQDate: rfq.closedAt || rfq.updatedAt,
              completedRFQs: 1
            });
          } else {
            const existing = manufacturerMap.get(mfrId);
            existing.completedRFQs += 1;
            if (new Date(rfq.closedAt || rfq.updatedAt) > new Date(existing.lastRFQDate)) {
              existing.lastRFQDate = rfq.closedAt || rfq.updatedAt;
            }
          }
        }
      });

      // Add saved manufacturers
      if (user?.savedManufacturers) {
        user.savedManufacturers.forEach(mfrId => {
          if (!manufacturerMap.has(mfrId)) {
            manufacturerMap.set(mfrId, { _id: mfrId, isSaved: true });
          }
        });
      }

      setManufacturers(Array.from(manufacturerMap.values()));
    } catch (error) {
      showError('Failed to load manufacturers: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRFQs = async () => {
    try {
      const response = await rfqAPI.getMyRFQs({ status: 'OPEN_FOR_REQUESTS' });
      setAvailableRFQs(response.data || []);
    } catch (error) {
      console.error('Failed to load RFQs:', error);
    }
  };

  const handleInvite = async (rfqId) => {
    if (!selectedManufacturer) return;

    try {
      await invitationAPI.create({
        rfqId,
        manufacturerId: selectedManufacturer._id,
        message: `We would like to invite you to quote on this RFQ.`
      });
      showSuccess('Invitation sent successfully!');
      setShowInviteModal(false);
      setSelectedManufacturer(null);
    } catch (error) {
      showError('Failed to send invitation: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleStar = async (manufacturerId) => {
    try {
      const response = await profileAPI.toggleSavedManufacturer(manufacturerId);
      showSuccess(response.saved ? 'Manufacturer saved to favorites' : 'Removed from favorites');
      fetchManufacturers();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update favorites');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Manufacturers</h1>
        <p className="text-gray-600">Manufacturers you've worked with or saved</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : manufacturers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Factory size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No manufacturers yet</h3>
          <p className="text-gray-600 mb-4">Complete RFQs to build your manufacturer network</p>
          <Link
            to="/manufacturers-pool"
            className="inline-block px-6 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors"
          >
            Browse Manufacturers
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {manufacturers.map((manufacturer) => (
              <div
                key={manufacturer._id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#4881F8] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {manufacturer.companyName || 'Manufacturer'}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin size={14} className="mr-1" />
                      {manufacturer.country || 'N/A'} {manufacturer.region && `• ${manufacturer.region}`}
                    </div>
                    {manufacturer.rating && (
                      <div className="flex items-center mb-2">
                        <Star size={14} className="text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{manufacturer.rating}</span>
                        <span className="text-xs text-gray-500 ml-1">({manufacturer.reviewCount || 0})</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleStar(manufacturer._id)}
                    className="text-yellow-500 hover:text-yellow-600"
                  >
                    <Star size={20} fill="currentColor" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {manufacturer.manufacturingTypes?.slice(0, 3).map((tech, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                        {tech.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                  {manufacturer.completedRFQs > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={14} className="mr-1 text-green-600" />
                      {manufacturer.completedRFQs} completed RFQ{manufacturer.completedRFQs > 1 ? 's' : ''}
                    </div>
                  )}
                  {manufacturer.lastRFQDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Last RFQ: {new Date(manufacturer.lastRFQDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <Link
                    to={`/manufacturer/${manufacturer._id}`}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Eye size={16} className="mr-2" />
                    View Profile
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedManufacturer(manufacturer);
                      setShowInviteModal(true);
                    }}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors text-sm"
                  >
                    <Mail size={16} className="mr-2" />
                    Invite
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Invite Modal */}
          {showInviteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Invite to RFQ</h3>
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setSelectedManufacturer(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Select an RFQ to invite <strong>{selectedManufacturer?.companyName}</strong> to:
                </p>
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {availableRFQs.length === 0 ? (
                    <p className="text-sm text-gray-500">No open RFQs available</p>
                  ) : (
                    availableRFQs.map((rfq) => (
                      <button
                        key={rfq._id}
                        onClick={() => handleInvite(rfq._id)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-[#4881F8] hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-medium">{rfq.title}</div>
                        <div className="text-xs text-gray-600">RFQ #{rfq._id.toString().slice(-6)}</div>
                      </button>
                    ))
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setSelectedManufacturer(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <Link
                    to="/start-rfq"
                    className="flex-1 px-4 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors text-center"
                  >
                    Create New RFQ
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyManufacturersPage;

