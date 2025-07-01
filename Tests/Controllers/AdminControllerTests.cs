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

namespace ECommerce.API.Tests.Controllers
{
    public class AdminControllerTests
    {
        private readonly Mock<IProductService> _productServiceMock;
        private readonly Mock<ICategoryService> _categoryServiceMock;
        private readonly Mock<ICouponService> _couponServiceMock;
        private readonly Mock<IPromotionService> _promotionServiceMock;
        private readonly Mock<IAnalyticsService> _analyticsServiceMock;
        private readonly Mock<ILogger<AdminController>> _loggerMock;
        private readonly AdminController _controller;

        public AdminControllerTests()
        {
            _productServiceMock = new Mock<IProductService>();
            _categoryServiceMock = new Mock<ICategoryService>();
            _couponServiceMock = new Mock<ICouponService>();
            _promotionServiceMock = new Mock<IPromotionService>();
            _analyticsServiceMock = new Mock<IAnalyticsService>();
            _loggerMock = new Mock<ILogger<AdminController>>();

            _controller = new AdminController(
                _productServiceMock.Object,
                _categoryServiceMock.Object,
                _couponServiceMock.Object,
                _promotionServiceMock.Object,
                _analyticsServiceMock.Object,
                _loggerMock.Object);

            // Setup HttpContext
            var httpContext = new DefaultHttpContext();
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };
        }

        [Fact]
        public async Task GetProducts_ReturnsOkResult_WithProducts()
        {
            // Arrange
            var products = new List<ProductDto>
            {
                new ProductDto { Id = 1, Name = "Admin Product 1", Price = 10.99m },
                new ProductDto { Id = 2, Name = "Admin Product 2", Price = 15.99m }
            };
            _productServiceMock.Setup(x => x.GetAllProductsAsync())
                .ReturnsAsync(products);

            // Act
            var result = await _controller.GetProducts();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult.Value.Should().BeEquivalentTo(products);
        }

        [Fact]
        public async Task CreateProduct_WithValidData_ReturnsCreatedResult()
        {
            // Arrange
            var productDto = new ProductCreateUpdateDto
            {
                Name = "New Chocolate",
                Description = "Delicious new chocolate",
                Price = 7.99m,
                StockQuantity = 100,
                CategoryId = 1,
                WeightInGrams = 100,
                CocoaPercentage = "70%"
            };

            var createdProduct = new ProductDto
            {
                Id = 1,
                Name = productDto.Name,
                Price = productDto.Price,
                CategoryId = productDto.CategoryId
            };

            _productServiceMock.Setup(x => x.CreateProductAsync(productDto, It.IsAny<IFormFile>()))
                .ReturnsAsync(createdProduct);

            // Act
            var result = await _controller.CreateProduct(productDto);

            // Assert
            result.Result.Should().BeOfType<CreatedAtActionResult>();
            var createdResult = result.Result as CreatedAtActionResult;
            createdResult.Value.Should().BeEquivalentTo(createdProduct);
        }

        [Fact]
        public async Task DeleteProduct_WithValidId_ReturnsNoContent()
        {
            // Arrange
            _productServiceMock.Setup(x => x.DeleteProductAsync(1))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeleteProduct(1);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task DeleteProduct_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            _productServiceMock.Setup(x => x.DeleteProductAsync(999))
                .ThrowsAsync(new KeyNotFoundException("Product with ID 999 not found"));

            // Act
            var result = await _controller.DeleteProduct(999);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }
    }
}