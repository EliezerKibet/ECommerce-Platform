// DTOs/SearchDTOs.cs
public class AdvancedSearchDto
{
    public string Query { get; set; } // Basic search term

    // Filters
    public List<int> CategoryIds { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public List<string> Origins { get; set; }
    public List<string> FlavorProfiles { get; set; }
    public bool? IsOrganic { get; set; }
    public bool? IsFairTrade { get; set; }
    public int? MinCocoaPercentage { get; set; }
    public int? MaxCocoaPercentage { get; set; }
    public List<string> Allergens { get; set; } // Allergens to exclude

    // Sorting
    public string SortBy { get; set; } // Price, Rating, Popularity, Name
    public bool SortDescending { get; set; }

    // Pagination
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class SearchFiltersDto
{
    public List<CategoryFilterDto> Categories { get; set; }
    public PriceRangeDto PriceRange { get; set; }
    public List<string> Origins { get; set; }
    public List<string> FlavorProfiles { get; set; }
    public List<string> Allergens { get; set; }
    public CocoaRangeDto CocoaPercentageRange { get; set; }
}

public class CategoryFilterDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int ProductCount { get; set; }
}

public class PriceRangeDto
{
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
}

public class CocoaRangeDto
{
    public int MinPercentage { get; set; }
    public int MaxPercentage { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; }
    public int TotalItems { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}