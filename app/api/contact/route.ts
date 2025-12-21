import { NextRequest, NextResponse } from 'next/server';

interface ContactFormData {
  customerName: string;
  email: string;
  phone: string;
  category: string;
  location?: string;
  area?: string;
  budget?: string;
  notes?: string;
}

function formatEmailAsHTML(data: ContactFormData): string {
  const categoryMap: Record<string, string> = {
    residential: 'Nhà ở',
    commercial: 'Thương mại',
    office: 'Văn phòng',
    other: 'Khác',
  };

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Montserrat', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #000000;
      background-color: #f5f5f5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #000000;
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 1px solid #000000;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
      line-height: 1.2;
    }
    .header p {
      font-size: 12px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      opacity: 0.9;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    .section {
      margin-bottom: 32px;
    }
    .section:last-child {
      margin-bottom: 0;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #000000;
    }
    .field {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e5e5;
    }
    .field:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    .field-label {
      font-size: 11px;
      font-weight: 600;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: block;
      margin-bottom: 6px;
    }
    .field-value {
      font-size: 15px;
      color: #000000;
      line-height: 1.6;
      word-break: break-word;
    }
    .field-value a {
      color: #000000;
      text-decoration: underline;
    }
    .notes-section {
      background-color: #f9f9f9;
      padding: 24px;
      border-left: 3px solid #000000;
      margin-top: 8px;
    }
    .notes-content {
      font-size: 15px;
      color: #000000;
      line-height: 1.8;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      background-color: #000000;
      color: #ffffff;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #000000;
    }
    .footer-text {
      font-size: 11px;
      letter-spacing: 0.5px;
      line-height: 1.6;
      opacity: 0.8;
      margin: 0;
    }
    .footer-text:first-child {
      margin-bottom: 8px;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        width: 100% !important;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 20px;
      }
      .content {
        padding: 30px 20px;
      }
      .section-title {
        font-size: 13px;
      }
      .field-value {
        font-size: 14px;
      }
      .notes-section {
        padding: 20px;
      }
      .footer {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <h1>Thông Tin Liên Hệ Mới</h1>
      <p>Trang Web Oly Studio</p>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">Thông Tin Khách Hàng</div>
        <div class="field">
          <span class="field-label">Tên</span>
          <div class="field-value">${escapeHtml(data.customerName)}</div>
        </div>
        <div class="field">
          <span class="field-label">Email</span>
          <div class="field-value"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></div>
        </div>
        <div class="field">
          <span class="field-label">Số Điện Thoại</span>
          <div class="field-value"><a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a></div>
        </div>
        <div class="field">
          <span class="field-label">Thể Loại</span>
          <div class="field-value">${escapeHtml(categoryMap[data.category] || data.category)}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Chi Tiết Dự Án</div>
        <div class="field">
          <span class="field-label">Vị Trí</span>
          <div class="field-value">${data.location ? escapeHtml(data.location) : '<span style="color: #999999; font-style: italic;">Chưa cung cấp</span>'}</div>
        </div>
        <div class="field">
          <span class="field-label">Diện Tích</span>
          <div class="field-value">${data.area ? escapeHtml(data.area) : '<span style="color: #999999; font-style: italic;">Chưa cung cấp</span>'}</div>
        </div>
        <div class="field">
          <span class="field-label">Ngân Sách</span>
          <div class="field-value">${data.budget ? escapeHtml(data.budget) : '<span style="color: #999999; font-style: italic;">Chưa cung cấp</span>'}</div>
        </div>
      </div>

      ${data.notes ? `
      <div class="section">
        <div class="section-title">Ghi Chú</div>
        <div class="notes-section">
          <div class="notes-content">${escapeHtml(data.notes)}</div>
        </div>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p class="footer-text">Email này được gửi từ form liên hệ của Oly Studio.</p>
      <p class="footer-text">Thời gian gửi: ${new Date().toLocaleString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      })}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function formatEmailAsText(data: ContactFormData): string {
  const categoryMap: Record<string, string> = {
    residential: 'Nhà ở',
    commercial: 'Thương mại',
    office: 'Văn phòng',
    other: 'Khác',
  };

  return `
Thông tin liên hệ mới từ trang web Oly Studio:

Thông Tin Khách Hàng:
- Tên: ${data.customerName}
- Email: ${data.email}
- Số Điện Thoại: ${data.phone}
- Thể Loại: ${categoryMap[data.category] || data.category}

Chi Tiết Dự Án:
- Vị Trí: ${data.location || 'Chưa cung cấp'}
- Diện Tích: ${data.area || 'Chưa cung cấp'}
- Ngân Sách: ${data.budget || 'Chưa cung cấp'}

Ghi Chú:
${data.notes || 'Không có ghi chú'}

---
Email này được gửi từ form liên hệ của Oly Studio.
Thời gian gửi: ${new Date().toLocaleString('vi-VN')}
  `.trim();
}

async function sendEmail(
  recipientEmail: string,
  subject: string,
  textBody: string,
  htmlBody: string,
  customerEmail?: string
): Promise<boolean> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  
  if (!brevoApiKey) {
    console.log('=== CONTACT FORM SUBMISSION ===');
    console.log('To:', recipientEmail);
    console.log('Subject:', subject);
    console.log('Text Body:', textBody);
    console.log('HTML Body:', htmlBody);
    console.log('==============================');
    console.log('⚠️  No email service configured.');
    console.log('📧 To enable email sending, choose one:');
    console.log('   Option 1 - SMTP (Matbao, Gmail, etc.):');
    console.log('     1. Install: npm install nodemailer @types/nodemailer');
    console.log('     2. Add to .env: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM');
    console.log('   Option 2 - Brevo:');
    console.log('     1. Install: npm install @getbrevo/brevo');
    console.log('     2. Get API key: https://app.brevo.com/settings/keys/api');
    console.log('     3. Add to .env: BREVO_API_KEY=xkeysib-xxxxxxxxxxxxx');
    return true;
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
    
    if (customerEmail) {
      sendSmtpEmail.replyTo = {
        email: customerEmail,
        name: 'Customer',
      };
    }

    console.log('📧 Attempting to send email via Brevo...');
    console.log('   From:', fromEmail, '(verified Brevo sender)');
    console.log('   To:', recipientEmail, '(owner email)');
    if (customerEmail) {
      console.log('   Reply-To:', customerEmail, '(customer email - owner can reply directly)');
    }

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    const messageId = result.body?.messageId || result.messageId;
    const statusCode = result.response?.statusCode;
    
    console.log('✅ Email sent successfully via Brevo!');
    console.log('   Status:', statusCode, statusCode === 201 ? '(Created - Success)' : '');
    console.log('   Message ID:', messageId || 'N/A');
    console.log('   To:', recipientEmail);
    
    if (messageId) {
      console.log('💡 Email queued for delivery!');
      console.log('📊 Next steps to check email delivery:');
      console.log('   1. Check Brevo dashboard: https://app.brevo.com/settings/transactional');
      console.log('   2. Search for Message ID:', messageId);
      console.log('   3. Check delivery status: Sent, Delivered, Bounced, or Failed');
      console.log('   4. Check spam folder in:', recipientEmail);
      console.log('   5. Verify sender email is verified: https://app.brevo.com/settings/senders');
      console.log('');
      console.log('⚠️  If email status is "Sent" but not "Delivered":');
      console.log('   - Wait a few minutes (delivery can take 1-5 minutes)');
      console.log('   - Check spam/junk folder');
      console.log('   - Verify sender email is verified in Brevo');
      console.log('   - Check recipient email is valid and accessible');
    } else {
      console.warn('⚠️  Warning: No messageId returned. Email may not have been sent.');
      console.warn('   Check Brevo dashboard for error details');
    }
    
    return true;
  } catch (error: unknown) {
    if ((error as Error).message?.includes('Cannot find module')) {
      console.error('❌ @getbrevo/brevo is not installed. Install it: npm install @getbrevo/brevo');
    } else {
      console.error('❌ Error sending email via Brevo:');
      console.error('   Error:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const brevoError = error as { response?: { body?: unknown; text?: string } };
        console.error('   Brevo Response:', brevoError.response?.body || brevoError.response?.text);
      }
      
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message;
        if (errorMessage.includes('sender')) {
          console.error('💡 Tip: Verify sender email in Brevo dashboard: https://app.brevo.com/settings/senders');
        }
        if (errorMessage.includes('invalid') || errorMessage.includes('unauthorized')) {
          console.error('💡 Tip: Check if BREVO_API_KEY is correct');
        }
      }
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
        replyTo: customerEmail ? `"Customer" <${customerEmail}>` : undefined,
      };

      console.log('📧 Attempting to send email via SMTP (Matbao)...');
      console.log('   SMTP Host:', smtpHost);
      console.log('   From:', smtpFrom, `(${smtpFromName})`);
      console.log('   To:', recipientEmail, '(owner email)');
      if (customerEmail) {
        console.log('   Reply-To:', customerEmail, '(customer email - owner can reply directly)');
      }
      console.log('   Subject:', subject);

      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully via SMTP (Matbao)!');
      console.log('   Message ID:', info.messageId || 'N/A');
      console.log('   To:', recipientEmail);
      console.log('   Response:', info.response || 'N/A');
      
      return true;
    } catch (error) {
      if ((error as Error).message?.includes('Cannot find module')) {
        console.error('❌ nodemailer is not installed. Install it: npm install nodemailer @types/nodemailer');
      } else {
        console.error('❌ Error sending email via SMTP (Matbao):', error);
      }
    }
  }

  console.log('=== CONTACT FORM SUBMISSION ===');
  console.log('To:', recipientEmail);
  console.log('Subject:', subject);
  console.log('Text Body:', textBody);
  console.log('HTML Body:', htmlBody);
  console.log('==============================');
  console.log('⚠️  No email service configured.');
  console.log('📧 To enable email sending, choose one:');
  console.log('   Option 1 - Brevo (Currently using):');
  console.log('     1. Install: npm install @getbrevo/brevo');
  console.log('     2. Get API key: https://app.brevo.com/settings/keys/api');
  console.log('     3. Add to .env: BREVO_API_KEY=xkeysib-xxxxxxxxxxxxx');
    console.log('   Option 2 - SMTP (Matbao - For future use):');
    console.log('     1. Install: npm install nodemailer @types/nodemailer');
    console.log('     2. Add to .env: SMTP_HOST, SMTP_USER, SMTP_PASS, FROM_EMAIL, FROM_NAME');
    console.log('     3. See MATBAO_SMTP_SETUP.md for details');
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();
    const {
      customerName,
      email,
      phone,
      category,
    } = body;

    if (!customerName || !email || !phone || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const recipientEmail = process.env.CONTACT_EMAIL || 'info@olystudio.vn';

    const emailSubject = `Thông Tin Liên Hệ Mới - ${customerName}`;
    const emailTextBody = formatEmailAsText(body);
    const emailHtmlBody = formatEmailAsHTML(body);

    const emailSent = await sendEmail(
      recipientEmail,
      emailSubject,
      emailTextBody,
      emailHtmlBody,
      email
    );

    if (!emailSent) {
      console.error('Failed to send email, but form submission was processed');
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Contact form submitted successfully' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to submit contact form', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

