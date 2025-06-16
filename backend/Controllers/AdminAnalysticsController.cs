using ECommerce.API.Data;
using ECommerce.API.Interfaces;
using ECommerce.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using ECommerce.API.Models;
using ECommerce.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ECommerce.API.Controllers
{
    [Route("api/admin")]
    [ApiController]
    public class AdminAnalysticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IProductService _productService;
        private readonly ICategoryService _categoryService;
        private readonly ICouponService _couponService;
        private readonly ILogger<AdminAnalysticsController> _logger;
        private readonly IPromotionService _promotionService;
        private readonly IAnalyticsService _analyticsService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IReviewService _reviewService;

        public AdminAnalysticsController(
            ApplicationDbContext context,
            IProductService productService,
            ICategoryService categoryService,
            ICouponService couponService,
            IPromotionService promotionService,
            IAnalyticsService analyticsService,
            UserManager<ApplicationUser> userManager,
            IReviewService reviewService,
            ILogger<AdminAnalysticsController> logger)
        {
            _context = context;
            _productService = productService;
            _categoryService = categoryService;
            _couponService = couponService;
            _promotionService = promotionService;
            _analyticsService = analyticsService;
            _userManager = userManager;
            _reviewService = reviewService;
            _logger = logger;
        }

        // New method to get total customers count
        [HttpGet("analytics/customers/total")]
        public async Task<ActionResult<object>> GetTotalCustomers()
        {
            try
            {
                // Method 1: Using UserManager (Recommended)
                var allUsers = await _userManager.Users.ToListAsync();
                var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
                var customerCount = allUsers.Count - adminUsers.Count;

                var result = new
                {
                    TotalCustomers = customerCount,
                    TotalUsers = allUsers.Count,
                    AdminUsers = adminUsers.Count,
                    LastUpdated = DateTime.UtcNow
                };

                _logger.LogInformation("Total customers count: {CustomerCount}", customerCount);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving total customers count");
                return StatusCode(500, "An error occurred while retrieving total customers count");
            }
        }

        [HttpGet("analytics/sales/summary")]
        public async Task<ActionResult<object>> GetSalesSummary(
         [FromQuery] DateTime? startDate = null,
         [FromQuery] DateTime? endDate = null)
            {
            try
            {
                // Get the original sales summary from analytics service
                var salesSummaryResult = await _analyticsService.GetSalesSummaryAsync(startDate, endDate);

                // Convert to dynamic to access nested properties
                dynamic salesSummary = salesSummaryResult;

                // COUNT ALL USERS EXCEPT ADMINS
                var allUsers = await _userManager.Users.ToListAsync();
                var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
                var customerCount = allUsers.Count - adminUsers.Count;

                // Method 2: Direct database query (Alternative)
                var totalUsersCount = await _context.Users.CountAsync();
                var adminUserIds = await (from ur in _context.UserRoles
                                          join r in _context.Roles on ur.RoleId equals r.Id
                                          where r.Name == "Admin"
                                          select ur.UserId)
                                        .Distinct()
                                        .ToListAsync();
                var customerCountDirect = totalUsersCount - adminUserIds.Count;

                // Use the UserManager method as primary
                var finalCustomerCount = customerCount;

                // Extract values from the nested Summary object
                decimal totalRevenue = 0;
                int totalOrders = 0;
                decimal averageOrderValue = 0;
                DateTime periodStart = startDate ?? DateTime.UtcNow.AddDays(-30);
                DateTime periodEnd = endDate ?? DateTime.UtcNow;

                // The salesSummary has a nested structure: { Summary: { TotalRevenue, TotalOrders, etc. } }
                if (salesSummary?.Summary != null)
                {
                    totalRevenue = salesSummary.Summary.TotalRevenue ?? 0;
                    totalOrders = salesSummary.Summary.TotalOrders ?? 0;
                    averageOrderValue = salesSummary.Summary.AverageOrderValue ?? 0;

                    // Handle DateTime parsing
                    if (salesSummary.Summary.StartDate != null)
                        periodStart = salesSummary.Summary.StartDate;
                    if (salesSummary.Summary.EndDate != null)
                        periodEnd = salesSummary.Summary.EndDate;
                }

                // Create response with actual customer count
                var result = new
                {
                    TotalRevenue = totalRevenue,
                    TotalOrders = totalOrders,
                    TotalCustomers = finalCustomerCount, // This is ALL users EXCEPT admins
                    AverageOrderValue = averageOrderValue,
                    PeriodStart = periodStart.ToString("yyyy-MM-dd"),
                    PeriodEnd = periodEnd.ToString("yyyy-MM-dd"),
                    // Include the daily data from the original response
                    DailyData = salesSummary?.DailyData,
                    // Debug information
                    CustomerBreakdown = new
                    {
                        TotalUsers = allUsers.Count,
                        AdminUsers = adminUsers.Count,
                        CustomerUsers = finalCustomerCount,
                        Method1Count = customerCount,
                        Method2Count = customerCountDirect,
                        AdminUsernames = adminUsers.Select(u => u.UserName).ToArray()
                    }
                };

                _logger.LogInformation("Sales summary - Total Customers (non-admin): {CustomerCount}", finalCustomerCount);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sales summary with customer count");
                return StatusCode(500, "An error occurred while retrieving sales summary");
            }
        }

        // Additional endpoint to explicitly get customer count
        [HttpGet("analytics/customers/count")]
        public async Task<ActionResult<object>> GetCustomerCount()
        {
            try
            {
                // Get all users
                var allUsers = await _userManager.Users.ToListAsync();

                // Get admin users
                var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");

                // Calculate customers (all users except admins)
                var customerCount = allUsers.Count - adminUsers.Count;

                // Get additional role information for completeness
                var roles = await _context.Roles.ToListAsync();
                var roleBreakdown = new Dictionary<string, object>();

                foreach (var role in roles)
                {
                    var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name);
                    roleBreakdown[role.Name] = new
                    {
                        Count = usersInRole.Count,
                        Users = usersInRole.Select(u => new { u.Id, u.UserName, u.Email }).ToList()
                    };
                }

                var result = new
                {
                    // Main customer count (all users except admins)
                    TotalCustomers = customerCount,

                    // Detailed breakdown
                    UserBreakdown = new
                    {
                        TotalUsers = allUsers.Count,
                        AdminUsers = adminUsers.Count,
                        CustomerUsers = customerCount
                    },

                    // Role-based breakdown
                    RoleBreakdown = roleBreakdown,

                    // Sample data for verification
                    SampleCustomers = allUsers
                        .Where(u => !adminUsers.Any(admin => admin.Id == u.Id))
                        .Select(u => new { u.Id, u.UserName, u.Email })
                        .Take(10)
                        .ToList(),

                    LastUpdated = DateTime.UtcNow
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer count");
                return StatusCode(500, "An error occurred while getting customer count");
            }
        }

        // Enhanced debug method to show customer information
        [HttpGet("debug/counts")]
        public async Task<ActionResult<object>> GetDebugCounts()
        {
            try
            {
                // Original counts
                var productCount = await _context.Products.CountAsync();
                var categoryCount = await _context.Categories.CountAsync();
                var orderCount = await _context.Orders.CountAsync();
                var userCount = await _context.Users.CountAsync();

                // Customer-specific counts
                var allUsers = await _userManager.Users.ToListAsync();
                var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
                var customerCount = allUsers.Count - adminUsers.Count;

                // Additional role information
                var roles = await _context.Roles.ToListAsync();
                var roleUserCounts = new Dictionary<string, int>();

                foreach (var role in roles)
                {
                    var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name);
                    roleUserCounts[role.Name] = usersInRole.Count;
                }

                var counts = new
                {
                    ProductCount = productCount,
                    CategoryCount = categoryCount,
                    OrderCount = orderCount,
                    UserCount = userCount,
                    CustomerCount = customerCount,
                    AdminCount = adminUsers.Count,
                    RoleBreakdown = roleUserCounts,
                    UserDetails = new
                    {
                        TotalUsers = allUsers.Count,
                        AdminUsers = adminUsers.Select(u => new { u.Id, u.UserName, u.Email }).ToList(),
                        SampleCustomers = allUsers
                            .Where(u => !adminUsers.Any(admin => admin.Id == u.Id))
                            .Select(u => new { u.Id, u.UserName, u.Email })
                            .Take(5)
                            .ToList()
                    }
                };

                _logger.LogInformation("Debug counts with customer breakdown: {@Counts}", new
                {
                    ProductCount = productCount,
                    CategoryCount = categoryCount,
                    OrderCount = orderCount,
                    UserCount = userCount,
                    CustomerCount = customerCount,
                    AdminCount = adminUsers.Count
                });

                return Ok(counts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving debug counts with customer breakdown");
                return StatusCode(500, "An error occurred while retrieving debug counts");
            }
        }

        // Quick customer verification method
        [HttpGet("analytics/customers/verify")]
        public async Task<ActionResult<object>> VerifyCustomerCount()
        {
            try
            {
                // Multiple ways to verify customer count
                var allUsers = await _userManager.Users.ToListAsync();
                var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");

                // Method 1: UserManager approach
                var method1Count = allUsers.Count - adminUsers.Count;

                // Method 2: Direct role query
                var adminUserIds = await (from ur in _context.UserRoles
                                          join r in _context.Roles on ur.RoleId equals r.Id
                                          where r.Name == "Admin"
                                          select ur.UserId)
                                        .Distinct()
                                        .ToListAsync();

                var method2Count = await _context.Users
                    .Where(u => !adminUserIds.Contains(u.Id))
                    .CountAsync();

                // Method 3: Using Users table directly (if no other roles exist)
                var totalUsers = await _context.Users.CountAsync();
                var adminCount = adminUsers.Count;
                var method3Count = totalUsers - adminCount;

                var verification = new
                {
                    Method1_UserManager = method1Count,
                    Method2_DirectQuery = method2Count,
                    Method3_Subtraction = method3Count,
                    AllMethodsMatch = method1Count == method2Count && method2Count == method3Count,
                    Details = new
                    {
                        TotalUsers = allUsers.Count,
                        AdminUsers = adminUsers.Count,
                        AdminUserNames = adminUsers.Select(u => u.UserName).ToList()
                    },
                    RecommendedCount = method1Count // Use UserManager approach as recommended
                };

                return Ok(verification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying customer count");
                return StatusCode(500, "An error occurred while verifying customer count");
            }
        }

        // Rest of your existing methods remain unchanged...

        [HttpGet("search/popular-terms")]
        public async Task<ActionResult<object>> GetPopularSearchTerms()
        {
            try
            {
                var lastMonth = DateTime.UtcNow.AddMonths(-1);

                var popularTerms = await _context.SearchQueries
                    .Where(sq => sq.CreatedAt >= lastMonth)
                    .GroupBy(sq => sq.Query)
                    .Select(g => new
                    {
                        Term = g.Key,
                        Count = g.Count(),
                        AverageResults = g.Average(sq => sq.ResultCount)
                    })
                    .OrderByDescending(x => x.Count)
                    .Take(20)
                    .ToListAsync();

                return Ok(popularTerms);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving popular search terms");
                return StatusCode(500, "An error occurred while retrieving popular search terms");
            }
        }

        [HttpGet("search/zero-results")]
        public async Task<ActionResult<object>> GetZeroResultSearches()
        {
            try
            {
                var lastMonth = DateTime.UtcNow.AddMonths(-1);

                var zeroResultSearches = await _context.SearchQueries
                    .Where(sq => sq.CreatedAt >= lastMonth && sq.ResultCount == 0)
                    .GroupBy(sq => sq.Query)
                    .Select(g => new
                    {
                        Term = g.Key,
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.Count)
                    .Take(20)
                    .ToListAsync();

                return Ok(zeroResultSearches);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving zero result searches");
                return StatusCode(500, "An error occurred while retrieving zero result searches");
            }
        }

        #region Analytics - Existing methods

        // Dashboard Analytics
        [HttpGet("analytics/dashboard")]
        public async Task<ActionResult<object>> GetDashboardData()
        {
            try
            {
                var dashboardData = await _analyticsService.GetDashboardDataAsync();
                return Ok(dashboardData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dashboard data");
                return StatusCode(500, "An error occurred while retrieving dashboard data");
            }
        }

        [HttpGet("analytics/sales/by-product")]
        public async Task<ActionResult<object>> GetSalesByProduct(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var result = await _analyticsService.GetSalesByProductAsync(startDate, endDate);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sales by product");
                return StatusCode(500, "An error occurred while retrieving sales by product");
            }
        }

        [HttpGet("analytics/sales/by-category")]
        public async Task<ActionResult<object>> GetSalesByCategory(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var result = await _analyticsService.GetSalesByCategoryAsync(startDate, endDate);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sales by category");
                return StatusCode(500, "An error occurred while retrieving sales by category");
            }
        }

        // Continue with all your existing analytics methods...
        // [Rest of the methods remain exactly the same]

        #endregion

        // Helper method for dashboard
        private async Task<object> GetActivePromotionsForDashboard()
        {
            var activePromotions = await _promotionService.GetActivePromotionsAsync();

            return new
            {
                Count = activePromotions.Count,
                Promotions = activePromotions.Select(p => new
                {
                    Id = p.Id,
                    Name = p.Name,
                    DiscountPercentage = p.DiscountPercentage,
                    EndDate = p.EndDate,
                    TimeRemaining = p.TimeRemaining,
                    ProductCount = p.Products?.Count ?? 0
                }).ToList()
            };
        }

        // Add these methods to your AdminAnalyticsController class

        // Get all-time sales summary
        [HttpGet("analytics/sales/all-time")]
        public async Task<ActionResult<object>> GetAllTimeSales()
        {
            try
            {
                var allTimeSales = await _analyticsService.GetAllTimeSalesAsync();

                // Add customer count to the response
                var allUsers = await _userManager.Users.ToListAsync();
                var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
                var customerCount = allUsers.Count - adminUsers.Count;

                // Create enhanced response
                var result = new
                {
                    AllTimeSales = allTimeSales,
                    TotalCustomers = customerCount,
                    GeneratedAt = DateTime.UtcNow
                };

                _logger.LogInformation("All-time sales data retrieved successfully");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all-time sales data");
                return StatusCode(500, "An error occurred while retrieving all-time sales data");
            }
        }

        // Get all sales orders with pagination
        [HttpGet("analytics/sales/orders")]
        public async Task<ActionResult<object>> GetAllSalesOrders(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var salesOrders = await _analyticsService.GetAllSalesOrdersAsync(page, pageSize);

                _logger.LogInformation("Sales orders retrieved - Page: {Page}, PageSize: {PageSize}", page, pageSize);
                return Ok(salesOrders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sales orders");
                return StatusCode(500, "An error occurred while retrieving sales orders");
            }
        }

        // Get sales summary with flexible date ranges
        [HttpGet("analytics/sales/flexible")]
        public async Task<ActionResult<object>> GetFlexibleSalesSummary(
            [FromQuery] string period = "last30days")
        {
            try
            {
                DateTime? startDate = null;
                DateTime? endDate = null;
                var now = DateTime.UtcNow;

                // Parse the period parameter
                switch (period.ToLower())
                {
                    case "alltime":
                        // No date restrictions
                        break;
                    case "today":
                        startDate = now.Date;
                        endDate = now.Date.AddDays(1).AddTicks(-1);
                        break;
                    case "yesterday":
                        startDate = now.Date.AddDays(-1);
                        endDate = now.Date.AddTicks(-1);
                        break;
                    case "last7days":
                        startDate = now.AddDays(-7);
                        endDate = now;
                        break;
                    case "last30days":
                        startDate = now.AddDays(-30);
                        endDate = now;
                        break;
                    case "last90days":
                        startDate = now.AddDays(-90);
                        endDate = now;
                        break;
                    case "thismonth":
                        startDate = new DateTime(now.Year, now.Month, 1);
                        endDate = now;
                        break;
                    case "lastmonth":
                        var lastMonth = now.AddMonths(-1);
                        startDate = new DateTime(lastMonth.Year, lastMonth.Month, 1);
                        endDate = startDate.Value.AddMonths(1).AddTicks(-1);
                        break;
                    case "thisyear":
                        startDate = new DateTime(now.Year, 1, 1);
                        endDate = now;
                        break;
                    case "lastyear":
                        startDate = new DateTime(now.Year - 1, 1, 1);
                        endDate = new DateTime(now.Year - 1, 12, 31, 23, 59, 59);
                        break;
                    default:
                        // Default to last 30 days
                        startDate = now.AddDays(-30);
                        endDate = now;
                        break;
                }

                // Use all-time method if no date restrictions
                if (period.ToLower() == "alltime")
                {
                    return await GetAllTimeSales();
                }
                else
                {
                    return await GetSalesSummary(startDate, endDate);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving flexible sales summary for period: {Period}", period);
                return StatusCode(500, "An error occurred while retrieving sales summary");
            }
        }


        // Updated AdminAnalyticsController Review Methods to match frontend format
        // Replace your existing review methods in AdminAnalyticsController with these:

        #region Review Management - Admin Only

        // Get all reviews (admin view) - Updated method call
        [HttpGet("analytics/sales/reviews")]
        public async Task<ActionResult<List<AdminReviewDto>>> GetAllReviews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                // Use the admin-specific method that returns AdminReviewDto
                var reviews = await _reviewService.GetAllReviewsForAdminAsync(page, pageSize);
                _logger.LogInformation("Retrieved {Count} reviews for admin", reviews.Count);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all reviews for admin");
                return StatusCode(500, "An error occurred while retrieving reviews");
            }
        }

        // Get pending reviews (admin view)
        [HttpGet("analytics/sales/reviews/pending")]
        public async Task<ActionResult<List<AdminReviewDto>>> GetPendingReviews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var reviews = await _reviewService.GetPendingReviewsAsync(page, pageSize);
                _logger.LogInformation("Retrieved {Count} pending reviews for admin", reviews.Count);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending reviews for admin");
                return StatusCode(500, "An error occurred while retrieving pending reviews");
            }
        }

        // Get approved reviews (admin view)
        [HttpGet("analytics/sales/reviews/approved")]
        public async Task<ActionResult<List<AdminReviewDto>>> GetApprovedReviews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var reviews = await _reviewService.GetApprovedReviewsAsync(page, pageSize);
                _logger.LogInformation("Retrieved {Count} approved reviews for admin", reviews.Count);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving approved reviews for admin");
                return StatusCode(500, "An error occurred while retrieving approved reviews");
            }
        }

        // Approve a review - Fixed logging
        [HttpPost("analytics/sales/reviews/{reviewId}/approve")]
        public async Task<ActionResult> ApproveReview(int reviewId)
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var adminName = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown Admin";

                var result = await _reviewService.ApproveReviewAsync(reviewId, adminId);

                if (!result)
                {
                    _logger.LogWarning("Attempted to approve non-existent review {ReviewId} by admin {AdminId}", reviewId, adminId);
                    return NotFound($"Review with ID {reviewId} not found");
                }

                _logger.LogInformation("Review {ReviewId} approved by admin {AdminName} ({AdminId})", reviewId, adminName, adminId);
                return Ok(new
                {
                    Message = "Review approved successfully",
                    ReviewId = reviewId,
                    ApprovedBy = adminName,
                    ApprovedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving review {ReviewId}", reviewId);
                return StatusCode(500, "An error occurred while approving the review");
            }
        }

        // Reject a review - Fixed logging
        [HttpPost("analytics/sales/reviews/{reviewId}/reject")]
        public async Task<ActionResult> RejectReview(int reviewId)
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var adminName = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown Admin";

                var result = await _reviewService.RejectReviewAsync(reviewId, adminId);

                if (!result)
                {
                    _logger.LogWarning("Attempted to reject non-existent review {ReviewId} by admin {AdminId}", reviewId, adminId);
                    return NotFound($"Review with ID {reviewId} not found");
                }

                _logger.LogInformation("Review {ReviewId} rejected by admin {AdminName} ({AdminId})", reviewId, adminName, adminId);
                return Ok(new
                {
                    Message = "Review rejected successfully",
                    ReviewId = reviewId,
                    RejectedBy = adminName,
                    RejectedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting review {ReviewId}", reviewId);
                return StatusCode(500, "An error occurred while rejecting the review");
            }
        }

        // Delete a review permanently (admin only) - Fixed logging
        [HttpDelete("analytics/sales/reviews/{reviewId}")]
        public async Task<ActionResult> DeleteReviewByAdmin(int reviewId)
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var adminName = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown Admin";

                var result = await _reviewService.DeleteReviewByAdminAsync(reviewId, adminId);

                if (!result)
                {
                    _logger.LogWarning("Attempted to delete non-existent review {ReviewId} by admin {AdminId}", reviewId, adminId);
                    return NotFound($"Review with ID {reviewId} not found");
                }

                _logger.LogInformation("Review {ReviewId} permanently deleted by admin {AdminName} ({AdminId})", reviewId, adminName, adminId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review {ReviewId}", reviewId);
                return StatusCode(500, "An error occurred while deleting the review");
            }
        }

        // Get review statistics for admin dashboard
        [HttpGet("analytics/sales/reviews/stats")]
        public async Task<ActionResult<object>> GetReviewStatistics()
        {
            try
            {
                var totalReviews = await _reviewService.GetTotalReviewCountAsync();
                var pendingReviews = await _reviewService.GetPendingReviewCountAsync();
                var approvedReviews = totalReviews - pendingReviews;

                var stats = new
                {
                    TotalReviews = totalReviews,
                    PendingReviews = pendingReviews,
                    ApprovedReviews = approvedReviews,
                    ApprovalRate = totalReviews > 0 ? Math.Round((double)approvedReviews / totalReviews * 100, 2) : 0,
                    GeneratedAt = DateTime.UtcNow
                };

                _logger.LogInformation("Review statistics generated: Total={TotalReviews}, Pending={PendingReviews}, Approved={ApprovedReviews}",
                    totalReviews, pendingReviews, approvedReviews);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating review statistics");
                return StatusCode(500, "An error occurred while generating review statistics");
            }
        }

        // Get a specific review with admin details
        [HttpGet("analytics/sales/reviews/{reviewId}")]
        public async Task<ActionResult<AdminReviewDto>> GetReviewForAdmin(int reviewId)
        {
            try
            {
                var review = await _reviewService.GetReviewForAdminAsync(reviewId);
                _logger.LogInformation("Review {ReviewId} retrieved for admin", reviewId);
                return Ok(review);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning("Review {ReviewId} not found", reviewId);
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving review {ReviewId} for admin", reviewId);
                return StatusCode(500, "An error occurred while retrieving the review");
            }
        }

        // Bulk approve reviews
        [HttpPost("analytics/sales/reviews/bulk-approve")]
        public async Task<ActionResult> BulkApproveReviews([FromBody] int[] reviewIds)
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var adminName = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown Admin";

                var successCount = 0;
                var failedIds = new List<int>();

                foreach (var reviewId in reviewIds)
                {
                    var result = await _reviewService.ApproveReviewAsync(reviewId, adminId);
                    if (result)
                        successCount++;
                    else
                        failedIds.Add(reviewId);
                }

                _logger.LogInformation("Bulk approve operation by {AdminName}: {SuccessCount} approved, {FailedCount} failed",
                    adminName, successCount, failedIds.Count);

                return Ok(new
                {
                    Message = $"Bulk approve completed: {successCount} approved, {failedIds.Count} failed",
                    SuccessCount = successCount,
                    FailedCount = failedIds.Count,
                    FailedIds = failedIds,
                    ApprovedBy = adminName,
                    ApprovedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk approve operation");
                return StatusCode(500, "An error occurred during bulk approve operation");
            }
        }

        // Bulk reject reviews
        [HttpPost("analytics/sales/reviews/bulk-reject")]
        public async Task<ActionResult> BulkRejectReviews([FromBody] int[] reviewIds)
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var adminName = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown Admin";

                var successCount = 0;
                var failedIds = new List<int>();

                foreach (var reviewId in reviewIds)
                {
                    var result = await _reviewService.RejectReviewAsync(reviewId, adminId);
                    if (result)
                        successCount++;
                    else
                        failedIds.Add(reviewId);
                }

                _logger.LogInformation("Bulk reject operation by {AdminName}: {SuccessCount} rejected, {FailedCount} failed",
                    adminName, successCount, failedIds.Count);

                return Ok(new
                {
                    Message = $"Bulk reject completed: {successCount} rejected, {failedIds.Count} failed",
                    SuccessCount = successCount,
                    FailedCount = failedIds.Count,
                    FailedIds = failedIds,
                    RejectedBy = adminName,
                    RejectedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk reject operation");
                return StatusCode(500, "An error occurred during bulk reject operation");
            }
        }

        // Add this new endpoint to your AdminAnalyticsController in the Reviews Management region
        // Add this method to your AdminAnalyticsController in the Reviews Management region
        [HttpPatch("analytics/sales/reviews/{reviewId}/toggle-approval")]
        public async Task<ActionResult> ToggleReviewApproval(int reviewId)
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var adminName = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown Admin";

                // Get the current review to check its status
                var review = await _reviewService.GetReviewForAdminAsync(reviewId);

                if (review == null)
                {
                    _logger.LogWarning("Attempted to toggle approval for non-existent review {ReviewId} by admin {AdminId}", reviewId, adminId);
                    return NotFound($"Review with ID {reviewId} not found");
                }

                bool currentStatus = review.IsApproved;

                // Use the toggle method
                bool result = await _reviewService.ToggleReviewApprovalAsync(reviewId, adminId);

                if (!result)
                {
                    return StatusCode(500, "Failed to toggle review approval status");
                }

                _logger.LogInformation("Review {ReviewId} approval toggled from {OldStatus} to {NewStatus} by admin {AdminName} ({AdminId})",
                    reviewId,
                    currentStatus ? "Approved" : "Pending",
                    !currentStatus ? "Approved" : "Pending",
                    adminName,
                    adminId);

                // Get the updated review to return the new status
                var updatedReview = await _reviewService.GetReviewForAdminAsync(reviewId);

                return Ok(new
                {
                    ReviewId = reviewId,
                    IsApproved = updatedReview.IsApproved,
                    ApprovalStatus = updatedReview.IsApproved ? "Approved" : "Pending",
                    UpdatedBy = adminName,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning("Review {ReviewId} not found when trying to toggle approval", reviewId);
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling approval for review {ReviewId}", reviewId);
                return StatusCode(500, "An error occurred while toggling review approval status");
            }
        }
        #endregion



    }
}