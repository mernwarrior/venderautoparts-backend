export const ticketPurchasedTemplate = (username, tickets, raffle, order) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket Purchase Confirmation</title>
</head>

<body style="margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:30px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

<!-- Header -->
<tr>
<td style="background: linear-gradient(135deg, #a67c2e, #3dc427); padding:30px; text-align:center;">
  <h1 style="color:#ffffff; margin:0; font-size:28px; letter-spacing:1px;">🎟️ RaffallStar</h1>
  <p style="color:#e8fde4; margin-top:8px; font-size:15px;">Ticket Purchase Confirmation</p>
</td>
</tr>

<!-- Success Banner -->
<tr>
<td style="background:#f0fdf4; padding:20px 40px; border-bottom:2px solid #bbf7d0; text-align:center;">
  <p style="margin:0; font-size:18px; color:#16a34a; font-weight:bold;">✅ Payment Successful!</p>
  <p style="margin:5px 0 0; color:#555; font-size:14px;">Your tickets have been confirmed and reserved.</p>
</td>
</tr>

<!-- Greeting -->
<tr>
<td style="padding:30px 40px 10px; color:#333333;">
  <h2 style="margin:0 0 8px;">Hello ${username},</h2>
  <p style="margin:0; color:#555; line-height:1.6;">
    Thank you for your purchase! Here's a summary of your order for 
    <strong style="color:#16a34a;">${raffle.title}</strong>.
  </p>
</td>
</tr>

<!-- Order Summary Card -->
<tr>
<td style="padding:15px 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border-radius:10px; border:1px solid #e5e7eb; overflow:hidden;">
    
    <tr>
      <td style="padding:15px 20px; background:#f3f4f6; border-bottom:1px solid #e5e7eb;">
        <p style="margin:0; font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">Order Summary</p>
      </td>
    </tr>

    <tr>
      <td style="padding:0 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          
          <tr>
            <td style="padding:12px 0; border-bottom:1px solid #f3f4f6; color:#555; font-size:14px;">Order ID</td>
            <td style="padding:12px 0; border-bottom:1px solid #f3f4f6; text-align:right; font-weight:bold; color:#111; font-size:14px;">#${order.orderId}</td>
          </tr>

          <tr>
            <td style="padding:12px 0; border-bottom:1px solid #f3f4f6; color:#555; font-size:14px;">Raffle</td>
            <td style="padding:12px 0; border-bottom:1px solid #f3f4f6; text-align:right; font-weight:bold; color:#111; font-size:14px;">${raffle.title}</td>
          </tr>

          <tr>
            <td style="padding:12px 0; border-bottom:1px solid #f3f4f6; color:#555; font-size:14px;">Tickets Purchased</td>
            <td style="padding:12px 0; border-bottom:1px solid #f3f4f6; text-align:right; font-weight:bold; color:#111; font-size:14px;">${order.ticketQuantity}</td>
          </tr>

          <tr>
            <td style="padding:12px 0; border-bottom:1px solid #f3f4f6; color:#555; font-size:14px;">Price per Ticket</td>
            <td style="padding:12px 0; border-bottom:1px solid #f3f4f6; text-align:right; font-weight:bold; color:#111; font-size:14px;">$${raffle.ticketPrice}</td>
          </tr>

          <tr>
            <td style="padding:14px 0; color:#111; font-size:15px; font-weight:bold;">Total Paid</td>
            <td style="padding:14px 0; text-align:right; font-size:18px; font-weight:bold; color:#16a34a;">$${order.amount}</td>
          </tr>

        </table>
      </td>
    </tr>

  </table>
</td>
</tr>

<!-- Ticket Numbers -->
<tr>
<td style="padding:15px 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4; border-radius:10px; border:1px solid #bbf7d0; overflow:hidden;">
    
    <tr>
      <td style="padding:15px 20px; background:#dcfce7; border-bottom:1px solid #bbf7d0;">
        <p style="margin:0; font-size:13px; color:#15803d; text-transform:uppercase; letter-spacing:1px; font-weight:bold;">🎟️ Your Ticket Numbers</p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${tickets.map((t, i) => `
              <td style="padding:6px 8px;">
                <div style="
                  background:#ffffff;
                  border:2px solid #a67c2e;
                  border-radius:8px;
                  padding:10px 14px;
                  text-align:center;
                  font-weight:bold;
                  font-size:15px;
                  color:#15803d;
                  letter-spacing:2px;
                  white-space:nowrap;
                ">
                  #${t.ticketNumber}
                </div>
              </td>
              ${(i + 1) % 3 === 0 ? '</tr><tr>' : ''}
            `).join('')}
          </tr>
        </table>
      </td>
    </tr>

  </table>
</td>
</tr>

<!-- Draw Date -->
<tr>
<td style="padding:15px 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb; border-radius:10px; border:1px solid #fde68a; padding:18px 20px;">
    <tr>
      <td style="padding:18px 20px;">
        <p style="margin:0; font-size:14px; color:#92400e;">
          🗓️ <strong>Draw Date:</strong> 
          ${new Date(raffle.raffleEndDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p style="margin:8px 0 0; font-size:13px; color:#b45309;">
          Good luck! The winner will be announced after the draw.
        </p>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- Footer Note -->
<tr>
<td style="padding:15px 40px 30px;">
  <p style="margin:0; font-size:13px; color:#6b7280; line-height:1.6;">
    If you have any questions about your purchase, please contact our support team. 
    Keep your ticket numbers safe — they are your entry into the draw.
  </p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#f9fafb; text-align:center; padding:20px; font-size:12px; color:#9ca3af; border-top:1px solid #f3f4f6;">
  © ${new Date().getFullYear()} RaffallStar. All rights reserved.<br/>
  <span style="font-size:11px;">You're receiving this because you purchased a ticket on RaffallStar.</span>
</td>
</tr>

</table>
</td>
</tr>
</table>

</body>
</html>
`;