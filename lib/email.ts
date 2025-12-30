async function sendPasswordResetEmail(
  recipientEmail: string,
  resetToken: string,
  locale: string = 'en'
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const resetUrl = `${baseUrl}/${locale}/admin/reset-password?token=${resetToken}`;
  
  const subject = locale === 'vi' 
    ? 'Đặt Lại Mật Khẩu - Oly Studio'
    : 'Reset Password - Oly Studio';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; border: 1px solid #e0e0e0; padding: 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">
              ${locale === 'vi' ? 'Đặt Lại Mật Khẩu' : 'Reset Password'}
            </h1>
          </div>
          
          <div style="color: #333; line-height: 1.6;">
            <p>
              ${locale === 'vi' 
                ? 'Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.' 
                : 'You have requested to reset your password.'}
            </p>
            <p>
              ${locale === 'vi' 
                ? 'Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu của bạn:' 
                : 'Please click the link below to reset your password:'}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 12px 30px; background-color: #333; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                ${locale === 'vi' ? 'Đặt Lại Mật Khẩu' : 'Reset Password'}
              </a>
            </div>
            
            <p style="font-size: 12px; color: #666;">
              ${locale === 'vi' 
                ? 'Hoặc sao chép và dán liên kết này vào trình duyệt của bạn:' 
                : 'Or copy and paste this link into your browser:'}
            </p>
            <p style="font-size: 12px; color: #666; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <p style="font-size: 12px; color: #666; margin-top: 30px;">
              ${locale === 'vi' 
                ? 'Liên kết này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.' 
                : 'This link will expire in 1 hour. If you did not request a password reset, please ignore this email.'}
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>Oly Studio</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textBody = `
${locale === 'vi' ? 'Đặt Lại Mật Khẩu - Oly Studio' : 'Reset Password - Oly Studio'}

${locale === 'vi' 
  ? 'Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.' 
  : 'You have requested to reset your password.'}

${locale === 'vi' 
  ? 'Vui lòng truy cập liên kết sau để đặt lại mật khẩu:' 
  : 'Please visit the following link to reset your password:'}

${resetUrl}

${locale === 'vi' 
  ? 'Liên kết này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.' 
  : 'This link will expire in 1 hour. If you did not request a password reset, please ignore this email.'}

Oly Studio
  `;
  
  return await sendEmail(recipientEmail, subject, textBody, htmlBody);
}

async function sendEmail(
  recipientEmail: string,
  subject: string,
  textBody: string,
  htmlBody: string
): Promise<boolean> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  
  if (!brevoApiKey) {
    console.log('=== PASSWORD RESET EMAIL ===');
    console.log('To:', recipientEmail);
    console.log('Subject:', subject);
    console.log('Text Body:', textBody);
    console.log('HTML Body:', htmlBody);
    console.log('==============================');
    console.log('⚠️  No email service configured.');
    return true; // Return true in dev mode to allow testing
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SibApiV3Sdk = require('@getbrevo/brevo');
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

    const fromEmail = process.env.FROM_EMAIL || 'noreply@olystudio.vn';
    const fromName = process.env.FROM_NAME || 'Oly Studio';
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlBody;
    sendSmtpEmail.textContent = textBody;
    sendSmtpEmail.sender = {
      name: fromName,
      email: fromEmail,
    };
    sendSmtpEmail.to = [{ email: recipientEmail }];

    console.log('📧 Attempting to send password reset email via Brevo...');
    console.log('   From:', fromEmail);
    console.log('   To:', recipientEmail);

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    const messageId = result.body?.messageId || result.messageId;
    
    console.log('✅ Password reset email sent successfully via Brevo!');
    console.log('   Message ID:', messageId || 'N/A');
    
    return true;
  } catch (error: unknown) {
    if ((error as Error).message?.includes('Cannot find module')) {
      console.error('❌ @getbrevo/brevo is not installed. Install it: npm install @getbrevo/brevo');
    } else {
      console.error('❌ Error sending password reset email via Brevo:', error);
    }
    
    console.log('⚠️  Brevo failed, trying SMTP (Matbao) as fallback...');
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.FROM_EMAIL || 'noreply@olystudio.vn';
  const smtpFromName = process.env.FROM_NAME || 'Oly Studio';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions = {
        from: `"${smtpFromName}" <${smtpFrom}>`,
        to: recipientEmail,
        subject: subject,
        text: textBody,
        html: htmlBody,
      };

      console.log('📧 Attempting to send password reset email via SMTP...');
      console.log('   From:', smtpFrom);

      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Password reset email sent successfully via SMTP!');
      console.log('   Message ID:', info.messageId || 'N/A');
      
      return true;
    } catch (error) {
      if ((error as Error).message?.includes('Cannot find module')) {
        console.error('❌ nodemailer is not installed. Install it: npm install nodemailer @types/nodemailer');
      } else {
        console.error('❌ Error sending password reset email via SMTP:', error);
      }
    }
  }

  console.log('=== PASSWORD RESET EMAIL ===');
  console.log('To:', recipientEmail);
  console.log('Subject:', subject);
  console.log('Text Body:', textBody);
  console.log('HTML Body:', htmlBody);
  console.log('==============================');
  console.log('⚠️  No email service configured.');
  
  return true; // Return true in dev mode
}

export { sendPasswordResetEmail };

