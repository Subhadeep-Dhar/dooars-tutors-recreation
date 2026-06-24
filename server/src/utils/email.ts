import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_test_key');

export async function sendWelcomeEmail(to: string, name: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] Welcome email sent to ${to}`);
    return;
  }

  await resend.emails.send({
    from: 'Dooars Tutors <onboarding@resend.dev>', // Update with verified domain
    to,
    subject: 'Welcome to Dooars Tutors!',
    html: `
      <h2>Hi ${name},</h2>
      <p>Welcome to Dooars Tutors! Your account is successfully verified.</p>
      <p>You can now log in and set up your profile to start connecting.</p>
      <a href="https://dooarstutors.in/dashboard" style="display:inline-block;padding:10px 20px;background:#10b981;color:#fff;text-decoration:none;border-radius:5px;">Go to Dashboard</a>
    `
  });
}

export async function sendAdminNotification(userEmail: string, role: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] Admin notified of new user: ${userEmail}`);
    return;
  }

  // Define admin email from env or default
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@dooarstutors.in';
  
  await resend.emails.send({
    from: 'System <notifications@resend.dev>', // Update with verified domain
    to: adminEmail,
    subject: 'New User Registration',
    html: `
      <h2>New User Alert</h2>
      <p>A new user has registered and verified their account.</p>
      <ul>
        <li><strong>Email:</strong> ${userEmail}</li>
        <li><strong>Role:</strong> ${role}</li>
      </ul>
    `
  });
}
