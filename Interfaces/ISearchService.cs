namespace ECommerce.API.Interfaces
{
    // Interfaces/ISearchService.cs
    public interface ISearchService
    {
        Task<PagedResult<ProductDto>> AdvancedSearchAsync(AdvancedSearchDto query);
        Task<List<string>> GetSearchSuggestionsAsync(string query);
        Task<SearchFiltersDto> GetAvailableFiltersAsync();
        Task<List<string>> GetPopularSearchesAsync();
    }
}
