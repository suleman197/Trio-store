import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Users, Eye, Ban, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../../../services';
import useFetch from '../../../hooks/useFetch';
import { AdminPageHeader, DataTable, SearchBox, StatCard } from '../../../components/admin/ui';
import Modal, { ConfirmDialog } from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import { formatCurrency, formatDate } from '../../../utils/format';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useFetch(
    () => adminApi.customers.list({ search: search || undefined, page, limit: 12 }),
    [search, page]
  );

  const [detailTarget, setDetailTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  const customers = data?.customers || [];
  const totalSpend = customers.reduce((s, c) => s + c.totalSpent, 0);

  const openDetail = async (c) => {
    setDetailTarget({ loading: true });
    try {
      const detail = await adminApi.customers.get(c.id);
      setDetailTarget(detail);
    } catch (err) {
      toast.error(err.message);
      setDetailTarget(null);
    }
  };

  const confirmToggle = async () => {
    setToggling(true);
    try {
      await adminApi.customers.toggleStatus(toggleTarget.id);
      toast.success(`Account ${!toggleTarget.isActive ? 'activated' : 'deactivated'}`);
      setToggleTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="max-w-[1300px]">
      <AdminPageHeader title="Customers" subtitle={`${data?.meta?.total ?? '…'} registered customers`} />

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-xl">
        <StatCard icon={Users} label="On this page" value={customers.length} sub={`${data?.meta?.total ?? 0} total`} />
        <StatCard icon={Eye} label="Page spend" value={formatCurrency(totalSpend)} tone="light" />
      </div>

      <div className="mb-5">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Name, email or phone…" />
      </div>

      {loading ? (
        <div className="skeleton h-72 rounded-xl" />
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: 'name',
                label: 'Customer',
                render: (c) => (
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-gold-500 text-black text-xs font-bold flex items-center justify-center uppercase shrink-0">
                      {c.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </span>
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-ink-500">{c.email}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'phone', label: 'Phone', render: (c) => c.phone || '—', mobileStrong: false },
              { key: 'createdAt', label: 'Registered', render: (c) => formatDate(c.createdAt), mobileStrong: false },
              { key: 'orderCount', label: 'Orders', align: 'center' },
              { key: 'totalSpent', label: 'Total Spent', align: 'right', render: (c) => formatCurrency(c.totalSpent) },
              {
                key: 'isActive',
                label: 'Status',
                align: 'center',
                render: (c) =>
                  c.isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-emerald-500"><CheckCircle2 size={12} /> Active</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-red-500"><Ban size={12} /> Disabled</span>
                  ),
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (c) => (
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => openDetail(c)} title="View details" className="p-2 rounded-lg hover:bg-ink-800 text-ink-400 hover:text-gold-500 transition-colors">
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => setToggleTarget(c)}
                      title={c.isActive ? 'Deactivate' : 'Activate'}
                      className={`p-2 rounded-lg transition-colors ${c.isActive ? 'hover:bg-red-500/10 text-ink-400 hover:text-red-500' : 'hover:bg-emerald-500/10 text-ink-400 hover:text-emerald-500'}`}
                    >
                      {c.isActive ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                    </button>
                  </div>
                ),
              },
            ]}
            rows={customers}
            keyField="id"
            empty="No customers found"
          />
          <Pagination meta={data?.meta} onPage={setPage} />
        </>
      )}

      {/* Detail modal */}
      <Modal open={!!detailTarget} onClose={() => setDetailTarget(null)} title="Customer Details" size="lg">
        {!detailTarget || detailTarget.loading ? (
          <div className="skeleton h-64 rounded-xl" />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="w-14 h-14 rounded-full bg-gold-500 text-black text-lg font-bold flex items-center justify-center uppercase">
                {detailTarget.customer.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </span>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white">{detailTarget.customer.name}</h3>
                <p className="text-sm text-ink-400">{detailTarget.customer.email} · {detailTarget.customer.phone}</p>
                <p className="text-xs text-ink-500 mt-0.5">Joined {formatDate(detailTarget.customer.createdAt)}</p>
              </div>
              <div className="ml-auto grid grid-cols-2 gap-4 text-right">
                <div>
                  <p className="text-[11px] uppercase font-bold text-ink-500">Orders</p>
                  <p className="text-xl font-extrabold text-white">{detailTarget.stats.orderCount}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold text-ink-500">Spent</p>
                  <p className="text-xl font-extrabold text-white">{formatCurrency(detailTarget.stats.totalSpent)}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink-500 mb-3">Order History</h4>
              {detailTarget.orders.length === 0 ? (
                <p className="text-sm text-ink-500 py-6 text-center border border-dashed border-ink-800 rounded-xl">This customer hasn't ordered yet.</p>
              ) : (
                <ul className="divide-y divide-ink-800 border border-ink-800 rounded-xl overflow-hidden">
                  {detailTarget.orders.map((o) => (
                    <li key={o._id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                      <span className="font-semibold">{o.orderNumber}</span>
                      <span className="text-xs text-ink-500">{formatDate(o.createdAt)}</span>
                      <span className="text-xs text-ink-400 truncate max-w-[180px] hidden sm:block">{o.items.map((i) => i.name).join(', ')}</span>
                      <span className="ml-auto flex items-center gap-3">
                        <span className="font-bold">{formatCurrency(o.total)}</span>
                        <StatusMini status={o.status} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={confirmToggle}
        loading={toggling}
        title={toggleTarget?.isActive ? 'Deactivate account?' : 'Activate account?'}
        message={
          toggleTarget?.isActive
            ? `${toggleTarget?.name} will no longer be able to sign in or place orders.`
            : `${toggleTarget?.name} will regain full access to their account.`
        }
        confirmLabel={toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
      />
    </div>
  );
}

function StatusMini({ status }) {
  const map = {
    pending: 'bg-amber-500/10 text-amber-500',
    confirmed: 'bg-blue-500/10 text-blue-500',
    processing: 'bg-indigo-500/10 text-indigo-500',
    shipped: 'bg-violet-500/10 text-violet-500',
    delivered: 'bg-emerald-500/10 text-emerald-500',
    cancelled: 'bg-red-500/10 text-red-500',
  };
  return <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${map[status] || 'bg-ink-900 text-ink-400'}`}>{status}</span>;
}
