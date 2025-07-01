using ECommerce.API.Controllers;
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using System.Text.Json;

namespace ECommerce.API.Tests.Controllers
{
    public class ProductsControllerTests
    {
        private readonly Mock<IProductService> _productServiceMock;
        private readonly Mock<IReviewService> _reviewServiceMock;
        private readonly Mock<IPromotionService> _promotionServiceMock;
        private readonly Mock<ILogger<ProductsController>> _loggerMock;
        private readonly ProductsController _controller;

        public ProductsControllerTests()
        {
            _productServiceMock = new Mock<IProductService>();
            _reviewServiceMock = new Mock<IReviewService>();
            _promotionServiceMock = new Mock<IPromotionService>();
            _loggerMock = new Mock<ILogger<ProductsController>>();

            _controller = new ProductsController(
                _productServiceMock.Object,
                _reviewServiceMock.Object,
                _promotionServiceMock.Object,
                _loggerMock.Object);

            // Setup HttpContext with proper cookie collection
            var httpContext = new DefaultHttpContext();
            var cookieCollection = new Mock<IRequestCookieCollection>();

            // Mock empty favorites cookie
            cookieCollection.Setup(x => x.TryGetValue("ChocolateFavorites", out It.Ref<string>.IsAny))
                .Returns(false);
            cookieCollection.Setup(x => x.TryGetValue("RecentlyViewed", out It.Ref<string>.IsAny))
                .Returns(false);

            httpContext.Request.Cookies = cookieCollection.Object;

            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };
        }

        [Fact]
        public async Task GetProducts_ReturnsOkResult_WithEnhancedProducts()
        {
            // Arrange
            var products = new List<ProductDto>
            {
                new ProductDto { Id = 1, Name = "Dark Chocolate", Price = 5.99m },
                new ProductDto { Id = 2, Name = "Milk Chocolate", Price = 4.99m }
            };
            _productServiceMock.Setup(x => x.GetAllProductsAsync())
                .ReturnsAsync(products);

            // Act
            var result = await _controller.GetProducts();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult.Value.Should().NotBeNull();

            // The controller returns anonymous objects with Product and IsFavorite properties
            var enhancedProducts = okResult.Value as IEnumerable<object>;
            enhancedProducts.Should().NotBeNull();
            enhancedProducts.Should().HaveCount(2);
        }

        [Fact]
        public async Task GetProduct_WithValidId_ReturnsOkResult()
        {
            // Arrange
            var product = new ProductDto
            {
                Id = 1,
                Name = "Test Chocolate",
                Price = 5.99m,
                CategoryId = 1,
                CategoryName = "Dark Chocolate"
            };

            _productServiceMock.Setup(x => x.GetProductByIdAsync(1))
                .ReturnsAsync(product);

            _promotionServiceMock.Setup(x => x.GetProductPromotionAsync(1))
                .ThrowsAsync(new KeyNotFoundException());

            // Act
            var result = await _controller.GetProduct(1);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult.Value.Should().NotBeNull();

            // The controller returns an anonymous object with Product and IsFavorite properties
            var responseValue = okResult.Value;
            responseValue.Should().NotBeNull();
        }

        [Fact]
        public async Task GetProduct_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            _productServiceMock.Setup(x => x.GetProductByIdAsync(999))
                .ReturnsAsync((ProductDto)null);

            // Act
            var result = await _controller.GetProduct(999);

            // Assert
            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [Theory]
        [InlineData("dark")]
        [InlineData("milk")]
        [InlineData("chocolate")]
        public async Task SearchProducts_WithValidTerm_ReturnsEnhancedProducts(string searchTerm)
        {
            // Arrange
            var products = new List<ProductDto>
            {
                new ProductDto { Id = 1, Name = $"{searchTerm} Chocolate", Price = 5.99m }
            };

            _productServiceMock.Setup(x => x.SearchProductsAsync(searchTerm))
                .ReturnsAsync(products);

            // Act
            var result = await _controller.SearchProducts(searchTerm);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult.Value.Should().NotBeNull();

            // The controller returns enhanced products (anonymous objects with Product and IsFavorite)
            var enhancedProducts = okResult.Value as IEnumerable<object>;
            enhancedProducts.Should().NotBeNull();
            enhancedProducts.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetFavoriteProducts_WithNoFavorites_ReturnsEmptyList()
        {
            // Arrange - favorites cookie is already mocked to return false in constructor

            // Act
            var result = await _controller.GetFavoriteProducts();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var products = okResult.Value as IEnumerable<object>;
            products.Should().NotBeNull();
            products.Should().BeEmpty();
        }

        [Fact]
        public async Task AddToFavorites_WithValidProduct_ReturnsSuccess()
        {
            // Arrange
            var product = new ProductDto { Id = 1, Name = "Test Chocolate", Price = 5.99m };
            _productServiceMock.Setup(x => x.GetProductByIdAsync(1))
                .ReturnsAsync(product);

            // Act
            var result = await _controller.AddToFavorites(1);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult.Value.Should().NotBeNull();
        }

        [Fact]
        public async Task AddToFavorites_WithInvalidProduct_ReturnsNotFound()
        {
            // Arrange
            _productServiceMock.Setup(x => x.GetProductByIdAsync(999))
                .ReturnsAsync((ProductDto)null);

            // Act
            var result = await _controller.AddToFavorites(999);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }
    }
}