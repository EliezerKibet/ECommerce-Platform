// Services/SearchService.cs
using AutoMapper;
using ECommerce.API.Data;
using ECommerce.API.Interfaces;
using ECommerce.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

public class SearchService : ISearchService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SearchService> _logger;
    private readonly IMapper _mapper;

    public SearchService(
        ApplicationDbContext context,
        ILogger<SearchService> logger,
        IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<PagedResult<ProductDto>> AdvancedSearchAsync(AdvancedSearchDto query)
    {
        try
        {
            // Start with base query
            IQueryable<Product> productsQuery = _context.Products
                .Include(p => p.Category);

            // Apply text search if provided
            if (!string.IsNullOrWhiteSpace(query.Query))
            {
                string searchTerm = query.Query.ToLower().Trim();
                productsQuery = productsQuery.Where(p =>
                    p.Name.ToLower().Contains(searchTerm) ||
                    p.Description.ToLower().Contains(searchTerm) ||
                    p.FlavorNotes.ToLower().Contains(searchTerm) ||
                    p.Origin.ToLower().Contains(searchTerm) ||
                    p.Category.Name.ToLower().Contains(searchTerm)
                );
            }

            // Apply category filter
            if (query.CategoryIds != null && query.CategoryIds.Any())
            {
                productsQuery = productsQuery.Where(p => query.CategoryIds.Contains(p.CategoryId));
            }

            // Apply price range filter
            if (query.MinPrice.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.Price >= query.MinPrice.Value);
            }

            if (query.MaxPrice.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.Price <= query.MaxPrice.Value);
            }

            // Apply origin filter
            if (query.Origins != null && query.Origins.Any())
            {
                productsQuery = productsQuery.Where(p => query.Origins.Contains(p.Origin));
            }

            // Apply flavor profiles filter
            if (query.FlavorProfiles != null && query.FlavorProfiles.Any())
            {
                // Since FlavorNotes is a comma-separated string, we need to check if any of the requested profiles is in there
                productsQuery = productsQuery.Where(p =>
                    query.FlavorProfiles.Any(flavor => p.FlavorNotes.Contains(flavor))
                );
            }

            // Apply organic filter
            if (query.IsOrganic.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.IsOrganic == query.IsOrganic.Value);
            }

            // Apply fair trade filter
            if (query.IsFairTrade.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.IsFairTrade == query.IsFairTrade.Value);
            }

            // Apply cocoa percentage filter
            if (query.MinCocoaPercentage.HasValue)
            {
                // Extract the percentage as a number from the string (e.g., "72%" -> 72)
                // To:
                productsQuery = productsQuery.Where(p =>
                    p.CocoaPercentage.Replace("%", "") != null &&
                    int.Parse(string.IsNullOrEmpty(p.CocoaPercentage) ? "0" : p.CocoaPercentage.Replace("%", "")) >= query.MinCocoaPercentage.Value
                );
            }

            if (query.MaxCocoaPercentage.HasValue)
            {
                // To:
                productsQuery = productsQuery.Where(p =>
                    p.CocoaPercentage.Replace("%", "") != null &&
                    int.Parse(string.IsNullOrEmpty(p.CocoaPercentage) ? "0" : p.CocoaPercentage.Replace("%", "")) >= query.MinCocoaPercentage.Value
                );
            }

            // Apply allergen exclusion
            if (query.Allergens != null && query.Allergens.Any())
            {
                foreach (var allergen in query.Allergens)
                {
                    // Exclude products that contain the allergen
                    productsQuery = productsQuery.Where(p => !p.AllergenInfo.Contains(allergen));
                }
            }

            // Calculate total before applying pagination
            var totalItems = await productsQuery.CountAsync();

            // Apply sorting
            productsQuery = ApplySorting(productsQuery, query.SortBy, query.SortDescending);

            // Apply pagination
            var pageSize = query.PageSize;
            var pageNumber = query.Page;
            var skip = (pageNumber - 1) * pageSize;

            var products = await productsQuery
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            // Map products to DTOs
            var productDtos = _mapper.Map<List<ProductDto>>(products);

            // Create paged result
            var result = new PagedResult<ProductDto>
            {
                Items = productDtos,
                TotalItems = totalItems,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            };

            // Track search query for analytics (optional)
            await TrackSearchQuery(query, result.TotalItems); // Add the second parameter
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in AdvancedSearchAsync with query: {Query}", query.Query);
            throw;
        }
    }

    public async Task<List<string>> GetSearchSuggestionsAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
        {
            return new List<string>();
        }

        query = query.ToLower().Trim();

        // Get product names that match the query
        var productSuggestions = await _context.Products
            .Where(p => p.Name.ToLower().Contains(query))
            .Select(p => p.Name)
            .Distinct()
            .Take(5)
            .ToListAsync();

        // Get category names that match the query
        var categorySuggestions = await _context.Categories
            .Where(c => c.Name.ToLower().Contains(query))
            .Select(c => c.Name)
            .Distinct()
            .Take(3)
            .ToListAsync();

        // Get origin suggestions
        var originSuggestions = await _context.Products
            .Where(p => p.Origin.ToLower().Contains(query))
            .Select(p => p.Origin)
            .Distinct()
            .Take(3)
            .ToListAsync();

        // Combine all suggestions
        var allSuggestions = new List<string>();
        allSuggestions.AddRange(productSuggestions);
        allSuggestions.AddRange(categorySuggestions);
        allSuggestions.AddRange(originSuggestions);

        // Remove duplicates and take top 10
        return allSuggestions
            .Distinct()
            .Take(10)
            .ToList();
    }

    public async Task<SearchFiltersDto> GetAvailableFiltersAsync()
    {
        // Get all categories with product counts
        var categories = await _context.Categories
            .Select(c => new CategoryFilterDto
            {
                Id = c.Id,
                Name = c.Name,
                ProductCount = c.Products.Count
            })
            .ToListAsync();

        // Get price range
        var priceRange = await _context.Products
            .Select(p => new
            {
                MinPrice = _context.Products.Min(p => p.Price),
                MaxPrice = _context.Products.Max(p => p.Price)
            })
            .FirstOrDefaultAsync();

        // Get all origins
        var origins = await _context.Products
            .Select(p => p.Origin)
            .Distinct()
            .Where(o => !string.IsNullOrEmpty(o))
            .ToListAsync();

        // Extract flavor profiles
        var allFlavorNotes = await _context.Products
            .Select(p => p.FlavorNotes)
            .Where(fn => !string.IsNullOrEmpty(fn))
            .ToListAsync();

        var flavorProfiles = new HashSet<string>();
        foreach (var notes in allFlavorNotes)
        {
            var flavors = notes.Split(',').Select(f => f.Trim()).Where(f => !string.IsNullOrEmpty(f));
            foreach (var flavor in flavors)
            {
                flavorProfiles.Add(flavor);
            }
        }

        // Extract allergens
        var allAllergenInfo = await _context.Products
            .Select(p => p.AllergenInfo)
            .Where(ai => !string.IsNullOrEmpty(ai))
            .ToListAsync();

        var allergens = new HashSet<string>();
        string[] commonAllergens = { "nuts", "milk", "soy", "gluten", "wheat", "eggs", "peanuts" };
        foreach (var info in allAllergenInfo)
        {
            foreach (var allergen in commonAllergens)
            {
                if (info.ToLower().Contains(allergen) && !allergens.Contains(allergen))
                {
                    allergens.Add(allergen);
                }
            }
        }

        // Get cocoa percentage range
        var cocoaRange = new CocoaRangeDto
        {
            MinPercentage = 0,
            MaxPercentage = 100
        };

        try
        {
            var cocoaPercentages = await _context.Products
                .Select(p => p.CocoaPercentage)
                .Where(cp => !string.IsNullOrEmpty(cp))
                .ToListAsync();

            var percentages = cocoaPercentages
                .Select(cp => int.TryParse(cp.Replace("%", ""), out int percent) ? percent : 0)
                .Where(p => p > 0)
                .ToList();

            if (percentages.Any())
            {
                cocoaRange.MinPercentage = percentages.Min();
                cocoaRange.MaxPercentage = percentages.Max();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating cocoa percentage range");
        }

        return new SearchFiltersDto
        {
            Categories = categories,
            PriceRange = new PriceRangeDto
            {
                MinPrice = priceRange?.MinPrice ?? 0,
                MaxPrice = priceRange?.MaxPrice ?? 100
            },
            Origins = origins,
            FlavorProfiles = flavorProfiles.ToList(),
            Allergens = allergens.ToList(),
            CocoaPercentageRange = cocoaRange
        };
    }

    public async Task<List<string>> GetPopularSearchesAsync()
    {
        // This would ideally come from a SearchQuery tracking table
        // For now, return sample data or most viewed products
        var topProducts = await _context.Products
            .OrderByDescending(p => p.AverageRating)
            .Take(5)
            .Select(p => p.Name)
            .ToListAsync();

        return topProducts;
    }

    private IQueryable<Product> ApplySorting(IQueryable<Product> query, string sortBy, bool descending)
    {
        switch (sortBy?.ToLower())
        {
            case "price":
                return descending
                    ? query.OrderByDescending(p => p.Price)
                    : query.OrderBy(p => p.Price);
            case "name":
                return descending
                    ? query.OrderByDescending(p => p.Name)
                    : query.OrderBy(p => p.Name);
            case "rating":
                return descending
                    ? query.OrderByDescending(p => p.AverageRating)
                    : query.OrderBy(p => p.AverageRating);
            case "popularity":
                // Assuming review count is a measure of popularity
                return descending
                    ? query.OrderByDescending(p => p.ReviewCount)
                    : query.OrderBy(p => p.ReviewCount);
            default:
                // Default sorting by newest
                return query.OrderByDescending(p => p.Id);
        }
    }

    private async Task TrackSearchQuery(AdvancedSearchDto query, int resultCount)
    {
        try
        {
            // Get user ID if authenticated
            string userId = null;
            string guestId = null;

            // Get user/guest ID from HttpContext
            var httpContext = new HttpContextAccessor().HttpContext;
            if (httpContext?.User?.Identity?.IsAuthenticated == true)
            {
                userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            }
            else
            {
                // Try to get guest ID from cookies
                guestId = httpContext?.Request.Cookies["GuestId"];
            }

            // Create search query record
            var searchQuery = new SearchQuery
            {
                Query = query.Query,
                UserId = userId,
                GuestId = guestId,
                ResultCount = resultCount,
                Filters = JsonSerializer.Serialize(new
                {
                    query.CategoryIds,
                    query.MinPrice,
                    query.MaxPrice,
                    query.Origins,
                    query.FlavorProfiles,
                    query.IsOrganic,
                    query.IsFairTrade,
                    query.MinCocoaPercentage,
                    query.MaxCocoaPercentage,
                    query.Allergens,
                    query.SortBy,
                    query.SortDescending
                })
            };

            _context.SearchQueries.Add(searchQuery);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking search query");
            // Continue without tracking the query
        }
    }
}