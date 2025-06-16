// Services/CouponService.cs
using ECommerce.API.Data;
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using ECommerce.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ECommerce.API.Services
{
    public class CouponService : ICouponService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CouponService> _logger;

        public CouponService(
            ApplicationDbContext context,
            ILogger<CouponService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<CouponDto>> GetAllCouponsAsync()
        {
            var coupons = await _context.Coupons
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return coupons.Select(MapToDto).ToList();
        }

        public async Task<CouponDto> GetCouponByIdAsync(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);

            if (coupon == null)
                throw new KeyNotFoundException($"Coupon with ID {id} not found");

            return MapToDto(coupon);
        }

        public async Task<CouponDto> GetCouponByCodeAsync(string code)
        {
            if (string.IsNullOrEmpty(code))
                throw new ArgumentException("Coupon code cannot be empty", nameof(code));

            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code.ToLower() == code.ToLower());

            if (coupon == null)
                throw new KeyNotFoundException($"Coupon with code '{code}' not found");

            return MapToDto(coupon);
        }

        public async Task<CouponDto> CreateCouponAsync(CreateUpdateCouponDto dto)
        {
            // Check for duplicate code
            var existingCoupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code.ToLower() == dto.Code.ToLower());

            if (existingCoupon != null)
                throw new InvalidOperationException($"Coupon with code '{dto.Code}' already exists");

            // Validate dates
            if (dto.StartDate >= dto.EndDate)
                throw new InvalidOperationException("End date must be after start date");

            // Create new coupon
            var coupon = new Coupon
            {
                Code = dto.Code.ToUpper(),
                Description = dto.Description,
                DiscountType = dto.DiscountType,
                DiscountAmount = dto.DiscountAmount,
                MinimumOrderAmount = dto.MinimumOrderAmount,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                UsageLimit = dto.UsageLimit,
                TimesUsed = 0,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Coupons.Add(coupon);
            await _context.SaveChangesAsync();

            return MapToDto(coupon);
        }

        public async Task<CouponDto> UpdateCouponAsync(int id, CreateUpdateCouponDto dto)
        {
            var coupon = await _context.Coupons.FindAsync(id);

            if (coupon == null)
                throw new KeyNotFoundException($"Coupon with ID {id} not found");

            // Check for duplicate code
            var existingCoupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code.ToLower() == dto.Code.ToLower() && c.Id != id);

            if (existingCoupon != null)
                throw new InvalidOperationException($"Coupon with code '{dto.Code}' already exists");

            // Validate dates
            if (dto.StartDate >= dto.EndDate)
                throw new InvalidOperationException("End date must be after start date");

            // Update coupon
            coupon.Code = dto.Code.ToUpper();
            coupon.Description = dto.Description;
            coupon.DiscountType = dto.DiscountType;
            coupon.DiscountAmount = dto.DiscountAmount;
            coupon.MinimumOrderAmount = dto.MinimumOrderAmount;
            coupon.StartDate = dto.StartDate;
            coupon.EndDate = dto.EndDate;
            coupon.UsageLimit = dto.UsageLimit;
            coupon.IsActive = dto.IsActive;
            coupon.UpdatedAt = DateTime.UtcNow;

            _context.Coupons.Update(coupon);
            await _context.SaveChangesAsync();

            return MapToDto(coupon);
        }

        public async Task<bool> DeleteCouponAsync(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);

            if (coupon == null)
                return false;

            _context.Coupons.Remove(coupon);
            await _context.SaveChangesAsync();

            return true;
        }

        // Update your CouponService.ValidateCouponAsync method to match your simplified DTO:

        public async Task<CouponValidationResultDto> ValidateCouponAsync(ValidateCouponDto dto)
        {
            string requestId = Guid.NewGuid().ToString("N").Substring(0, 8);
            _logger.LogInformation("[{RequestId}] Validating coupon: {Code} for order amount: ${OrderAmount} (promotion discount: ${PromotionDiscount})",
                requestId, dto.Code, dto.OrderAmount, dto.PromotionDiscount);

            if (string.IsNullOrEmpty(dto.Code))
            {
                _logger.LogWarning("[{RequestId}] Empty coupon code provided", requestId);
                return new CouponValidationResultDto
                {
                    IsValid = false,
                    Message = "Coupon code cannot be empty",
                    DiscountAmount = 0,
                    FinalAmount = dto.OrderAmount
                };
            }

            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code.ToLower() == dto.Code.ToLower());

            if (coupon == null)
            {
                _logger.LogWarning("[{RequestId}] Coupon not found: {Code}", requestId, dto.Code);
                return new CouponValidationResultDto
                {
                    IsValid = false,
                    Message = "Invalid coupon code",
                    DiscountAmount = 0,
                    FinalAmount = dto.OrderAmount
                };
            }

            _logger.LogInformation("[{RequestId}] Found coupon: {CouponId} - {CouponCode}, Type: {DiscountType}, Amount: {DiscountAmount}, MinOrder: ${MinimumOrderAmount}",
                requestId, coupon.Id, coupon.Code, coupon.DiscountType, coupon.DiscountAmount, coupon.MinimumOrderAmount);

            // Check if coupon is active
            if (!coupon.IsActive)
            {
                _logger.LogWarning("[{RequestId}] Coupon is inactive: {Code}", requestId, dto.Code);
                return new CouponValidationResultDto
                {
                    IsValid = false,
                    Message = "This coupon is no longer active",
                    DiscountAmount = 0,
                    FinalAmount = dto.OrderAmount
                };
            }

            // Check dates
            var now = DateTime.UtcNow;
            if (now < coupon.StartDate || now > coupon.EndDate)
            {
                _logger.LogWarning("[{RequestId}] Coupon is outside valid date range: {Code} (Start: {StartDate}, End: {EndDate}, Now: {Now})",
                    requestId, dto.Code, coupon.StartDate, coupon.EndDate, now);
                return new CouponValidationResultDto
                {
                    IsValid = false,
                    Message = "This coupon is not valid at this time",
                    DiscountAmount = 0,
                    FinalAmount = dto.OrderAmount
                };
            }

            // Check usage limit
            if (coupon.UsageLimit.HasValue && coupon.TimesUsed >= coupon.UsageLimit.Value)
            {
                _logger.LogWarning("[{RequestId}] Coupon usage limit exceeded: {Code} (Used: {TimesUsed}, Limit: {UsageLimit})",
                    requestId, dto.Code, coupon.TimesUsed, coupon.UsageLimit.Value);
                return new CouponValidationResultDto
                {
                    IsValid = false,
                    Message = "This coupon has reached its usage limit",
                    DiscountAmount = 0,
                    FinalAmount = dto.OrderAmount
                };
            }

            // 🔧 KEY FIX: Check minimum order amount against ORIGINAL order amount (before promotions)
            // This is the standard e-commerce practice - promotions shouldn't disqualify customers from coupons
            if (dto.OrderAmount < coupon.MinimumOrderAmount)
            {
                _logger.LogWarning("[{RequestId}] Order amount ${OrderAmount} is below minimum ${MinimumOrderAmount} for coupon {Code}",
                    requestId, dto.OrderAmount, coupon.MinimumOrderAmount, dto.Code);
                return new CouponValidationResultDto
                {
                    IsValid = false,
                    Message = $"This coupon requires a minimum order of ${coupon.MinimumOrderAmount:F2}",
                    DiscountAmount = 0,
                    FinalAmount = dto.OrderAmount
                };
            }


            // 🔧 KEY FIX: Calculate discount based on amount AFTER promotions
            decimal amountForDiscount = Math.Max(0, dto.OrderAmount - dto.PromotionDiscount);
            decimal discountAmount = 0;

            if (coupon.DiscountType == "Percentage")
            {
                discountAmount = amountForDiscount * (coupon.DiscountAmount / 100);
                _logger.LogInformation("[{RequestId}] Percentage discount calculation: {AmountForDiscount} * {DiscountPercentage}% = ${DiscountAmount}",
                    requestId, amountForDiscount, coupon.DiscountAmount, discountAmount);
            }
            else // FixedAmount
            {
                discountAmount = Math.Min(coupon.DiscountAmount, amountForDiscount);
                _logger.LogInformation("[{RequestId}] Fixed discount calculation: Min({FixedAmount}, {AmountForDiscount}) = ${DiscountAmount}",
                    requestId, coupon.DiscountAmount, amountForDiscount, discountAmount);
            }

            decimal finalAmount = Math.Max(0, amountForDiscount - discountAmount);

            _logger.LogInformation("[{RequestId}] ✅ Coupon validation successful for {Code}: Discount=${DiscountAmount}, Final=${FinalAmount}",
                requestId, dto.Code, discountAmount, finalAmount);

            return new CouponValidationResultDto
            {
                IsValid = true,
                Message = "Coupon applied successfully",
                Coupon = MapToDto(coupon),
                DiscountAmount = discountAmount,
                FinalAmount = finalAmount
            };
        }

        public async Task<CouponDto> IncrementUsageAsync(string code)
        {
            if (string.IsNullOrEmpty(code))
                throw new ArgumentException("Coupon code cannot be empty", nameof(code));

            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code.ToLower() == code.ToLower());

            if (coupon == null)
                throw new KeyNotFoundException($"Coupon with code '{code}' not found");

            coupon.TimesUsed++;
            coupon.UpdatedAt = DateTime.UtcNow;

            _context.Coupons.Update(coupon);
            await _context.SaveChangesAsync();

            return MapToDto(coupon);
        }

        private CouponDto MapToDto(Coupon coupon)
        {
            return new CouponDto
            {
                Id = coupon.Id,
                Code = coupon.Code,
                Description = coupon.Description,
                DiscountType = coupon.DiscountType,
                DiscountAmount = coupon.DiscountAmount,
                MinimumOrderAmount = coupon.MinimumOrderAmount,
                StartDate = coupon.StartDate,
                EndDate = coupon.EndDate,
                UsageLimit = coupon.UsageLimit,
                TimesUsed = coupon.TimesUsed,
                IsActive = coupon.IsActive
            };
        }
    }
}