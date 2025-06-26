// Controllers/CouponsController.cs
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/coupons")]
    public class CouponsController : ControllerBase
    {
        private readonly ICouponService _couponService;
        private readonly ILogger<CouponsController> _logger;

        public CouponsController(
            ICouponService couponService,
            ILogger<CouponsController> logger)
        {
            _couponService = couponService;
            _logger = logger;
        }

        [HttpPost("validate")]
        [AllowAnonymous]
        public async Task<ActionResult<CouponValidationResultDto>> ValidateCoupon([FromBody] ValidateCouponDto dto)
        {
            try
            {
                var result = await _couponService.ValidateCouponAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating coupon");
                return StatusCode(500, "An error occurred while validating the coupon");
            }
        }
    }
}