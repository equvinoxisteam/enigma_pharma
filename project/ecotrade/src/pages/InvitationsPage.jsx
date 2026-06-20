import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { invitationAPI } from '../api/invitationAPI';
import { useToast } from '../contexts/ToastContext';
import { Mail, CheckCircle, X, Eye, Clock } from 'lucide-react';

const InvitationsPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const response = await invitationAPI.getAll();
      setInvitations(response.data || []);
    } catch (error) {
      showError('Failed to load invitations: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId) => {
    setProcessing(invitationId);
    try {
      const response = await invitationAPI.accept(invitationId);
      if (response.success) {
        showSuccess('Invitation accepted! RFQ request created.');
        fetchInvitations();
      }
    } catch (error) {
      showError('Failed to accept invitation: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (invitationId) => {
    const reason = window.prompt('Please provide a reason for declining (optional):');
    setProcessing(invitationId);
    try {
      const response = await invitationAPI.decline(invitationId, reason);
      if (response.success) {
        showSuccess('Invitation declined');
        fetchInvitations();
      }
    } catch (error) {
      showError('Failed to decline invitation: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'ACCEPTED': { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      'DECLINED': { color: 'bg-red-100 text-red-800', label: 'Declined' }
    };
    const statusInfo = statusMap[status] || statusMap['PENDING'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING');
  const otherInvitations = invitations.filter(inv => inv.status !== 'PENDING');

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Invitations</h1>
        <p className="text-gray-600">RFQ invitations from buyers</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4 w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : invitations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Mail size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No invitations</h3>
          <p className="text-gray-600">You haven't received any invitations yet</p>
        </div>
      ) : (
        <>
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
              <div className="space-y-4">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className="bg-white border-2 border-[#4881F8] rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {invitation.rfqId?.title || 'RFQ Invitation'}
                          </h3>
                          {getStatusBadge(invitation.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          From: {invitation.buyerId?.companyName || 'Buyer'} • {invitation.buyerId?.country || ''}
                        </p>
                        {invitation.message && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mt-2">
                            {invitation.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Invited: {new Date(invitation.invitedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                      <Link
                        to={`/rfqs-pool/${invitation.rfqId?._id}`}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Eye size={16} className="mr-2" />
                        View RFQ
                      </Link>
                      <button
                        onClick={() => handleAccept(invitation._id)}
                        disabled={processing === invitation._id}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        {processing === invitation._id ? 'Processing...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleDecline(invitation._id)}
                        disabled={processing === invitation._id}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <X size={16} className="mr-2" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Invitations */}
          {otherInvitations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">All Invitations</h2>
              <div className="space-y-4">
                {otherInvitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {invitation.rfqId?.title || 'RFQ Invitation'}
                          </h3>
                          {getStatusBadge(invitation.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          From: {invitation.buyerId?.companyName || 'Buyer'} • {invitation.buyerId?.country || ''}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {invitation.status === 'ACCEPTED' && invitation.respondedAt && (
                            <>Accepted: {new Date(invitation.respondedAt).toLocaleDateString()}</>
                          )}
                          {invitation.status === 'DECLINED' && invitation.respondedAt && (
                            <>Declined: {new Date(invitation.respondedAt).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      <Link
                        to={`/rfqs-pool/${invitation.rfqId?._id}`}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Eye size={16} className="mr-2" />
                        View RFQ
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvitationsPage;

