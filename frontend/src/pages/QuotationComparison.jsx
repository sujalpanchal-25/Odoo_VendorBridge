import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
  CreditCard,
  MessageSquare,
  Star,
  TrendingDown,
  ShieldCheck,
  Trophy,
} from 'lucide-react';

import { compareQuotations, selectQuotation } from '../services/quotationApi.js';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { showToast } from '../components/common/Toast.jsx';

export default function QuotationComparison() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const canSelect = user?.role === 'officer' || user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [rfq, setRfq] = useState(null);
  const [confirmSelection, setConfirmSelection] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [submittingSelection, setSubmittingSelection] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await compareQuotations(rfqId);
        const data = res.data.data;
        setQuotations(data);
        if (data.length > 0 && data[0].rfq) setRfq(data[0].rfq);
      } catch {
        showToast('Error loading comparison', 'error');
        navigate('/rfqs');
      } finally {
        setLoading(false);
      }
    })();
  }, [rfqId]);

  const handleSelectBid = async () => {
    setSubmittingSelection(true);
    try {
      await selectQuotation(selectedQuoteId);
      showToast('✅ Quotation selected! Approval workflow initiated.');
      setConfirmSelection(false);
      navigate(`/rfqs/${rfqId}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to select quotation', 'error');
    } finally {
      setSubmittingSelection(false);
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '60vh' }}>
        <Spinner />
      </div>
    );
  }

  // Collect all unique item names across all quotes
  const allItems = Array.from(new Set(quotations.flatMap((q) => q.items.map((i) => i.item))));

  return (
    <div className="page-wrapper">
      {/* ── Back ── */}
      <button
        onClick={() => navigate(`/rfqs/${rfqId}`)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          border: 'none', background: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', marginBottom: '28px', fontSize: '14px', fontWeight: 500,
          padding: '6px 0', transition: 'color .2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <ArrowLeft size={16} /> Back to RFQ Details
      </button>

      {/* ── Header ── */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(245,158,11,0.1)', color: 'var(--accent-color)' }}>
            <Trophy size={22} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Quotation Comparison
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginLeft: '56px' }}>
          {rfq ? (
            <>Comparing <strong>{quotations.length}</strong> bids for <strong>{rfq.rfqNumber} — {rfq.title}</strong>. Lowest price is highlighted in green.</>
          ) : (
            'Select the best bid to initiate the approval workflow.'
          )}
        </p>
      </div>

      {quotations.length === 0 ? (
        /* ── Empty State ── */
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 24px', border: '2px dashed var(--border-color)', borderRadius: '16px',
            color: 'var(--text-secondary)', gap: '16px',
          }}
        >
          <AlertCircle size={52} strokeWidth={1.2} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>No Bids Available Yet</h3>
          <p style={{ fontSize: '14px', margin: 0 }}>Vendors haven't submitted any quotations for this RFQ.</p>
          <Button onClick={() => navigate(`/rfqs/${rfqId}`)} variant="secondary">Go Back to RFQ</Button>
        </div>
      ) : (
        <>
          {/* ── Summary Score Cards ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${quotations.length}, 1fr)`,
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {quotations.map((q, idx) => (
              <div
                key={q._id}
                style={{
                  borderRadius: '16px',
                  border: q.isLowest ? '2px solid #10B981' : '1.5px solid var(--border-color)',
                  backgroundColor: q.isLowest ? 'rgba(16,185,129,0.04)' : 'var(--card-bg)',
                  padding: '24px',
                  position: 'relative',
                  boxShadow: q.isLowest ? '0 4px 24px rgba(16,185,129,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                  transition: 'box-shadow .2s',
                }}
              >
                {/* Badge */}
                {q.isLowest && (
                  <div
                    style={{
                      position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                      backgroundColor: '#10B981', color: '#fff', fontSize: '11px', fontWeight: 700,
                      padding: '5px 14px', borderRadius: '20px',
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.35)', whiteSpace: 'nowrap',
                    }}
                  >
                    <Sparkles size={11} /> LOWEST PRICE
                  </div>
                )}

                {/* Rank badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
                      backgroundColor: idx === 0 ? 'rgba(16,185,129,0.12)' : 'var(--bg-secondary,#F1F5F9)',
                      color: idx === 0 ? '#10B981' : 'var(--text-secondary)',
                    }}
                  >
                    RANK #{idx + 1}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B', fontSize: '13px', fontWeight: 600 }}>
                    <Star size={13} fill="#F59E0B" />
                    {q.vendor?.rating?.toFixed(1) || 'N/A'}
                  </div>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {q.vendor?.companyName}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {q.vendor?.category} • GST: {q.vendor?.gstNumber}
                </p>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>Grand Total</p>
                  <p
                    style={{
                      fontSize: '24px', fontWeight: 800,
                      color: q.isLowest ? '#10B981' : 'var(--text-primary)',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {fmt(q.grandTotal)}
                  </p>
                  {q.isLowest && quotations.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#10B981', fontSize: '12px', fontWeight: 600 }}>
                      <TrendingDown size={13} />
                      Saves {fmt(Math.max(...quotations.map((x) => x.grandTotal)) - q.grandTotal)} vs highest
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Detailed Comparison Table ── */}
          <div
            style={{
              borderRadius: '16px', border: '1.5px solid var(--border-color)',
              overflow: 'hidden', overflowX: 'auto',
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${240 + quotations.length * 220}px` }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary,#F8FAFC)' }}>
                  <th
                    style={{
                      padding: '16px 20px', textAlign: 'left', fontSize: '12px',
                      fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase',
                      letterSpacing: '0.06em', width: '240px', borderBottom: '1.5px solid var(--border-color)',
                    }}
                  >
                    Parameter
                  </th>
                  {quotations.map((q) => (
                    <th
                      key={q._id}
                      style={{
                        padding: '16px 20px', textAlign: 'center', fontSize: '14px',
                        fontWeight: 700, color: q.isLowest ? '#10B981' : 'var(--text-primary)',
                        borderBottom: '1.5px solid var(--border-color)',
                        borderLeft: '1px solid var(--border-color)',
                        backgroundColor: q.isLowest ? 'rgba(16,185,129,0.06)' : 'transparent',
                      }}
                    >
                      {q.vendor?.companyName}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* ── Item Costs Section Label ── */}
                <tr style={{ backgroundColor: 'rgba(99,102,241,0.04)' }}>
                  <td
                    colSpan={quotations.length + 1}
                    style={{
                      padding: '10px 20px', fontSize: '11px', fontWeight: 700,
                      color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    📦 Itemized Unit Costs
                  </td>
                </tr>

                {/* ── Items ── */}
                {allItems.map((itemName, idx) => {
                  const prices = quotations.map((q) => q.items.find((i) => i.item === itemName)?.unitPrice || Infinity);
                  const minPrice = Math.min(...prices);
                  return (
                    <tr
                      key={itemName}
                      style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(248,250,252,0.5)' }}
                    >
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', fontWeight: 500 }}>
                        {itemName}
                      </td>
                      {quotations.map((q) => {
                        const it = q.items.find((i) => i.item === itemName);
                        const isCheapest = it && it.unitPrice === minPrice;
                        return (
                          <td
                            key={q._id}
                            style={{
                              padding: '14px 20px', textAlign: 'center',
                              borderBottom: '1px solid var(--border-color)',
                              borderLeft: '1px solid var(--border-color)',
                              backgroundColor: q.isLowest ? 'rgba(16,185,129,0.03)' : 'transparent',
                            }}
                          >
                            {it ? (
                              <div>
                                <span
                                  style={{
                                    fontSize: '15px', fontWeight: 700,
                                    color: isCheapest ? '#10B981' : 'var(--text-primary)',
                                  }}
                                >
                                  {fmt(it.unitPrice)}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                                  × {it.qty} {it.unit || 'units'}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  = {fmt(it.total)}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* ── Totals Section Label ── */}
                <tr style={{ backgroundColor: 'rgba(99,102,241,0.04)' }}>
                  <td
                    colSpan={quotations.length + 1}
                    style={{
                      padding: '10px 20px', fontSize: '11px', fontWeight: 700,
                      color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    💰 Pricing Breakdown
                  </td>
                </tr>

                {/* Subtotal */}
                <SummaryRow label="Subtotal" quotations={quotations} getValue={(q) => fmt(q.subtotal)} />

                {/* GST */}
                <SummaryRow
                  label="GST Charge"
                  quotations={quotations}
                  getValue={(q) => (
                    <span>
                      {fmt(q.gstAmount)}
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>
                        ({q.gstPercent}%)
                      </span>
                    </span>
                  )}
                  muted
                />

                {/* Grand Total */}
                <tr style={{ backgroundColor: 'rgba(248,250,252,0.8)' }}>
                  <td style={{ padding: '18px 20px', fontWeight: 700, fontSize: '14px', borderBottom: '2px solid var(--border-color)' }}>
                    Grand Total (incl. GST)
                  </td>
                  {quotations.map((q) => (
                    <td
                      key={q._id}
                      style={{
                        padding: '18px 20px', textAlign: 'center',
                        borderBottom: '2px solid var(--border-color)',
                        borderLeft: '1px solid var(--border-color)',
                        backgroundColor: q.isLowest ? 'rgba(16,185,129,0.08)' : 'transparent',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px',
                          color: q.isLowest ? '#10B981' : 'var(--text-primary)',
                        }}
                      >
                        {fmt(q.grandTotal)}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* ── Logistics Section Label ── */}
                <tr style={{ backgroundColor: 'rgba(99,102,241,0.04)' }}>
                  <td
                    colSpan={quotations.length + 1}
                    style={{
                      padding: '10px 20px', fontSize: '11px', fontWeight: 700,
                      color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    🚚 Logistics & Terms
                  </td>
                </tr>

                {/* Delivery */}
                <tr>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} color="var(--text-secondary)" /> Delivery Lead Time
                    </div>
                  </td>
                  {quotations.map((q) => {
                    const minDays = Math.min(...quotations.map((x) => x.deliveryDays));
                    const isFastest = q.deliveryDays === minDays;
                    return (
                      <td
                        key={q._id}
                        style={{
                          padding: '14px 20px', textAlign: 'center',
                          borderBottom: '1px solid var(--border-color)',
                          borderLeft: '1px solid var(--border-color)',
                          backgroundColor: q.isLowest ? 'rgba(16,185,129,0.03)' : 'transparent',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '15px', fontWeight: 700,
                            color: isFastest ? '#6366F1' : 'var(--text-primary)',
                          }}
                        >
                          {q.deliveryDays} Days
                        </span>
                        {isFastest && (
                          <span style={{ display: 'block', fontSize: '10px', color: '#6366F1', fontWeight: 600, marginTop: '2px' }}>
                            ⚡ Fastest
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Payment Terms */}
                <tr style={{ backgroundColor: 'rgba(248,250,252,0.5)' }}>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={13} color="var(--text-secondary)" /> Payment Terms
                    </div>
                  </td>
                  {quotations.map((q) => (
                    <td
                      key={q._id}
                      style={{
                        padding: '14px 20px', textAlign: 'center', fontSize: '13px',
                        borderBottom: '1px solid var(--border-color)',
                        borderLeft: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        backgroundColor: q.isLowest ? 'rgba(16,185,129,0.03)' : 'transparent',
                      }}
                    >
                      {q.paymentTerms || '—'}
                    </td>
                  ))}
                </tr>

                {/* Remarks */}
                <tr>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '13px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageSquare size={13} color="var(--text-secondary)" /> Vendor Remarks
                    </div>
                  </td>
                  {quotations.map((q) => (
                    <td
                      key={q._id}
                      style={{
                        padding: '14px 20px', textAlign: 'center', fontSize: '12px',
                        borderBottom: '1px solid var(--border-color)',
                        borderLeft: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)', lineHeight: 1.6,
                        backgroundColor: q.isLowest ? 'rgba(16,185,129,0.03)' : 'transparent',
                      }}
                    >
                      {q.notes || <em>No remarks provided.</em>}
                    </td>
                  ))}
                </tr>

                {/* ── Action Row ── */}
                {canSelect && (
                  <tr>
                    <td style={{ padding: '20px', backgroundColor: 'var(--bg-secondary,#F8FAFC)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        <ShieldCheck size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Selection triggers L1/L2 approval
                      </div>
                    </td>
                    {quotations.map((q) => (
                      <td
                        key={q._id}
                        style={{
                          padding: '20px', textAlign: 'center',
                          borderLeft: '1px solid var(--border-color)',
                          backgroundColor: q.isLowest ? 'rgba(16,185,129,0.06)' : 'var(--bg-secondary,#F8FAFC)',
                        }}
                      >
                        <button
                          onClick={() => { setSelectedQuoteId(q._id); setConfirmSelection(true); }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            width: '100%', padding: '12px 20px', borderRadius: '10px', border: 'none',
                            cursor: 'pointer', fontSize: '14px', fontWeight: 700, transition: 'all .2s',
                            backgroundColor: q.isLowest ? '#10B981' : 'var(--primary-bg, #0F172A)',
                            color: '#ffffff',
                            boxShadow: q.isLowest ? '0 4px 14px rgba(16,185,129,0.35)' : '0 2px 8px rgba(0,0,0,0.15)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.92'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '1'; }}
                        >
                          <CheckCircle2 size={16} />
                          Select this Bid
                        </button>
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Info Note ── */}
          <div
            style={{
              marginTop: '16px', padding: '14px 20px', borderRadius: '10px',
              backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
              fontSize: '13px', color: '#6366F1', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <ShieldCheck size={15} />
            Selecting a bid will close the RFQ, reject other bids, and automatically initiate a 2-step manager approval workflow (L1 → L2). A Purchase Order and Invoice will be auto-generated upon final approval.
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmSelection}
        title="Select Quotation & Initiate Approval"
        message="Are you sure? The RFQ will close, other bids will be rejected, and a 2-step (L1 + L2) manager approval workflow will be created. The Purchase Order and Invoice will auto-generate once both approvals are complete."
        onConfirm={handleSelectBid}
        onCancel={() => setConfirmSelection(false)}
        loading={submittingSelection}
      />
    </div>
  );
}

// ── Helper: Summary Row ──────────────────────────────────────────────────────
function SummaryRow({ label, quotations, getValue, muted }) {
  return (
    <tr>
      <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '13px' }}>
        {label}
      </td>
      {quotations.map((q) => (
        <td
          key={q._id}
          style={{
            padding: '14px 20px', textAlign: 'center',
            borderBottom: '1px solid var(--border-color)',
            borderLeft: '1px solid var(--border-color)',
            fontSize: muted ? '13px' : '14px',
            fontWeight: muted ? 400 : 600,
            color: muted ? 'var(--text-secondary)' : 'var(--text-primary)',
            backgroundColor: q.isLowest ? 'rgba(16,185,129,0.03)' : 'transparent',
          }}
        >
          {getValue(q)}
        </td>
      ))}
    </tr>
  );
}
