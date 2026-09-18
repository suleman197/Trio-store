import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { productApi, categoryApi } from '../../services';
import useFetch from '../../hooks/useFetch';
import ProductCard from '../../components/product/ProductCard';
import SectionHeader from '../../components/common/SectionHeader';
import ViewAllLink from '../../components/common/ViewAllLink';
import { ProductGridSkeleton } from '../../components/common/Skeletons';

export default function Home() {
  const featured = useFetch(() => productApi.list({ featured: 'true', limit: 8 }));
  const bestsellers = useFetch(() => productApi.list({ bestseller: 'true', sort: 'popular', limit: 4 }));
  const latest = useFetch(() => productApi.list({ sort: 'newest', limit: 4 }));
  const deals = useFetch(() => productApi.list({ sort: 'price-low', limit: 4 }));
  const categories = useFetch(() => categoryApi.list());

  return (
    <div>
      <Hero />
      <CategoryStrip data={categories.data} loading={categories.loading} />

      <section className="max-w-7xl mx-auto px-4 py-14">
        <SectionHeader
          eyebrow="Handpicked"
          title="Featured Products"
          action={<ViewAllLink to="/shop" />}
        />
        {featured.loading ? <ProductGridSkeleton count={8} /> : <Grid products={featured.data?.products || []} />}
      </section>

      {/* Deals banner */}
      <section className="bg-gradient-to-r from-[#0a0a0a] via-[#111] to-[#0a0a0a] border-y border-ink-800">
        <div className="max-w-7xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-400 mb-3">Limited Time</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Deals of the Week.
              <br />
              <span className="text-gold-400">Up to 25% Off.</span>
            </h2>
            <p className="mt-4 text-ink-500 max-w-md">
              Premium gear at sharper prices. New markdowns land every Monday — when they're gone, they're gone.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-gold-500 text-black px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-gold-400 transition-colors"
              >
                Shop Deals <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <DealsPreview data={deals.data} loading={deals.loading} />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14">
        <SectionHeader eyebrow="Customer Favorites" title="Best Sellers" action={<ViewAllLink to="/shop?sort=popular" />} />
        {bestsellers.loading ? <ProductGridSkeleton count={4} /> : <Grid products={bestsellers.data?.products || []} />}
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-14">
        <SectionHeader eyebrow="Just Landed" title="Latest Products" action={<ViewAllLink to="/shop?sort=newest" />} />
        {latest.loading ? <ProductGridSkeleton count={4} /> : <Grid products={latest.data?.products || []} />}
      </section>

      <NewsletterCta />
    </div>
  );
}

function Grid({ products }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1800&q=70',
    tag: 'New Season · New Tech',
    title: 'Technology That\nMoves You.',
    sub: 'Discover the latest electronics, smart devices and accessories — engineered for performance, designed for life.',
  },
  {
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1800&q=70',
    tag: 'Premium Laptops',
    title: 'Power Meets\nPrecision.',
    sub: 'Ultra-thin notebooks and powerhouse workstations for creators, gamers, and professionals.',
  },
  {
    image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?auto=format&fit=crop&w=1800&q=70',
    tag: 'Smart Devices',
    title: 'Stay Connected.\nStay Ahead.',
    sub: 'Smartwatches, earbuds, and wearables that keep you in sync with what matters most.',
  },
];

function Hero() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const goTo = useCallback((idx) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
    }, 400);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current, goTo]);

  const slide = HERO_SLIDES[current];

  return (
    <section className="relative bg-[#0a0a0a] text-white overflow-hidden h-[600px] sm:h-[650px] lg:h-[700px]">
      {/* Background images */}
      {HERO_SLIDES.map((s, i) => (
        <img
          key={i}
          src={s.image}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out ${
            i === current ? 'opacity-30' : 'opacity-0'
          }`}
        />
      ))}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/40" />

      {/* Gold accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

      {/* Text content */}
      <div className={`relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-center transition-all duration-500 ${fading ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.3em] text-gold-400 mb-5">
          {slide.tag}
        </p>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.02] max-w-3xl whitespace-pre-line">
          {slide.title}
        </h1>
        <p className="mt-5 text-base sm:text-lg text-ink-500 max-w-xl leading-relaxed">
          {slide.sub}
        </p>
        <div className="mt-9 flex flex-wrap gap-3.5">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-gold-500 text-black px-8 py-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-gold-400 transition-all active:scale-95 shadow-[0_0_30px_rgba(212,175,55,0.2)]"
          >
            Shop Now <ArrowRight size={17} />
          </Link>
          <Link
            to="/shop?discounted=true"
            className="inline-flex items-center gap-2 border border-gold-500/40 text-gold-400 px-8 py-4 rounded-xl font-semibold text-sm sm:text-base hover:border-gold-400 hover:bg-gold-500/10 transition-all active:scale-95"
          >
            View Deals
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-3 max-w-lg divide-x divide-ink-200">
          {[
            ['500+', 'Products'],
            ['50+', 'Top Brands'],
            ['24/7', 'Support'],
          ].map(([num, label]) => (
            <div key={label} className="px-5 first:pl-0">
              <p className="text-2xl font-extrabold text-gold-400">{num}</p>
              <p className="text-xs text-ink-500 uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`transition-all duration-300 rounded-full ${
              i === current
                ? 'w-8 h-2 bg-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                : 'w-2 h-2 bg-ink-500 hover:bg-ink-400'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryStrip({ data, loading }) {
  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[4/5] rounded-xl" />
        ))}
      </div>
    );

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <SectionHeader eyebrow="Browse" title="Shop by Category" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {(data || []).map((c) => (
          <Link
            key={c._id}
            to={`/shop?category=${c.slug}`}
            className="group card-img-zoom relative rounded-xl overflow-hidden border border-ink-800 aspect-[4/5] hover:border-gold-500 hover:shadow-lg hover:shadow-gold-500/5 transition-all duration-300"
          >
            <img src={c.image} alt={c.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">{c.name}</span>
              <span className="w-6 h-6 rounded-full bg-gold-500/20 backdrop-blur flex items-center justify-center group-hover:bg-gold-500 group-hover:text-black text-white transition-colors">
                <ChevronRight size={13} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DealsPreview({ data, loading }) {
  const deals = (data?.products || []).filter((p) => p.discountPrice);
  return (
    <div className="grid grid-cols-2 gap-4">
      {loading && Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton aspect-video rounded-xl opacity-40" />)}
      {!loading &&
        deals.slice(0, 2).map((p) => (
          <Link key={p._id} to={`/product/${p.slug}`} className="group relative rounded-xl overflow-hidden border border-ink-800 aspect-video card-img-zoom hover:border-gold-500/50 transition-colors">
            <img src={p.images?.[0]} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/85 to-transparent" />
            <div className="absolute bottom-0 p-4">
              <p className="text-xs text-gold-400 uppercase tracking-widest">Save {Math.round(((p.price - p.discountPrice) / p.price) * 100)}%</p>
              <p className="text-white font-bold text-sm mt-0.5 line-clamp-1">{p.name}</p>
            </div>
          </Link>
        ))}
    </div>
  );
}

function NewsletterCta() {
  return (
    <section className="border-y border-ink-800 bg-[#080808]">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-400 mb-3">Stay in the loop</p>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Never miss a drop.</h2>
        <p className="mt-3 text-ink-500 text-sm">
          Sign up for early access to launches, restocks and subscriber-only pricing.
        </p>
        <Link
          to="/#newsletter"
          onClick={(e) => {
            e.preventDefault();
            document.querySelector('footer input')?.focus();
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }}
          className="mt-7 inline-flex items-center gap-2 bg-gold-500 text-black px-8 py-4 rounded-xl font-semibold text-sm hover:bg-gold-400 transition-colors"
        >
          Subscribe to Newsletter <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
