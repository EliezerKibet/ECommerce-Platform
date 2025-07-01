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
            IQueryable<Product> productsQuery = _context.Products
                .Include(p => p.Category);

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

            if (query.CategoryIds != null && query.CategoryIds.Any())
            {
                productsQuery = productsQuery.Where(p => query.CategoryIds.Contains(p.CategoryId));
            }

            if (query.MinPrice.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.Price >= query.MinPrice.Value);
            }

            if (query.MaxPrice.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.Price <= query.MaxPrice.Value);
            }

            if (query.Origins != null && query.Origins.Any())
            {
                productsQuery = productsQuery.Where(p => query.Origins.Contains(p.Origin));
            }

            if (query.FlavorProfiles != null && query.FlavorProfiles.Any())
            {
                productsQuery = productsQuery.Where(p =>
                    query.FlavorProfiles.Any(flavor => p.FlavorNotes.Contains(flavor))
                );
            }

            if (query.IsOrganic.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.IsOrganic == query.IsOrganic.Value);
            }

            if (query.IsFairTrade.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.IsFairTrade == query.IsFairTrade.Value);
            }

            if (query.MinCocoaPercentage.HasValue)
            {
                productsQuery = productsQuery.Where(p =>
                    p.CocoaPercentage.Replace("%", "") != null &&
                    int.Parse(string.IsNullOrEmpty(p.CocoaPercentage) ? "0" : p.CocoaPercentage.Replace("%", "")) >= query.MinCocoaPercentage.Value
                );
            }

            if (query.MaxCocoaPercentage.HasValue)
            {
                productsQuery = productsQuery.Where(p =>
                    p.CocoaPercentage.Replace("%", "") != null &&
                    int.Parse(string.IsNullOrEmpty(p.CocoaPercentage) ? "0" : p.CocoaPercentage.Replace("%", "")) >= query.MinCocoaPercentage.Value
                );
            }

            if (query.Allergens != null && query.Allergens.Any())
            {
                foreach (var allergen in query.Allergens)
                {
                    productsQuery = productsQuery.Where(p => !p.AllergenInfo.Contains(allergen));
                }
            }

            var totalItems = await productsQuery.CountAsync();

            productsQuery = ApplySorting(productsQuery, query.SortBy, query.SortDescending);

            var pageSize = query.PageSize;
            var pageNumber = query.Page;
            var skip = (pageNumber - 1) * pageSize;

            var products = await productsQuery
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            var productDtos = _mapper.Map<List<ProductDto>>(products);

            var result = new PagedResult<ProductDto>
            {
                Items = productDtos,
                TotalItems = totalItems,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            };

            await TrackSearchQuery(query, result.TotalItems); 
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
        var productSuggestions = await _context.Products
            .Where(p => p.Name.ToLower().Contains(query))
            .Select(p => p.Name)
            .Distinct()
            .Take(5)
            .ToListAsync();

        var categorySuggestions = await _context.Categories
            .Where(c => c.Name.ToLower().Contains(query))
            .Select(c => c.Name)
            .Distinct()
            .Take(3)
            .ToListAsync();

        var originSuggestions = await _context.Products
            .Where(p => p.Origin.ToLower().Contains(query))
            .Select(p => p.Origin)
            .Distinct()
            .Take(3)
            .ToListAsync();

        var allSuggestions = new List<string>();
        allSuggestions.AddRange(productSuggestions);
        allSuggestions.AddRange(categorySuggestions);
        allSuggestions.AddRange(originSuggestions);

        return allSuggestions
            .Distinct()
            .Take(10)
            .ToList();
    }

    public async Task<SearchFiltersDto> GetAvailableFiltersAsync()
    {
        var categories = await _context.Categories
            .Select(c => new CategoryFilterDto
            {
                Id = c.Id,
                Name = c.Name,
                ProductCount = c.Products.Count
            })
            .ToListAsync();

        var priceRange = await _context.Products
            .Select(p => new
            {
                MinPrice = _context.Products.Min(p => p.Price),
                MaxPrice = _context.Products.Max(p => p.Price)
            })
            .FirstOrDefaultAsync();

        var origins = await _context.Products
            .Select(p => p.Origin)
            .Distinct()
            .Where(o => !string.IsNullOrEmpty(o))
            .ToListAsync();

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
                return descending
                    ? query.OrderByDescending(p => p.ReviewCount)
                    : query.OrderBy(p => p.ReviewCount);
            default:
                return query.OrderByDescending(p => p.Id);
        }
    }

    private async Task TrackSearchQuery(AdvancedSearchDto query, int resultCount)
    {
        try
        {
            string userId = null;
            string guestId = null;

            var httpContext = new HttpContextAccessor().HttpContext;
            if (httpContext?.User?.Identity?.IsAuthenticated == true)
            {
                userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            }
            else
            {
                guestId = httpContext?.Request.Cookies["GuestId"];
            }

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
        }
    }
}