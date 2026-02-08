import nodemailer from "nodemailer";

//Nodemailer transporter configuration ( nodemailer talks to SMTP server(we used mailtrap as a fake SMTP server for dev/testing))
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_SMTP_HOST,
  port: process.env.MAILTRAP_SMTP_PORT,
  auth: {
    user: process.env.MAILTRAP_SMTP_USER,
    pass: process.env.MAILTRAP_SMTP_PASS,
  },
});

//Generic email sending function : Takes structured email content → converts it to HTML + text → sends it using SMTP
//sending email is always an async function
const sendEmail = async (options) => {
  const mail = {
    from: "bloom@skillpass.org",
    to: options.email,
    subject: options.subject,
    html: `
      <div style="margin:0;padding:0;background:#f7d3d6;font-family:Georgia,serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 15px;">
              <table width="100%" max-width="420" cellpadding="0" cellspacing="0"
                style="max-width:420px;background:linear-gradient(180deg,#b94a57,#f0b4b8);
                      border-radius:26px;
                      padding:36px 28px;
                      color:white;
                      text-align:center;
                      box-shadow:0 12px 40px rgba(0,0,0,0.15);">

                <!-- Logo -->
                <h1 style="
                  margin:0;
                  font-size:38px;
                  font-weight:500;
                  letter-spacing:1px;">
                  Bloom
                </h1>

                <p style="
                  margin:6px 0 28px;
                  font-style:italic;
                  opacity:0.95;">
                  Someone around you might be feeling the same.
                </p>

                <!-- Divider -->
                <div style="
                  width:80px;
                  height:2px;
                  background:rgba(255,255,255,0.5);
                  margin:0 auto 24px;">
                </div>

                <!-- Message -->
                <h2 style="
                  font-size:22px;
                  font-weight:400;
                  margin-bottom:12px;">
                  Your letter has arrived 💌
                </h2>

                <p style="
                  font-size:15px;
                  line-height:1.6;noreply
                  margin-bottom:26px;
                  opacity:0.95;">
                  Someone nearby might already be wondering about you.
                  Before the story unfolds, we just need to make sure it’s really you.
                  Tap below to step inside Bloom.
                </p>

                <!-- CTA -->
                <a href="${options.verificationUrl}"
                  style="
                    display:inline-block;
                    background:#ffffff;
                    color:#b94a57;
                    padding:14px 30px;
                    border-radius:30px;
                    font-size:16px;
                    font-weight:600;
                    text-decoration:none;
                    box-shadow:0 8px 20px rgba(0,0,0,0.15);">
                  Verify & Enter ✨
                </a>

                <!-- Footer -->
                <p style="
                  margin-top:32px;
                  font-size:12px;
                  opacity:0.8;">
                  This link will expire soon for your safety.<br/>
                  If you didn’t request this, you can ignore the message.
                </p>

              </table>
            </td>
          </tr>
        </table>
      </div>
      `,
  };

  try {
    await transporter.sendMail(mail);
    console.log("Email sent successfully to " + options.email);
  } catch (error) {
    console.error("Error sending email to " + options.email + ": ", error);
  }
};

export { sendEmail };
