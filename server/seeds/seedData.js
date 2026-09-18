/**
 * Seed data — admin account, 6 categories, 18 electronic products,
 * 2 sample coupons. Used by both the CLI seeder (seeds/seed.js) and
 * the automated smoke test (tests/smoke.js).
 */
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Coupon = require('../models/Coupon');
const InventoryLog = require('../models/InventoryLog');
const Subscriber = require('../models/Subscriber');

const img = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const categoriesData = [
  {
    name: 'Smartphones',
    slug: 'smartphones',
    description: 'Flagship and mid-range smartphones from the biggest brands.',
    image: img('photo-1511707171634-5f897ff02aa9'),
  },
  {
    name: 'Laptops',
    slug: 'laptops',
    description: 'Ultrabooks, gaming rigs and creator machines.',
    image: img('photo-1517336714731-489689fd1ca8'),
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Consoles, controllers and everything gaming.',
    image: img('photo-1606144042614-b2417e99c4e3'),
  },
  {
    name: 'Headphones',
    slug: 'headphones',
    description: 'Wireless earbuds, over-ear cans and studio monitors.',
    image: img('photo-1505740420928-5e560c06d30e'),
  },
  {
    name: 'Smart Watches',
    slug: 'smart-watches',
    description: 'Fitness trackers and premium smartwatches.',
    image: img('photo-1523275335684-37898b6baf30'),
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Keyboards, mice, chargers and everyday carry.',
    image: img('photo-1587829741301-dc798b83add3'),
  },
];

const p = (
  name,
  sku,
  brand,
  catSlug,
  price,
  discountPrice,
  stock,
  shortDescription,
  description,
  specs,
  features,
  images,
  opts = {}
) => ({
  name,
  sku,
  brand,
  categoryRef: catSlug,
  price,
  discountPrice,
  stock,
  lowStockThreshold: opts.lowStockThreshold ?? 5,
  shortDescription,
  description,
  specifications: Object.entries(specs).map(([key, value]) => ({ key, value })),
  features,
  images,
  variations: opts.variations || [],
  warranty: opts.warranty || '1 year manufacturer warranty',
  shippingInfo: 'Free express shipping on orders over $500. Standard delivery 2â€“5 business days.',
  rating: opts.rating || 0,
  reviewCount: opts.reviewCount || 0,
  featured: !!opts.featured,
  bestseller: !!opts.bestseller,
  status: 'active',
});

const productsData = [
  // ---------- Smartphones ----------
  p(
    'Nova X Pro 5G', 'SP-NVX-001', 'Nexon', 'smartphones', 999, 899, 42,
    'Flagship 5G smartphone with a 120Hz AMOLED display and pro-grade camera system.',
    'The Nova X Pro 5G redefines what a flagship can be. Its 6.7-inch LTPO AMOLED display adapts from 1Hz to 120Hz for buttery smooth scrolling and all-day efficiency. The triple camera array â€” 50MP main with sensor-shift stabilization, 12MP ultra-wide and 5x periscope tele â€” captures studio-quality shots in any light. Powered by the A19 Fusion chip with a dedicated neural engine, it handles AAA gaming and 8K editing alike. All wrapped in aerospace aluminum with Ceramic Shield glass and IP68 water resistance.',
    { Display: '6.7" LTPO AMOLED 120Hz', Processor: 'A19 Fusion octa-core', RAM: '12GB', Storage: '256GB', Camera: '50MP + 12MP + 12MP tele 5x', Battery: '5000mAh, 65W fast charge', OS: 'Android 15' },
    ['Adaptive 120Hz LTPO display', 'Pro triple camera with 5x optical zoom', '65W wired + 25W wireless charging', 'IP68 water & dust resistance'],
    [img('photo-1511707171634-5f897ff02aa9'), img('photo-1592899677977-9c10ca588bbd'), img('photo-1585060544812-6b45742d762f')],
    { variations: [{ name: 'Color', options: ['Midnight Black', 'Titanium Silver'] }, { name: 'Storage', options: ['256GB', '512GB'] }], rating: 4.8, reviewCount: 214, featured: true, bestseller: true }
  ),
  p(
    'Pulse S24 Ultra', 'SP-PLS-002', 'Orion', 'smartphones', 1199, null, 18,
    'S Pen productivity powerhouse with a 200MP camera and QHD+ display.',
    'Meet the Pulse S24 Ultra â€” a productivity beast with an integrated S Pen, massive 6.8-inch QHD+ Dynamic display and a groundbreaking 200MP main sensor that crops like a telephoto. The titanium frame houses a 5000mAh battery with 45W charging and the Snapdragon-class Orion X1 chipset for desktop-class performance.',
    { Display: '6.8" QHD+ 120Hz', Processor: 'Orion X1', RAM: '16GB', Storage: '512GB', Camera: '200MP + 12MP + 10MP x3 + 10MP x10', Battery: '5000mAh, 45W', OS: 'Android 15' },
    ['Built-in S Pen', '200MP main camera with AI processing', 'Titanium frame', '7 years of OS updates'],
    [img('photo-1580910051074-3eb694886505'), img('photo-1616348436168-de43ad0db179')],
    { variations: [{ name: 'Color', options: ['Phantom Black', 'Cream'] }, { name: 'Storage', options: ['512GB', '1TB'] }], rating: 4.7, reviewCount: 189, featured: true }
  ),
  p(
    'Zephyr Lite 5G', 'SP-ZEP-003', 'Nexon', 'smartphones', 449, 379, 0,
    'Mid-range champion with flagship DNA â€” 90Hz OLED and clean software.',
    'The Zephyr Lite brings flagship features to an accessible price: a crisp 6.4" 90Hz OLED panel, clean bloat-free Android, 64MP OIS camera and two-day battery life. Perfect as a first 5G phone or reliable daily driver.',
    { Display: '6.4" OLED 90Hz', Processor: 'Snap-class 6 Gen 2', RAM: '8GB', Storage: '128GB', Camera: '64MP OIS + 8MP UW', Battery: '4800mAh', OS: 'Android 15' },
    ['Two-day battery life', 'Clean Android, zero bloatware', '3.5mm headphone jack'],
    [img('photo-1533228100845-08145b01de14')],
    { variations: [{ name: 'Color', options: ['Graphite', 'Mint'] }], rating: 4.4, reviewCount: 96, bestseller: true }
  ),

  // ---------- Laptops ----------
  p(
    'AirBook M3 13"', 'LT-AIR-101', 'Fruitline', 'laptops', 1299, null, 25,
    'Feather-light ultrabook with silent fanless design and 18-hour battery.',
    'The AirBook M3 pairs a stunning Liquid Retina display with the whisper-quiet, fanless M3 chip. At just 1.24kg it goes everywhere; at 18 hours of battery it never asks to be charged twice in a day. The Magic Keyboard, Force Touch trackpad and studio-grade mics make it the ultimate everyday laptop.',
    { Display: '13.6" Liquid Retina 2560x1664', Processor: 'Apple M3 8-core', RAM: '16GB unified', Storage: '512GB SSD', Battery: 'Up to 18 hours', Weight: '1.24 kg', Ports: '2x Thunderbolt, MagSafe 3, jack' },
    ['Fanless silent design', '18-hour battery life', '1080p webcam with 3-mic array'],
    [img('photo-1517336714731-489689fd1ca8'), img('photo-1611186871348-b1ce696e52c9')],
    { variations: [{ name: 'Color', options: ['Space Gray', 'Silver'] }, { name: 'RAM', options: ['16GB', '24GB'] }], rating: 4.9, reviewCount: 342, featured: true, bestseller: true }
  ),
  p(
    'Vertex Creator 15', 'LT-VTX-102', 'Deltatech', 'laptops', 1899, 1699, 11,
    'Creator workstation with RTX graphics and a factory-calibrated 4K OLED screen.',
    'For editors, designers and engineers: the Vertex Creator 15 packs an 8-core HX processor, RTX 4070 graphics and a Pantone-validated 4K OLED touch display covering 100% DCI-P3. Thunderbolt 4, SD Express and vapor-chamber cooling keep heavy timelines moving.',
    { Display: '15.6" 4K OLED touch 100% DCI-P3', Processor: 'HX 8-core 2.4GHz', Graphics: 'RTX 4070 8GB', RAM: '32GB DDR5', Storage: '1TB NVMe Gen4', Weight: '1.95 kg' },
    ['Factory-calibrated 4K OLED', 'Vapor chamber cooling', 'Thunderbolt 4 + full-size SD'],
    [img('photo-1593642632823-8f785ba67e45'), img('photo-1618424181497-157f25b6ddd5')],
    { variations: [{ name: 'RAM', options: ['32GB', '64GB'] }, { name: 'Storage', options: ['1TB', '2TB'] }], rating: 4.6, reviewCount: 87, featured: true }
  ),
  p(
    'Striker Gaming 16', 'LT-STK-103', 'Deltatech', 'laptops', 2199, null, 7,
    '240Hz esports laptop with liquid metal cooling and per-key RGB.',
    'Dominate the lobby with the Striker Gaming 16: a 240Hz WQHD panel, top-tier GPU, liquid metal thermal compound and a per-key RGB keyboard tuned for anti-ghosting. MUX switch sends frames straight to the display for minimum latency.',
    { Display: '16" WQHD 240Hz', Processor: 'HX 24-core', Graphics: 'RTX 4080 12GB', RAM: '32GB DDR5', Storage: '2TB NVMe RAID', Cooling: 'Liquid metal + quad fans' },
    ['240Hz esports display', 'MUX switch for lowest latency', 'Per-key RGB lighting'],
    [img('photo-1541447271487-09612b3f49f7')],
    { rating: 4.5, reviewCount: 54, bestseller: true, lowStockThreshold: 8 }
  ),
  p(
    'CloudBook 14 Chrome', 'LT-CLB-104', 'Orion', 'laptops', 329, 279, 31,
    'Everyday cloud laptop â€” instant boot, all-day battery, zero maintenance.',
    'The CloudBook 14 boots in seconds, updates itself silently and sips power for up to 15 hours. A great pick for students and casual browsing with a full-size keyboard and 1080p webcam.',
    { Display: '14" FHD IPS', Processor: 'Quad-core ARM', RAM: '8GB', Storage: '128GB eMMC', Battery: '15 hours', Weight: '1.3 kg' },
    ['Boots in seconds', 'Automatic background updates', '15-hour battery'],
    [img('photo-1588872657578-7efd1f1555ed')],
    { rating: 4.2, reviewCount: 143 }
  ),

  // ---------- Gaming ----------
  p(
    'PlayCube 5 Digital', 'GM-PC5-201', 'Sonyx', 'gaming', 499, null, 14,
    'Next-gen console with ray tracing, 4K/120 output and ultra-fast SSD.',
    'The PlayCube 5 Digital delivers generational leaps: ray-traced worlds, near-instant load times from the custom SSD, and haptic-feedback controller that lets you feel every texture. Includes Horizon-exclusives library access for 3 months.',
    { CPU: '8-core Zen 4 3.8GHz', GPU: 'RDNA4 12TFLOPS', Memory: '1TB SSD', Output: '4K 120Hz, 8K ready', Controller: 'Haptic + adaptive triggers' },
    ['Ray tracing support', 'Ultra-fast custom SSD', 'Haptic adaptive-trigger controller'],
    [img('photo-1606144042614-b2417e99c4e3'), img('photo-1622297845775-5ff3fef71d13')],
    { rating: 4.9, reviewCount: 421, featured: true, bestseller: true }
  ),
  p(
    'Arcade Pad Elite Wireless', 'GM-PAD-202', 'Sonyx', 'gaming', 74, 59, 58,
    'Tournament-grade wireless controller with hall-effect sticks and back paddles.',
    'Drift-proof hall-effect thumbsticks, micro-switch face buttons, four remappable back paddles and 40-hour battery. Low-latency 2.4GHz wireless plus Bluetooth and USB-C modes.',
    { Sticks: 'Hall-effect anti-drift', Battery: '40 hours', Connectivity: '2.4GHz / BT / USB-C', Extra: '4 back paddles, trigger stops' },
    ['Anti-drift hall-effect sticks', 'Remappable back paddles', 'On-board profiles'],
    [img('photo-1592840496694-26d035b52b48')],
    { rating: 4.6, reviewCount: 167, bestseller: true }
  ),
  p(
    'HyperDeck Portable SSD 1TB', 'GM-HDS-203', 'Kinetix', 'gaming', 129, 99, 44,
    'Console-approved expansion SSD â€” plug into your PlayCube 5 and go.',
    'Purpose-built for next-gen consoles: USB 3.2 Gen2 speeds up to 1050MB/s in a shock-resistant shell smaller than a deck of cards. Also perfect for PC game libraries.',
    { Capacity: '1TB', Interface: 'USB 3.2 Gen2 Type-C', Speed: 'Up to 1050 MB/s read', Durability: 'IP55 rated shell' },
    ['Console-ready out of the box', '1050MB/s transfer speeds', 'Shock-resistant IP55 body'],
    [img('photo-1621768216002-5ac171876625')],
    { rating: 4.7, reviewCount: 89 }
  ),

  // ---------- Headphones ----------
  p(
    'EchoPods Pro ANC', 'HD-ECH-301', 'Sonique', 'headphones', 249, 199, 63,
    'True-wireless earbuds with adaptive noise cancellation and spatial audio.',
    'EchoPods Pro silences the world with adaptive hybrid ANC, then drops you back in with transparency mode. Custom dual drivers deliver deep bass and airy highs while six mics keep calls crystal clear. Up to 30 hours total with the wireless charging case.',
    { Drivers: 'Custom dual-driver 11mm', ANC: 'Adaptive hybrid, 6 mics', Battery: '8h buds / 30h case', Charging: 'USB-C + Qi wireless', Rating: 'IPX4 sweat resistant' },
    ['Adaptive noise cancellation', 'Spatial audio with head tracking', 'Wireless charging case'],
    [img('photo-1590658268037-6bf12165a8df'), img('photo-1572569511254-d8f925fe2cbb')],
    { variations: [{ name: 'Color', options: ['White', 'Black'] }], rating: 4.7, reviewCount: 512, featured: true, bestseller: true }
  ),
  p(
    'StudioOne Over-Ear', 'HD-STO-302', 'Sonique', 'headphones', 399, null, 21,
    'Reference-grade over-ear headphones tuned for mixing and mastering.',
    'Flat response, 40mm beryllium-coated drivers and memory-foam lambskin pads â€” the StudioOne is engineered for long sessions and honest sound. Balanced 4.4mm input plus lossless USB-C audio mode.',
    { Drivers: '40mm beryllium-coated', Response: '5Hzâ€“40kHz', Impedance: '38 ohm', Pads: 'Memory foam lambskin', Inputs: '3.5mm, balanced 4.4mm, USB-C' },
    ['Flat reference tuning', 'Lossless USB-C DAC mode', 'Replaceable pads and cable'],
    [img('photo-1505740420928-5e560c06d30e'), img('photo-1583394838336-acd977736f90')],
    { rating: 4.8, reviewCount: 233, featured: true }
  ),
  p(
    'RunBeat Sport Buds', 'HD-RNB-303', 'Kinetix', 'headphones', 99, 79, 47,
    'Secure-fit workout earbuds with IPX7 waterproofing and bass boost.',
    'Ear-hook design stays locked through any workout. IPX7 survives sweat and rain, physical buttons work with gloves, and Bass Boost mode powers you through the last set.',
    { Fit: 'Over-ear hooks', Waterproof: 'IPX7', Battery: '9h buds / 36h case', Extras: 'Physical controls, fast pair' },
    ['IPX7 fully waterproof', 'Glove-friendly physical buttons', 'Fast pairing'],
    [img('photo-1608156639585-b3a032ef9689')],
    { rating: 4.3, reviewCount: 178 }
  ),

  // ---------- Smart Watches ----------
  p(
    'Chronos Watch Series 8', 'SW-CHR-401', 'Fruitline', 'smart-watches', 429, 379, 29,
    'Health hub on your wrist â€” ECG, SpO2, sleep stages and crash detection.',
    'Chronos Watch Series 8 tracks heart rhythm, blood oxygen and sleep architecture around the clock. The always-on Retina display is crack resistant, and safety features like crash detection and emergency SOS bring peace of mind. Water resistant to 50m.',
    { Display: '1.9" Always-on Retina', Sensors: 'ECG, SpO2, temperature', Battery: '36 hours / 72 in low power', Water: 'WR50 + swimproof', Bands: 'Quick-release ecosystem' },
    ['ECG and blood-oxygen app', 'Crash detection', 'Sleep stage tracking'],
    [img('photo-1523275335684-37898b6baf30'), img('photo-1579586337278-3befd40fd17a')],
    { variations: [{ name: 'Size', options: ['41mm', '45mm'] }, { name: 'Band', options: ['Sport Band', 'Milanese Loop'] }], rating: 4.8, reviewCount: 388, featured: true, bestseller: true }
  ),
  p(
    'TrailFit GPS Band', 'SW-TRF-402', 'Kinetix', 'smart-watches', 149, null, 52,
    'Lightweight multisport band with dual-band GPS and 14-day battery.',
    'From trail runs to triathlons, TrailFit nails pace and route with dual-band GPS. The transflective MIP display is readable in direct sun and the battery lasts two weeks of training.',
    { Display: '1.3" transflective MIP', GPS: 'Dual-band multi-GNSS', Battery: '14 days smart mode', Water: '5ATM swimproof', Sports: '120+ activity profiles' },
    ['Dual-band precise GPS', '14-day battery life', 'Sunlight-readable display'],
    [img('photo-1508685096489-7aacd43bd3b1')],
    { rating: 4.5, reviewCount: 156 }
  ),

  // ---------- Accessories ----------
  p(
    'MechBoard 75 Wireless', 'AC-MKB-501', 'Kinetix', 'accessories', 159, 139, 36,
    'Hot-swappable 75% mechanical keyboard with gasket mount and tri-mode wireless.',
    'A enthusiast-grade 75% board: gasket-mounted plate for a soft bounce, hot-swap sockets, south-facing RGB and tri-mode connectivity (2.4GHz/BT5.1/USB-C). Pre-lubed linear switches sound deep right out of the box.',
    { Layout: '75% 82-key', Mount: 'Gasket', Switches: 'Pre-lubed linear, hot-swap', Battery: '4000mAh', Connection: '2.4GHz / BT 5.1 / USB-C' },
    ['Hot-swappable switches', 'Gasket-mount typing feel', 'Tri-mode wireless'],
    [img('photo-1587829741301-dc798b83add3'), img('photo-1618384887929-16ec33fab9ef')],
    { variations: [{ name: 'Switches', options: ['Linear Red', 'Tactile Brown'] }, { name: 'Color', options: ['Black', 'White'] }], rating: 4.8, reviewCount: 264, featured: true }
  ),
  p(
    'GlideMouse Pro Ergo', 'AC-GLM-502', 'Deltatech', 'accessories', 89, null, 61,
    'Vertical ergonomic mouse with adjustable pivot and silent clicks.',
    'The GlideMouse Pro keeps your wrist in a natural handshake position to cut strain during long days. Adjustable 20Â° pivot, magnetic thumb rest, 8000 DPI sensor and near-silent switches.',
    { Sensor: '8000 DPI optical', Grip: 'Vertical with 20Â° pivot', Clicks: 'Silent switches', Battery: '90 days', Connection: 'BT + 2.4GHz dongle' },
    ['Reduces wrist strain', 'Adjustable pivot angle', 'Whisper-quiet clicks'],
    [img('photo-1527864550417-7fd91fc51a46')],
    { rating: 4.4, reviewCount: 121 }
  ),
  p(
    'PowerHub 100W GaN Charger', 'AC-PHW-503', 'Orion', 'accessories', 69, 55, 0,
    'Four-port GaN charger that powers a laptop, phone, tablet and watch together.',
    'GaN III internals shrink a 100W desktop charger to palm size. Two USB-C PD ports negotiate independently, so your laptop charges at full speed while phones top up alongside.',
    { Output: '100W total', Ports: '2x USB-C PD, 2x USB-A', Tech: 'GaN III', Safety: 'Over-current/temp protection', Size: '62 x 62 x 32 mm' },
    ['Charges 4 devices at once', 'Full 100W to a single port', 'Travel-ready folding prongs'],
    [img('photo-1583863788434-e58a36330cf0')],
    { rating: 4.6, reviewCount: 97, lowStockThreshold: 10 }
  ),
];

const couponsData = [
  {
    code: 'WELCOME10',
    description: '10% off your first order',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 50,
    usageLimit: 500,
    isActive: true,
  },
  {
    code: 'SAVE50',
    description: '$50 off orders over $800',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 800,
    maxDiscountAmount: 50,
    usageLimit: 100,
    isActive: true,
  },
];


/**
 * Wipes collections and inserts seed data. Assumes an active Mongoose connection.
 */
const seedAll = async () => {
  console.log('[seed] Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    Coupon.deleteMany({}),
    InventoryLog.deleteMany({}),
    Subscriber.deleteMany({}),
  ]);

  console.log('[seed] Creating admin user...');
  await User.create({
    firstName: 'Store',
    lastName: 'Admin',
    email: 'admin@example.com',
    phone: '+15550001000',
    password: 'Admin@123',
    role: 'admin',
  });

  console.log('[seed] Creating categories...');
  const cats = await Category.insertMany(categoriesData);
  const catMap = new Map(cats.map((c) => [c.slug, c._id]));

  console.log('[seed] Creating products...');
  const slugify = (text) =>
    text
      .toString()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-');

  await Product.insertMany(
    productsData.map(({ categoryRef, ...rest }) => ({
      ...rest,
      slug: slugify(rest.name),
      category: catMap.get(categoryRef),
    }))
  );

  console.log('[seed] Creating coupons...');
  await Coupon.insertMany(couponsData);

  return { categories: cats.length, products: productsData.length, coupons: couponsData.length };
};

module.exports = { categoriesData, productsData, couponsData, seedAll };
