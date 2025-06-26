// Interfaces/ICouponService.cs
using ECommerce.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.API.Interfaces
{
    public interface ICouponService
    {
        Task<List<CouponDto>> GetAllCouponsAsync();
        Task<CouponDto> GetCouponByIdAsync(int id);
        Task<CouponDto> GetCouponByCodeAsync(string code);
        Task<CouponDto> CreateCouponAsync(CreateUpdateCouponDto dto);
        Task<CouponDto> UpdateCouponAsync(int id, CreateUpdateCouponDto dto);
        Task<bool> DeleteCouponAsync(int id);
        Task<CouponValidationResultDto> ValidateCouponAsync(ValidateCouponDto dto);
        Task<CouponDto> IncrementUsageAsync(string code);
    }
}