export const welcomeTemplate = (username) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to RaffallStar</title>
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
<p style="color:#e0e7ff; margin-top:5px;">Welcome to the Community</p>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:35px 40px; color:#333333; line-height:1.6;">

<h2 style="margin-top:0;">Welcome, ${username}! :tada:</h2>

<p>
We're thrilled to have you on <strong>RaffallStar</strong>.
</p>

<p>
Get started by verifying your email and exploring all the amazing features we have to offer.
</p>

<div style="
margin:25px 0;
padding:18px;
background:#eef2ff;
border:1px solid #a67c2e;
border-radius:6px;
text-align:center;
font-size:16px;
font-weight:bold;
color:#0f220a;
">
:rocket: Your journey with RaffallStar starts now!
</div>

<p>
We’re excited to help you discover raffles, win rewards, and enjoy the experience.
</p>

<p style="margin-top:30px;">
Best Regards,<br>
<strong>RaffallStar Team</strong>
</p>

<p style="color:#777; font-size:14px;">
If you didn't request this, you can safely ignore this email.
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
`;