import nodemailer from "nodemailer";

/**
 * Checks whether real SMTP credentials are configured in environment variables.
 */
export const isSmtpConfigured = () => {
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const rawPass =
    process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
  const pass = rawPass ? String(rawPass).replace(/\s+/g, "").trim() : "";
  return Boolean(user && pass);
};

/**
 * Creates and configures the email transporter.
 * Supports environment variables:
 * - EMAIL_SERVICE (e.g. 'gmail')
 * - SMTP_HOST / EMAIL_HOST (e.g. smtp.gmail.com)
 * - SMTP_PORT / EMAIL_PORT (e.g. 587 or 465)
 * - SMTP_USER / EMAIL_USER (e.g. your Gmail address)
 * - SMTP_PASS / EMAIL_PASS / EMAIL_PASSWORD (e.g. 16-digit App Password)
 * - SMTP_SECURE (true for 465)
 * - EMAIL_FROM (e.g. "Smart City Administration" <no-reply@smartcity.gov>)
 */
export const createMailerTransporter = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const rawPass =
    process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
  const pass = rawPass ? String(rawPass).replace(/\s+/g, "").trim() : "";
  const service = process.env.EMAIL_SERVICE;
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;

  if (user && pass) {
    if (
      service === "gmail" ||
      (user && user.toLowerCase().endsWith("@gmail.com")) ||
      (!host && !service)
    ) {
      console.log(`[Mailer] Initializing direct Gmail transporter for ${user}`);
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user,
          pass,
        },
      });
    }

    console.log(
      `[Mailer] Initializing custom SMTP transporter (${host || "smtp.gmail.com"}:${port}) for ${user}`
    );
    return nodemailer.createTransport({
      host: host || "smtp.gmail.com",
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback: If SMTP credentials are not yet set in .env / Railway,
  // we create a jsonTransport transporter for development/safe execution without crashing
  console.warn(
    "[Mailer Warning] SMTP credentials (EMAIL_USER & EMAIL_PASS) are NOT configured in environment. Notification email was processed in simulation mode (jsonTransport) and not delivered to inboxes. Please set EMAIL_USER and EMAIL_PASS to enable real email delivery."
  );
  return nodemailer.createTransport({
    jsonTransport: true,
  });
};

const getFromAddress = () => {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (user) return `"Smart City Administration" <${user}>`;
  return '"Smart City Administration" <no-reply@smartcity.gov>';
};

// ============================================================================
// 1. COMPLAINT STATUS UPDATE EMAIL (ENGLISH)
// ============================================================================
export const sendComplaintStatusEmail = async ({
  toEmail,
  citizenName = "Citizen",
  complaintId,
  category = "General",
  location = "City Area",
  priority = "Medium",
  previousStatus,
  newStatus,
  description = "",
}) => {
  if (!toEmail) {
    console.warn(`[Mailer] No recipient email found for Complaint #${complaintId}`);
    return { success: false, reason: "No recipient email address" };
  }

  try {
    const transporter = createMailerTransporter();
    const formattedId = `CMP-${String(complaintId).padStart(4, "0")}`;

    // Color definitions for status
    let statusBg = "#eff6ff";
    let statusColor = "#1e40af";
    let statusBorder = "#bfdbfe";
    let statusGuidance = "";

    if (newStatus === "In Progress") {
      statusBg = "#eff6ff";
      statusColor = "#1d4ed8";
      statusBorder = "#bfdbfe";
      statusGuidance =
        "Our municipal operations department has reviewed your complaint and a field maintenance team has been dispatched to work on the issue. We are taking all necessary measures to complete this as swiftly as possible.";
    } else if (newStatus === "Resolved") {
      statusBg = "#ecfdf5";
      statusColor = "#047857";
      statusBorder = "#a7f3d0";
      statusGuidance =
        "We are pleased to inform you that our field operations unit has successfully resolved the reported problem. If you feel the issue has not been fully resolved or requires additional attention, please feel free to submit a follow-up through your citizen account.";
    } else {
      statusBg = "#fffbeb";
      statusColor = "#b45309";
      statusBorder = "#fde68a";
      statusGuidance =
        "Your complaint has been logged into the Smart City tracking system and is currently pending assignment to the appropriate municipal department.";
    }

    const cleanDescription = description
      ? description.replace(/^Title:[^\n]*\n*/i, "").trim()
      : "No detailed description provided.";

    const subject = `[Smart City] Status Update: Complaint #${formattedId} is now ${newStatus}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af, #2563eb); padding: 26px 30px; text-align: left;">
              <span style="display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 4px 10px; border-radius: 20px; margin-bottom: 8px;">
                Citizen Portal Notification
              </span>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                Complaint Status Updated
              </h1>
              <p style="margin: 6px 0 0; color: #bfdbfe; font-size: 13px;">
                Reference: <strong>${formattedId}</strong>
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 28px 30px;">
              <p style="font-size: 15px; margin: 0 0 16px; color: #334155;">
                Dear <strong>${citizenName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 22px; color: #475569;">
                This email is to notify you that the status of your municipal complaint has been updated by the city administration.
              </p>

              <!-- Status Card -->
              <div style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; text-align: center;">
                <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px;">
                  Current Incident Status
                </span>
                <span style="display: inline-block; font-size: 18px; font-weight: 700; color: ${statusColor};">
                  ${newStatus}
                </span>
                ${
                  previousStatus && previousStatus !== newStatus
                    ? `<span style="display: block; font-size: 12px; color: #64748b; margin-top: 4px;">(Previously: ${previousStatus})</span>`
                    : ""
                }
              </div>

              <!-- Status Guidance -->
              <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #334155;">
                  ${statusGuidance}
                </p>
              </div>

              <!-- Incident Details Summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fafcff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #64748b; font-weight: 600; width: 35%;">Complaint ID:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700;">${formattedId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #64748b; font-weight: 600;">Category:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a;">${category}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #64748b; font-weight: 600;">Location:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a;">${location}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #64748b; font-weight: 600;">Priority:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 600;">${priority}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; color: #64748b; font-weight: 600; vertical-align: top;">Description:</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #334155; line-height: 1.5;">${cleanDescription}</td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 10px;">
                You can track all active updates and submit additional details anytime by logging into the Smart City Citizen Portal.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                This is an automated notification from the <strong>Smart City Operations & Citizen Care System</strong>.<br>
                Please do not reply directly to this email address.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
[Smart City] Status Update: Complaint #${formattedId}

Dear ${citizenName},

The status of your municipal complaint has been updated to: ${newStatus}
${previousStatus ? `(Previously: ${previousStatus})` : ""}

Complaint Details:
- Complaint ID: ${formattedId}
- Category: ${category}
- Location: ${location}
- Priority: ${priority}
- Description: ${cleanDescription}

Update Guidance:
${statusGuidance}

Log in to the Smart City Citizen Portal to review details and track progress.

Best regards,
Smart City Administration & Citizen Care
    `.trim();

    const mailOptions = {
      from: getFromAddress(),
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Complaint status email dispatched to ${toEmail} for Complaint #${formattedId}`);
    return { success: true, messageId: info.messageId, recipient: toEmail };
  } catch (error) {
    console.error(`[Mailer] Error sending complaint status email to ${toEmail}:`, error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// 2. EMERGENCY STATUS UPDATE EMAIL (ENGLISH)
// ============================================================================
export const sendEmergencyStatusEmail = async ({
  toEmail,
  citizenName = "Citizen",
  emergencyId,
  emergencyType = "Emergency Incident",
  location = "Incident Area",
  team = "Emergency Response Team",
  priority = "High",
  previousStatus,
  newStatus,
}) => {
  if (!toEmail) {
    console.warn(`[Mailer] No recipient email found for Emergency #${emergencyId}`);
    return { success: false, reason: "No recipient email address" };
  }

  try {
    const transporter = createMailerTransporter();
    const formattedId = `EMG-${String(emergencyId).padStart(4, "0")}`;

    let statusBg = "#fef2f2";
    let statusColor = "#dc2626";
    let statusBorder = "#fecaca";
    let statusGuidance = "";

    if (newStatus === "Responding") {
      statusBg = "#fffbeb";
      statusColor = "#d97706";
      statusBorder = "#fde68a";
      statusGuidance =
        `Emergency response units (${team || "Emergency Dispatch Unit"}) have been mobilized and are actively en route / on-scene. For your personal safety, please keep emergency routes clear and adhere to instructions given by on-site responders.`;
    } else if (newStatus === "Resolved") {
      statusBg = "#ecfdf5";
      statusColor = "#047857";
      statusBorder = "#a7f3d0";
      statusGuidance =
        "The emergency situation has been successfully controlled, secured, and declared safe by field emergency personnel. The incident has been cleared in our command center log.";
    } else {
      statusBg = "#fef2f2";
      statusColor = "#b91c1c";
      statusBorder = "#fca5a5";
      statusGuidance =
        "Your emergency report is actively registered in the Smart City Emergency Command Center. Dispatchers are coordinating response teams to address the incident.";
    }

    const subject = `🚨 [Smart City Emergency] Incident Update: Emergency #${formattedId} is now ${newStatus}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; border: 1px solid #fee2e2; overflow: hidden; box-shadow: 0 4px 15px rgba(220,38,38,0.06);" cellspacing="0" cellpadding="0">
          
          <!-- Urgent Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #b91c1c, #dc2626); padding: 26px 30px; text-align: left;">
              <span style="display: inline-block; background: rgba(255,255,255,0.22); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 4px 10px; border-radius: 20px; margin-bottom: 8px;">
                🚨 Emergency Command Center
              </span>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                Emergency Incident Status Update
              </h1>
              <p style="margin: 6px 0 0; color: #fecaca; font-size: 13px;">
                Incident Reference: <strong>${formattedId}</strong>
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 30px;">
              <p style="font-size: 15px; margin: 0 0 16px; color: #334155;">
                Dear <strong>${citizenName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 22px; color: #475569;">
                This is an official incident update regarding the emergency reported in your area through the Smart City Operations Network.
              </p>

              <!-- Status Card -->
              <div style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px; text-align: center;">
                <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #7f1d1d; letter-spacing: 0.5px; margin-bottom: 4px;">
                  Current Response Status
                </span>
                <span style="display: inline-block; font-size: 20px; font-weight: 800; color: ${statusColor};">
                  ${newStatus}
                </span>
                ${
                  previousStatus && previousStatus !== newStatus
                    ? `<span style="display: block; font-size: 12px; color: #991b1b; margin-top: 4px;">(Previously: ${previousStatus})</span>`
                    : ""
                }
              </div>

              <!-- Guidance Box -->
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #991b1b;">
                  <strong>Safety Notice:</strong> ${statusGuidance}
                </p>
              </div>

              <!-- Incident Details Summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fffafa; border: 1px solid #fee2e2; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #fee2e2; font-size: 12px; color: #64748b; font-weight: 600; width: 35%;">Incident ID:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #fee2e2; font-size: 13px; color: #0f172a; font-weight: 700;">${formattedId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #fee2e2; font-size: 12px; color: #64748b; font-weight: 600;">Incident Type:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #fee2e2; font-size: 13px; color: #b91c1c; font-weight: 700;">${emergencyType}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #fee2e2; font-size: 12px; color: #64748b; font-weight: 600;">Location:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #fee2e2; font-size: 13px; color: #0f172a;">${location}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #fee2e2; font-size: 12px; color: #64748b; font-weight: 600;">Priority Level:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #fee2e2; font-size: 13px; color: #dc2626; font-weight: 700;">${priority} Priority</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; color: #64748b; font-weight: 600;">Assigned Team:</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #1e40af; font-weight: 600;">${team || "Emergency Response Team"}</td>
                </tr>
              </table>

              <!-- Helplines -->
              <div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; text-align: center;">
                <span style="font-size: 12px; font-weight: 600; color: #334155;">Emergency Hotlines: </span>
                <span style="font-size: 12px; color: #475569;">Rescue: <strong>1122</strong> | Police: <strong>15</strong> | Fire Brigade: <strong>16</strong></span>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                This is an automated dispatch notification from the <strong>Smart City Emergency Command Center</strong>.<br>
                Please do not reply directly to this email address.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
🚨 [Smart City Emergency] Incident Update: Emergency #${formattedId}

Dear ${citizenName},

The status of the reported emergency incident has been updated to: ${newStatus}
${previousStatus ? `(Previously: ${previousStatus})` : ""}

Incident Summary:
- Incident ID: ${formattedId}
- Type: ${emergencyType}
- Location: ${location}
- Priority: ${priority}
- Assigned Response Unit: ${team || "Emergency Response Team"}

Safety Directive:
${statusGuidance}

Emergency Hotlines: Rescue: 1122 | Police: 15 | Fire: 16

Smart City Emergency Command & Dispatch Operations
    `.trim();

    const mailOptions = {
      from: getFromAddress(),
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Emergency status email dispatched to ${toEmail} for Emergency #${formattedId}`);
    return { success: true, messageId: info.messageId, recipient: toEmail };
  } catch (error) {
    console.error(`[Mailer] Error sending emergency status email to ${toEmail}:`, error);
    return { success: false, error: error.message };
  }
};
