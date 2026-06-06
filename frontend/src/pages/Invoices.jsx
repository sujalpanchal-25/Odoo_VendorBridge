import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FileText, Calendar, Building, DollarSign, ArrowRight, ShieldAlert } from 'lucide-react';

import { listInvoices } from '../services/invoiceApi.js';
import Card from '../components/common/Card.jsx';
import Table from '../components/common/Table.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';
import { showToast } from '../components/common/Toast.jsx';

export default function Invoices() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // List states
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await listInvoices({ status: statusFilter, page, limit: 12 });
      setInvoices(res.data.data.invoices);
      setTotal(res.data.data.total);
    } catch (err) {
      showToast('Error fetching invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, page]);

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
          <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '4px' }}>Tax Invoices</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage organization payments, tax calculations (CGST + SGST), invoice emails, and downloads.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ width: '180px' }}>
            <select 
              className="form-control"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Invoices List */}
      {loading ? (
        <div className="spinner-container">
          <Spinner />
        </div>
      ) : invoices.length > 0 ? (
        <Card style={{ padding: 0 }}>
          <Table headers={['Invoice Number', 'Linked PO', 'Vendor Partner', 'Invoice Date', 'Due Date', 'Grand Total', 'Status', 'Actions']}>
            {invoices.map(invoice => (
              <tr key={invoice._id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{invoice.invoiceNumber}</td>
                <td style={{ fontFamily: 'monospace' }}>{invoice.po?.poNumber}</td>
                <td>{invoice.vendor?.companyName}</td>
                <td>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</td>
                <td>{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(invoice.grandTotal)}</td>
                <td>
                  <Badge status={invoice.status}>{invoice.status}</Badge>
                </td>
                <td>
                  <Button 
                    onClick={() => navigate(`/invoices/${invoice._id}`)} 
                    variant="secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    Manage <ArrowRight size={12} />
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <div className="empty-state">
          <ShieldAlert size={48} className="empty-state-icon" />
          <h3>No Invoices Found</h3>
          <p>No tax invoices have been generated or match your current filters.</p>
        </div>
      )}
    </div>
  );
}
