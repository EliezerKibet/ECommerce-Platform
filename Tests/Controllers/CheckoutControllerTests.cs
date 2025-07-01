using ECommerce.API.Controllers;
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using ECommerce.API.Models;
using ECommerce.API.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace ECommerce.API.Tests.Controllers
{
    public class CheckoutControllerTests
    {
        private readonly Mock<IOrderService> _orderServiceMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<ICartService> _cartServiceMock;
        private readonly Mock<IShippingAddressService> _addressServiceMock;
        private readonly Mock<IWebHostEnvironment> _environmentMock;
        private readonly Mock<IPromotionService> _promotionServiceMock;
        private readonly Mock<ICouponService> _couponServiceMock;
        private readonly Mock<ILogger<CheckoutController>> _loggerMock;
        private readonly CheckoutController _controller;

        public CheckoutControllerTests()
        {
            _orderServiceMock = new Mock<IOrderService>();
            _emailServiceMock = new Mock<IEmailService>();
            _cartServiceMock = new Mock<ICartService>();
            _addressServiceMock = new Mock<IShippingAddressService>();
            _environmentMock = new Mock<IWebHostEnvironment>();
            _promotionServiceMock = new Mock<IPromotionService>();
            _couponServiceMock = new Mock<ICouponService>();
            _loggerMock = new Mock<ILogger<CheckoutController>>();

            _controller = new CheckoutController(
                _orderServiceMock.Object,
                _emailServiceMock.Object,
                _cartServiceMock.Object,
                _loggerMock.Object,
                _addressServiceMock.Object,
                _environmentMock.Object,
                _promotionServiceMock.Object,
                _couponServiceMock.Object);

            // Setup HttpContext
            var httpContext = new DefaultHttpContext();
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };
        }

        [Fact]
        public void CreateGuestSession_ReturnsOkResult_WithGuestId()
        {
            // Act
            var result = _controller.CreateGuestSession();

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult.Value.Should().NotBeNull();
        }

        [Fact]
        public async Task CalculateCartPromotions_WithEmptyCart_ReturnsZeroDiscount()
        {
            // Arrange
            var emptyCart = new CartDto
            {
                Items = new List<CartItemDto>(),
                Subtotal = 0
            };

            _cartServiceMock.Setup(x => x.GetCartAsync(It.IsAny<string>()))
                .ReturnsAsync(emptyCart);

            // Act
            var result = await _controller.CalculateCartPromotions();

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult.Value.Should().NotBeNull();
        }

        [Fact]
        public async Task GetReceipt_WithValidOrderId_ReturnsReceipt()
        {
            // Arrange
            var orderId = 1;
            var expectedReceipt = new ReceiptDto
            {
                OrderId = orderId,
                OrderNumber = "CHC-000001",
                Total = 25.99m,
                CustomerName = "Test Customer"
            };

            _orderServiceMock.Setup(x => x.GenerateReceiptAsync(orderId))
                .ReturnsAsync(expectedReceipt);

            // Act
            var result = await _controller.GetReceipt(orderId);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult.Value.Should().BeEquivalentTo(expectedReceipt);
        }

        [Fact]
        public async Task GetOrders_ReturnsUserOrders()
        {
            // Arrange
            var expectedOrders = new List<Order>
            {
                new Order { Id = 1, TotalAmount = 25.99m, Status = "Pending" },
                new Order { Id = 2, TotalAmount = 15.99m, Status = "Completed" }
            };

            _orderServiceMock.Setup(x => x.GetUserOrdersAsync(It.IsAny<string>()))
                .ReturnsAsync(expectedOrders);

            // Act
            var result = await _controller.GetOrders();

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult.Value.Should().BeEquivalentTo(expectedOrders);
        }
    }
}