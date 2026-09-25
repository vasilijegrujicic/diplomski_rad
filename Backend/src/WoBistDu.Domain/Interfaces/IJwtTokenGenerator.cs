using WoBistDu.Domain.Entities;

namespace WoBistDu.Domain.Interfaces
{
    public interface IJwtTokenGenerator
    {
        string GenerateToken(User user);
    }
}
