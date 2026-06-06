import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Clock, Shield, User as UserIcon, RefreshCw, Eye } from 'lucide-react';

import { listActivityLogs, getMyActivityLogs } from '../services/activityApi.js';
import Card from '../components/common/Card.jsx';
import Table from '../components/common/Table.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';
import { showToast } from '../components/common/Toast.jsx';

export default function Activity() {
  const { user } = useSelector((state) => state.auth);

  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  // States
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [viewScope, setViewScope] = useState('mine'); // Default to 'mine' for safety

  // Update scope when user role is available
  useEffect(() => {
    if (isManagerOrAdmin) {
      setViewScope('all');
    }
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      const res = viewScope === 'mine' 
        ? await getMyActivityLogs(params) 
        : await listActivityLogs(params);
      
      setLogs(res.data.data.logs);
      setTotal(res.data.data.total);
    } catch (err) {
      showToast('Error loading activity logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, viewScope]);

  const formatAction = (action) => {
    return action.replace(/_/g, ' ');
  };

  const getActionBadgeStatus = (action) => {
    if (action.includes('CREATE') || action.includes('REGISTER') || action.includes('SUBMIT')) return 'approved'; // Success color
    if (action.includes('REJECT') || action.includes('DELETE') || action.includes('BLOCKED') || action.includes('CANCEL')) return 'rejected'; // Danger color
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'pending'; // Warning color
    return 'issued'; // Default info status
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '4px' }}>System Audit Trails</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Real-time immutable log of actions performed by officers, managers, and vendor partners.
          </p>
        </div>
        {isManagerOrAdmin && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button 
              onClick={() => setViewScope('all')} 
              variant={viewScope === 'all' ? 'primary' : 'secondary'}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              All Activity
            </Button>
            <Button 
              onClick={() => setViewScope('mine')} 
              variant={viewScope === 'mine' ? 'primary' : 'secondary'}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              My Activity
            </Button>
          </div>
        )}
      </div>

      {/* Activity logs listing */}
      {loading ? (
        <div className="spinner-container">
          <Spinner />
        </div>
      ) : logs.length > 0 ? (
        <Card style={{ padding: 0 }}>
          <Table headers={['Time', 'User / Account', 'Role', 'Action Event', 'Target Entity', 'Metadata Remarks']}>
            {logs.map(log => (
              <tr key={log._id}>
                <td>
                  <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <Clock size={13} />
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div 
                      style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        backgroundColor: '#E2E8F0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden'
                      }}
                    >
                      {log.performedBy?.avatar?.url ? (
                        <img src={log.performedBy.avatar.url} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        log.performedBy?.firstName?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '13px' }}>
                        {log.performedBy ? `${log.performedBy.firstName} ${log.performedBy.lastName}` : 'System Agent'}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {log.performedBy?.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ textTransform: 'capitalize', fontSize: '12px', fontWeight: 500 }}>
                    {log.performedBy?.role || 'System'}
                  </span>
                </td>
                <td>
                  <Badge status={getActionBadgeStatus(log.action)}>
                    {formatAction(log.action)}
                  </Badge>
                </td>
                <td>
                  <div>
                    <span style={{ fontWeight: 500, fontSize: '13px' }}>{log.entityTitle || 'N/A'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', fontFamily: 'monospace' }}>
                      {log.entity} ID: {log.entityId}
                    </span>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {log.meta?.remarks || log.meta?.status || 'No additional context'}
                  </span>
                </td>
              </tr>
            ))}
          </Table>

          {/* Simple Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', alignItems: 'center', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Showing {logs.length} of {total} events
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                variant="secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Previous
              </Button>
              <Button 
                onClick={() => setPage(p => p + 1)} 
                disabled={logs.length < 15}
                variant="secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="empty-state">
          <Shield size={48} className="empty-state-icon" />
          <h3>No activity recorded</h3>
          <p>We couldn't find any audit logs for your scope.</p>
        </div>
      )}
    </div>
  );
}
