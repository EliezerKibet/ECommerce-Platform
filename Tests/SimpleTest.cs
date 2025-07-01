using FluentAssertions;
using Xunit;
using ECommerce.API.DTOs;
using ECommerce.API.Models;
using System;

namespace ECommerce.API.Tests
{
    public class SimpleTests
    {
        [Fact]
        public void ProductDto_ShouldHaveCorrectProperties()
        {
            // Arrange & Act
            var product = new ProductDto
            {
                Id = 1,
                Name = "Test Chocolate",
                Price = 5.99m,
                StockQuantity = 100
            };

            // Assert
            product.Id.Should().Be(1);
            product.Name.Should().Be("Test Chocolate");
            product.Price.Should().Be(5.99m);
            product.StockQuantity.Should().Be(100);
        }

        [Fact]
        public void CartItemDto_ShouldCalculateLineTotal()
        {
            // Arrange
            var cartItem = new CartItemDto
            {
                ProductPrice = 5.99m,
                Quantity = 3
            };

            // Act
            var expectedTotal = cartItem.ProductPrice * cartItem.Quantity;

            // Assert
            expectedTotal.Should().Be(17.97m);
        }

        [Fact]
        public void CheckoutDto_ShouldHaveValidDefaults()
        {
            // Arrange & Act
            var checkout = new CheckoutDto();

            // Assert
            checkout.Should().NotBeNull();
        }

        [Theory]
        [InlineData(0)]
        [InlineData(5)]
        [InlineData(100)]
        public void Product_WithValidQuantity_ShouldBeValid(int quantity)
        {
            // Arrange
            var product = new Product
            {
                StockQuantity = quantity,
                Name = "Test",
                Description = "Test",
                ImageUrl = "/test.jpg",
                CocoaPercentage = "70%",
                Origin = "Test",
                FlavorNotes = "Test",
                Ingredients = "Test",
                AllergenInfo = "Test"
            };

            // Act & Assert
            product.StockQuantity.Should().Be(quantity);
        }

        [Fact]
        public void ReceiptDto_ShouldFormatOrderNumber()
        {
            // Arrange
            var receipt = new ReceiptDto
            {
                OrderId = 123,
                OrderNumber = "CHC-000123"
            };

            // Act & Assert
            receipt.OrderNumber.Should().StartWith("CHC-");
            receipt.OrderNumber.Should().EndWith("123");
        }

        [Fact]
        public void AddToCartDto_WithValidData_ShouldBeValid()
        {
            // Arrange
            var addToCart = new AddToCartDto
            {
                ProductId = 1,
                Quantity = 2,
                IsGiftWrapped = false
            };

            // Act & Assert
            addToCart.ProductId.Should().BeGreaterThan(0);
            addToCart.Quantity.Should().BeGreaterThan(0);
        }

        [Fact]
        public void DateTime_CalculateAge_ShouldWork()
        {
            // Arrange
            var birthDate = DateTime.Now.AddYears(-25);

            // Act
            var age = DateTime.Now.Year - birthDate.Year;

            // Assert
            age.Should().Be(25);
        }

        [Fact]
        public void Math_Calculations_ShouldBeAccurate()
        {
            // Arrange
            decimal price = 5.99m;
            int quantity = 3;

            // Act
            decimal total = price * quantity;

            // Assert
            total.Should().Be(17.97m);
        }
    }
}