// Controllers/SearchController.cs
using ECommerce.API.Interfaces;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/search")]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;
    private readonly ILogger<SearchController> _logger;

    public SearchController(
        ISearchService searchService,
        ILogger<SearchController> logger)
    {
        _searchService = searchService;
        _logger = logger;
    }

    [HttpGet("advanced")]
    public async Task<ActionResult<PagedResult<ProductDto>>> AdvancedSearch([FromQuery] AdvancedSearchDto query)
    {
        try
        {
            var results = await _searchService.AdvancedSearchAsync(query);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in advanced search");
            return StatusCode(500, "An error occurred while searching");
        }
    }

    [HttpGet("suggest")]
    public async Task<ActionResult<List<string>>> GetSearchSuggestions([FromQuery] string query)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return new List<string>();
            }

            var suggestions = await _searchService.GetSearchSuggestionsAsync(query);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting search suggestions");
            return StatusCode(500, "An error occurred while getting search suggestions");
        }
    }

    [HttpGet("filters")]
    public async Task<ActionResult<SearchFiltersDto>> GetAvailableFilters()
    {
        try
        {
            var filters = await _searchService.GetAvailableFiltersAsync();
            return Ok(filters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting search filters");
            return StatusCode(500, "An error occurred while getting search filters");
        }
    }

    [HttpGet("popular")]
    public async Task<ActionResult<List<string>>> GetPopularSearches()
    {
        try
        {
            var popularSearches = await _searchService.GetPopularSearchesAsync();
            return Ok(popularSearches);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting popular searches");
            return StatusCode(500, "An error occurred while getting popular searches");
        }
    }
}