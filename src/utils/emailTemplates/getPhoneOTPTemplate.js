export const getPhoneChangeTemplate = (username, phone, otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RaffallStar Phone Update</title>
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
<p style="color:#e0e7ff; margin-top:5px;">Phone Number Update</p>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:35px 40px; color:#333333; line-height:1.6;">

<h2 style="margin-top:0;">Hello ${username},</h2>

<p>
We received a request to update your phone number.
</p>

<p>
Your new phone number:
<strong style="color:#4f46e5;">${phone}</strong>
</p>

<p>
To confirm this change, please use the following OTP:
</p>

<!-- OTP Box -->
<div style="
margin:30px 0;
padding:20px;
background:#f1f5ff;
border:2px dashed #a67c2e;
border-radius:8px;
text-align:center;
font-size:28px;
font-weight:bold;
letter-spacing:6px;
color:#4f46e5;
">
${otp}
</div>

<p>
Enter this code in the verification page to securely update your phone number.
</p>

<p style="color:#777; font-size:14px;">
If you did not request this change, please ignore this email or contact support immediately.
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