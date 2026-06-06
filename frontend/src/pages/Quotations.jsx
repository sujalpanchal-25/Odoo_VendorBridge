import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FileText, Calendar, DollarSign, TrendingDown, Eye } from 'lucide-react';

import { listQuotations } from '../services/quotationApi.js';
import Card from '../components/common/Card.jsx';
import Table from '../components/common/Table.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';
import { showToast } from '../components/common/Toast.jsx';

export default function Quotations() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // List states
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await listQuotations({ page, limit: 12 });
      setQuotations(res.data.data.quotations);
      setTotal(res.data.data.total);
    } catch (err) {
      showToast('Error loading quotations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [page]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '4px' }}>Vendor Quotations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {user?.role === 'vendor' 
              ? 'View and manage your submitted price proposals for RFQs.' 
              : 'Review submitted vendor price quotes, side-by-side comparisons, and selection status.'}
          </p>
        </div>
      </div>

      {/* List content */}
      {loading ? (
        <div className="spinner-container">
          <Spinner />
        </div>
      ) : quotations.length > 0 ? (
        <Card style={{ padding: 0 }}>
          <Table headers={['RFQ Reference', 'Vendor Partner', 'Delivery Days', 'Subtotal', 'Grand Total', 'Status', 'Submitted Date', 'Actions']}>
            {quotations.map(quote => (
              <tr key={quote._id}>
                <td>
                  <div>
                    <span 
                      onClick={() => navigate(`/rfqs/${quote.rfq?._id}`)}
                      style={{ fontWeight: 600, color: 'var(--accent-color)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {quote.rfq?.rfqNumber}
                    </span>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {quote.rfq?.title}
                    </p>
                  </div>
                </td>
                <td>
                  <div>
                    <span style={{ fontWeight: 600 }}>{quote.vendor?.companyName}</span>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Rating: {quote.vendor?.rating} ★</p>
                  </div>
                </td>
                <td>{quote.deliveryDays} Days</td>
                <td>{formatCurrency(quote.subtotal)}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(quote.grandTotal)}</td>
                <td>
                  <Badge status={quote.status}>{quote.status}</Badge>
                </td>
                <td>
                  {quote.submittedAt ? new Date(quote.submittedAt).toLocaleDateString('en-IN') : 'Draft'}
                </td>
                <td>
                  <Button 
                    onClick={() => navigate(`/rfqs/${quote.rfq?._id}`)} 
                    variant="secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={12} /> View RFQ
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <div className="empty-state">
          <FileText size={48} className="empty-state-icon" />
          <h3>No Quotations Yet</h3>
          <p>
            {user?.role === 'vendor'
              ? 'You have not submitted any quotations. Open the RFQ page to find assignments.'
              : 'No quotations have been submitted by vendors yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
