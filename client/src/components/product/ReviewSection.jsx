import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { MessageSquarePlus } from 'lucide-react';
import { reviewApi } from '../../services';
import useFetch from '../../hooks/useFetch';
import RatingStars from '../common/RatingStars';
import Button from '../common/Button';
import Modal, { ConfirmDialog } from '../common/Modal';
import { Textarea, Input } from '../common/Input';
import EmptyState from '../common/EmptyState';
import Pagination from '../common/Pagination';
import { formatDate } from '../../utils/format';

export default function ReviewSection({ productId }) {
  const [page, setPage] = useState(1);
  const reviews = useFetch(() => reviewApi.list(productId, { page, limit: 5 }), [productId, page]);
  const [modalOpen, setModalOpen] = useState(false);

  const data = reviews.data;
  const breakdown = data?.breakdown || {};
  const totalReviews = data?.meta?.total || 0;

  return (
    <section className="pb-16">
      <h2 className="text-2xl font-bold tracking-tight mb-7">Customer Reviews</h2>

      <div className="grid lg:grid-cols-[300px_1fr] gap-10">
        {/* Summary */}
        <div>
          <div className="border border-ink-800 bg-[#111] rounded-xl p-6 text-center lg:sticky lg:top-28">
            <p className="text-5xl font-extrabold tracking-tight">{(data?.reviews?.length ? avgFrom(reviews.data.reviews) : 0).toFixed(1)}</p>
            <div className="flex justify-center mt-2">
              <RatingStars rating={avgFrom(reviews.data?.reviews || [])} size={17} />
            </div>
            <p className="text-xs text-ink-500 mt-1.5">{totalReviews} verified review{totalReviews === 1 ? '' : 's'}</p>

            <div className="mt-5 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star] || 0;
                const pct = totalReviews ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 font-semibold">{star}</span>
                    <div className="flex-1 h-1.5 bg-ink-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gold-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-ink-400">{count}</span>
                  </div>
                );
              })}
            </div>

            <Button className="w-full mt-6" icon={MessageSquarePlus} onClick={() => setModalOpen(true)}>
              Write a Review
            </Button>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-400">Only customers who purchased this product can submit a review.</p>
          </div>
        </div>

        {/* List */}
        <div>
          {reviews.loading ? (
            <div className="space-y-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-28 rounded-xl" />
              ))}
            </div>
          ) : totalReviews === 0 ? (
            <EmptyState icon={MessageSquarePlus} title="No reviews yet" description="Be the first verified buyer to share your experience." />
          ) : (
            <>
              <div className="divide-y divide-ink-800 border-t border-b border-ink-800">
                {(data?.reviews || []).map((r) => (
                  <article key={r._id} className="py-6">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-gold-500 text-black text-xs font-bold flex items-center justify-center uppercase">
                          {r.user?.firstName?.[0]}{r.user?.lastName?.[0]}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">
                            {r.user?.firstName} {r.user?.lastName?.[0] ? `${r.user.lastName[0]}.` : ''}
                          </p>
                          <RatingStars rating={r.rating} size={12} showValue />
                        </div>
                      </div>
                      <time className="text-xs text-ink-400">{formatDate(r.createdAt)}</time>
                    </div>
                    {r.title && <h4 className="mt-3 font-semibold text-sm">{r.title}</h4>}
                    <p className="mt-1.5 text-sm text-ink-400 leading-relaxed">{r.comment}</p>
                    <span className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-semibold text-emerald-500">
                      <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-none stroke-current stroke-2"><path d="M1 4l3 3 5-6" /></svg>
                      Verified Purchase
                    </span>
                  </article>
                ))}
              </div>
              <Pagination meta={data.meta} onPage={setPage} />
            </>
          )}
        </div>
      </div>

      <WriteReviewModal productId={productId} open={modalOpen} onClose={() => setModalOpen(false)} onSubmitted={() => { setModalOpen(false); }} />
    </section>
  );
}

const avgFrom = (list) => (list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0);

function WriteReviewModal({ productId, open, onClose }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const submit = async () => {
    if (!rating) return toast.error('Please select a star rating');
    if (!comment.trim()) return toast.error('Please write your review');
    setLoading(true);
    try {
      await reviewApi.create(productId, { rating, title, comment });
      toast.success('Review submitted — awaiting approval');
      onClose();
      setRating(0);
      setTitle('');
      setComment('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={() => setConfirmClose(true)} title="Write a Review" size="sm">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Your rating *</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} stars`}>
                  <StarButton filled={star <= rating} />
                </button>
              ))}
            </div>
          </div>
          <Input label="Title" placeholder="Sums it up in a few words" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
          <Textarea label="Review *" placeholder="What did you like or dislike?" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} rows={5} />
          <Button className="w-full" loading={loading} onClick={submit}>
            Submit Review
          </Button>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          onClose();
        }}
        title="Discard review?"
        message="Your review will not be saved."
        confirmLabel="Discard"
      />
    </>
  );
}

function StarButton({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-8 h-8 transition-transform active:scale-90 ${filled ? 'fill-gold-500' : 'fill-none stroke-ink-600 hover:stroke-gold-500'}`} strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5a.56.56 0 0 1 1.04 0l2.13 5.11 5.52.44c.5.04.71.66.32.98l-4.2 3.6 1.28 5.38a.56.56 0 0 1-.84.61L12 16.7l-4.73 2.92a.56.56 0 0 1-.84-.61l1.28-5.38-4.2-3.6a.56.56 0 0 1 .32-.98l5.52-.44 2.13-5.11Z" />
    </svg>
  );
}
