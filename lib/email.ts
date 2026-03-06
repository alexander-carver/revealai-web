import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "affiliates@revealai-peoplesearch.com";

/**
 * Send email to an affiliate
 */
export async function sendAffiliateEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[Email] RESEND_API_KEY not set, skipping email:", subject);
    return { success: false, skipped: true };
  }

  try {
    const result = await resend.emails.send({
      from: `RevealAI Affiliates <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
    return { success: true, id: result.data?.id };
  } catch (error: any) {
    console.error("[Email] Failed to send:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Commission earned notification
 * Sent immediately when an affiliate earns a commission
 */
export async function sendCommissionEmail(
  to: string,
  affiliateName: string,
  amount: string,
  isFirst: boolean = false
) {
  const subject = isFirst
    ? "🎉 First Commission Earned!"
    : `💰 Commission Earned: ${amount}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 12px; }
    .amount { font-size: 36px; font-weight: bold; color: #16a34a; text-align: center; margin: 20px 0; }
    .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .stats-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .stats-row:last-child { border-bottom: none; }
    .cta { text-align: center; margin-top: 30px; }
    .cta a { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${isFirst ? "🎉 Congratulations!" : "💰 Commission Alert"}</h1>
    <p>${isFirst ? "You just earned your first commission!" : "You just earned a commission!"}</p>
  </div>
  
  <div class="content">
    <p>Hi ${affiliateName},</p>
    
    <p>${isFirst 
      ? "Amazing news! Someone just subscribed through your affiliate link, and you've earned your <strong>first commission</strong>! This is just the beginning." 
      : "Great news! Someone just made a payment on their subscription, and you've earned a commission."}</p>
    
    <div class="amount">${amount}</div>
    
    <div class="stats">
      <div class="stats-row">
        <span>Commission Rate</span>
        <strong>30%</strong>
      </div>
      <div class="stats-row">
        <span>Earning Type</span>
        <strong>Recurring (Lifetime)</strong>
      </div>
      <div class="stats-row">
        <span>Status</span>
        <strong style="color: #16a34a;">✓ Paid to your account</strong>
      </div>
    </div>
    
    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      Remember: You earn 30% on <strong>every payment</strong> they make, forever.
    </p>
    
    <div class="cta">
      <a href="https://revealai-peoplesearch.com/affiliates/dashboard?ref={{ref_slug}}">View Your Dashboard</a>
    </div>
  </div>
  
  <div class="footer">
    <p>You're receiving this because you're a RevealAI affiliate.</p>
    <p>Questions? Reply to this email or contact support@revealai-peoplesearch.com</p>
  </div>
</body>
</html>`;

  return sendAffiliateEmail(to, subject, html);
}

/**
 * Monthly summary email
 * Sent at the end of each month with total earnings
 */
export async function sendMonthlySummaryEmail(
  to: string,
  affiliateName: string,
  month: string,
  totalEarned: string,
  newReferrals: number,
  activeSubscriptions: number
) {
  const subject = `📊 Your ${month} Affiliate Summary — ${totalEarned} Earned`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 12px; }
    .amount { font-size: 42px; font-weight: bold; color: #16a34a; text-align: center; margin: 20px 0; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
    .stat-box { background: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-box .number { font-size: 28px; font-weight: bold; color: #111827; }
    .stat-box .label { color: #6b7280; font-size: 14px; margin-top: 5px; }
    .cta { text-align: center; margin-top: 30px; }
    .cta a { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 ${month} Summary</h1>
    <p>Here's how you performed as a RevealAI affiliate</p>
  </div>
  
  <div class="content">
    <p>Hi ${affiliateName},</p>
    
    <p>Another great month! Here's what you earned:</p>
    
    <div class="amount">${totalEarned}</div>
    
    <div class="stats-grid">
      <div class="stat-box">
        <div class="number">${newReferrals}</div>
        <div class="label">New Referrals</div>
      </div>
      <div class="stat-box">
        <div class="number">${activeSubscriptions}</div>
        <div class="label">Active Subscriptions</div>
      </div>
    </div>
    
    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      You earn 30% on every payment from these ${activeSubscriptions} active subscribers — forever!
    </p>
    
    <div class="cta">
      <a href="https://revealai-peoplesearch.com/affiliates/dashboard?ref={{ref_slug}}">View Full Dashboard</a>
    </div>
  </div>
  
  <div class="footer">
    <p>You're receiving this monthly summary because you're a RevealAI affiliate.</p>
  </div>
</body>
</html>`;

  return sendAffiliateEmail(to, subject, html);
}
