const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'site' },

    // Branding
    brandName: { type: String, default: 'VOLTIQ' },
    logoUrl: { type: String, default: '' },
    tagline: { type: String, default: 'Technology that moves you' },

    // Announcement bar
    announcementText: { type: String, default: 'Free express shipping on orders over $500 · Use code WELCOME10 for 10% off' },
    announcementEnabled: { type: Boolean, default: true },

    // Contact
    contactEmail: { type: String, default: 'support@voltiq.store' },
    contactPhone: { type: String, default: '+1 (555) 010-2020' },
    address: { type: String, default: '100 Circuit Avenue, San Francisco, CA' },

    // About / Footer
    aboutText: { type: String, default: 'Premium electronics, smart devices and accessories — curated for people who expect more from their gear.' },
    footerCopyright: { type: String, default: 'VOLTIQ. All rights reserved.' },

    // Social links
    socialLinks: {
      facebook: { type: String, default: '#' },
      instagram: { type: String, default: '#' },
      x: { type: String, default: '#' },
      youtube: { type: String, default: '#' },
    },

    // SEO
    metaTitle: { type: String, default: 'VOLTIQ — Premium Electronics Store' },
    metaDescription: { type: String, default: 'Shop the latest electronics, smartphones, laptops, and accessories at VOLTIQ.' },

    // Bank payment details
    bankName: { type: String, default: 'HBL' },
    bankAccountTitle: { type: String, default: 'MUHAMMAD ADA' },
    bankAccountNumber: { type: String, default: '09917902364499' },
    bankDiscountPercent: { type: Number, default: 20 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
