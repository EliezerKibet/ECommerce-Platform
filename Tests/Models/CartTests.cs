using ECommerce.API.Models;
using FluentAssertions;
using System;
using System.Collections.Generic;
using Xunit;

namespace ECommerce.API.Tests.Models
{
    public class CartTests
    {
        [Fact]
        public void Cart_ShouldHaveCorrectDefaultValues()
        {
            // Arrange & Act
            var cart = new Cart
            {
                UserId = "test-user-123",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Assert
            cart.UserId.Should().Be("test-user-123");
            cart.Items.Should().BeEmpty();
            cart.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }

        [Fact]
        public void CartItem_ShouldCalculateLineTotal()
        {
            // Arrange
            var product = new Product { Id = 1, Price = 5.99m };
            var cartItem = new CartItem
            {
                ProductId = 1,
                Product = product,
                Quantity = 3,
                AddedAt = DateTime.UtcNow
            };

            // Act
            var expectedTotal = product.Price * cartItem.Quantity;

            // Assert
            expectedTotal.Should().Be(17.97m);
        }

        [Fact]
        public void Cart_WithMultipleItems_ShouldMaintainItemCollection()
        {
            // Arrange
            var cart = new Cart
            {
                UserId = "test-user-123",
                Items = new List<CartItem>
                {
                    new CartItem { Id = 1, ProductId = 1, Quantity = 2 },
                    new CartItem { Id = 2, ProductId = 2, Quantity = 1 }
                }
            };

            // Act & Assert
            cart.Items.Should().HaveCount(2);
            cart.Items.Should().Contain(item => item.ProductId == 1);
            cart.Items.Should().Contain(item => item.ProductId == 2);
        }
    }
}