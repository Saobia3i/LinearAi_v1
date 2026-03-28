namespace Linear_v1.Services
{
    public interface IEmailService
    {
        Task SendEmailConfirmationAsync(string toEmail, string userName, string confirmationLink);
        Task SendDeliveryEmailAsync(string toEmail, string userName, string productTitle, int orderId, string deliveryNote);
    }
}