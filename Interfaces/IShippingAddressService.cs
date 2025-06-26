using ECommerce.API.DTOs;

namespace ECommerce.API.Interfaces
{
    public interface IShippingAddressService
    {
        Task<List<ShippingAddressDto>> GetUserAddressesAsync(string userId);
        Task<ShippingAddressDto> GetAddressByIdAsync(int id);
        Task<ShippingAddressDto> SaveAddressAsync(string userId, ShippingAddressDto address);
        Task<ShippingAddressDto> SetDefaultAddressAsync(string userId, int addressId);
        Task<bool> DeleteAddressAsync(int id, string userId);
        Task UpdateAddressUsageAsync(int id);
        // Add this new method
        Task<ShippingAddressDto> SaveGuestAddressAsync(string guestId, ShippingAddressDto addressDto);

        // Optional: Add the address conversion method too
        Task ConvertGuestAddressesToUserAsync(string guestId, string userId);
        Task<ShippingAddressDto> UpdateAddressAsync(int addressId, string userId, ShippingAddressDto addressDto);
    }
}
