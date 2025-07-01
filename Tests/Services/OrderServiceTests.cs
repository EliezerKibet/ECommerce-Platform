using ECommerce.API.DTOs;
using ECommerce.API.Services;
using ECommerce.API.Interfaces;
using ECommerce.API.Data;
using ECommerce.API.Models;
using FluentAssertions;
using Moq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace ECommerce.API.Tests.Services
{
    public class OrderServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<ICartService> _cartServiceMock;
        private readonly Mock<ICouponService> _couponServiceMock;
        private readonly Mock<ILogger<OrderService>> _loggerMock;
        private readonly OrderService _service;

        public OrderServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _cartServiceMock = new Mock<ICartService>();
            _couponServiceMock = new Mock<ICouponService>();
            _loggerMock = new Mock<ILogger<OrderService>>();

            _service = new OrderService(
                _context,
                _cartServiceMock.Object,
                _couponServiceMock.Object,
                _loggerMock.Object);

            SeedTestData();
        }

        private void SeedTestData()
        {
            // Create complete Category
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
                Name = "Test Chocolate",
                Description = "Premium test chocolate with rich flavor",
                Price = 5.99m,
                StockQuantity = 100,
                CategoryId = 1,
                ImageUrl = "/uploads/test-chocolate.jpg",
                CocoaPercentage = "70%",
                Origin = "Ecuador",
                FlavorNotes = "Rich and smooth",
                IsOrganic = false,
                IsFairTrade = true,
                Ingredients = "Cocoa mass, sugar, cocoa butter",
                WeightInGrams = 100,
                AllergenInfo = "May contain nuts",
                AverageRating = 4.5,
                ReviewCount = 10,
                IsVisible = true
            };

            _context.Categories.Add(category);
            _context.Products.Add(product);
            _context.SaveChanges();
        }

        [Fact]
        public async Task CreateOrderFromCartAsync_WithValidData_ReturnsOrder()
        {
            // Arrange
            var userId = "test-user-123";
            var cartDto = new CartDto
            {
                Items = new List<CartItemDto>
                {
                    new CartItemDto
                    {
                        ProductId = 1,
                        Quantity = 2,
                        ProductPrice = 5.99m,
                        LineTotal = 11.98m,
                        ProductName = "Test Chocolate"
                    }
                },
                Subtotal = 11.98m,
                ItemCount = 2
            };

            var checkoutDto = new CheckoutDto
            {
                ShippingAddress = new ShippingAddressDto
                {
                    FullName = "Test User",
                    AddressLine1 = "123 Test St",
                    AddressLine2 = "",
                    City = "Test City",
                    State = "TS",
                    ZipCode = "12345",
                    Country = "USA",
                    PhoneNumber = "555-1234"
                },
                ShippingMethod = "standard",
                CustomerEmail = "test@example.com",
                OrderNotes = "Test order notes"
            };

            _cartServiceMock.Setup(x => x.GetCartAsync(userId))
                .ReturnsAsync(cartDto);
            _cartServiceMock.Setup(x => x.ClearCartAsync(userId))
                .ReturnsAsync(new CartDto());

            // Act
            var result = await _service.CreateOrderFromCartAsync(userId, checkoutDto);

            // Assert
            result.Should().NotBeNull();
            result.UserId.Should().Be(userId);
            result.Status.Should().Be("Pending");
            result.OrderItems.Should().HaveCount(1);
            result.CustomerEmail.Should().Be("test@example.com");
            result.ShippingName.Should().Be("Test User");
        }

        [Fact]
        public async Task CreateOrderFromCartAsync_WithEmptyCart_ThrowsException()
        {
            // Arrange
            var userId = "test-user-empty";
            var emptyCartDto = new CartDto
            {
                Items = new List<CartItemDto>(),
                Subtotal = 0,
                ItemCount = 0
            };

            var checkoutDto = new CheckoutDto
            {
                ShippingAddress = new ShippingAddressDto
                {
                    FullName = "Test User",
                    AddressLine1 = "123 Test St",
                    City = "Test City",
                    State = "TS",
                    ZipCode = "12345",
                    Country = "USA"
                }
            };

            _cartServiceMock.Setup(x => x.GetCartAsync(userId))
                .ReturnsAsync(emptyCartDto);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateOrderFromCartAsync(userId, checkoutDto));
        }

        [Fact]
        public async Task GetOrderByIdAsync_WithValidId_ReturnsOrder()
        {
            // Arrange
            var order = new Order
            {
                Id = 1,
                UserId = "test-user",
                TotalAmount = 25.99m,
                Status = "Pending",
                OrderDate = DateTime.UtcNow,
                CustomerEmail = "test@example.com",
                ShippingName = "Test User",
                ShippingAddressLine1 = "123 Test St",
                ShippingAddressLine2 = "",
                ShippingCity = "Test City",
                ShippingState = "TS",
                ShippingZipCode = "12345",
                ShippingCountry = "USA",
                ShippingPhoneNumber = "555-1234",
                PaymentMethod = "card",
                Subtotal = 20.99m,
                Tax = 1.68m,
                ShippingCost = 3.32m,
                DiscountAmount = 0
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetOrderByIdAsync(1);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(1);
            result.TotalAmount.Should().Be(25.99m);
            result.UserId.Should().Be("test-user");
            result.Status.Should().Be("Pending");
        }

        [Fact]
        public async Task GetOrderByIdAsync_WithInvalidId_ThrowsKeyNotFoundException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.GetOrderByIdAsync(999));
        }

        [Fact]
        public async Task GetUserOrdersAsync_WithValidUserId_ReturnsUserOrders()
        {
            // Arrange
            var userId = "test-user-123";
            var orders = new[]
            {
                CreateCompleteOrder(userId, 25.99m, "Pending"),
                CreateCompleteOrder(userId, 15.99m, "Completed")
            };

            _context.Orders.AddRange(orders);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetUserOrdersAsync(userId);

            // Assert
            result.Should().HaveCount(2);
            result.Should().OnlyContain(o => o.UserId == userId);
        }

        [Fact]
        public async Task GenerateReceiptAsync_WithValidOrderId_ReturnsReceipt()
        {
            // Arrange
            var order = CreateCompleteOrder("test-user", 25.99m, "Completed");
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GenerateReceiptAsync(order.Id);

            // Assert
            result.Should().NotBeNull();
            result.OrderId.Should().Be(order.Id);
            result.Total.Should().Be(25.99m);
            result.CustomerName.Should().Be("Test Customer");
            result.OrderStatus.Should().Be("Completed");
        }

        // Helper method to create complete Order entities
        private Order CreateCompleteOrder(string userId, decimal totalAmount, string status)
        {
            return new Order
            {
                UserId = userId,
                TotalAmount = totalAmount,
                Status = status,
                OrderDate = DateTime.UtcNow,
                CustomerEmail = "test@example.com",
                ShippingName = "Test Customer",
                ShippingAddressLine1 = "123 Test Street",
                ShippingAddressLine2 = "",
                ShippingCity = "Test City",
                ShippingState = "TS",
                ShippingZipCode = "12345",
                ShippingCountry = "USA",
                ShippingPhoneNumber = "555-1234",
                PaymentMethod = "card",
                ShippingMethod = "standard",
                Subtotal = totalAmount - 2.00m, // Subtract tax/shipping
                Tax = 1.00m,
                ShippingCost = 1.00m,
                DiscountAmount = 0,
                OrderNotes = "Test order notes"
            };
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}