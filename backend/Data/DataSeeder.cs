// Data/DataSeeder.cs
using ECommerce.API.Data;
using ECommerce.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public static class DataSeeder
{
    public static async Task SeedData(ApplicationDbContext context, RoleManager<IdentityRole> roleManager, UserManager<ApplicationUser> userManager)
    {
        // Ensure database is created
        context.Database.EnsureCreated();

        // Seed Categories
        if (!context.Categories.Any())
        {
            var categories = new List<Category>
            {
                new Category { Name = "Dark Chocolate", Description = "Chocolates with high cocoa content" },
                new Category { Name = "Milk Chocolate", Description = "Creamy chocolates with milk" },
                new Category { Name = "White Chocolate", Description = "Sweet chocolates made with cocoa butter" },
                new Category { Name = "Chocolate Gifts", Description = "Gift packages and assortments" },
                new Category { Name = "Organic Chocolate", Description = "Certified organic chocolates" }
            };
            await context.Categories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
        }

        // Seed Products if none exist
        if (!context.Products.Any())
        {
            var categories = await context.Categories.ToListAsync();
            var darkChocolateCat = categories.First(c => c.Name == "Dark Chocolate");
            var milkChocolateCat = categories.First(c => c.Name == "Milk Chocolate");
            var whiteChocolateCat = categories.First(c => c.Name == "White Chocolate");
            var giftsCat = categories.First(c => c.Name == "Chocolate Gifts");
            var organicCat = categories.First(c => c.Name == "Organic Chocolate");

            var products = new List<Product>
            {
                // Dark Chocolate Products
                new Product
                {
                    Name = "Intense Dark Espresso",
                    Description = "Rich, bold dark chocolate infused with espresso notes for coffee lovers.",
                    Price = 7.99M,
                    StockQuantity = 100,
                    ImageUrl = "/uploads/dark_espresso.jpg",
                    CategoryId = darkChocolateCat.Id,
                    CocoaPercentage = "72%",
                    Origin = "Ecuador",
                    FlavorNotes = "Coffee, caramel, toasted nuts",
                    IsOrganic = false,
                    IsFairTrade = true,
                    Ingredients = "Cocoa mass, sugar, cocoa butter, coffee, soy lecithin, vanilla",
                    WeightInGrams = 100,
                    AllergenInfo = "May contain traces of nuts, milk"
                },
                new Product
                {
                    Name = "Single Origin Madagascar",
                    Description = "Fruity and complex dark chocolate from premium Madagascar cocoa beans.",
                    Price = 8.99M,
                    StockQuantity = 75,
                    ImageUrl = "/uploads/madagascar.jpg",
                    CategoryId = darkChocolateCat.Id,
                    CocoaPercentage = "85%",
                    Origin = "Madagascar",
                    FlavorNotes = "Red berries, citrus, vanilla",
                    IsOrganic = false,
                    IsFairTrade = true,
                    Ingredients = "Cocoa mass, sugar, cocoa butter, vanilla",
                    WeightInGrams = 100,
                    AllergenInfo = "May contain traces of nuts, milk"
                },
                new Product
                {
                    Name = "Sea Salt Dark Bar",
                    Description = "Smooth dark chocolate with crunchy sea salt crystals for a perfect sweet-savory balance.",
                    Price = 6.99M,
                    StockQuantity = 120,
                    ImageUrl = "/uploads/sea_salt_dark.jpg",
                    CategoryId = darkChocolateCat.Id,
                    CocoaPercentage = "70%",
                    Origin = "Peru",
                    FlavorNotes = "Sea salt, caramel, roasted cocoa",
                    IsOrganic = false,
                    IsFairTrade = false,
                    Ingredients = "Cocoa mass, sugar, cocoa butter, sea salt, soy lecithin",
                    WeightInGrams = 100,
                    AllergenInfo = "May contain traces of nuts, milk"
                },
                
                // Milk Chocolate Products
                new Product
                {
                    Name = "Creamy Milk Classic",
                    Description = "Smooth, classic milk chocolate with rich dairy notes and melt-in-your-mouth texture.",
                    Price = 5.99M,
                    StockQuantity = 150,
                    ImageUrl = "/uploads/milk_classic.jpg",
                    CategoryId = milkChocolateCat.Id,
                    CocoaPercentage = "38%",
                    Origin = "Ghana",
                    FlavorNotes = "Cream, vanilla, cocoa",
                    IsOrganic = false,
                    IsFairTrade = false,
                    Ingredients = "Sugar, cocoa butter, milk powder, cocoa mass, soy lecithin, vanilla",
                    WeightInGrams = 100,
                    AllergenInfo = "Contains milk. May contain traces of nuts"
                },
                new Product
                {
                    Name = "Hazelnut Crunch",
                    Description = "Milk chocolate bar filled with crunchy hazelnut pieces and smooth praline.",
                    Price = 6.99M,
                    StockQuantity = 100,
                    ImageUrl = "/uploads/hazelnut_crunch.jpg",
                    CategoryId = milkChocolateCat.Id,
                    CocoaPercentage = "35%",
                    Origin = "Belgium",
                    FlavorNotes = "Hazelnut, caramel, milk",
                    IsOrganic = false,
                    IsFairTrade = false,
                    Ingredients = "Sugar, hazelnuts, cocoa butter, milk powder, cocoa mass, soy lecithin, vanilla",
                    WeightInGrams = 100,
                    AllergenInfo = "Contains milk and hazelnuts. May contain traces of other nuts"
                },
                new Product
                {
                    Name = "Caramel Swirl",
                    Description = "Silky milk chocolate with swirls of buttery caramel throughout.",
                    Price = 7.49M,
                    StockQuantity = 90,
                    ImageUrl = "/uploads/caramel_swirl.jpg",
                    CategoryId = milkChocolateCat.Id,
                    CocoaPercentage = "33%",
                    Origin = "Switzerland",
                    FlavorNotes = "Butter caramel, cream, vanilla",
                    IsOrganic = false,
                    IsFairTrade = false,
                    Ingredients = "Sugar, caramel (sugar, glucose syrup, butter), cocoa butter, milk powder, cocoa mass, soy lecithin, vanilla",
                    WeightInGrams = 100,
                    AllergenInfo = "Contains milk and butter. May contain traces of nuts"
                },
                
                // White Chocolate Products
                new Product
                {
                    Name = "Vanilla Bean White",
                    Description = "Smooth white chocolate with real vanilla bean specks for authentic flavor.",
                    Price = 6.99M,
                    StockQuantity = 80,
                    ImageUrl = "/uploads/vanilla_white.jpg",
                    CategoryId = whiteChocolateCat.Id,
                    CocoaPercentage = "30%",
                    Origin = "Belgium",
                    FlavorNotes = "Bourbon vanilla, cream, honey",
                    IsOrganic = false,
                    IsFairTrade = false,
                    Ingredients = "Sugar, cocoa butter, milk powder, vanilla beans, soy lecithin",
                    WeightInGrams = 100,
                    AllergenInfo = "Contains milk. May contain traces of nuts"
                },
                new Product
                {
                    Name = "Raspberry White Delight",
                    Description = "White chocolate bar with freeze-dried raspberry pieces for a fruity twist.",
                    Price = 7.99M,
                    StockQuantity = 70,
                    ImageUrl = "/uploads/raspberry_white.jpg",
                    CategoryId = whiteChocolateCat.Id,
                    CocoaPercentage = "29%",
                    Origin = "France",
                    FlavorNotes = "Raspberry, cream, sweet vanilla",
                    IsOrganic = false,
                    IsFairTrade = false,
                    Ingredients = "Sugar, cocoa butter, milk powder, freeze-dried raspberries, soy lecithin, natural flavors",
                    WeightInGrams = 100,
                    AllergenInfo = "Contains milk. May contain traces of nuts"
                },
                new Product
                {
                    Name = "Coconut White Dream",
                    Description = "Tropical white chocolate with coconut flakes for a paradise-inspired treat.",
                    Price = 7.49M,
                    StockQuantity = 85,
                    ImageUrl = "/uploads/coconut_white.jpg",
                    CategoryId = whiteChocolateCat.Id,
                    CocoaPercentage = "28%",
                    Origin = "Switzerland",
                    FlavorNotes = "Coconut, vanilla, sweet cream",
                    IsOrganic = false,
                    IsFairTrade = false,
                    Ingredients = "Sugar, cocoa butter, milk powder, coconut flakes, soy lecithin, natural flavors",
                    WeightInGrams = 100,
                    AllergenInfo = "Contains milk and coconut. May contain traces of nuts"
                },
                
                // Chocolate Gifts
                new Product
                {
                    Name = "Luxury Truffle Collection",
                    Description = "Elegant box of 16 handcrafted chocolate truffles in assorted flavors.",
                    Price = 24.99M,
                    StockQuantity = 50,
                    ImageUrl = "/uploads/truffle_collection.jpg",
                    CategoryId = giftsCat.Id,
                    CocoaPercentage = "Mixed",
                    Origin = "Belgium",
                    FlavorNotes = "Various: champagne, raspberry, caramel, espresso",
                    IsOrganic = false,
                    IsFairTrade = true,
                    Ingredients = "Cocoa mass, sugar, cocoa butter, cream, butter, various natural flavors, soy lecithin",
                    WeightInGrams = 200,
                    AllergenInfo = "Contains milk, may contain traces of nuts, alcohol"
                },
                new Product
                {
                    Name = "Chocolate Lover's Hamper",
                    Description = "Beautiful gift basket with an assortment of premium chocolate bars, truffles, and hot chocolate.",
                    Price = 49.99M,
                    StockQuantity = 30,
                    ImageUrl = "/uploads/chocolate_hamper.jpg",
                    CategoryId = giftsCat.Id,
                    CocoaPercentage = "Mixed",
                    Origin = "Various",
                    FlavorNotes = "Various chocolate flavors",
                    IsOrganic = false,
                    IsFairTrade = true,
                    Ingredients = "Various, see individual products",
                    WeightInGrams = 500,
                    AllergenInfo = "Contains milk, may contain nuts, soy, wheat"
                },
                new Product
                {
                    Name = "Celebration Chocolate Box",
                    Description = "Elegant box of 24 premium chocolates perfect for special occasions and celebrations.",
                    Price = 34.99M,
                    StockQuantity = 40,
                    ImageUrl = "/uploads/celebration_box.jpg",
                    CategoryId = giftsCat.Id,
                    CocoaPercentage = "Mixed",
                    Origin = "Belgium & Switzerland",
                    FlavorNotes = "Various: praline, ganache, caramel, fruit",
                    IsOrganic = false,
                    IsFairTrade = false,
                    Ingredients = "Various, see box for details",
                    WeightInGrams = 300,
                    AllergenInfo = "Contains milk, nuts. May contain soy, wheat"
                },
                
                // Organic Chocolate
                new Product
                {
                    Name = "Organic Dark 75%",
                    Description = "Certified organic dark chocolate made with ethically sourced cocoa beans.",
                    Price = 8.99M,
                    StockQuantity = 60,
                    ImageUrl = "/uploads/organic_dark.jpg",
                    CategoryId = organicCat.Id,
                    CocoaPercentage = "75%",
                    Origin = "Peru",
                    FlavorNotes = "Rich cocoa, light fruitiness, earthy notes",
                    IsOrganic = true,
                    IsFairTrade = true,
                    Ingredients = "Organic cocoa mass, organic cane sugar, organic cocoa butter",
                    WeightInGrams = 100,
                    AllergenInfo = "May contain traces of nuts, milk"
                },
                new Product
                {
                    Name = "Organic Milk with Almonds",
                    Description = "Smooth organic milk chocolate studded with crunchy organic almonds.",
                    Price = 9.49M,
                    StockQuantity = 55,
                    ImageUrl = "/uploads/organic_milk_almond.jpg",
                    CategoryId = organicCat.Id,
                    CocoaPercentage = "42%",
                    Origin = "Ecuador",
                    FlavorNotes = "Creamy milk, roasted almonds, honey notes",
                    IsOrganic = true,
                    IsFairTrade = true,
                    Ingredients = "Organic cane sugar, organic cocoa butter, organic milk powder, organic cocoa mass, organic almonds, organic vanilla",
                    WeightInGrams = 100,
                    AllergenInfo = "Contains milk, almonds. May contain traces of other nuts"
                },
                new Product
                {
                    Name = "Organic Raw Cacao Nibs",
                    Description = "Pure organic cacao nibs for baking or adding crunch to desserts and smoothies.",
                    Price = 12.99M,
                    StockQuantity = 45,
                    ImageUrl = "/uploads/cacao_nibs.jpg",
                    CategoryId = organicCat.Id,
                    CocoaPercentage = "100%",
                    Origin = "Ecuador",
                    FlavorNotes = "Intense cocoa, slight bitterness, fruity undertones",
                    IsOrganic = true,
                    IsFairTrade = true,
                    Ingredients = "Organic cacao nibs",
                    WeightInGrams = 200,
                    AllergenInfo = "May contain traces of nuts"
                }
            };

            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();
        }

        // You can also seed roles
        if (!roleManager.Roles.Any())
        {
            await roleManager.CreateAsync(new IdentityRole("Admin"));
            await roleManager.CreateAsync(new IdentityRole("Customer"));
        }

        // And seed admin user
        if (!userManager.Users.Any())
        {
            var adminUser = new ApplicationUser
            {
                UserName = "admin@example.com",
                Email = "admin@example.com",
                EmailConfirmed = true,
                FirstName = "Admin",
                LastName = "User"
            };
            await userManager.CreateAsync(adminUser, "Admin123$");
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }

        // Seed customer users
        if (await userManager.FindByEmailAsync("customer@example.com") == null)
        {
            var customerUser = new ApplicationUser
            {
                UserName = "customer@example.com",
                Email = "customer@example.com",
                EmailConfirmed = true,
                FirstName = "John",
                LastName = "Doe"
            };
            await userManager.CreateAsync(customerUser, "Customer123$");
            await userManager.AddToRoleAsync(customerUser, "Customer");
        }
    }
}