namespace ECommerce.API.Interfaces
{
    public interface IPromotionService
    {
        Task<List<PromotionDto>> GetAllPromotionsAsync();
        Task<List<PromotionDto>> GetActivePromotionsAsync();
        Task<PromotionDto> GetPromotionByIdAsync(int id);
        Task<PromotionDto> CreatePromotionAsync(CreateUpdatePromotionDto dto);
        Task<PromotionDto> UpdatePromotionAsync(int id, CreateUpdatePromotionDto dto);
        Task<bool> DeletePromotionAsync(int id);
        Task<List<PromotionProductDto>> GetPromotionProductsAsync(int promotionId);
        Task<PromotionDto> GetProductPromotionAsync(int productId);
        // Add to IPromotionService.cs
        // Add to IPromotionService.cs
        Task<PromotionDto> AddProductToPromotionAsync(int promotionId, int productId);
        Task<PromotionDto> RemoveProductFromPromotionAsync(int promotionId, int productId);
    }
}
