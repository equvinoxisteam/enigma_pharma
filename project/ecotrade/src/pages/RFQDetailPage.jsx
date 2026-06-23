import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { rfqAPI } from '../api/rfqAPI';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { hasFeature, FEATURE_KEYS } from '../config/planFeatures';
import { normalizeFileUrl } from '../utils/fileUtils';
import {
  SERVICE_CATEGORY_LABELS, DEVELOPMENT_PHASE_LABELS, GMP_LABELS,
  BATCH_SCALE_LABELS, DOCUMENT_TYPE_LABELS, labelFor
} from '../config/pharmaTaxonomy';

const RFQDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const canRequest = hasFeature(user, FEATURE_KEYS.RFQ_RESPOND);
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({ message: '', proposedLeadTime: 30 });

  const visibilityTier = rfq?.visibilityTier || 'FULL';
  const isPreview = visibilityTier !== 'FULL';
  const isFreePreview = visibilityTier === 'FREE_PREVIEW';
  const pp = rfq?.pharmaProject || {};

  useEffect(() => { fetchRFQ(); }, [id]);

  const fetchRFQ = async () => {
    setLoading(true);
    try {
      const response = await rfqAPI.getById(id);
      setRfq(response.data);
    } catch (error) {
      showError('Failed to load RFQ');
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
        showSuccess('Bid submitted successfully');
        setShowRequestModal(false);
        fetchRFQ();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to submit bid');
    }
  };

  if (loading) return <div className="w-full animate-pulse h-64 bg-gray-100 rounded-xl" />;
  if (!rfq) return null;

  return (
    <div className="w-full">
      <button type="button" onClick={() => navigate('/rfqs-pool')} className="text-sm font-semibold text-gray-500 hover:text-[#4881F8] mb-4">
        ← Back to project pool
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#01364a]">{rfq.title}</h1>
          <p className="text-gray-500">RFQ #{rfq._id.toString().slice(-6)}</p>
        </div>
        {(rfq.status === 'OPEN_FOR_REQUESTS' || rfq.status === 'REQUESTS_PENDING') && (
          canRequest ? (
            <button type="button" onClick={() => setShowRequestModal(true)} className="px-6 py-2.5 bg-[#4881F8] text-white rounded-xl font-bold">Submit bid</button>
          ) : (
            <Link to="/pricing" className="px-6 py-2.5 bg-[#01364a] text-white rounded-xl font-bold text-center">Upgrade to bid</Link>
          )
        )}
      </div>

      {isPreview && (
        <div className={`mb-6 rounded-xl border p-4 text-sm ${isFreePreview ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
          {isFreePreview
            ? 'View-only preview. Upgrade to submit bids and access NDA documents.'
            : 'Limited preview until buyer accepts your bid. Sensitive process documents unlock after selection.'}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-[#01364a]">Project details</h2>
          <p><span className="text-gray-500">Category:</span> {labelFor(SERVICE_CATEGORY_LABELS, pp.serviceCategory)}</p>
          <p><span className="text-gray-500">Molecule:</span> {pp.moleculeName || '—'}</p>
          <p><span className="text-gray-500">Phase:</span> {labelFor(DEVELOPMENT_PHASE_LABELS, pp.developmentPhase)}</p>
          <p><span className="text-gray-500">Therapeutic area:</span> {pp.therapeuticArea || '—'}</p>
          <p><span className="text-gray-500">Batch scale:</span> {labelFor(BATCH_SCALE_LABELS, pp.batchScale)}</p>
          <p><span className="text-gray-500">Annual volume:</span> {pp.annualVolume || '—'}</p>
          <p><span className="text-gray-500">Markets:</span> {(pp.targetMarkets || []).join(', ') || '—'}</p>
          {rfq.description && <p className="text-gray-700">{rfq.description}</p>}
        </div>

        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-[#01364a]">Regulatory</h2>
          <p><span className="text-gray-500">Required GMP:</span> {(rfq.regulatory?.requiredGmp || []).map((g) => GMP_LABELS[g] || g).join(', ') || '—'}</p>
          <p><span className="text-gray-500">Licenses:</span> {(rfq.regulatory?.requiredLicenses || []).join(', ') || '—'}</p>
          {rfq.regulatory?.dmfReferences && <p><span className="text-gray-500">DMF/CEP:</span> {rfq.regulatory.dmfReferences}</p>}
          {rfq.ndaFile && (
            <a href={normalizeFileUrl(rfq.ndaFile)} target="_blank" rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-[#01364a] text-white rounded-lg text-sm font-semibold">
              Download NDA / CDA
            </a>
          )}
        </div>
      </div>

      {rfq.documents?.length > 0 && (
        <div className="mt-6 bg-white border rounded-xl p-6">
          <h2 className="font-bold text-[#01364a] mb-4">Documents</h2>
          <ul className="space-y-2">
            {rfq.documents.map((d, i) => (
              <li key={i}>
                <a href={normalizeFileUrl(d.fileUrl)} target="_blank" rel="noopener noreferrer" className="text-[#4881F8] font-medium">
                  {DOCUMENT_TYPE_LABELS[d.docType] || d.docType}: {d.fileName || 'Document'}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isFreePreview && rfq.buyerId && (
        <div className="mt-6 bg-white border rounded-xl p-6">
          <h2 className="font-bold text-[#01364a] mb-2">Buyer snapshot</h2>
          <p>{rfq.buyerId.companyName} · {rfq.buyerId.country}</p>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Submit bid</h3>
            <form onSubmit={handleRequestRFQ} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Lead time (days)</label>
                <input type="number" min="1" className="w-full border rounded-lg px-4 py-2"
                  value={requestData.proposedLeadTime}
                  onChange={(e) => setRequestData({ ...requestData, proposedLeadTime: parseInt(e.target.value, 10) })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea className="w-full border rounded-lg px-4 py-2 h-24" value={requestData.message}
                  onChange={(e) => setRequestData({ ...requestData, message: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 border rounded-lg py-2">Cancel</button>
                <button type="submit" className="flex-1 bg-[#4881F8] text-white rounded-lg py-2 font-semibold">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFQDetailPage;
