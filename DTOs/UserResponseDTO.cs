public class UserResponseDTO
{
    public int Id { get; set; }
    public string UserName { get; set; }
    public string Role { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastLogin { get; set; }
}