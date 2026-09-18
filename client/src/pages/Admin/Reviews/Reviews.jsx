import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Check, Trash2, MessageSquareOff, ExternalLink } from 'lucide-react';
import { adminApi } from '../../../services';
import useFetch from '../../../hooks/useFetch';
import { AdminPageHeader, DataTable } from '../../../components/admin/ui';
import ConfirmDialog from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import RatingStars from '../../../components/common/RatingStars';
import { Badge } from '../../../components/common/Badges';
import { formatDate } from '../../../utils/format';

const TABS = [
  ['', 'All'],
  ['false', 'Pending'],
  ['true', 'Approved'],
];

export default function AdminReviews() {
  const [approved, setApproved] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useFetch(
    () => adminApi.reviews.list({ approved: approved === '' ? undefined : approved, page, limit: 10 }),
    [approved, page]
  );

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const approve = async (r) => {
    try {
      await adminApi.reviews.approve(r._id);
      toast.success('Review approved & rating updated');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.reviews.remove(deleteTarget._id);
      toast.success('Review deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-[1200px]">
      <AdminPageHeader title="Reviews" subtitle="Moderate customer reviews — approved reviews affect product ratings" />

      <div className="flex gap-1.5 mb-5">
        {TABS.map(([val, label]) => (
          <button
            key={val}
            onClick={() => {
              setApproved(val);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              approved === val ? 'bg-gold-500 text-black border-gold-500' : 'border-ink-700 text-ink-400 hover:border-gold-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton h-72 rounded-xl" />
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: 'review',
                label: 'Review',
                render: (r) => (
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <RatingStars rating={r.rating} size={12} />
                      {r.title && <span className="text-xs font-bold truncate">{r.title}</span>}
                    </div>
                    <p className="text-xs text-ink-400 mt-1 line-clamp-2 max-w-md">{r.comment}</p>
                  </div>
                ),
              },
              {
                key: 'customer',
                label: 'Customer',
                render: (r) => (
                  <div>
                    <p className="font-medium text-sm">{r.user?.firstName} {r.user?.lastName}</p>
                    <p className="text-[11px] text-ink-500">{r.user?.email}</p>
                  </div>
                ),
              },
              {
                key: 'product',
                label: 'Product',
                render: (r) => (
                  <a
                    href={`/product/${r.product?.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium underline underline-offset-2 hover:text-gold-500 inline-flex items-center gap-1 max-w-[140px] text-gold-500"
                  >
                    <span className="truncate">{r.product?.name || 'Deleted product'}</span>
                    {r.product && <ExternalLink size={11} className="shrink-0" />}
                  </a>
                ),
              },
              {
                key: 'isApproved',
                label: 'Status',
                align: 'center',
                render: (r) =>
                  r.isApproved ? <Badge tone="dark">Approved</Badge> : <Badge tone="light" className="!bg-amber-500/10 !border-amber-500/30 !text-amber-500">Pending</Badge>,
              },
              { key: 'createdAt', label: 'Date', align: 'right', render: (r) => formatDate(r.createdAt), mobileStrong: false },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (r) => (
                  <div className="flex justify-end gap-1.5">
                    {!r.isApproved && (
                      <button onClick={() => approve(r)} title="Approve" className="p-2 rounded-lg bg-gold-500 text-black hover:bg-gold-600 transition-colors">
                        <Check size={15} />
                      </button>
                    )}
                    <button onClick={() => setDeleteTarget(r)} title="Delete" className="p-2 rounded-lg hover:bg-red-500/10 text-ink-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ),
              },
            ]}
            rows={data?.reviews || []}
            empty={
              <div className="flex flex-col items-center py-6 text-ink-500">
                <MessageSquareOff size={24} />
                No reviews here
              </div>
            }
          />
          <Pagination meta={data?.meta} onPage={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete review?"
        message={`This ${deleteTarget?.rating}-star review by ${deleteTarget?.user?.firstName} will be permanently removed and product ratings recalculated.`}
        confirmLabel="Delete Review"
      />
    </div>
  );
}
