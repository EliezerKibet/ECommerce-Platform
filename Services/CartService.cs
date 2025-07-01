using AutoMapper;
using ECommerce.API.Data;
using ECommerce.API.DTOs;
using ECommerce.API.Models;
using Microsoft.EntityFrameworkCore;
using System;

namespace ECommerce.API.Services
{
    public class CartService : ICartService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CartService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<CartDto> GetCartAsync(string userId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                return await CreateCartAsync(userId);
            }

            return MapCartToDto(cart);
        }

        public async Task<CartDto> GetCartByIdAsync(int cartId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(c => c.Id == cartId);

            if (cart == null)
            {
                throw new KeyNotFoundException($"Cart with ID {cartId} not found.");
            }

            return MapCartToDto(cart);
        }

        public async Task<CartDto> CreateCartAsync(string userId)
        {
            var cart = new Cart
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();

            return MapCartToDto(cart);
        }

        public async Task<CartDto> AddToCartAsync(string userId, AddToCartDto addToCartDto)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Items = new List<CartItem>()
                };
                _context.Carts.Add(cart);
            }

            var product = await _context.Products.FindAsync(addToCartDto.ProductId);
            if (product == null)
            {
                throw new KeyNotFoundException($"Product with ID {addToCartDto.ProductId} not found.");
            }

            if (product.StockQuantity < addToCartDto.Quantity)
            {
                throw new InvalidOperationException("Not enough stock available.");
            }

            var existingItem = cart.Items.FirstOrDefault(i => i.ProductId == addToCartDto.ProductId);

            if (existingItem != null)
            {
                existingItem.Quantity += addToCartDto.Quantity;
                existingItem.IsGiftWrapped = addToCartDto.IsGiftWrapped;
                existingItem.GiftMessage = addToCartDto.GiftMessage;
            }
            else
            {
                var cartItem = new CartItem
                {
                    CartId = cart.Id,
                    ProductId = addToCartDto.ProductId,
                    Quantity = addToCartDto.Quantity,
                    AddedAt = DateTime.UtcNow,
                    IsGiftWrapped = addToCartDto.IsGiftWrapped,
                    GiftMessage = addToCartDto.GiftMessage
                };

                cart.Items.Add(cartItem);
            }

            cart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetCartAsync(userId);
        }

        public async Task<CartDto> UpdateCartItemAsync(string userId, int cartItemId, UpdateCartItemDto updateCartItemDto)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                throw new KeyNotFoundException("Cart not found.");
            }

            var cartItem = cart.Items.FirstOrDefault(i => i.Id == cartItemId);
            if (cartItem == null)
            {
                throw new KeyNotFoundException($"Cart item with ID {cartItemId} not found.");
            }

            var product = await _context.Products.FindAsync(cartItem.ProductId);
            if (product.StockQuantity < updateCartItemDto.Quantity)
            {
                throw new InvalidOperationException("Not enough stock available.");
            }

            cartItem.Quantity = updateCartItemDto.Quantity;
            cartItem.IsGiftWrapped = updateCartItemDto.IsGiftWrapped;
            cartItem.GiftMessage = updateCartItemDto.GiftMessage;

            cart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetCartAsync(userId);
        }

        public async Task<CartDto> RemoveFromCartAsync(string userId, int cartItemId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                throw new KeyNotFoundException("Cart not found.");
            }

            var cartItem = cart.Items.FirstOrDefault(i => i.Id == cartItemId);
            if (cartItem == null)
            {
                throw new KeyNotFoundException($"Cart item with ID {cartItemId} not found.");
            }

            cart.Items.Remove(cartItem);
            _context.CartItems.Remove(cartItem);

            cart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetCartAsync(userId);
        }

        public async Task<CartDto> ClearCartAsync(string userId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                throw new KeyNotFoundException("Cart not found.");
            }

            foreach (var item in cart.Items.ToList())
            {
                _context.CartItems.Remove(item);
            }

            cart.Items.Clear();
            cart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapCartToDto(cart);
        }

        public async Task<bool> TransferGuestCartAsync(int guestCartId, string userId)
        {
            var guestCart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.Id == guestCartId);

            if (guestCart == null)
            {
                throw new KeyNotFoundException($"Guest cart with ID {guestCartId} not found.");
            }

            var userCart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (userCart == null)
            {
                userCart = new Cart
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Items = new List<CartItem>()
                };
                _context.Carts.Add(userCart);
                await _context.SaveChangesAsync();
            }

            foreach (var guestItem in guestCart.Items)
            {
                var existingItem = userCart.Items.FirstOrDefault(i => i.ProductId == guestItem.ProductId);

                if (existingItem != null)
                {
                    existingItem.Quantity += guestItem.Quantity;
                    existingItem.IsGiftWrapped = guestItem.IsGiftWrapped;
                    existingItem.GiftMessage = guestItem.GiftMessage;
                }
                else
                {
                    var newItem = new CartItem
                    {
                        CartId = userCart.Id,
                        ProductId = guestItem.ProductId,
                        Quantity = guestItem.Quantity,
                        AddedAt = DateTime.UtcNow,
                        IsGiftWrapped = guestItem.IsGiftWrapped,
                        GiftMessage = guestItem.GiftMessage
                    };

                    userCart.Items.Add(newItem);
                }
            }

            userCart.UpdatedAt = DateTime.UtcNow;

            _context.CartItems.RemoveRange(guestCart.Items);
            _context.Carts.Remove(guestCart);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<CartDto> MergeCartsAsync(string sourceUserId, string targetUserId)
        {
            var sourceCart = await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(c => c.UserId == sourceUserId);

            if (sourceCart == null || !sourceCart.Items.Any())
            {
                return await GetCartAsync(targetUserId);
            }

            var targetCart = await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(c => c.UserId == targetUserId);

            if (targetCart == null)
            {
                targetCart = new Cart
                {
                    UserId = targetUserId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Items = new List<CartItem>()
                };
                _context.Carts.Add(targetCart);
                await _context.SaveChangesAsync();
            }

            foreach (var sourceItem in sourceCart.Items)
            {
                var existingItem = targetCart.Items.FirstOrDefault(i => i.ProductId == sourceItem.ProductId);

                if (existingItem != null)
                {
                    existingItem.Quantity += sourceItem.Quantity;
                    existingItem.IsGiftWrapped = sourceItem.IsGiftWrapped;
                    existingItem.GiftMessage = sourceItem.GiftMessage;
                }
                else
                {
                    var newItem = new CartItem
                    {
                        CartId = targetCart.Id,
                        ProductId = sourceItem.ProductId,
                        Quantity = sourceItem.Quantity,
                        IsGiftWrapped = sourceItem.IsGiftWrapped,
                        GiftMessage = sourceItem.GiftMessage,
                        AddedAt = DateTime.UtcNow
                    };
                    targetCart.Items.Add(newItem);
                }
            }

            targetCart.UpdatedAt = DateTime.UtcNow;

            _context.CartItems.RemoveRange(sourceCart.Items);

            _context.Carts.Remove(sourceCart);


            await _context.SaveChangesAsync();


            return MapCartToDto(targetCart);
        }

        private CartDto MapCartToDto(Cart cart)
        {

            var cartDto = new CartDto
            {
                Id = cart.Id,
                UserId = cart.UserId,
                CreatedAt = cart.CreatedAt,
                UpdatedAt = cart.UpdatedAt,
                Items = new List<CartItemDto>(),
                ItemCount = cart.Items.Sum(i => i.Quantity)
            };

            decimal subtotal = 0;

            foreach (var item in cart.Items)
            {
                var product = item.Product;
                decimal lineTotal = product.Price * item.Quantity;
                subtotal += lineTotal;

                var itemDto = new CartItemDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    ProductName = product.Name,
                    ProductImageUrl = product.ImageUrl,
                    ProductPrice = product.Price,
                    Quantity = item.Quantity,
                    LineTotal = lineTotal,
                    IsGiftWrapped = item.IsGiftWrapped,
                    GiftMessage = item.GiftMessage,
                    CocoaPercentage = product.CocoaPercentage,
                    Origin = product.Origin
                };

                cartDto.Items.Add(itemDto);
            }


            const decimal taxRate = 0.08m; // 8% tax
            cartDto.Subtotal = subtotal;
            cartDto.Tax = Math.Round(subtotal * taxRate, 2);
            cartDto.Total = cartDto.Subtotal + cartDto.Tax;

            return cartDto;
        }
    }
}