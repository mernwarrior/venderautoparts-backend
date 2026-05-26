export const successPasswordTemp = (username) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Password Updated - RaffallStar</title>
</head>

<body style="margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:30px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

<!-- Header -->
<tr>
<td style="background:#4eec1e; padding:25px; text-align:center;">
<h1 style="color:#ffffff; margin:0;">RaffallStar</h1>
<p style="color:#e0e7ff; margin-top:5px;">Password Updated</p>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:35px 40px; color:#333333; line-height:1.6;">

<h2 style="margin-top:0;">Hello ${username},</h2>

<p>
Your password has been successfully changed.
</p>

<div style="
margin:25px 0;
padding:18px;
background:#ecfdf5;
border:1px solid #a67c2e;
border-radius:6px;
text-align:center;
font-size:16px;
font-weight:bold;
color:#059669;
">
:heavy_check_mark: Password Updated Successfully
</div>

<p>
If you made this change, no further action is required.
</p>

<p>
If you did <strong>not</strong> change your password, please reset it immediately and contact our support team.
</p>

<p style="margin-top:30px;">
Kind Regards,<br>
<strong>RaffallStar Team</strong>
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