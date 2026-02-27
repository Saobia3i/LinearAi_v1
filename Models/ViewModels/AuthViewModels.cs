using System.ComponentModel.DataAnnotations;

namespace Linear_v1.Models.ViewModels
{
    public class RegisterViewModel
    {
        [Required(ErrorMessage = "নাম আবশ্যক")]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "ইমেইল আবশ্যক")]
        [EmailAddress(ErrorMessage = "সঠিক ইমেইল দিন")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "পাসওয়ার্ড আবশ্যক")]
        [MinLength(6, ErrorMessage = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "পাসওয়ার্ড কনফার্ম করুন")]
        [DataType(DataType.Password)]
        [Compare("Password", ErrorMessage = "পাসওয়ার্ড মিলছে না")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class LoginViewModel
    {
        [Required(ErrorMessage = "ইমেইল আবশ্যক")]
        [EmailAddress(ErrorMessage = "সঠিক ইমেইল দিন")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "পাসওয়ার্ড আবশ্যক")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;

        public bool RememberMe { get; set; }
    }

    public class EmailConfirmationViewModel
    {
        public string Email { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}