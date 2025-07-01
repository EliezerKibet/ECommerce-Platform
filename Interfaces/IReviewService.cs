using ECommerce.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.API.Interfaces
{
    public interface IReviewService
    {
        Task<List<ReviewDto>> GetProductReviewsAsync(int productId, int page = 1, int pageSize = 10);
        Task<ReviewDto> GetReviewByIdAsync(int id);
        Task<List<ReviewDto>> GetUserReviewsAsync(string userId);
        Task<ReviewDto> CreateReviewAsync(int productId, string userId, string userName, CreateReviewDto dto);
        Task<ReviewDto> UpdateReviewAsync(int id, string userId, UpdateReviewDto dto);
        Task<bool> DeleteReviewAsync(int id, string userId);
        Task<ProductRatingsSummaryDto> GetProductRatingsSummaryAsync(int productId);
        Task<bool> HasUserReviewedProductAsync(int productId, string userId);
        Task<bool> HasUserPurchasedProductAsync(int productId, string userId);

        Task<ReviewDto?> GetUserReviewForProductAsync(int productId, string userId);

        Task<List<AdminReviewDto>> GetAllReviewsForAdminAsync(int page = 1, int pageSize = 20);
        Task<List<AdminReviewDto>> GetPendingReviewsAsync(int page = 1, int pageSize = 20);
        Task<List<AdminReviewDto>> GetApprovedReviewsAsync(int page = 1, int pageSize = 20);

        Task<bool> ApproveReviewAsync(int reviewId, string adminId);
        Task<bool> RejectReviewAsync(int reviewId, string adminId);
        Task<bool> DeleteReviewByAdminAsync(int reviewId, string adminId);

        Task<AdminReviewDto> GetReviewForAdminAsync(int reviewId);
        Task<int> GetPendingReviewCountAsync();
        Task<int> GetTotalReviewCountAsync();

        Task<bool> ApproveReviewAsync(int id);
        Task<bool> RejectReviewAsync(int id);
        Task<List<ReviewDto>> GetAllReviewsAsync(int page, int pageSize);
        Task<bool> ToggleReviewApprovalAsync(int reviewId, string adminId);
    }
}
