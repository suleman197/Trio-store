const nodemailer = require('nodemailer');

const getTransporter = () => {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || 'sulemanmunir6752@gmail.com';
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || 'sdybgakytxrobkdi';

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
 * Sends a rich order confirmation email to customer after successful order placement.
 */
const sendOrderConfirmationEmail = async (order) => {
  if (!order || !order.customerInfo || !order.customerInfo.email) {
    console.warn('[email] Cannot send confirmation: Customer email missing');
    return;
  }

  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || 'sulemanmunir6752@gmail.com';
  const clientUrl = (process.env.CLIENT_URL || 'https://triostore.vercel.app').split(',')[0].trim();
  const orderUrl = `${clientUrl}/orders/${order._id}`;
  const customerName = `${order.customerInfo.firstName || 'Valued'} ${order.customerInfo.lastName || 'Customer'}`.trim();

  const itemsHtml = (order.items || [])
    .map((item) => {
      const variantEntries = item.variant
        ? Object.entries(item.variant instanceof Map ? Object.fromEntries(item.variant) : item.variant)
        : [];
      const variantText = variantEntries.length > 0 ? variantEntries.map(([k, v]) => `${k}: ${v}`).join(' · ') : '';

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #222; vertical-align: middle;">
            <div style="display: flex; align-items: center; gap: 14px;">
              ${
                item.image
                  ? `<img src="${item.image}" alt="${item.name}" width="54" height="54" style="border-radius: 8px; object-fit: cover; background: #1a1a1a; display: block;" />`
                  : ''
              }
              <div>
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #ffffff;">${item.name}</p>
                ${variantText ? `<p style="margin: 3px 0 0; font-size: 11px; color: #999;">${variantText}</p>` : ''}
                <p style="margin: 4px 0 0; font-size: 12px; color: #888;">Qty: <strong style="color: #ddd;">${item.quantity}</strong> × ${formatPrice(item.price)}</p>
              </div>
            </div>
          </td>
          <td style="padding: 14px 0; border-bottom: 1px solid #222; text-align: right; vertical-align: middle;">
            <span style="font-size: 14px; font-weight: 700; color: #e5c07b;">${formatPrice(item.price * item.quantity)}</span>
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
        
        <!-- Header / Brand -->
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #e5c07b; text-transform: uppercase;">TRIO STORE</h1>
          <p style="margin: 6px 0 0; font-size: 12px; color: #777; letter-spacing: 1px;">YOUR TRUST IS OUR FIRST PRIORITY</p>
        </div>

        <!-- Main Card -->
        <div style="background: #111111; border: 1px solid #222222; border-radius: 18px; padding: 32px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Badge & Headline -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background: rgba(229, 192, 123, 0.15); color: #e5c07b; border: 1px solid rgba(229, 192, 123, 0.3); padding: 5px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
              ✓ Order Confirmed
            </span>
            <h2 style="margin: 16px 0 8px; font-size: 22px; font-weight: 800; color: #ffffff;">Thank you, ${order.customerInfo.firstName || 'Customer'}!</h2>
            <p style="margin: 0; font-size: 14px; color: #aaaaaa; line-height: 1.5;">
              Your order <strong style="color: #ffffff; font-family: monospace;">#${order.orderNumber}</strong> has been placed and is being prepared with care.
            </p>
          </div>

          <!-- Estimated Delivery Notice -->
          <div style="background: rgba(229, 192, 123, 0.08); border-left: 4px solid #e5c07b; border-radius: 8px; padding: 14px 16px; margin-bottom: 26px;">
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #e5c07b;">
              🚚 Estimated Delivery Timeline:
            </p>
            <p style="margin: 4px 0 0; font-size: 14px; font-weight: 700; color: #ffffff;">
              2 to 4 Business Days to your doorstep
            </p>
          </div>

          <!-- Items Ordered Table -->
          <div style="margin-bottom: 26px;">
            <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 1px solid #222; padding-bottom: 8px;">
              Items in Your Order
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              ${itemsHtml}
            </table>
          </div>

          <!-- Price Breakdown -->
          <div style="background: #171717; border-radius: 12px; padding: 18px 20px; margin-bottom: 26px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
              <tr>
                <td style="padding: 5px 0; color: #888;">Items Subtotal</td>
                <td style="padding: 5px 0; text-align: right; color: #ffffff; font-weight: 600;">${formatPrice(order.subtotal)}</td>
              </tr>
              ${
                order.discount > 0
                  ? `<tr>
                      <td style="padding: 5px 0; color: #10b981;">Coupon Discount</td>
                      <td style="padding: 5px 0; text-align: right; color: #10b981; font-weight: 600;">-${formatPrice(order.discount)}</td>
                    </tr>`
                  : ''
              }
              ${
                order.bankDiscount > 0
                  ? `<tr>
                      <td style="padding: 5px 0; color: #10b981;">Bank Advance Discount</td>
                      <td style="padding: 5px 0; text-align: right; color: #10b981; font-weight: 600;">-${formatPrice(order.bankDiscount)}</td>
                    </tr>`
                  : ''
              }
              <tr>
                <td style="padding: 5px 0; color: #888;">Delivery / Shipping</td>
                <td style="padding: 5px 0; text-align: right; color: #10b981; font-weight: 700;">FREE</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #888;">Sales Tax (5%)</td>
                <td style="padding: 5px 0; text-align: right; color: #ffffff; font-weight: 600;">${formatPrice(order.tax)}</td>
              </tr>
              <tr style="border-top: 1px solid #333;">
                <td style="padding: 12px 0 0; font-size: 16px; font-weight: 800; color: #ffffff;">Total Payable</td>
                <td style="padding: 12px 0 0; text-align: right; font-size: 18px; font-weight: 900; color: #e5c07b;">${formatPrice(order.total)}</td>
              </tr>
            </table>
          </div>

          <!-- Shipping & Payment Details -->
          <div style="display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 28px;">
            <div style="background: #171717; border-radius: 10px; padding: 14px 16px;">
              <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Payment Method</p>
              <p style="margin: 0; font-size: 13px; font-weight: 700; color: #ffffff;">
                ${order.paymentMethod === 'bank' ? '🏦 Bank Transfer / Advance' : '💵 Cash on Delivery (COD)'}
              </p>
            </div>
            <div style="background: #171717; border-radius: 10px; padding: 14px 16px;">
              <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Shipping Address</p>
              <p style="margin: 0; font-size: 13px; color: #dddddd; line-height: 1.5;">
                ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.country || ''}
              </p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #888;">Contact: ${order.customerInfo.phone || 'N/A'}</p>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center;">
            <a href="${orderUrl}" style="display: inline-block; background: #e5c07b; color: #000000; font-size: 14px; font-weight: 800; padding: 14px 36px; text-decoration: none; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 14px rgba(229, 192, 123, 0.4);">
              View Order Details
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; color: #666; font-size: 12px; line-height: 1.6;">
          <p style="margin: 0;">Need assistance with your order? Reply directly to this email or contact us:</p>
          <p style="margin: 4px 0 0;">
            <strong style="color: #999;">Email:</strong> triostoreinfo@gmail.com · <strong style="color: #999;">Phone:</strong> 03440867308
          </p>
          <p style="margin: 14px 0 0; font-size: 11px; color: #444;">
            © ${new Date().getFullYear()} Trio Store. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();
  const mailOptions = {
    from: `"Trio Store" <${smtpUser}>`,
    to: order.customerInfo.email,
    subject: `Order Confirmed: ${order.orderNumber} - Trio Store`,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[email] Order confirmation email sent to ${order.customerInfo.email}. MessageId: ${info.messageId}`);
  return info;
};

module.exports = {
  sendOrderConfirmationEmail,
};
