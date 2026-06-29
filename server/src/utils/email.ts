import { Resend } from 'resend';
import { User } from '../models';

async function getAdminEmails(): Promise<string[]> {
  try {
    const admins = await User.find({ role: 'admin', email: { $ne: 'importer@dooars-tutors.com' } }).select('email');
    const emails = admins.map(a => a.email);
    if (emails.length === 0) {
      return [process.env.ADMIN_EMAIL || 'subhadeepdhar563@gmail.com'];
    }
    return emails;
  } catch (error) {
    console.error('Failed to fetch admin emails', error);
    return [process.env.ADMIN_EMAIL || 'subhadeepdhar563@gmail.com'];
  }
}

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

  // Fetch all admin emails
  const adminEmails = await getAdminEmails();
  
  await resend.emails.send({
    from: 'Dooars Tutors <onboarding@resend.dev>', // Update with verified domain
    to: adminEmails,
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

export async function sendProfileCreationAdminNotification(userEmail: string, profileName: string, profileType: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] Admin notified of new profile: ${profileName} by ${userEmail}`);
    return;
  }

  const adminEmails = await getAdminEmails();
  
  await resend.emails.send({
    from: 'Dooars Tutors <onboarding@resend.dev>',
    to: adminEmails,
    subject: 'New Tutor Profile Created',
    html: `
      <h2>New Profile Alert</h2>
      <p>A user has just completed setting up their public profile.</p>
      <ul>
        <li><strong>Profile Name:</strong> ${profileName}</li>
        <li><strong>Profile Type:</strong> ${profileType}</li>
        <li><strong>User Email:</strong> ${userEmail}</li>
      </ul>
      <br/>
      <a href="https://dooarstutors.in/admin" style="display:inline-block;padding:10px 20px;background:#10b981;color:#fff;text-decoration:none;border-radius:5px;">Go to Admin Panel</a>
    `
  });
}

export async function sendReportAdminNotification(reporterEmail: string, reportedProfileName: string, reason: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] Admin notified of report against: ${reportedProfileName}`);
    return;
  }

  const adminEmails = await getAdminEmails();
  
  await resend.emails.send({
    from: 'Dooars Tutors <onboarding@resend.dev>',
    to: adminEmails,
    subject: '🚨 Profile Reported',
    html: `
      <h2>A profile has been reported</h2>
      <p>Please review this report in the admin dashboard.</p>
      <ul>
        <li><strong>Reported Profile:</strong> ${reportedProfileName}</li>
        <li><strong>Reporter Email:</strong> ${reporterEmail}</li>
        <li><strong>Reason:</strong> ${reason}</li>
      </ul>
    `
  });
}

export async function sendReportConfirmation(reporterEmail: string, reportedProfileName: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] Report confirmation sent to: ${reporterEmail}`);
    return;
  }

  await resend.emails.send({
    from: 'Dooars Tutors <onboarding@resend.dev>',
    to: reporterEmail,
    subject: 'Report Submitted Successfully',
    html: `
      <h2>Report Received</h2>
      <p>Thank you for helping keep Dooars Tutors safe.</p>
      <p>We have successfully received your report regarding the profile: <strong>${reportedProfileName}</strong>.</p>
      <p>Our team will review this report shortly and take appropriate action. We will get back to you if we need further details.</p>
    `
  });
}

export async function sendReviewNotification(tutorEmail: string, rating: number, reviewText: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] New review notification sent to: ${tutorEmail} | Rating: ${rating}`);
    return;
  }

  console.log(`[Email Attempt] Sending review notification via Resend to ${tutorEmail}`);
  try {
    const data = await resend.emails.send({
      from: 'Dooars Tutors <onboarding@resend.dev>',
      to: tutorEmail,
    subject: '⭐ You received a new review!',
    html: `
      <h2>New Review Received!</h2>
      <p>Congratulations, someone has left a new review on your profile.</p>
      <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Rating:</strong> ${rating} / 5</p>
        <p><strong>Review:</strong> "${reviewText}"</p>
      </div>
      <p>Log in to your dashboard to see your updated rating.</p>
      <a href="https://dooarstutors.in/dashboard/reviews" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:5px;">View Dashboard</a>
    `
    });
    console.log(`[Email Success] Review notification sent successfully to ${tutorEmail}, resend response:`, data);
  } catch (error) {
    console.error(`[Email Error] Failed to send review notification to ${tutorEmail}`, error);
  }
}
