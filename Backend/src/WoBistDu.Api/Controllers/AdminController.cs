using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoBistDu.Domain.DTOs.Admin;
using WoBistDu.Domain.Interfaces;

namespace WoBistDu.Api.Controllers
{
    // Responses are AdminUserResponse, never the User entity: the entity carries PasswordHash.
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public AdminController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userRepository.GetAllAsync();
            return Ok(users.Select(AdminUserResponse.From).ToList());
        }

        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound();
            return Ok(AdminUserResponse.From(user));
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] AdminUserUpdateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || request.Email.Length > 255 ||
                !new EmailAddressAttribute().IsValid(request.Email))
            {
                return BadRequest("A valid email address is required.");
            }

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound();

            user.Email = request.Email;
            user.TelegramChatId = string.IsNullOrWhiteSpace(request.TelegramChatId) ? null : request.TelegramChatId;

            try
            {
                await _userRepository.UpdateAsync(user);
            }
            catch (DbUpdateException)
            {
                // Email and TelegramChatId are unique; another user already has one of them.
                return Conflict("Another user already has this email or Telegram chat.");
            }

            return Ok(AdminUserResponse.From(user));
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            await _userRepository.DeleteAsync(id);
            return Ok("User deleted successfully");
        }
    }
}
