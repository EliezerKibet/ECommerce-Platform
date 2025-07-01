using ECommerce.API.Data;
using ECommerce.API.DTOs;
using ECommerce.API.Models;
using ECommerce.API.Services;
using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace ECommerce.API.Tests.Services
{
    public class CartServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IMapper> _mapperMock;
        private readonly CartService _service;

        public CartServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _mapperMock = new Mock<IMapper>();
            _service = new CartService(_context, _mapperMock.Object);

            SeedTestData();
        }

        private void SeedTestData()
        {
            // Create complete Category with all required fields
            var category = new Category
            {
                Id = 1,
                Name = "Test Category",
                Description = "Complete test category description"
            };

            // Create complete Product with ALL required fields
            var product = new Product
            {
                Id = 1,
                Name = "Test Chocolate Product",
                Description = "Complete test product description with all details",
                Price = 5.99m,
                StockQuantity = 100,
                CategoryId = 1,
                ImageUrl = "/uploads/test-product.jpg",
                CocoaPercentage = "70%",
                Origin = "Ecuador",
                FlavorNotes = "Rich and smooth with hints of vanilla",
                IsOrganic = false,
                IsFairTrade = true,
                Ingredients = "Organic cocoa mass, cane sugar, cocoa butter, natural vanilla",
                WeightInGrams = 100,
                AllergenInfo = "May contain traces of nuts and milk",
                AverageRating = 4.5,
                ReviewCount = 0,
                IsVisible = true
            };

            _context.Categories.Add(category);
            _context.Products.Add(product);
            _context.SaveChanges();
        }

        [Fact]
        public async Task GetCartAsync_WithNewUser_CreatesNewCart()
        {
            // Arrange
            string userId = "new-user-123";
            var expectedCartDto = new CartDto
            {
                UserId = userId,
                Items = new List<CartItemDto>(),
                Subtotal = 0,
                Total = 0,
                ItemCount = 0
            };

            _mapperMock.Setup(x => x.Map<CartDto>(It.IsAny<Cart>()))
                .Returns(expectedCartDto);

            // Act
            var result = await _service.GetCartAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.UserId.Should().Be(userId);
            result.Items.Should().BeEmpty();
            result.Subtotal.Should().Be(0);
        }

        [Fact]
        public async Task AddToCartAsync_WithValidProduct_ReturnsCartWithItem()
        {
            // Arrange
            string userId = "test-user-123";
            var addToCartDto = new AddToCartDto
            {
                ProductId = 1,
                Quantity = 2,
                IsGiftWrapped = false,
                GiftMessage = ""
            };

            var expectedCartDto = new CartDto
            {
                UserId = userId,
                Items = new List<CartItemDto>
                {
                    new CartItemDto
                    {
                        ProductId = 1,
                        Quantity = 2,
                        ProductName = "Test Chocolate Product",
                        ProductPrice = 5.99m,
                        LineTotal = 11.98m,
                        IsGiftWrapped = false,
                        GiftMessage = ""
                    }
                },
                Subtotal = 11.98m,
                Total = 11.98m,
                ItemCount = 1
            };

            _mapperMock.Setup(x => x.Map<CartDto>(It.IsAny<Cart>()))
                .Returns(expectedCartDto);

            // Act
            var result = await _service.AddToCartAsync(userId, addToCartDto);

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(1);
            result.Items.First().ProductId.Should().Be(1);
            result.Items.First().Quantity.Should().Be(2);
            result.Subtotal.Should().Be(11.98m);
        }

        [Fact]
        public async Task AddToCartAsync_WithInvalidProduct_ThrowsKeyNotFoundException()
        {
            // Arrange
            string userId = "test-user-123";
            var addToCartDto = new AddToCartDto
            {
                ProductId = 999, // Non-existent product
                Quantity = 1,
                IsGiftWrapped = false
            };

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.AddToCartAsync(userId, addToCartDto));
        }

        
        public void Dispose()
        {
            _context.Dispose();
        }
    }
}