namespace ECommerce.API.Interfaces
{
    // Interfaces/IAnalyticsService.cs
    public interface IAnalyticsService
    {
        Task<object> GetSalesSummaryAsync(DateTime? startDate = null, DateTime? endDate = null);
        Task<object> GetSalesByProductAsync(DateTime? startDate = null, DateTime? endDate = null);
        Task<object> GetSalesByCategoryAsync(DateTime? startDate = null, DateTime? endDate = null);
        Task<object> GetPromotionPerformanceAsync(int? promotionId = null);
        Task<object> GetPromotionImpactOnSalesAsync(int promotionId);
        Task<object> GetCustomerAcquisitionAsync(DateTime? startDate = null, DateTime? endDate = null);
        Task<object> GetCustomerRetentionAsync();
        Task<object> GetTopCustomersAsync(int count = 10);
        Task<object> GetTopSellingProductsAsync(int count = 10);
        Task<object> GetProductViewsToSalesRatioAsync();
        Task<object> GetInventoryStatusAsync();
        Task<object> GetLowStockProductsAsync(int threshold = 10);
        Task<object> GetDashboardDataAsync();

        // New method for all-time sales
        Task<object> GetAllTimeSalesAsync();
        Task<object> GetAllSalesOrdersAsync(int page = 1, int pageSize = 50);
    }
}