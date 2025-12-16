import nodemailer from 'nodemailer';

// Check if SMTP is configured
const isSmtpConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

// Create transporter only if SMTP is configured
const createTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Get the app URL for email links
const getAppUrl = () => {
  return process.env.APP_URL || 'http://localhost:5173';
};

// Get the from address
const getFromAddress = () => {
  return process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com';
};

// HTML template for password reset email
const getPasswordResetEmailHtml = (resetUrl: string, userName?: string) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0;">
              <div style="width: 64px; height: 64px; margin: 0 auto 16px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">🔐</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Finanzas Pro</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a2e; font-size: 20px; font-weight: 600;">
                ${userName ? `Hola ${userName},` : 'Hola,'}
              </h2>
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si no realizaste esta solicitud, puedes ignorar este correo.
              </p>
              
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);">
                      Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Este enlace expirará en <strong>1 hora</strong> por motivos de seguridad.
              </p>
              
              <!-- Alternative Link -->
              <div style="margin-top: 24px; padding: 16px; background-color: #f7fafc; border-radius: 8px; border-left: 4px solid #667eea;">
                <p style="margin: 0 0 8px; color: #4a5568; font-size: 13px;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:
                </p>
                <p style="margin: 0; color: #667eea; font-size: 12px; word-break: break-all;">
                  ${resetUrl}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f7fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                © ${new Date().getFullYear()} Finanzas Pro • Gestión financiera personal
              </p>
              <p style="margin: 8px 0 0; color: #cbd5e0; font-size: 11px;">
                Este es un correo automático, por favor no respondas a este mensaje.
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
};

// Plain text version for email clients that don't support HTML
const getPasswordResetEmailText = (resetUrl: string, userName?: string) => {
  return `
${userName ? `Hola ${userName},` : 'Hola,'}

Recibimos una solicitud para restablecer la contraseña de tu cuenta en Finanzas Pro.

Para restablecer tu contraseña, visita el siguiente enlace:
${resetUrl}

Este enlace expirará en 1 hora por motivos de seguridad.

Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.

---
Finanzas Pro - Gestión financiera personal
  `.trim();
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName?: string
): Promise<{ success: boolean; message: string }> => {
  const resetUrl = `${getAppUrl()}/reset-password?token=${resetToken}`;

  // If SMTP is not configured, fall back to console logging
  if (!isSmtpConfigured()) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 SMTP not configured - Email would be sent to:', email);
    console.log('🔗 Reset URL:', resetUrl);
    console.log('💡 Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env to enable email sending');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return {
      success: true,
      message: 'SMTP not configured - reset link logged to console',
    };
  }

  try {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Failed to create email transporter');
    }

    const mailOptions = {
      from: getFromAddress(),
      to: email,
      subject: '🔐 Restablecer Contraseña - Finanzas Pro',
      text: getPasswordResetEmailText(resetUrl, userName),
      html: getPasswordResetEmailHtml(resetUrl, userName),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    console.log('📬 Message ID:', info.messageId);

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
};

// Verify SMTP connection (can be used on startup or for health checks)
export const verifySmtpConnection = async (): Promise<boolean> => {
  if (!isSmtpConfigured()) {
    console.log('⚠️  SMTP not configured - email sending disabled');
    return false;
  }

  try {
    const transporter = createTransporter();
    if (!transporter) {
      return false;
    }

    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
};
