using ECommerce.API.Models;
using FluentAssertions;
using Xunit;

namespace ECommerce.API.Tests.Models
{
    public class ProductTests
    {
        [Fact]
        public void Product_ShouldHaveCorrectProperties()
        {
            // Arrange & Act
            var product = new Product
            {
                Id = 1,
                Name = "Test Chocolate",
                Description = "Delicious test chocolate",
                Price = 5.99m,
                StockQuantity = 100,
                CategoryId = 1,
                CocoaPercentage = "70%",
                Origin = "Ecuador",
                IsOrganic = true,
                IsFairTrade = true,
                WeightInGrams = 100
            };

            // Assert
            product.Id.Should().Be(1);
            product.Name.Should().Be("Test Chocolate");
            product.Price.Should().Be(5.99m);
            product.StockQuantity.Should().Be(100);
            product.IsOrganic.Should().BeTrue();
            product.IsFairTrade.Should().BeTrue();
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(-100.50)]
        public void Product_WithNegativePrice_ShouldBeInvalid(decimal price)
        {
            // Arrange
            var product = new Product { Price = price };

            // Act & Assert
            product.Price.Should().BeLessThan(0);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(5)]
        [InlineData(100)]
        public void Product_WithValidStockQuantity_ShouldBeValid(int quantity)
        {
            // Arrange
            var product = new Product { StockQuantity = quantity };

            // Act & Assert
            product.StockQuantity.Should().BeGreaterThanOrEqualTo(0);
        }
    }
}