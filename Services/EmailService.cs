using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Linear_v1.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendEmailConfirmationAsync(string toEmail, string userName, string confirmationLink)
        {
            var smtpHost = _config["Email:SmtpHost"] ?? throw new InvalidOperationException("Email:SmtpHost is not configured.");
            var smtpPortRaw = _config["Email:SmtpPort"] ?? throw new InvalidOperationException("Email:SmtpPort is not configured.");
            if (!int.TryParse(smtpPortRaw, out var smtpPort))
                throw new InvalidOperationException("Email:SmtpPort must be a valid integer.");

            var smtpUser = _config["Email:SmtpUser"] ?? throw new InvalidOperationException("Email:SmtpUser is not configured.");
            var smtpPass = _config["Email:SmtpPass"] ?? throw new InvalidOperationException("Email:SmtpPass is not configured.");
            var fromEmail = _config["Email:FromEmail"] ?? throw new InvalidOperationException("Email:FromEmail is not configured.");

            // Check for obvious placeholder values
            if (smtpUser.Contains("youremail", StringComparison.OrdinalIgnoreCase) ||
                smtpPass.Contains("your-app-password", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("SMTP credentials are placeholders. Set real credentials via user-secrets or environment variables. For Gmail: enable 2FA and create an App Password.");
            }

            var subject = "Linear AI - Email Verification";
            var body = $@"
                <div style='font-family:Arial;max-width:600px;margin:auto;padding:20px;background:#0a0a0a;color:#fff;border-radius:8px;'>
                    <h2 style='color:#7c3aed;'>Linear AI</h2>
                    <p>Hello {userName},</p>
                    <p>Click the button below to verify your account:</p>
                    <a href='{confirmationLink}' 
                       style='display:inline-block;padding:12px 28px;background:#7c3aed;color:#fff;
                              text-decoration:none;border-radius:6px;margin:16px 0;font-weight:bold;'>
                        Verify Email
                    </a>
                    <p style='color:#999;font-size:12px;'>This link is valid for 24 hours.</p>
                    <p style='color:#999;font-size:12px;'>If you didn't sign up, please ignore this email.</p>
                </div>";

            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(fromEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;
            message.Body = new BodyBuilder { HtmlBody = body }.ToMessageBody();

            using var client = new SmtpClient();
            try
            {
                var secureOption = smtpPort == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
                await client.ConnectAsync(smtpHost, smtpPort, secureOption);
                await client.AuthenticateAsync(smtpUser, smtpPass);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Confirmation email sent to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send confirmation email to {Email}. SMTP host: {Host}:{Port}. Error: {Error}", 
                    toEmail, smtpHost, smtpPort, ex.Message);
                throw new InvalidOperationException("Failed to send confirmation email. Verify SMTP credentials and settings.", ex);
            }
        }
    }
}