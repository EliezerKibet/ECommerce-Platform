using ECommerce.API.Data;
using ECommerce.API.Interfaces;
using Microsoft.EntityFrameworkCore;


// Services/AnalyticsService.cs
public class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AnalyticsService> _logger;
    private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

    public AnalyticsService(
        IDbContextFactory<ApplicationDbContext> contextFactory,
        ApplicationDbContext context,
        ILogger<AnalyticsService> logger)
    {
        _contextFactory = contextFactory;
        _context = context;
        _logger = logger;
    }

    // Add this method to AnalyticsService.cs
    public async Task<object> GetDashboardDataAsync()
    {
        // Get last 30 days as default range
        var endDate = DateTime.UtcNow;
        var startDate = endDate.AddDays(-30);

        // Execute all queries with the regular DbContext
        // Sales Summary
        var orders = await _context.Orders
            .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
            .Include(o => o.OrderItems)
            .ToListAsync();

        var totalSales = orders.Sum(o => o.TotalAmount);
        var totalOrders = orders.Count;
        var averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Top Products
        var topProducts = await _context.OrderItems
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                ProductName = g.First().ProductName,
                UnitsSold = g.Sum(oi => oi.Quantity),
                Revenue = g.Sum(oi => oi.ProductPrice * oi.Quantity),
                OrderCount = g.Select(oi => oi.OrderId).Distinct().Count()
            })
            .OrderByDescending(x => x.UnitsSold)
            .Take(5)
            .ToListAsync();

        // Low Stock Products
        var lowStockProducts = await _context.Products
            .Where(p => p.StockQuantity <= 10)
            .Include(p => p.Category)
            .Select(p => new
            {
                Id = p.Id,
                Name = p.Name,
                StockQuantity = p.StockQuantity,
                Category = p.Category.Name,
                Price = p.Price
            })
            .OrderBy(p => p.StockQuantity)
            .ToListAsync();

        // Active Promotions
        var now = DateTime.UtcNow;
        var activePromotions = await _context.Promotions
            .Where(p => p.IsActive && p.StartDate <= now && p.EndDate >= now)
            .Include(p => p.Products)
            .Select(p => new
            {
                Id = p.Id,
                Name = p.Name,
                DiscountPercentage = p.DiscountPercentage,
                EndDate = p.EndDate,
                TimeRemaining = (p.EndDate - now).TotalSeconds,
                ProductCount = p.Products.Count
            })
            .ToListAsync();

        return new
        {
            SalesSummary = new
            {
                Summary = new
                {
                    TotalRevenue = totalSales,
                    TotalOrders = totalOrders,
                    AverageOrderValue = averageOrderValue,
                    StartDate = startDate,
                    EndDate = endDate
                }
            },
            TopProducts = new
            {
                TopSellingProducts = topProducts
            },
            LowStockProducts = new
            {
                LowStockThreshold = 10,
                LowStockProductCount = lowStockProducts.Count,
                Products = lowStockProducts
            },
            ActivePromotions = new
            {
                Count = activePromotions.Count,
                Promotions = activePromotions
            }
        };
    }

    // Sales Analytics
    public async Task<object> GetSalesSummaryAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        startDate ??= DateTime.UtcNow.AddMonths(-1);
        endDate ??= DateTime.UtcNow;

        var orders = await _context.Orders
            .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
            .Include(o => o.OrderItems)
            .ToListAsync();

        // Calculate key metrics
        var totalSales = orders.Sum(o => o.TotalAmount);
        var totalOrders = orders.Count;
        var averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Sales by day
        var salesByDay = orders
            .GroupBy(o => o.OrderDate.Date)
            .Select(g => new {
                Date = g.Key,
                Revenue = g.Sum(o => o.TotalAmount),
                Orders = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToList();

        return new
        {
            Summary = new
            {
                TotalRevenue = totalSales,
                TotalOrders = totalOrders,
                AverageOrderValue = averageOrderValue,
                StartDate = startDate,
                EndDate = endDate
            },
            DailyData = salesByDay
        };
    }

    public async Task<object> GetSalesByProductAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        startDate ??= DateTime.UtcNow.AddMonths(-1);
        endDate ??= DateTime.UtcNow;

        var salesByProduct = await _context.OrderItems
            .Where(oi => oi.Order.OrderDate >= startDate && oi.Order.OrderDate <= endDate)
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                ProductName = g.First().ProductName,
                UnitsSold = g.Sum(oi => oi.Quantity),
                Revenue = g.Sum(oi => oi.ProductPrice * oi.Quantity)
            })
            .OrderByDescending(x => x.Revenue)
            .ToListAsync();

        return new
        {
            StartDate = startDate,
            EndDate = endDate,
            Products = salesByProduct
        };
    }

    public async Task<object> GetSalesByCategoryAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        startDate ??= DateTime.UtcNow.AddMonths(-1);
        endDate ??= DateTime.UtcNow;

        // Get all order items in the date range
        var orderItems = await _context.OrderItems
            .Where(oi => oi.Order.OrderDate >= startDate && oi.Order.OrderDate <= endDate)
            .ToListAsync();

        // Get all products to map to categories
        var products = await _context.Products
            .Include(p => p.Category)
            .ToDictionaryAsync(p => p.Id, p => p);

        // Group sales by category
        var salesByCategory = orderItems
            .GroupBy(oi => products.ContainsKey(oi.ProductId) ? products[oi.ProductId].CategoryId : 0)
            .Select(g => new
            {
                CategoryId = g.Key,
                CategoryName = g.Key > 0 && products.Values.Any(p => p.CategoryId == g.Key)
                    ? products.Values.First(p => p.CategoryId == g.Key).Category?.Name
                    : "Uncategorized",
                UnitsSold = g.Sum(oi => oi.Quantity),
                Revenue = g.Sum(oi => oi.ProductPrice * oi.Quantity)
            })
            .OrderByDescending(x => x.Revenue)
            .ToList();

        return new
        {
            StartDate = startDate,
            EndDate = endDate,
            Categories = salesByCategory
        };
    }

    // Promotion Analytics
    public async Task<object> GetPromotionPerformanceAsync(int? promotionId = null)
    {
        IQueryable<Promotion> promotionsQuery = _context.Promotions
            .Include(p => p.Products)
                .ThenInclude(pp => pp.Product);

        if (promotionId.HasValue)
        {
            promotionsQuery = promotionsQuery.Where(p => p.Id == promotionId.Value);
        }

        var promotions = await promotionsQuery.ToListAsync();
        var results = new List<object>();

        foreach (var promotion in promotions)
        {
            var productIds = promotion.Products.Select(pp => pp.ProductId).ToList();

            // Get orders with these products during the promotion period
            var orderItemsInPromotion = await _context.OrderItems
                .Where(oi => productIds.Contains(oi.ProductId) &&
                       oi.Order.OrderDate >= promotion.StartDate &&
                       oi.Order.OrderDate <= promotion.EndDate)
                .Include(oi => oi.Order)
                .ToListAsync();

            var ordersDuringPromotion = orderItemsInPromotion
                .Select(oi => oi.Order)
                .Distinct()
                .ToList();

            // Calculate metrics
            var totalRevenue = orderItemsInPromotion.Sum(oi => oi.ProductPrice * oi.Quantity);
            var totalOrders = ordersDuringPromotion.Count;
            var totalUnitsSold = orderItemsInPromotion.Sum(oi => oi.Quantity);

            // Get sales before promotion for comparison (same duration)
            var promotionDurationDays = (promotion.EndDate - promotion.StartDate).TotalDays;
            var periodBeforePromotion = new
            {
                Start = promotion.StartDate.AddDays(-promotionDurationDays),
                End = promotion.StartDate.AddDays(-1)
            };

            var orderItemsBeforePromotion = await _context.OrderItems
                .Where(oi => productIds.Contains(oi.ProductId) &&
                       oi.Order.OrderDate >= periodBeforePromotion.Start &&
                       oi.Order.OrderDate <= periodBeforePromotion.End)
                .ToListAsync();

            var revenueBeforePromotion = orderItemsBeforePromotion.Sum(oi => oi.ProductPrice * oi.Quantity);
            var unitsSoldBeforePromotion = orderItemsBeforePromotion.Sum(oi => oi.Quantity);

            // Calculate percentage changes
            var revenueChange = revenueBeforePromotion > 0
                ? ((totalRevenue - revenueBeforePromotion) / revenueBeforePromotion) * 100
                : 0;

            var unitsSoldChange = unitsSoldBeforePromotion > 0
                ? ((totalUnitsSold - unitsSoldBeforePromotion) / (double)unitsSoldBeforePromotion) * 100
                : 0;

            // Top selling products during promotion
            var topProducts = orderItemsInPromotion
                .GroupBy(oi => oi.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    ProductName = g.First().ProductName,
                    UnitsSold = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.ProductPrice * oi.Quantity)
                })
                .OrderByDescending(x => x.UnitsSold)
                .Take(5)
                .ToList();

            results.Add(new
            {
                PromotionId = promotion.Id,
                PromotionName = promotion.Name,
                StartDate = promotion.StartDate,
                EndDate = promotion.EndDate,
                DiscountPercentage = promotion.DiscountPercentage,
                Performance = new
                {
                    TotalRevenue = totalRevenue,
                    TotalOrders = totalOrders,
                    TotalUnitsSold = totalUnitsSold,
                    RevenueChangePercentage = revenueChange,
                    UnitsSoldChangePercentage = unitsSoldChange
                },
                TopProducts = topProducts
            });
        }

        return promotionId.HasValue ? results.FirstOrDefault() : new { Promotions = results };
    }

    public async Task<object> GetPromotionImpactOnSalesAsync(int promotionId)
    {
        var promotion = await _context.Promotions
            .Include(p => p.Products)
            .FirstOrDefaultAsync(p => p.Id == promotionId);

        if (promotion == null)
        {
            throw new KeyNotFoundException($"Promotion with ID {promotionId} not found");
        }

        var productIds = promotion.Products.Select(pp => pp.ProductId).ToList();

        // Get the daily sales data before, during, and after the promotion
        var beforePeriodStart = promotion.StartDate.AddDays(-30);
        var afterPeriodEnd = promotion.EndDate.AddDays(30);

        var orderItems = await _context.OrderItems
            .Where(oi => productIds.Contains(oi.ProductId) &&
                   oi.Order.OrderDate >= beforePeriodStart &&
                   oi.Order.OrderDate <= afterPeriodEnd)
            .Include(oi => oi.Order)
            .ToListAsync();

        // Group by day
        var salesByDay = orderItems
            .GroupBy(oi => oi.Order.OrderDate.Date)
            .Select(g => new
            {
                Date = g.Key,
                Revenue = g.Sum(oi => oi.ProductPrice * oi.Quantity),
                Units = g.Sum(oi => oi.Quantity),
                Period = g.Key < promotion.StartDate ? "Before" :
                         g.Key <= promotion.EndDate ? "During" : "After"
            })
            .OrderBy(x => x.Date)
            .ToList();

        // Calculate period averages
        var beforeAvg = salesByDay.Where(x => x.Period == "Before")
            .DefaultIfEmpty(new { Date = DateTime.MinValue, Revenue = 0m, Units = 0, Period = "Before" })
            .Average(x => x.Revenue);

        var duringAvg = salesByDay.Where(x => x.Period == "During")
            .DefaultIfEmpty(new { Date = DateTime.MinValue, Revenue = 0m, Units = 0, Period = "During" })
            .Average(x => x.Revenue);

        var afterAvg = salesByDay.Where(x => x.Period == "After")
            .DefaultIfEmpty(new { Date = DateTime.MinValue, Revenue = 0m, Units = 0, Period = "After" })
            .Average(x => x.Revenue);

        return new
        {
            PromotionDetails = new
            {
                Id = promotion.Id,
                Name = promotion.Name,
                StartDate = promotion.StartDate,
                EndDate = promotion.EndDate,
                DiscountPercentage = promotion.DiscountPercentage
            },
            DailySales = salesByDay,
            AverageRevenue = new
            {
                Before = beforeAvg,
                During = duringAvg,
                After = afterAvg,
                DuringVsBeforeChange = beforeAvg > 0 ? ((duringAvg - beforeAvg) / beforeAvg) * 100 : 0,
                AfterVsBeforeChange = beforeAvg > 0 ? ((afterAvg - beforeAvg) / beforeAvg) * 100 : 0
            }
        };
    }

    // Customer Analytics
    public async Task<object> GetCustomerAcquisitionAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        startDate ??= DateTime.UtcNow.AddMonths(-6);
        endDate ??= DateTime.UtcNow;

        // Get all users who registered in the date range
        var newUsers = await _context.Users
            .Where(u => u.RegisteredDate >= startDate && u.RegisteredDate <= endDate)
            .ToListAsync();

        // Group by day or month depending on range
        var groupByMonth = (endDate.Value - startDate.Value).TotalDays > 90;

        var acquisitionData = newUsers;

        if (groupByMonth)
        {
            // Group by month
            var byMonth = newUsers
                .GroupBy(u => new { Year = u.RegisteredDate.Year, Month = u.RegisteredDate.Month })
                .Select(g => new
                {
                    Period = new DateTime(g.Key.Year, g.Key.Month, 1),
                    NewUsers = g.Count()
                })
                .OrderBy(x => x.Period)
                .ToList();

            // Calculate cumulative total
            int runningTotal = 0;
            var cumulativeData = byMonth.Select(x =>
            {
                runningTotal += x.NewUsers;
                return new
                {
                    Period = x.Period,
                    NewUsers = x.NewUsers,
                    CumulativeUsers = runningTotal
                };
            }).ToList();

            return new
            {
                StartDate = startDate,
                EndDate = endDate,
                TotalNewUsers = newUsers.Count,
                ByMonth = cumulativeData
            };
        }
        else
        {
            // Group by day
            var byDay = newUsers
                .GroupBy(u => u.RegisteredDate.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    NewUsers = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToList();

            // Calculate cumulative total
            int runningTotal = 0;
            var cumulativeData = byDay.Select(x =>
            {
                runningTotal += x.NewUsers;
                return new
                {
                    Date = x.Date,
                    NewUsers = x.NewUsers,
                    CumulativeUsers = runningTotal
                };
            }).ToList();

            return new
            {
                StartDate = startDate,
                EndDate = endDate,
                TotalNewUsers = newUsers.Count,
                ByDay = cumulativeData
            };
        }
    }

    public async Task<object> GetCustomerRetentionAsync()
    {
        // Define cohorts by month (users who made their first purchase in a specific month)
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);

        // Get first order date for each user
        var firstOrderDates = await _context.Orders
            .Where(o => o.OrderDate >= sixMonthsAgo)
            .GroupBy(o => o.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                FirstOrderDate = g.Min(o => o.OrderDate)
            })
            .ToListAsync();

        // Group users into cohorts by month of first purchase
        var cohorts = firstOrderDates
            .GroupBy(x => new { Year = x.FirstOrderDate.Year, Month = x.FirstOrderDate.Month })
            .Select(g => new
            {
                CohortDate = new DateTime(g.Key.Year, g.Key.Month, 1),
                UserIds = g.Select(x => x.UserId).ToList()
            })
            .OrderBy(x => x.CohortDate)
            .ToList();

        // Get all orders for retention analysis
        var allOrders = await _context.Orders
            .Where(o => o.OrderDate >= sixMonthsAgo)
            .ToListAsync();

        // Calculate retention by month for each cohort
        var retentionData = new List<object>();

        foreach (var cohort in cohorts)
        {
            var cohortUsers = cohort.UserIds;
            var cohortSize = cohortUsers.Count;

            if (cohortSize == 0) continue;

            var retentionByMonth = new List<object>();

            // Calculate retention for up to 6 months after the cohort month
            for (int i = 0; i <= 6; i++)
            {
                var monthStart = cohort.CohortDate.AddMonths(i);
                var monthEnd = monthStart.AddMonths(1).AddDays(-1);

                // Skip future months
                if (monthStart > DateTime.UtcNow) break;

                // Count users who placed orders in this month
                var activeUsers = allOrders
                    .Where(o => cohortUsers.Contains(o.UserId) &&
                           o.OrderDate >= monthStart &&
                           o.OrderDate <= monthEnd)
                    .Select(o => o.UserId)
                    .Distinct()
                    .Count();

                var retentionRate = (double)activeUsers / cohortSize * 100;

                retentionByMonth.Add(new
                {
                    Month = i,
                    MonthName = monthStart.ToString("MMM yyyy"),
                    ActiveUsers = activeUsers,
                    RetentionRate = retentionRate
                });
            }

            retentionData.Add(new
            {
                Cohort = cohort.CohortDate.ToString("MMM yyyy"),
                CohortSize = cohortSize,
                RetentionByMonth = retentionByMonth
            });
        }

        return new
        {
            Analysis = "Customer Retention Analysis",
            Cohorts = retentionData
        };
    }

    public async Task<object> GetTopCustomersAsync(int count = 10)
    {
        var customers = await _context.Orders
            .Where(o => o.UserId != null)
            .GroupBy(o => o.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                TotalSpent = g.Sum(o => o.TotalAmount),
                OrderCount = g.Count(),
                AverageOrderValue = g.Sum(o => o.TotalAmount) / g.Count(),
                FirstOrderDate = g.Min(o => o.OrderDate),
                LastOrderDate = g.Max(o => o.OrderDate)
            })
            .OrderByDescending(x => x.TotalSpent)
            .Take(count)
            .ToListAsync();

        // Get user names
        var userIds = customers.Select(c => c.UserId).ToList();
        var users = await _context.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => new { u.Email, u.FirstName, u.LastName });

        var result = customers.Select(c => new
        {
            UserId = c.UserId,
            Email = users.ContainsKey(c.UserId) ? users[c.UserId].Email : "Unknown",
            Name = users.ContainsKey(c.UserId)
                ? $"{users[c.UserId].FirstName} {users[c.UserId].LastName}"
                : "Unknown",
            TotalSpent = c.TotalSpent,
            OrderCount = c.OrderCount,
            AverageOrderValue = c.AverageOrderValue,
            DaysSinceFirstOrder = (DateTime.UtcNow - c.FirstOrderDate).TotalDays,
            DaysSinceLastOrder = (DateTime.UtcNow - c.LastOrderDate).TotalDays
        }).ToList();

        return new
        {
            TopCustomers = result
        };
    }

    // Product Analytics
    public async Task<object> GetTopSellingProductsAsync(int count = 10)
    {
        var topProducts = await _context.OrderItems
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                ProductName = g.First().ProductName,
                UnitsSold = g.Sum(oi => oi.Quantity),
                Revenue = g.Sum(oi => oi.ProductPrice * oi.Quantity),
                OrderCount = g.Select(oi => oi.OrderId).Distinct().Count()
            })
            .OrderByDescending(x => x.UnitsSold)
            .Take(count)
            .ToListAsync();

        return new
        {
            TopSellingProducts = topProducts
        };
    }

    public async Task<object> GetProductViewsToSalesRatioAsync()
    {
        // Get product views (assuming you have a ProductViews table or similar)
        var productViews = await _context.ProductViews
            .GroupBy(pv => pv.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                ViewCount = g.Count()
            })
            .ToListAsync();

        // Get product sales
        var productSales = await _context.OrderItems
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                SalesCount = g.Sum(oi => oi.Quantity)
            })
            .ToListAsync();

        // Get product names
        var productIds = productViews.Select(pv => pv.ProductId)
            .Union(productSales.Select(ps => ps.ProductId))
            .ToList();

        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.Name);

        // Calculate conversion rates
        var conversionData = productIds.Select(id =>
        {
            var views = productViews.FirstOrDefault(pv => pv.ProductId == id)?.ViewCount ?? 0;
            var sales = productSales.FirstOrDefault(ps => ps.ProductId == id)?.SalesCount ?? 0;
            var conversionRate = views > 0 ? (double)sales / views * 100 : 0;

            return new
            {
                ProductId = id,
                ProductName = products.ContainsKey(id) ? products[id] : "Unknown",
                ViewCount = views,
                SalesCount = sales,
                ConversionRate = conversionRate
            };
        })
        .OrderByDescending(x => x.ConversionRate)
        .ToList();

        return new
        {
            ProductConversions = conversionData,
            AverageConversionRate = conversionData.Any()
                ? conversionData.Average(x => x.ConversionRate)
                : 0
        };
    }

    // Inventory Analytics
    public async Task<object> GetInventoryStatusAsync()
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .ToListAsync();

        // Group by status
        var stockStatus = products
            .GroupBy(p => p.StockQuantity switch
            {
                var n when n == 0 => "Out of Stock",
                var n when n < 10 => "Low Stock",
                var n when n < 50 => "Medium Stock",
                _ => "Well Stocked"
            })
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count(),
                Products = g.Select(p => new
                {
                    Id = p.Id,
                    Name = p.Name,
                    StockQuantity = p.StockQuantity,
                    Category = p.Category?.Name ?? "Uncategorized"
                }).ToList()
            })
            .ToDictionary(g => g.Status, g => g);

        // Calculate inventory value
        var totalInventoryValue = products.Sum(p => p.Price * p.StockQuantity);
        var inventoryValueByCategory = products
            .GroupBy(p => p.CategoryId)
            .Select(g => new
            {
                CategoryId = g.Key,
                CategoryName = g.First().Category?.Name ?? "Uncategorized",
                InventoryValue = g.Sum(p => p.Price * p.StockQuantity),
                ItemCount = g.Count(),
                TotalUnits = g.Sum(p => p.StockQuantity)
            })
            .OrderByDescending(x => x.InventoryValue)
            .ToList();

        return new
        {
            TotalProducts = products.Count,
            TotalUnits = products.Sum(p => p.StockQuantity),
            TotalInventoryValue = totalInventoryValue,
            StockStatus = stockStatus,
            InventoryByCategory = inventoryValueByCategory
        };
    }

    public async Task<object> GetLowStockProductsAsync(int threshold = 10)
    {
        var lowStockProducts = await _context.Products
            .Where(p => p.StockQuantity <= threshold)
            .Include(p => p.Category)
            .Select(p => new
            {
                Id = p.Id,
                Name = p.Name,
                StockQuantity = p.StockQuantity,
                Category = p.Category.Name,
                Price = p.Price
            })
            .OrderBy(p => p.StockQuantity)
            .ToListAsync();

        // Get sales velocity for these products (30-day average)
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        var productIds = lowStockProducts.Select(p => p.Id).ToList();

        var salesVelocity = await _context.OrderItems
            .Where(oi => productIds.Contains(oi.ProductId) &&
                   oi.Order.OrderDate >= thirtyDaysAgo)
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                UnitsSold = g.Sum(oi => oi.Quantity),
                // Units sold per day
                DailySalesRate = g.Sum(oi => oi.Quantity) / 30.0
            })
            .ToDictionaryAsync(x => x.ProductId, x => x);

        // Combine data
        var result = lowStockProducts.Select(p => new
        {
            Id = p.Id,
            Name = p.Name,
            StockQuantity = p.StockQuantity,
            Category = p.Category,
            Price = p.Price,
            ThirtyDaySales = salesVelocity.ContainsKey(p.Id) ? salesVelocity[p.Id].UnitsSold : 0,
            DailySalesRate = salesVelocity.ContainsKey(p.Id) ? salesVelocity[p.Id].DailySalesRate : 0,
            EstimatedDaysUntilOutOfStock = salesVelocity.ContainsKey(p.Id) && salesVelocity[p.Id].DailySalesRate > 0
            ? (double?)(p.StockQuantity / salesVelocity[p.Id].DailySalesRate)
            : null
        }).ToList();

        return new
        {
            LowStockThreshold = threshold,
            LowStockProductCount = result.Count,
            Products = result
        };
    }

    // Add these methods to your AnalyticsService class

    // Get all-time sales summary (no date restrictions)
    public async Task<object> GetAllTimeSalesAsync()
    {
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .ToListAsync();

        // Calculate key metrics for all time
        var totalSales = orders.Sum(o => o.TotalAmount);
        var totalOrders = orders.Count;
        var averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Get first and last order dates
        var firstOrder = orders.OrderBy(o => o.OrderDate).FirstOrDefault();
        var lastOrder = orders.OrderByDescending(o => o.OrderDate).FirstOrDefault();

        // Sales by month (all time)
        var salesByMonth = orders
            .GroupBy(o => new { Year = o.OrderDate.Year, Month = o.OrderDate.Month })
            .Select(g => new {
                Period = new DateTime(g.Key.Year, g.Key.Month, 1),
                Revenue = g.Sum(o => o.TotalAmount),
                Orders = g.Count()
            })
            .OrderBy(x => x.Period)
            .ToList();

        // Sales by year
        var salesByYear = orders
            .GroupBy(o => o.OrderDate.Year)
            .Select(g => new {
                Year = g.Key,
                Revenue = g.Sum(o => o.TotalAmount),
                Orders = g.Count()
            })
            .OrderBy(x => x.Year)
            .ToList();

        return new
        {
            Summary = new
            {
                TotalRevenue = totalSales,
                TotalOrders = totalOrders,
                AverageOrderValue = averageOrderValue,
                FirstOrderDate = firstOrder?.OrderDate,
                LastOrderDate = lastOrder?.OrderDate,
                BusinessDays = firstOrder != null && lastOrder != null
                    ? (lastOrder.OrderDate - firstOrder.OrderDate).TotalDays
                    : 0
            },
            MonthlyData = salesByMonth,
            YearlyData = salesByYear
        };
    }

    // Get all sales orders with pagination
    public async Task<object> GetAllSalesOrdersAsync(int page = 1, int pageSize = 50)
    {
        try
        {
            var totalOrders = await _context.Orders.CountAsync();

            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new
                {
                    OrderId = o.Id,
                    OrderNumber = o.OrderNumber,
                    OrderDate = o.OrderDate,
                    CustomerName = o.ShippingName ?? "Guest Customer",
                    CustomerEmail = o.CustomerEmail ?? "N/A",
                    TotalAmount = o.TotalAmount,
                    Status = o.Status ?? "Pending",
                    PaymentStatus = o.PaymentStatus ?? "Pending",
                    PaymentMethod = o.PaymentMethod ?? "N/A",
                    ItemCount = o.OrderItems.Count,
                    Subtotal = o.Subtotal,
                    Tax = o.Tax,
                    ShippingCost = o.ShippingCost,
                    DiscountAmount = o.DiscountAmount,
                    OrderItems = o.OrderItems.Select(oi => new
                    {
                        ProductId = oi.ProductId,
                        ProductName = oi.ProductName,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.ProductPrice,
                        Total = oi.Subtotal
                    }).ToList()
                })
                .ToListAsync();

            var result = new
            {
                Orders = orders,
                Pagination = new
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalOrders = totalOrders,
                    TotalPages = (int)Math.Ceiling((double)totalOrders / pageSize),
                    HasNextPage = page * pageSize < totalOrders,
                    HasPreviousPage = page > 1
                }
            };

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetAllSalesOrdersAsync - Page: {Page}, PageSize: {PageSize}", page, pageSize);
            throw;
        }
    }
}