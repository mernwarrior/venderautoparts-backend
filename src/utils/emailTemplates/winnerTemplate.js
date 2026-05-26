export const getWinnerTemplate = (username, raffleTitle, ticketNumber, deadline) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RaffallStar - You Won!</title>
</head>
<body style="margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:30px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

<!-- Header -->
<tr>
<td style="background:#a67c2e; padding:25px; text-align:center;">
<h1 style="color:#ffffff; margin:0;">RaffallStar</h1>
<p style="color:#ffffff; margin-top:5px;">🎉 Congratulations! 🎉</p>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:35px 40px; color:#333333; line-height:1.6;">

<h2 style="margin-top:0;">Hello ${username},</h2>

<p>
You have successfully won the raffle: <strong style="color:#4f46e5;">${raffleTitle}</strong>
</p>

<p>
Winning Ticket Number: <strong style="color:#4f46e5;">${ticketNumber}</strong>
</p>

<p>
Please go to your ticket section and complete your <strong>KYC verification</strong>.
Upload your ID document before the deadline.
</p>

<p>
<strong>Deadline:</strong> ${deadline}
</p>

<p style="color:#d97706;">
⚠️ If you do not complete your KYC within the given time, the raffle will be redrawn and you will be removed from the lucky winner list.
</p>

<p style="color:#777; font-size:14px;">
If you did not participate in this raffle, please contact support immediately.
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#f9fafb; text-align:center; padding:20px; font-size:12px; color:#888;">
© ${new Date().getFullYear()} RaffallStar. All rights reserved.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;