using ECommerce.API.Data;
using ECommerce.API.DTOs;
using ECommerce.API.Models;
using ECommerce.API.Services;
using ECommerce.API.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using Moq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace ECommerce.API.Tests.Services
{
    public class ProductServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IProductRepository> _productRepositoryMock;
        private readonly Mock<ICategoryRepository> _categoryRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IWebHostEnvironment> _environmentMock;
        private readonly ProductService _service;

        public ProductServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _productRepositoryMock = new Mock<IProductRepository>();
            _categoryRepositoryMock = new Mock<ICategoryRepository>();
            _mapperMock = new Mock<IMapper>();
            _environmentMock = new Mock<IWebHostEnvironment>();

            _service = new ProductService(
                _context,
                _productRepositoryMock.Object,
                _categoryRepositoryMock.Object,
                _mapperMock.Object,
                _environmentMock.Object);

            SeedTestData();
        }

        private void SeedTestData()
        {
            // Create a complete category
            var category = new Category
            {
                Id = 1,
                Name = "Test Category",
                Description = "Complete test category description"
            };

            // Create complete products with ALL required fields
            var product1 = new Product
            {
                Id = 1,
                Name = "Dark Chocolate Test",
                Description = "Premium dark chocolate for testing",
                Price = 5.99m,
                StockQuantity = 100,
                CategoryId = 1,
                ImageUrl = "/uploads/dark-chocolate.jpg",
                CocoaPercentage = "70%",
                Origin = "Ecuador",
                FlavorNotes = "Rich and intense with fruity notes",
                IsOrganic = false,
                IsFairTrade = true,
                Ingredients = "Organic cocoa mass, cane sugar, cocoa butter",
                WeightInGrams = 100,
                AllergenInfo = "May contain traces of nuts",
                AverageRating = 4.5,
                ReviewCount = 10,
                IsVisible = true
            };

            var product2 = new Product
            {
                Id = 2,
                Name = "Milk Chocolate Test",
                Description = "Creamy milk chocolate for testing",
                Price = 4.99m,
                StockQuantity = 150,
                CategoryId = 1,
                ImageUrl = "/uploads/milk-chocolate.jpg",
                CocoaPercentage = "35%",
                Origin = "Belgium",
                FlavorNotes = "Smooth and creamy with vanilla notes",
                IsOrganic = false,
                IsFairTrade = false,
                Ingredients = "Sugar, cocoa butter, milk powder, cocoa mass",
                WeightInGrams = 100,
                AllergenInfo = "Contains milk, may contain nuts",
                AverageRating = 4.2,
                ReviewCount = 8,
                IsVisible = true
            };

            _context.Categories.Add(category);
            _context.Products.AddRange(product1, product2);
            _context.SaveChanges();
        }

        [Fact]
        public async Task GetAllProductsAsync_ReturnsAllProducts()
        {
            // Arrange
            var products = new List<Product>
            {
                CreateCompleteProduct(1, "Product 1", 5.99m),
                CreateCompleteProduct(2, "Product 2", 7.99m)
            };

            var productDtos = new List<ProductDto>
            {
                new ProductDto { Id = 1, Name = "Product 1", Price = 5.99m },
                new ProductDto { Id = 2, Name = "Product 2", Price = 7.99m }
            };

            _productRepositoryMock.Setup(x => x.GetAllAsync())
                .ReturnsAsync(products);
            _mapperMock.Setup(x => x.Map<IEnumerable<ProductDto>>(products))
                .Returns(productDtos);

            // Act
            var result = await _service.GetAllProductsAsync();

            // Assert
            result.Should().HaveCount(2);
            result.Should().BeEquivalentTo(productDtos);
        }

        [Fact]
        public async Task GetProductByIdAsync_WithValidId_ReturnsProduct()
        {
            // Arrange
            var product = CreateCompleteProduct(1, "Test Product", 5.99m);
            var productDto = new ProductDto { Id = 1, Name = "Test Product", Price = 5.99m };

            _productRepositoryMock.Setup(x => x.GetByIdAsync(1))
                .ReturnsAsync(product);
            _mapperMock.Setup(x => x.Map<ProductDto>(product))
                .Returns(productDto);

            // Act
            var result = await _service.GetProductByIdAsync(1);

            // Assert
            result.Should().BeEquivalentTo(productDto);
        }

        [Fact]
        public async Task GetProductsByCategoryAsync_WithValidCategory_ReturnsProducts()
        {
            // Arrange
            var categoryId = 1;
            var products = new List<Product>
            {
                CreateCompleteProduct(1, "Dark Chocolate", 5.99m, categoryId),
                CreateCompleteProduct(2, "Milk Chocolate", 4.99m, categoryId)
            };

            var productDtos = new List<ProductDto>
            {
                new ProductDto { Id = 1, Name = "Dark Chocolate", Price = 5.99m, CategoryId = categoryId },
                new ProductDto { Id = 2, Name = "Milk Chocolate", Price = 4.99m, CategoryId = categoryId }
            };

            _productRepositoryMock.Setup(x => x.GetProductsByCategoryAsync(categoryId))
                .ReturnsAsync(products);
            _mapperMock.Setup(x => x.Map<IEnumerable<ProductDto>>(products))
                .Returns(productDtos);

            // Act
            var result = await _service.GetProductsByCategoryAsync(categoryId);

            // Assert
            result.Should().HaveCount(2);
            result.Should().BeEquivalentTo(productDtos);
        }

        [Fact]
        public async Task SearchProductsAsync_WithTerm_ReturnsMatchingProducts()
        {
            // Arrange
            var searchTerm = "chocolate";
            var products = new List<Product>
            {
                CreateCompleteProduct(1, "Dark Chocolate", 5.99m),
                CreateCompleteProduct(2, "Milk Chocolate", 4.99m)
            };

            var productDtos = new List<ProductDto>
            {
                new ProductDto { Id = 1, Name = "Dark Chocolate", Price = 5.99m },
                new ProductDto { Id = 2, Name = "Milk Chocolate", Price = 4.99m }
            };

            _productRepositoryMock.Setup(x => x.SearchProductsAsync(searchTerm))
                .ReturnsAsync(products);
            _mapperMock.Setup(x => x.Map<IEnumerable<ProductDto>>(products))
                .Returns(productDtos);

            // Act
            var result = await _service.SearchProductsAsync(searchTerm);

            // Assert
            result.Should().HaveCount(2);
            result.Should().BeEquivalentTo(productDtos);
        }

        [Fact]
        public async Task ToggleProductVisibilityAsync_WithValidId_TogglesVisibility()
        {
            // Arrange - Use the seeded product from SeedTestData
            var productId = 1;

            // Act
            var result = await _service.ToggleProductVisibilityAsync(productId);

            // Assert
            result.Success.Should().BeTrue();
            result.IsVisible.Should().BeFalse(); // Should be toggled from true to false

            // Verify in database
            var updatedProduct = await _context.Products.FindAsync(productId);
            updatedProduct.IsVisible.Should().BeFalse();
        }

        [Fact]
        public async Task ToggleProductVisibilityAsync_WithInvalidId_ReturnsFailure()
        {
            // Act
            var result = await _service.ToggleProductVisibilityAsync(999);

            // Assert
            result.Success.Should().BeFalse();
            result.Error.Should().Be("NotFound");
        }

        // Helper method to create complete Product entities
        private Product CreateCompleteProduct(int id, string name, decimal price, int categoryId = 1)
        {
            return new Product
            {
                Id = id,
                Name = name,
                Description = $"Complete description for {name}",
                Price = price,
                StockQuantity = 100,
                CategoryId = categoryId,
                ImageUrl = $"/uploads/{name.ToLower().Replace(" ", "-")}.jpg",
                CocoaPercentage = "70%",
                Origin = "Test Origin",
                FlavorNotes = "Test flavor notes",
                IsOrganic = false,
                IsFairTrade = true,
                Ingredients = "Test ingredients",
                WeightInGrams = 100,
                AllergenInfo = "Test allergen info",
                AverageRating = 4.0,
                ReviewCount = 5,
                IsVisible = true
            };
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}