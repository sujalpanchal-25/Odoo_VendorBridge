import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IKContext, IKUpload } from 'imagekitio-react';
import { 
  Plus, 
  Search, 
  FileText, 
  X, 
  PlusCircle, 
  Trash2, 
  Calendar, 
  Users, 
  Upload, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Eye
} from 'lucide-react';

import { listRfqs, createRfq } from '../services/rfqApi.js';
import { listVendors } from '../services/vendorApi.js';
import api from '../services/api.js';
import Card from '../components/common/Card.jsx';
import Table from '../components/common/Table.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import Modal from '../components/common/Modal.jsx';
import Spinner from '../components/common/Spinner.jsx';
import { showToast } from '../components/common/Toast.jsx';

const CATEGORIES = [
  'IT & Hardware',
  'Office Supplies',
  'Logistics',
  'Raw Materials',
  'Consulting',
  'Facilities',
  'Marketing',
  'Other'
];

export default function RFQs() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // List states
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Multi-step Creation Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStep, setFormStep] = useState(1); // Steps: 1 = Basic Info, 2 = Line Items, 3 = Vendors & Files

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [rfqCategory, setRfqCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  // Step 2: Line Items
  const [lineItems, setLineItems] = useState([{ item: '', qty: 1, unit: 'units' }]);

  // Step 3: Vendors & Files
  const [availableVendors, setAvailableVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [assignedVendors, setAssignedVendors] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch RFQs list
  const fetchRfqsList = async () => {
    setLoading(true);
    try {
      const res = await listRfqs({ category, status, page, limit: 12 });
      setRfqs(res.data.data.rfqs);
      setTotal(res.data.data.total);
    } catch (err) {
      showToast('Failed to load RFQs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqsList();
  }, [category, status, page]);

  // Load vendors for assignment when step 3 is reached or category changes
  useEffect(() => {
    if (isModalOpen && formStep === 3) {
      async function loadVendors() {
        setLoadingVendors(true);
        try {
          const res = await listVendors({ category: rfqCategory, status: 'active', limit: 100 });
          setAvailableVendors(res.data.data.vendors);
        } catch (err) {
          showToast('Failed to load vendors for assignment', 'error');
        } finally {
          setLoadingVendors(false);
        }
      }
      loadVendors();
    }
  }, [isModalOpen, formStep, rfqCategory]);

  // Line item handlers
  const handleAddLineItem = () => {
    setLineItems([...lineItems, { item: '', qty: 1, unit: 'units' }]);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  // Vendor selection handlers
  const handleToggleVendor = (vendorId) => {
    if (assignedVendors.includes(vendorId)) {
      setAssignedVendors(assignedVendors.filter(id => id !== vendorId));
    } else {
      setAssignedVendors([...assignedVendors, vendorId]);
    }
  };

  // Multi-step submission
  const handleNextStep = () => {
    if (formStep === 1) {
      if (!title || !rfqCategory || !deadline) {
        showToast('Please fill in all required fields', 'warning');
        return;
      }
      if (new Date(deadline) <= new Date()) {
        showToast('Deadline must be in the future', 'warning');
        return;
      }
      setFormStep(2);
    } else if (formStep === 2) {
      const invalid = lineItems.some(item => !item.item || item.qty <= 0);
      if (invalid) {
        showToast('Please fill out all items with a quantity greater than 0', 'warning');
        return;
      }
      setFormStep(3);
    }
  };

  const handlePrevStep = () => {
    setFormStep(prev => prev - 1);
  };

  const handleCreateRfqSubmit = async (e) => {
    e.preventDefault();
    if (assignedVendors.length === 0) {
      showToast('Please assign at least one vendor', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await createRfq({
        title,
        category: rfqCategory,
        description,
        lineItems,
        deadline,
        assignedVendors,
        attachments
      });
      showToast('RFQ created successfully as Draft!');
      setIsModalOpen(false);
      resetForm();
      fetchRfqsList();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to create RFQ';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormStep(1);
    setTitle('');
    setRfqCategory(CATEGORIES[0]);
    setDescription('');
    setDeadline('');
    setLineItems([{ item: '', qty: 1, unit: 'units' }]);
    setAssignedVendors([]);
    setAttachments([]);
  };

  const isOfficerOrAdmin = user?.role === 'officer' || user?.role === 'manager' || user?.role === 'admin';

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '4px' }}>Request for Quotations (RFQs)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Create RFQs, assign suppliers, and review submitted price bids.
          </p>
        </div>
        {isOfficerOrAdmin && (
          <Button onClick={() => setIsModalOpen(true)} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Create RFQ
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ width: '200px' }}>
            <select 
              className="form-control"
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select 
              className="form-control"
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* RFQ List Grid */}
      {loading ? (
        <div className="spinner-container">
          <Spinner />
        </div>
      ) : rfqs.length > 0 ? (
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {rfqs.map(rfq => (
            <Card 
              key={rfq._id}
              onClick={() => navigate(`/rfqs/${rfq._id}`)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{rfq.rfqNumber}</span>
                  <Badge status={rfq.status}>{rfq.status}</Badge>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {rfq.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {rfq.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>Category: <strong>{rfq.category}</strong></span>
                  <span>Items: <strong>{rfq.lineItems?.length || 0}</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Quotes: <strong>{rfq.quotationCount || 0} Submitted</strong></span>
                  <span style={{ color: new Date(rfq.deadline) < new Date() ? 'var(--danger-color)' : 'inherit' }}>
                    Deadline: {new Date(rfq.deadline).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <FileText size={48} className="empty-state-icon" />
          <h3>No RFQs Found</h3>
          <p>Create a Request for Quotation to gather vendor quotes.</p>
        </div>
      )}

      {/* Multi-step Create RFQ Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); resetForm(); }} 
        title={`Create RFQ — Step ${formStep} of 3`}
        style={{ maxWidth: '650px' }}
      >
        <div className="timeline-stepper" style={{ marginBottom: '24px' }}>
          <div className={`timeline-step ${formStep >= 1 ? 'active' : ''} ${formStep > 1 ? 'completed' : ''}`}>
            <div className="timeline-circle">1</div>
            <div className="timeline-label">Details</div>
          </div>
          <div className={`timeline-step ${formStep >= 2 ? 'active' : ''} ${formStep > 2 ? 'completed' : ''}`}>
            <div className="timeline-circle">2</div>
            <div className="timeline-label">Items</div>
          </div>
          <div className={`timeline-step ${formStep >= 3 ? 'active' : ''}`}>
            <div className="timeline-circle">3</div>
            <div className="timeline-label">Vendors & Specs</div>
          </div>
        </div>

        {formStep === 1 && (
          <div>
            <Input
              label="RFQ Title"
              placeholder="Supply of Laptops & Office Equipment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select
                label="Procurement Category"
                value={rfqCategory}
                onChange={(e) => setRfqCategory(e.target.value)}
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
                required
              />
              <Input
                label="Submission Deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">RFQ Specifications Description</label>
              <textarea
                className="form-control"
                placeholder="Detail the technical specifications, requirements, and compliance metrics..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button onClick={() => setIsModalOpen(false)} variant="secondary" style={{ marginRight: '12px' }}>
                Cancel
              </Button>
              <Button onClick={handleNextStep} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Next <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {formStep === 2 && (
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px' }}>
              Procurement Line Items
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px', marginBottom: '16px' }}>
              {lineItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 2 }}>
                    <Input
                      label={idx === 0 ? "Item Description" : ""}
                      placeholder="e.g. ThinkPad L14 Gen 4"
                      value={item.item}
                      onChange={(e) => handleLineItemChange(idx, 'item', e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input
                      label={idx === 0 ? "Quantity" : ""}
                      type="number"
                      min="1"
                      placeholder="qty"
                      value={item.qty}
                      onChange={(e) => handleLineItemChange(idx, 'qty', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input
                      label={idx === 0 ? "Unit" : ""}
                      placeholder="Units / Pcs"
                      value={item.unit}
                      onChange={(e) => handleLineItemChange(idx, 'unit', e.target.value)}
                      required
                    />
                  </div>
                  {lineItems.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveLineItem(idx)}
                      style={{ border: 'none', background: 'none', color: 'var(--danger-color)', cursor: 'pointer', paddingBottom: '12px' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddLineItem}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginBottom: '24px' }}
            >
              <PlusCircle size={16} /> Add Line Item
            </button>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button onClick={handlePrevStep} variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={16} /> Back
              </Button>
              <Button onClick={handleNextStep} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Next <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {formStep === 3 && (
          <form onSubmit={handleCreateRfqSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
              {/* Select Vendors Column */}
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} /> Assign active {rfqCategory} vendors
                </h4>

                <div style={{ height: '200px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', overflowY: 'auto', backgroundColor: '#F8FAFC' }}>
                  {loadingVendors ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Spinner style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                    </div>
                  ) : availableVendors.length > 0 ? (
                    availableVendors.map(vendor => (
                      <label 
                        key={vendor._id} 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginBottom: '4px', backgroundColor: assignedVendors.includes(vendor._id) ? 'rgba(245,158,11,0.08)' : 'transparent' }}
                      >
                        <input
                          type="checkbox"
                          checked={assignedVendors.includes(vendor._id)}
                          onChange={() => handleToggleVendor(vendor._id)}
                          style={{ accentColor: 'var(--accent-color)' }}
                        />
                        <span>{vendor.companyName}</span>
                      </label>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 10px' }}>
                      No active vendors in {rfqCategory} found. Register them first.
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Specs Column */}
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={14} /> Technical specs attachments
                </h4>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', maxHeight: '100px', overflowY: 'auto' }}>
                  {attachments.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', backgroundColor: '#E2E8F0', borderRadius: '4px', fontSize: '11px' }}>
                      <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <button type="button" onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>

                <IKContext
                  publicKey={import.meta.env.VITE_IK_PUBLIC_KEY || 'developer-placeholder-public-key'}
                  urlEndpoint={import.meta.env.VITE_IK_URL_ENDPOINT || 'https://ik.imagekit.io/developer-placeholder-endpoint'}
                  authenticator={async () => {
                    const res = await api.get('/upload/auth');
                    return res.data.data;
                  }}
                >
                  <label 
                    className="btn btn-secondary" 
                    style={{ 
                      width: '100%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      cursor: uploadingFile ? 'not-allowed' : 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    <Upload size={14} /> {uploadingFile ? 'Uploading specs...' : 'Upload RFQ Specs Document'}
                    <IKUpload
                      folder="/rfq-attachments"
                      style={{ display: 'none' }}
                      onUploadStart={() => setUploadingFile(true)}
                      onSuccess={(res) => {
                        setAttachments(prev => [...prev, { url: res.url, fileId: res.fileId, name: res.name }]);
                        setUploadingFile(false);
                        showToast('Spec file uploaded');
                      }}
                      onError={() => {
                        setUploadingFile(false);
                        showToast('File upload failed', 'error');
                      }}
                    />
                  </label>
                </IKContext>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button onClick={handlePrevStep} variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={16} /> Back
              </Button>
              <Button type="submit" variant="primary" loading={submitting || uploadingFile}>
                Create Draft RFQ
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
