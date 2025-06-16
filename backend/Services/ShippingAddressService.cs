using ECommerce.API.Data;
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using ECommerce.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Services
{
    public class ShippingAddressService : IShippingAddressService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ShippingAddressService> _logger;

        public ShippingAddressService(ApplicationDbContext context, ILogger<ShippingAddressService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<ShippingAddressDto>> GetUserAddressesAsync(string userId)
        {
            // Add a safety check
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("GetUserAddressesAsync called with null or empty userId");
                return new List<ShippingAddressDto>();
            }

            var addresses = await _context.ShippingAddresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.LastUsed)
                .ToListAsync();

            return addresses.Select(MapToDto).ToList();
        }

        public async Task<ShippingAddressDto> GetAddressByIdAsync(int id)
        {
            var address = await _context.ShippingAddresses.FindAsync(id);
            if (address == null)
                throw new KeyNotFoundException($"Address with ID {id} not found");

            return MapToDto(address);
        }

        public async Task<ShippingAddressDto> SaveAddressAsync(string userId, ShippingAddressDto addressDto)
        {
            // Check if this is a duplicate address
            var existingAddress = await _context.ShippingAddresses
                .Where(a => a.UserId == userId &&
                       a.FullName.ToLower() == addressDto.FullName.ToLower() &&
                       a.AddressLine1.ToLower() == addressDto.AddressLine1.ToLower() &&
                       a.City.ToLower() == addressDto.City.ToLower() &&
                       a.ZipCode.ToLower() == addressDto.ZipCode.ToLower() &&
                       a.Country.ToLower() == addressDto.Country.ToLower())
                .FirstOrDefaultAsync();

            if (existingAddress != null)
            {
                // Update existing address usage
                existingAddress.LastUsed = DateTime.UtcNow;
                existingAddress.UseCount++;

                if (addressDto.IsDefault)
                {
                    await ClearDefaultAddressesAsync(userId);
                    existingAddress.IsDefault = true;
                }

                _context.ShippingAddresses.Update(existingAddress);
                await _context.SaveChangesAsync();

                return MapToDto(existingAddress);
            }

            // Create new address
            var address = new ShippingAddress
            {
                UserId = userId,
                FullName = addressDto.FullName,
                AddressLine1 = addressDto.AddressLine1,
                AddressLine2 = addressDto.AddressLine2,
                City = addressDto.City,
                State = addressDto.State,
                ZipCode = addressDto.ZipCode,
                Country = addressDto.Country,
                PhoneNumber = addressDto.PhoneNumber,
                IsDefault = addressDto.IsDefault,
                CreatedAt = DateTime.UtcNow,
                LastUsed = DateTime.UtcNow
            };

            // If this is the first address or set as default
            if (addressDto.IsDefault || !await _context.ShippingAddresses.AnyAsync(a => a.UserId == userId))
            {
                await ClearDefaultAddressesAsync(userId);
                address.IsDefault = true;
            }

            _context.ShippingAddresses.Add(address);
            await _context.SaveChangesAsync();

            return MapToDto(address);
        }

        public async Task<ShippingAddressDto> SetDefaultAddressAsync(string userId, int addressId)
        {
            var address = await _context.ShippingAddresses
                .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

            if (address == null)
                throw new KeyNotFoundException($"Address with ID {addressId} not found");

            await ClearDefaultAddressesAsync(userId);

            address.IsDefault = true;
            address.LastUsed = DateTime.UtcNow;
            _context.ShippingAddresses.Update(address);

            await _context.SaveChangesAsync();

            return MapToDto(address);
        }

        public async Task<bool> DeleteAddressAsync(int id, string userId)
        {
            var address = await _context.ShippingAddresses
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

            if (address == null)
                return false;

            _context.ShippingAddresses.Remove(address);

            // If it was the default address, set a new default
            if (address.IsDefault)
            {
                var newDefaultAddress = await _context.ShippingAddresses
                    .Where(a => a.UserId == userId && a.Id != id)
                    .OrderByDescending(a => a.UseCount)
                    .FirstOrDefaultAsync();

                if (newDefaultAddress != null)
                {
                    newDefaultAddress.IsDefault = true;
                    _context.ShippingAddresses.Update(newDefaultAddress);
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task UpdateAddressUsageAsync(int id)
        {
            var address = await _context.ShippingAddresses.FindAsync(id);
            if (address != null)
            {
                address.UseCount++;
                address.LastUsed = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        private async Task ClearDefaultAddressesAsync(string userId)
        {
            var defaultAddresses = await _context.ShippingAddresses
                .Where(a => a.UserId == userId && a.IsDefault)
                .ToListAsync();

            foreach (var address in defaultAddresses)
            {
                address.IsDefault = false;
                _context.ShippingAddresses.Update(address);
            }
        }

        private ShippingAddressDto MapToDto(ShippingAddress address)
        {
            return new ShippingAddressDto
            {
                Id = address.Id,
                FullName = address.FullName,
                AddressLine1 = address.AddressLine1,
                AddressLine2 = address.AddressLine2,
                City = address.City,
                State = address.State,
                ZipCode = address.ZipCode,
                Country = address.Country,
                PhoneNumber = address.PhoneNumber,
                IsDefault = address.IsDefault,
                UseCount = address.UseCount,
                UserId = address.UserId,
                Email = null
            };
        }

        public async Task<ShippingAddressDto> SaveGuestAddressAsync(string guestId, ShippingAddressDto addressDto)
        {
            // Check if this is a duplicate address for this guest
            var existingAddress = await _context.ShippingAddresses
                .Where(a => a.UserId == guestId &&
                       a.FullName.ToLower() == addressDto.FullName.ToLower() &&
                       a.AddressLine1.ToLower() == addressDto.AddressLine1.ToLower() &&
                       a.City.ToLower() == addressDto.City.ToLower() &&
                       a.ZipCode.ToLower() == addressDto.ZipCode.ToLower() &&
                       a.Country.ToLower() == addressDto.Country.ToLower())
                .FirstOrDefaultAsync();

            if (existingAddress != null)
            {
                // Update existing address usage
                existingAddress.LastUsed = DateTime.UtcNow;
                existingAddress.UseCount++;

                if (addressDto.IsDefault)
                {
                    await ClearDefaultAddressesAsync(guestId);
                    existingAddress.IsDefault = true;
                }

                _context.ShippingAddresses.Update(existingAddress);
                await _context.SaveChangesAsync();

                return MapToDto(existingAddress);
            }

            // Create new address for guest
            var address = new ShippingAddress
            {
                UserId = guestId,
                FullName = addressDto.FullName,
                AddressLine1 = addressDto.AddressLine1,
                AddressLine2 = addressDto.AddressLine2,
                City = addressDto.City,
                State = addressDto.State,
                ZipCode = addressDto.ZipCode,
                Country = addressDto.Country,
                PhoneNumber = addressDto.PhoneNumber,
                IsDefault = addressDto.IsDefault,
                CreatedAt = DateTime.UtcNow,
                LastUsed = DateTime.UtcNow,
                UseCount = 1
            };

            // If this is the first address or set as default
            if (addressDto.IsDefault || !await _context.ShippingAddresses.AnyAsync(a => a.UserId == guestId))
            {
                await ClearDefaultAddressesAsync(guestId);
                address.IsDefault = true;
            }

            _context.ShippingAddresses.Add(address);
            await _context.SaveChangesAsync();

            return MapToDto(address);
        }

        public async Task ConvertGuestAddressesToUserAsync(string guestId, string userId)
        {
            var guestAddresses = await _context.ShippingAddresses
                .Where(a => a.UserId == guestId)
                .ToListAsync();

            if (guestAddresses.Any())
            {
                // Check if user already has any addresses
                bool userHasAddresses = await _context.ShippingAddresses.AnyAsync(a => a.UserId == userId);

                foreach (var address in guestAddresses)
                {
                    // If this is a default address but user already has addresses,
                    // we'll respect the user's existing default
                    if (address.IsDefault && userHasAddresses)
                    {
                        address.IsDefault = false;
                    }

                    address.UserId = userId;
                    _context.ShippingAddresses.Update(address);
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Converted {Count} addresses from guest ID {GuestId} to user ID {UserId}",
                    guestAddresses.Count, guestId, userId);
            }
        }

        public async Task<ShippingAddressDto> UpdateAddressAsync(int addressId, string userId, ShippingAddressDto addressDto)
        {
            var existingAddress = await _context.ShippingAddresses
                .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

            if (existingAddress == null)
                throw new KeyNotFoundException("Address not found");

            // Update the properties (only fields that exist in your model)
            existingAddress.FullName = addressDto.FullName;
            existingAddress.AddressLine1 = addressDto.AddressLine1;
            existingAddress.AddressLine2 = addressDto.AddressLine2;
            existingAddress.City = addressDto.City;
            existingAddress.State = addressDto.State;
            existingAddress.ZipCode = addressDto.ZipCode;
            existingAddress.Country = addressDto.Country;
            existingAddress.PhoneNumber = addressDto.PhoneNumber;
            existingAddress.LastUsed = DateTime.UtcNow;
            existingAddress.UseCount += 1;

            await _context.SaveChangesAsync();

            // Manual mapping (only existing fields)
            return new ShippingAddressDto
            {
                Id = existingAddress.Id,
                UserId = existingAddress.UserId,
                FullName = existingAddress.FullName,
                AddressLine1 = existingAddress.AddressLine1,
                AddressLine2 = existingAddress.AddressLine2,
                City = existingAddress.City,
                State = existingAddress.State,
                ZipCode = existingAddress.ZipCode,
                Country = existingAddress.Country,
                PhoneNumber = existingAddress.PhoneNumber,
                IsDefault = existingAddress.IsDefault,
                UseCount = existingAddress.UseCount,
                Email = null // Assuming email is not part of the address model
            };
        }

    }
}
