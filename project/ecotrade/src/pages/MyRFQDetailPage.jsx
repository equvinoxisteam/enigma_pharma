import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { rfqAPI } from '../api/rfqAPI';
import { chatAPI } from '../api/chatAPI';
import { ratingAPI } from '../api/ratingAPI';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import CADFileViewer from '../components/CADFileViewer';
import { DetailField, RFQFilesList } from '../components/RFQDetailsPanel';
import { ArrowLeft, FileText, Users, MessageSquare, Package, CheckCircle, X, Star, Send, Pencil, Save, Loader2 } from 'lucide-react';
import OtherTextInput from '../components/ui/OtherTextInput';
import { isOtherValue, resolveOtherValue, otherRequiredError } from '../utils/otherOption';

const partTypeOptions = ['Gear', 'Pipe', 'Bracket', 'Housing', 'Shaft', 'Bearing', 'Valve', 'Connector', 'Mount', 'Cover', 'Other'];
const technologyOptions = ['CNC', 'TURNING', 'MILLING', '3D_PRINTING', 'SHEET_METAL', 'DIE_CASTING', 'INJECTION_MOLDING', 'STAMPING', 'WELDING', 'ASSEMBLY', 'OTHER'];

const MyRFQDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState({ rating: 5, comment: '' });
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === '1');
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const canEdit = rfq && ['DRAFT', 'OPEN_FOR_REQUESTS', 'REQUESTS_PENDING'].includes(rfq.status);

  const buildEditForm = (data) => ({
    title: data.title || '',
    description: data.description || '',
    preferredCurrency: data.preferredCurrency || 'USD',
    rfqDeadline: data.rfqDeadline ? new Date(data.rfqDeadline).toISOString().slice(0, 16) : '',
    acceptanceDeadline: data.acceptanceDeadline ? new Date(data.acceptanceDeadline).toISOString().slice(0, 16) : '',
    shippingTerms: data.shippingTerms || 'FOB',
    country: data.country || '',
    region: data.region || '',
    communicationLanguage: data.communicationLanguage || 'English',
    requestJustification: data.requestJustification || '',
    partTrackingId: data.partTrackingId || '',
    notes: data.notes || '',
    targetDeliveryDate: data.targetDeliveryDate ? new Date(data.targetDeliveryDate).toISOString().slice(0, 10) : '',
    requiredCertificates: data.requiredCertificates || [],
    workpieces: (data.workpieces || []).map((wp) => ({
      ...wp,
      partType: partTypeOptions.includes(wp.partType) ? wp.partType : (wp.partType ? 'Other' : ''),
      partTypeOther: partTypeOptions.includes(wp.partType) ? '' : (wp.partType || ''),
      technology: technologyOptions.includes(wp.technology) ? wp.technology : (wp.technology ? 'OTHER' : ''),
      technologyOther: technologyOptions.includes(wp.technology) ? '' : (wp.technology || ''),
      dimensions: { length: 0, width: 0, height: 0, diameter: 0, ...wp.dimensions },
      quantity: wp.quantity || 1
    }))
  });

  useEffect(() => {
    if (rfq && isEditing && !editForm) {
      setEditForm(buildEditForm(rfq));
    }
  }, [rfq, isEditing, editForm]);

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
    } catch (error) {
      showError('Failed to load RFQ: ' + (error.response?.data?.message || error.message));
      navigate('/my-rfqs');
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

  const handleAcceptManufacturer = async (manufacturerRequestId) => {
    try {
      const response = await rfqAPI.acceptManufacturer(id, manufacturerRequestId);
      if (response.success) {
        showSuccess('Manufacturer accepted!');
        fetchRFQ();
      }
    } catch (error) {
      showError('Failed to accept manufacturer: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectManufacturer = async (manufacturerRequestId) => {
    const reason = window.prompt('Please provide a reason for rejection (optional):');
    try {
      await rfqAPI.rejectManufacturer(id, manufacturerRequestId, reason);
      showSuccess('Manufacturer request rejected');
      fetchRFQ();
    } catch (error) {
      showError('Failed to reject manufacturer');
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      await ratingAPI.create({
        rfqId: id,
        rating: rating.rating,
        comment: rating.comment
      });
      showSuccess('Rating submitted!');
      setShowRatingModal(false);
      fetchRFQ();
    } catch (error) {
      showError('Failed to submit rating');
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await rfqAPI.updateStatus(id, { status });
      showSuccess('Status updated');
      fetchRFQ();
    } catch (error) {
      showError('Failed to update status');
    }
  };

  const handleStartEdit = () => {
    setEditForm(buildEditForm(rfq));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleWorkpieceEdit = (index, field, value) => {
    setEditForm((prev) => {
      const workpieces = [...prev.workpieces];
      if (field.startsWith('dimensions.')) {
        const dim = field.split('.')[1];
        workpieces[index] = {
          ...workpieces[index],
          dimensions: { ...workpieces[index].dimensions, [dim]: parseFloat(value) || 0 }
        };
      } else {
        workpieces[index] = { ...workpieces[index], [field]: value };
      }
      return { ...prev, workpieces };
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    for (let i = 0; i < (editForm.workpieces || []).length; i += 1) {
      const wp = editForm.workpieces[i];
      const partTypeErr = otherRequiredError(wp.partType, wp.partTypeOther, 'part type');
      if (partTypeErr) {
        showError(partTypeErr);
        return;
      }
      const techErr = otherRequiredError(wp.technology, wp.technologyOther, 'technology');
      if (techErr) {
        showError(techErr);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        preferredCurrency: editForm.preferredCurrency,
        rfqDeadline: editForm.rfqDeadline ? new Date(editForm.rfqDeadline) : undefined,
        acceptanceDeadline: editForm.acceptanceDeadline ? new Date(editForm.acceptanceDeadline) : undefined,
        shippingTerms: editForm.shippingTerms,
        country: editForm.country,
        region: editForm.region,
        communicationLanguage: editForm.communicationLanguage,
        requestJustification: editForm.requestJustification,
        partTrackingId: editForm.partTrackingId,
        notes: editForm.notes,
        targetDeliveryDate: editForm.targetDeliveryDate ? new Date(editForm.targetDeliveryDate) : undefined,
        requiredCertificates: editForm.requiredCertificates,
        workpieces: editForm.workpieces.map((wp) => ({
          mainFile: wp.mainFile,
          extraFiles: wp.extraFiles || [],
          partType: resolveOtherValue(wp.partType, wp.partTypeOther),
          dimensions: wp.dimensions,
          technology: resolveOtherValue(wp.technology, wp.technologyOther),
          material: wp.material,
          quantity: parseInt(wp.quantity, 10) || 1
        }))
      };
      const response = await rfqAPI.update(id, payload);
      if (response.success) {
        showSuccess('RFQ updated successfully');
        setRfq(response.data);
        setIsEditing(false);
        setEditForm(null);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update RFQ');
    } finally {
      setSaving(false);
    }
  };

  const certificationOptions = ['ISO_9001', 'ISO_13485', 'AS9100', 'IATF_16949', 'ROHS', 'OTHER'];
  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent text-sm';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
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
    { id: 'requests', label: 'Manufacturer Requests', show: rfq.status !== 'SUPPLIER_SELECTED' },
    { id: 'production', label: 'Production & Chat', show: rfq.selectedManufacturerId },
    { id: 'logistics', label: 'Logistics & Closure', show: rfq.status === 'SHIPPED' || rfq.status === 'DELIVERED' }
  ].filter(tab => tab.show);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/my-rfqs')}
          className="flex items-center text-gray-600 hover:text-[#4881F8] mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to My RFQs
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{rfq.title}</h1>
            <p className="text-gray-600">RFQ #{rfq._id.toString().slice(-6)}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {canEdit && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-2 px-4 py-2 border border-[#4881F8] text-[#4881F8] rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Pencil size={18} />
                Edit RFQ
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] disabled:opacity-60"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </>
            )}
            {rfq.status === 'DELIVERED' && !rfq.rating && !isEditing && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Star size={18} className="mr-2" />
                Rate Manufacturer
              </button>
            )}
            {rfq.status === 'SHIPPED' && !isEditing && (
              <button
                onClick={() => handleStatusUpdate('DELIVERED')}
                className="px-4 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0]"
              >
                Confirm Delivery
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Stepper */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          {['DRAFT', 'OPEN_FOR_REQUESTS', 'REQUESTS_PENDING', 'SUPPLIER_SELECTED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CLOSED'].map((status, index) => {
            const isActive = rfq.status === status;
            const isPast = ['DRAFT', 'OPEN_FOR_REQUESTS', 'REQUESTS_PENDING', 'SUPPLIER_SELECTED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CLOSED'].indexOf(rfq.status) >= index;
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
                {index < 7 && (
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
          <div className="space-y-8">
            {isEditing && editForm ? (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 block mb-1">Title</label>
                    <input className={inputClass} value={editForm.title} onChange={(e) => handleEditChange('title', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 block mb-1">Description</label>
                    <textarea className={inputClass} rows={3} value={editForm.description} onChange={(e) => handleEditChange('description', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">RFQ Deadline</label>
                    <input type="datetime-local" className={inputClass} value={editForm.rfqDeadline} onChange={(e) => handleEditChange('rfqDeadline', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">Acceptance Deadline</label>
                    <input type="datetime-local" className={inputClass} value={editForm.acceptanceDeadline} onChange={(e) => handleEditChange('acceptanceDeadline', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">Preferred Currency</label>
                    <select className={inputClass} value={editForm.preferredCurrency} onChange={(e) => handleEditChange('preferredCurrency', e.target.value)}>
                      {['USD', 'EUR', 'GBP', 'INR', 'CNY'].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">Shipping Terms</label>
                    <select className={inputClass} value={editForm.shippingTerms} onChange={(e) => handleEditChange('shippingTerms', e.target.value)}>
                      {['FOB', 'CIF', 'EXW', 'DDP', 'DAP', 'FCA'].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">Country</label>
                    <input className={inputClass} value={editForm.country} onChange={(e) => handleEditChange('country', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">Region</label>
                    <input className={inputClass} value={editForm.region} onChange={(e) => handleEditChange('region', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">Communication Language</label>
                    <input className={inputClass} value={editForm.communicationLanguage} onChange={(e) => handleEditChange('communicationLanguage', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">Target Delivery Date</label>
                    <input type="date" className={inputClass} value={editForm.targetDeliveryDate} onChange={(e) => handleEditChange('targetDeliveryDate', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 block mb-1">Request Justification</label>
                    <textarea className={inputClass} rows={2} value={editForm.requestJustification} onChange={(e) => handleEditChange('requestJustification', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">Part Tracking ID</label>
                    <input className={inputClass} value={editForm.partTrackingId} onChange={(e) => handleEditChange('partTrackingId', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 block mb-1">Notes</label>
                    <textarea className={inputClass} rows={2} value={editForm.notes} onChange={(e) => handleEditChange('notes', e.target.value)} />
                  </div>
                </div>

                {editForm.workpieces?.map((wp, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">Workpiece {index + 1}</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Technology</label>
                        <select className={inputClass} value={wp.technology || ''} onChange={(e) => handleWorkpieceEdit(index, 'technology', e.target.value)}>
                          <option value="">Select</option>
                          {technologyOptions.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                        </select>
                        <OtherTextInput
                          show={isOtherValue(wp.technology)}
                          value={wp.technologyOther}
                          onChange={(value) => handleWorkpieceEdit(index, 'technologyOther', value)}
                          placeholder="Enter technology"
                          className={`${inputClass} mt-2`}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Material</label>
                        <input className={inputClass} value={wp.material || ''} onChange={(e) => handleWorkpieceEdit(index, 'material', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Part Type</label>
                        <select className={inputClass} value={wp.partType || ''} onChange={(e) => handleWorkpieceEdit(index, 'partType', e.target.value)}>
                          <option value="">Select</option>
                          {partTypeOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <OtherTextInput
                          show={isOtherValue(wp.partType)}
                          value={wp.partTypeOther}
                          onChange={(value) => handleWorkpieceEdit(index, 'partTypeOther', value)}
                          placeholder="Enter part type"
                          className={`${inputClass} mt-2`}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Quantity</label>
                        <input type="number" min="1" className={inputClass} value={wp.quantity} onChange={(e) => handleWorkpieceEdit(index, 'quantity', e.target.value)} />
                      </div>
                      {['length', 'width', 'height', 'diameter'].map((dim) => (
                        <div key={dim}>
                          <label className="text-sm font-medium text-gray-500 block mb-1 capitalize">{dim} (mm)</label>
                          <input type="number" className={inputClass} value={wp.dimensions?.[dim] || 0} onChange={(e) => handleWorkpieceEdit(index, `dimensions.${dim}`, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {rfq.description && (
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-800">Project Description</h4>
                    <p className="text-gray-700">{rfq.description}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DetailField label="RFQ Deadline" value={new Date(rfq.rfqDeadline).toLocaleString()} />
                  <DetailField label="Status" value={rfq.status.replace(/_/g, ' ')} />
                  <DetailField label="Preferred Currency" value={rfq.preferredCurrency} />
                  <DetailField label="Shipping Terms" value={rfq.shippingTerms} />
                  <DetailField label="Country" value={rfq.country} />
                  <DetailField label="Region" value={rfq.region} />
                  <DetailField label="Communication Language" value={rfq.communicationLanguage} />
                  {rfq.acceptanceDeadline && (
                    <DetailField label="Acceptance Deadline" value={new Date(rfq.acceptanceDeadline).toLocaleString()} />
                  )}
                  {rfq.targetDeliveryDate && (
                    <DetailField label="Target Delivery" value={new Date(rfq.targetDeliveryDate).toLocaleDateString()} />
                  )}
                  {rfq.partTrackingId && (
                    <DetailField label="Part Tracking ID" value={rfq.partTrackingId} />
                  )}
                </div>

                {rfq.requestJustification && (
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-800">Request Justification</h4>
                    <p className="text-gray-700">{rfq.requestJustification}</p>
                  </div>
                )}

                {rfq.notes && (
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-800">Notes</h4>
                    <p className="text-gray-700">{rfq.notes}</p>
                  </div>
                )}

                {rfq.requiredCertificates?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-800">Required Certificates</h4>
                    <div className="flex flex-wrap gap-2">
                      {rfq.requiredCertificates.map((cert) => (
                        <span key={cert} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">
                          {cert.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">Attached Files</h4>
                  <RFQFilesList workpieces={rfq.workpieces} ndaFile={rfq.ndaFile} />
                </div>

                {rfq.workpieces?.length > 0 && (
                  <div className="space-y-6">
                    <h4 className="font-semibold text-gray-800">Workpieces & Previews</h4>
                    {rfq.workpieces.map((workpiece, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 text-sm">
                          <span><strong>Technology:</strong> {workpiece.technology?.replace(/_/g, ' ')}</span>
                          <span><strong>Material:</strong> {workpiece.material}</span>
                          <span><strong>Qty:</strong> {workpiece.quantity}</span>
                          {workpiece.partType && <span><strong>Type:</strong> {workpiece.partType}</span>}
                        </div>
                        {workpiece.mainFile && (
                          <CADFileViewer workpiece={workpiece} height="320px" backgroundColor="#111827" />
                        )}
                        {workpiece.extraFiles?.length > 0 && (
                          <div className="p-4 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Extra Files</p>
                            <RFQFilesList workpieces={[{ extraFiles: workpiece.extraFiles }]} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
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

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {rfq.manufacturerRequests && rfq.manufacturerRequests.length > 0 ? (
              rfq.manufacturerRequests.map((request) => (
                <div key={request._id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {request.manufacturerId?.companyName || 'Manufacturer'}
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Location:</span> {request.manufacturerId?.country || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Proposed Lead Time:</span> {request.proposedLeadTime} days
                        </div>
                        {request.matchScore && (
                          <div>
                            <span className="font-medium">Match Score:</span> {request.matchScore}%
                          </div>
                        )}
                      </div>
                      {request.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">{request.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <Link
                      to={`/manufacturer/${request.manufacturerId?._id}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => handleAcceptManufacturer(request._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Accept as Supplier
                    </button>
                    <button
                      onClick={() => handleRejectManufacturer(request._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No manufacturer requests yet</p>
              </div>
            )}
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
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-gray-900">Status: {rfq.productionStatus || 'Not Started'}</div>
                  <div className="mt-2">Last updated: {new Date(rfq.updatedAt).toLocaleString()}</div>
                </div>
                {/* Timeline entries would go here */}
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

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Rate Manufacturer</h3>
            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(prev => ({ ...prev, rating: star }))}
                      className="text-3xl"
                    >
                      <Star
                        size={32}
                        className={star <= rating.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                <textarea
                  value={rating.comment}
                  onChange={(e) => setRating(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0]"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRFQDetailPage;

