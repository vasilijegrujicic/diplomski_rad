using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WoBistDu.Domain.Interfaces;

namespace WoBistDu.Api.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {

        
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> HandleWebhook()
        {
            using var reader = new StreamReader(Request.Body);
            var json = await reader.ReadToEndAsync();
            var signature = Request.Headers["Stripe-Signature"];

            await _paymentService.ProcessWebhookAsync(json, signature);

            return Ok();
        }
    }
}
