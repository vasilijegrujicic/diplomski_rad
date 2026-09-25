using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WoBistDu.Domain.DTOs.Auth;
using WoBistDu.Domain.Interfaces;

namespace WoBistDu.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var token = await _authService.RegisterPendingAsync(request);
            if (token == null) return BadRequest("User already exists");
            return Ok(new { token });
        }

        [HttpGet("check-status")]
        public async Task<IActionResult> CheckStatus([FromQuery] string token)
        {
            var status = await _authService.CheckRegistrationStatusAsync(token);
            return Ok(status);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var response = await _authService.LoginAsync(request);
            if (response == null) return Unauthorized("Invalid credentials");
            return Ok(response);
        }
    }
}
