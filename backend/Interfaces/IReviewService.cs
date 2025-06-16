// Fixed IReviewService interface - removing duplicate method signatures
// Interfaces/IReviewService.cs
using ECommerce.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.API.Interfaces
{
    public interface IReviewService
    {
        // Customer-facing methods (only return approved reviews)
        Task<List<ReviewDto>> GetProductReviewsAsync(int productId, int page = 1, int pageSize = 10);
        Task<ReviewDto> GetReviewByIdAsync(int id);
        Task<List<ReviewDto>> GetUserReviewsAsync(string userId);
        Task<ReviewDto> CreateReviewAsync(int productId, string userId, string userName, CreateReviewDto dto);
        Task<ReviewDto> UpdateReviewAsync(int id, string userId, UpdateReviewDto dto);
        Task<bool> DeleteReviewAsync(int id, string userId);
        Task<ProductRatingsSummaryDto> GetProductRatingsSummaryAsync(int productId);
        Task<bool> HasUserReviewedProductAsync(int productId, string userId);
        Task<bool> HasUserPurchasedProductAsync(int productId, string userId);

        // ADD THIS NEW METHOD 👇
        Task<ReviewDto?> GetUserReviewForProductAsync(int productId, string userId);

        // Admin methods - return AdminReviewDto for better admin experience
        Task<List<AdminReviewDto>> GetAllReviewsForAdminAsync(int page = 1, int pageSize = 20);
        Task<List<AdminReviewDto>> GetPendingReviewsAsync(int page = 1, int pageSize = 20);
        Task<List<AdminReviewDto>> GetApprovedReviewsAsync(int page = 1, int pageSize = 20);

        // Enhanced admin approval methods that track who performed the action
        Task<bool> ApproveReviewAsync(int reviewId, string adminId);
        Task<bool> RejectReviewAsync(int reviewId, string adminId);
        Task<bool> DeleteReviewByAdminAsync(int reviewId, string adminId);

        // Additional helpful admin methods
        Task<AdminReviewDto> GetReviewForAdminAsync(int reviewId);
        Task<int> GetPendingReviewCountAsync();
        Task<int> GetTotalReviewCountAsync();

        // Backward compatibility methods (to support existing controller code)
        Task<bool> ApproveReviewAsync(int id);
        Task<bool> RejectReviewAsync(int id);
        Task<List<ReviewDto>> GetAllReviewsAsync(int page, int pageSize);
        Task<bool> ToggleReviewApprovalAsync(int reviewId, string adminId);
    }
}
