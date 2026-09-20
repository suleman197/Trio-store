const nodemailer = require('nodemailer');

const getTransporter = () => {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || 'triostoreinfo@gmail.com';
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || 'bnaphlzxmdwcykuf';

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const formatPrice = (val) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(val || 0));

/**
 * Sends a high-inbox-rate order confirmation email using a lightweight,
 * clean format (identical structure to the Password Reset email which Google places in Primary Inbox).
 */
const sendOrderConfirmationEmail = async (order) => {
  if (!order || !order.customerInfo || !order.customerInfo.email) {
    console.warn('[email] Cannot send confirmation: Customer email missing');
    return;
  }

  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || 'triostoreinfo@gmail.com';
  const clientUrl = (process.env.CLIENT_URL || 'https://triostore.vercel.app').split(',')[0].trim();
  const orderUrl = `${clientUrl}/orders/${order._id}`;
  const firstName = (order.customerInfo.firstName || 'Customer').trim();

  // Plain-text alternative
  const plainItems = (order.items || [])
    .map((item) => `- ${item.name} x ${item.quantity} (${formatPrice(item.price * item.quantity)})`)
    .join('\n');

  const text = `
Hello ${firstName},

Thank you for your order at Trio Store! Your order has been placed successfully.

Order Number: ${order.orderNumber}
Estimated Delivery: 2 to 4 Business Days

Items:
${plainItems}

Subtotal: ${formatPrice(order.subtotal)}
${order.discount > 0 ? `Discount: -${formatPrice(order.discount)}\n` : ''}${order.bankDiscount > 0 ? `Bank Discount: -${formatPrice(order.bankDiscount)}\n` : ''}Shipping: FREE
Sales Tax (2%): ${formatPrice(order.tax)}
Total: ${formatPrice(order.total)}

Shipping Address:
${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}
Phone: ${order.customerInfo.phone || 'N/A'}

View your order status:
${orderUrl}

Need assistance? Reply directly to this email or call 03440867308.

Trio Store Team
  `.trim();

  const itemsRows = (order.items || [])
    .map((item) => `
      <div style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; font-size: 13px;">
        <span><strong>${item.name}</strong> × ${item.quantity}</span>
        <span style="font-weight: 600;">${formatPrice(item.price * item.quantity)}</span>
      </div>
    `)
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; color: #111; max-width: 500px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #000; margin: 0 0 6px 0;">Trio Store</h2>
      <p style="font-size: 14px; color: #555; margin: 0 0 16px 0;">Order Confirmation</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #444; margin: 0 0 12px 0;">Hello ${firstName},</p>
      <p style="font-size: 14px; line-height: 1.6; color: #444; margin: 0 0 16px 0;">
        Thank you for your order! We have received your order <strong>#${order.orderNumber}</strong> and it is being prepared for shipment.
      </p>

      <div style="background: #f9f9f9; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; line-height: 1.6;">
        <p style="margin: 0 0 4px 0;"><strong>Order ID:</strong> #${order.orderNumber}</p>
        <p style="margin: 0 0 4px 0;"><strong>Estimated Delivery:</strong> 2 to 4 Business Days</p>
        <p style="margin: 0;"><strong>Payment Method:</strong> ${order.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash on Delivery (COD)'}</p>
      </div>

      <p style="font-size: 13px; font-weight: bold; margin: 0 0 8px 0; color: #333;">Order Items:</p>
      <div style="margin-bottom: 16px;">
        ${itemsRows}
      </div>

      <div style="font-size: 13px; line-height: 1.8; margin-bottom: 18px; border-top: 1px solid #eee; padding-top: 10px;">
        <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span> <span>${formatPrice(order.subtotal)}</span></div>
        ${order.discount > 0 ? `<div style="display: flex; justify-content: space-between; color: #16a34a;"><span>Discount:</span> <span>-${formatPrice(order.discount)}</span></div>` : ''}
        ${order.bankDiscount > 0 ? `<div style="display: flex; justify-content: space-between; color: #16a34a;"><span>Bank Discount:</span> <span>-${formatPrice(order.bankDiscount)}</span></div>` : ''}
        <div style="display: flex; justify-content: space-between;"><span>Shipping:</span> <span style="color: #16a34a; font-weight: bold;">FREE</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Sales Tax (2%):</span> <span>${formatPrice(order.tax)}</span></div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 8px 0;" />
        <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: bold;">
          <span>Total Payable:</span> <span style="color: #000;">${formatPrice(order.total)}</span>
        </div>
      </div>

      <div style="background: #f9f9f9; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #444; line-height: 1.5;">
        <strong>Delivery Address:</strong><br />
        ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}<br />
        Contact: ${order.customerInfo.phone || 'N/A'}
      </div>

      <div style="margin: 24px 0; text-align: center;">
        <a href="${orderUrl}" style="background-color: #d4af37; color: #000000; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 14px;">View Order Status</a>
      </div>

      <p style="font-size: 12px; color: #777; margin: 0 0 4px 0;">Or copy and paste this URL into your browser:</p>
      <p style="font-size: 12px; color: #0066cc; word-break: break-all; margin: 0 0 16px 0;">${orderUrl}</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 11px; color: #888; text-align: center; margin: 0;">
        Need assistance with your order? Reply directly to this email or call 03440867308.<br />
        © ${new Date().getFullYear()} Trio Store
      </p>
    </div>
  `.trim();

  const transporter = getTransporter();
  const mailOptions = {
    from: `"Trio Store" <${smtpUser}>`,
    to: order.customerInfo.email,
    subject: 'Order Confirmation - Trio Store',
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[email] Order confirmation email sent to ${order.customerInfo.email}. MessageId: ${info.messageId}`);
  return info;
};

module.exports = {
  sendOrderConfirmationEmail,
};
