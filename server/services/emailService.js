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
 * Sends an inbox-optimized order confirmation email to customer after successful order placement.
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
  const customerName = `${firstName} ${(order.customerInfo.lastName || '')}`.trim();

  // Plain-text alternative for spam filters
  const plainTextItems = (order.items || [])
    .map((item) => `• ${item.name} x ${item.quantity} = ${formatPrice(item.price * item.quantity)}`)
    .join('\n');

  const text = `
Hello ${firstName},

Thank you for your order at Trio Store! We have received your order and are currently preparing it.

Order Number: #${order.orderNumber}
Estimated Delivery: 2 to 4 Business Days

Order Items:
${plainTextItems}

Subtotal: ${formatPrice(order.subtotal)}
${order.discount > 0 ? `Discount: -${formatPrice(order.discount)}\n` : ''}${order.bankDiscount > 0 ? `Bank Discount: -${formatPrice(order.bankDiscount)}\n` : ''}Shipping: Free Delivery
Sales Tax (2%): ${formatPrice(order.tax)}
Total Payable: ${formatPrice(order.total)}

Shipping Address:
${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}
Phone: ${order.customerInfo?.phone || 'N/A'}

View your order details anytime:
${orderUrl}

If you have questions, reply directly to this email or contact us:
Email: triostoreinfo@gmail.com
Phone: 03440867308

Warm regards,
Trio Store Team
https://triostore.vercel.app
`.trim();

  const itemsHtml = (order.items || [])
    .map((item) => {
      const variantEntries = item.variant
        ? Object.entries(item.variant instanceof Map ? Object.fromEntries(item.variant) : item.variant)
        : [];
      const variantText = variantEntries.length > 0 ? variantEntries.map(([k, v]) => `${k}: ${v}`).join(' · ') : '';

      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #edf2f7; vertical-align: top;">
            <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1a202c; line-height: 1.4;">${item.name}</p>
            ${variantText ? `<p style="margin: 3px 0 0; font-size: 12px; color: #718096;">${variantText}</p>` : ''}
            <p style="margin: 4px 0 0; font-size: 13px; color: #4a5568;">Qty: <strong>${item.quantity}</strong> × ${formatPrice(item.price)}</p>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #edf2f7; text-align: right; vertical-align: top; white-space: nowrap;">
            <span style="font-size: 15px; font-weight: 700; color: #1a202c;">${formatPrice(item.price * item.quantity)}</span>
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmation #${order.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748; line-height: 1.5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; margin-bottom: 20px;">
          <tr>
            <td align="center">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #1a202c; letter-spacing: 1px;">TRIO STORE</h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px;">Your Trust Is Our Priority</p>
            </td>
          </tr>
        </table>

        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Green Success Bar -->
          <tr>
            <td style="background-color: #10b981; height: 5px; line-height: 5px; font-size: 5px;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding: 32px 28px;">
              
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">✓ Order Confirmed</p>
              <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #1a202c;">Thank you, ${firstName}!</h2>
              <p style="margin: 0 0 24px; font-size: 14px; color: #4a5568; line-height: 1.6;">
                We have received your order <strong style="color: #1a202c; font-family: monospace;">#${order.orderNumber}</strong> and it is being prepared for shipment.
              </p>

              <!-- Delivery Timeline Box -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 26px;">
                <p style="margin: 0; font-size: 13px; font-weight: 700; color: #166534;">Estimated Delivery Timeline:</p>
                <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #15803d;">2 to 4 Business Days to your doorstep</p>
              </div>

              <!-- Order Items Section -->
              <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #718096; border-bottom: 1px solid #edf2f7; padding-bottom: 8px;">Order Details</h3>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                ${itemsHtml}
              </table>

              <!-- Price Breakdown -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; padding: 16px 20px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #718096;">Subtotal</td>
                  <td style="padding: 4px 0; font-size: 13px; text-align: right; color: #1a202c; font-weight: 600;">${formatPrice(order.subtotal)}</td>
                </tr>
                ${
                  order.discount > 0
                    ? `<tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #059669;">Coupon Discount</td>
                        <td style="padding: 4px 0; font-size: 13px; text-align: right; color: #059669; font-weight: 600;">-${formatPrice(order.discount)}</td>
                      </tr>`
                    : ''
                }
                ${
                  order.bankDiscount > 0
                    ? `<tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #059669;">Bank Discount</td>
                        <td style="padding: 4px 0; font-size: 13px; text-align: right; color: #059669; font-weight: 600;">-${formatPrice(order.bankDiscount)}</td>
                      </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #718096;">Shipping</td>
                  <td style="padding: 4px 0; font-size: 13px; text-align: right; color: #059669; font-weight: 700;">FREE</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #718096;">Sales Tax (2%)</td>
                  <td style="padding: 4px 0; font-size: 13px; text-align: right; color: #1a202c; font-weight: 600;">${formatPrice(order.tax)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 6px;"></td>
                </tr>
                <tr>
                  <td style="font-size: 15px; font-weight: 800; color: #1a202c;">Total Payable</td>
                  <td style="font-size: 17px; font-weight: 800; text-align: right; color: #1a202c;">${formatPrice(order.total)}</td>
                </tr>
              </table>

              <!-- Shipping Info -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="background-color: #f8fafc; border-radius: 8px; padding: 14px 18px;">
                    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #718096; letter-spacing: 0.5px;">Shipping Address</p>
                    <p style="margin: 0; font-size: 13px; color: #2d3748; line-height: 1.5;">
                      ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.country || ''}
                    </p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #718096;">Phone: ${order.customerInfo.phone || 'N/A'}</p>
                  </td>
                </tr>
              </table>

              <!-- View Order CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${orderUrl}" target="_blank" style="display: inline-block; background-color: #1a202c; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.5px;">
                      View Order Details
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; margin-top: 24px;">
          <tr>
            <td align="center" style="font-size: 12px; color: #718096; line-height: 1.6;">
              <p style="margin: 0;">Have a question? Simply reply to this email or call us at <strong>03440867308</strong>.</p>
              <p style="margin: 6px 0 0; color: #a0aec0; font-size: 11px;">
                © ${new Date().getFullYear()} Trio Store · <a href="${clientUrl}" style="color: #718096; text-decoration: underline;">triostore.vercel.app</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const transporter = getTransporter();
  const mailOptions = {
    from: `"Trio Store" <${smtpUser}>`,
    to: order.customerInfo.email,
    replyTo: smtpUser,
    subject: `Order Confirmation #${order.orderNumber} - Trio Store`,
    text,
    html,
    headers: {
      'X-Entity-Ref-ID': order.orderNumber,
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
    },
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[email] Order confirmation email sent to ${order.customerInfo.email}. MessageId: ${info.messageId}`);
  return info;
};

module.exports = {
  sendOrderConfirmationEmail,
};
