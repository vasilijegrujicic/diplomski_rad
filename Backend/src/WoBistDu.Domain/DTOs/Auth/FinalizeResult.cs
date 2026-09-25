namespace WoBistDu.Domain.DTOs.Auth
{
    public enum FinalizeResult
    {
        Success,
        UnknownToken,
        Expired,
        AlreadyUsed,
        ChatAlreadyLinked,
        EmailTaken
    }
}
