// Services/ProductService.cs
using AutoMapper;
using ECommerce.API.Data;
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using ECommerce.API.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace ECommerce.API.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;
        private readonly IProductRepository _productRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _environment;

        public ProductService(
            ApplicationDbContext context,
            IProductRepository productRepository,
            ICategoryRepository categoryRepository,
            IMapper mapper,
            IWebHostEnvironment environment)
        {
            _context = context;
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
            _mapper = mapper;
            _environment = environment;
        }

        public async Task<IEnumerable<ProductDto>> GetAllProductsAsync()
        {
            var products = await _productRepository.GetAllAsync();
            return _mapper.Map<IEnumerable<ProductDto>>(products);
        }

        public async Task<ProductDto> GetProductByIdAsync(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            return _mapper.Map<ProductDto>(product);
        }

        public async Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(int categoryId)
        {
            var products = await _productRepository.GetProductsByCategoryAsync(categoryId);
            return _mapper.Map<IEnumerable<ProductDto>>(products);
        }

        public async Task<IEnumerable<ProductDto>> SearchProductsAsync(string searchTerm)
        {
            var products = await _productRepository.SearchProductsAsync(searchTerm);
            return _mapper.Map<IEnumerable<ProductDto>>(products);
        }

        public async Task<ProductDto> CreateProductAsync(ProductCreateUpdateDto productDto, IFormFile image)
        {
            // Check if category exists
            var category = await _categoryRepository.GetByIdAsync(productDto.CategoryId);
            if (category == null)
                throw new KeyNotFoundException($"Category with ID {productDto.CategoryId} not found");

            // Process and save the image
            string imageUrl = await SaveImageAsync(image);

            // Create product entity
            var product = _mapper.Map<Product>(productDto);
            product.ImageUrl = imageUrl;

            // Save to database
            var createdProduct = await _productRepository.AddAsync(product);

            // Return mapped DTO
            return _mapper.Map<ProductDto>(createdProduct);
        }

        public async Task<ProductDto> UpdateProductAsync(int id, ProductCreateUpdateDto productDto)
        {
            // Check if product exists
            var existingProduct = await _productRepository.GetByIdAsync(id);
            if (existingProduct == null)
                throw new KeyNotFoundException($"Product with ID {id} not found");

            // Check if category exists
            var category = await _categoryRepository.GetByIdAsync(productDto.CategoryId);
            if (category == null)
                throw new KeyNotFoundException($"Category with ID {productDto.CategoryId} not found");

            // Update product properties
            _mapper.Map(productDto, existingProduct);

            // Process and save new image if provided
            if (productDto.Image != null)
            {
                string imageUrl = await SaveImageAsync(productDto.Image);
                existingProduct.ImageUrl = imageUrl;
            }

            // Save to database
            await _productRepository.UpdateAsync(existingProduct);

            // Return mapped DTO
            return _mapper.Map<ProductDto>(existingProduct);
        }

        public async Task DeleteProductAsync(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                throw new KeyNotFoundException($"Product with ID {id} not found");

            // Delete the image file if it exists
            if (!string.IsNullOrEmpty(product.ImageUrl))
            {
                var imagePath = Path.Combine(_environment.WebRootPath, product.ImageUrl.TrimStart('/'));
                if (File.Exists(imagePath))
                {
                    File.Delete(imagePath);
                }
            }

            await _productRepository.DeleteAsync(id);
        }

        private async Task<string> SaveImageAsync(IFormFile image)
        {
            if (image == null || image.Length == 0)
                return null;

            // Generate a unique filename
            string fileName = $"{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";

            // Create uploads directory if it doesn't exist
            string uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Save the file
            string filePath = Path.Combine(uploadsFolder, fileName);
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(fileStream);
            }

            // Return the relative URL
            return $"/uploads/{fileName}";
        }

        // In ProductService.cs
        public async Task<List<ProductDto>> GetProductsByIdsAsync(List<int> productIds)
        {
            if (productIds == null || !productIds.Any())
                return new List<ProductDto>();

            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();

            return products.Select(p => MapToDto(p)).ToList(); // Fixed MapToDto call
        }

        // Add the MapToDto method if it's not already there
        public ProductDto MapToDto(Product product)
        {
            return new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                StockQuantity = product.StockQuantity,
                ImageUrl = product.ImageUrl,
                CategoryId = product.CategoryId,
                CocoaPercentage = product.CocoaPercentage,
                Origin = product.Origin,
                FlavorNotes = product.FlavorNotes,
                IsOrganic = product.IsOrganic,
                IsFairTrade = product.IsFairTrade,
                Ingredients = product.Ingredients,
                WeightInGrams = product.WeightInGrams,
                AllergenInfo = product.AllergenInfo,
                AverageRating = product.AverageRating,
                ReviewCount = product.ReviewCount
            };
        }

        public async Task<List<ProductDto>> GetSimilarProductsAsync(int productId, int count)
        {
            // Get the product to find similarities
            var product = await _context.Products.FindAsync(productId);
            if (product == null)
                return new List<ProductDto>();

            // Get products in same category with similar characteristics
            var similarProducts = await _context.Products
                .Where(p => p.Id != productId) // Exclude current product
                .Where(p =>
                    // Same category
                    p.CategoryId == product.CategoryId ||
                    // Or similar cocoa percentage
                    (p.CocoaPercentage == product.CocoaPercentage && p.Id != productId) ||
                    // Or same origin
                    (p.Origin == product.Origin && p.Id != productId)
                )
                .OrderBy(x => Guid.NewGuid()) // Random order for variety
                .Take(count)
                .ToListAsync();

            return similarProducts.Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                StockQuantity = p.StockQuantity,
                ImageUrl = p.ImageUrl,
                CategoryId = p.CategoryId,
                CocoaPercentage = p.CocoaPercentage,
                Origin = p.Origin,
                FlavorNotes = p.FlavorNotes,
                IsOrganic = p.IsOrganic,
                IsFairTrade = p.IsFairTrade,
                Ingredients = p.Ingredients,
                WeightInGrams = p.WeightInGrams,
                AllergenInfo = p.AllergenInfo,
                AverageRating = p.AverageRating,
                ReviewCount = p.ReviewCount
            }).ToList();
        }

        // Add this method to ProductService.cs implementation
        public async Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(int categoryId, int limit = 10)
        {
            // First check if the category exists
            var category = await _context.Categories.FindAsync(categoryId);
            if (category == null)
            {
                throw new KeyNotFoundException($"Category with ID {categoryId} not found");
            }

            // Get products for this category with limit
            var products = await _context.Products
                .Where(p => p.CategoryId == categoryId)
                .OrderByDescending(p => p.Id) // Most recent first
                .Take(limit)
                .Select(p => _mapper.Map<ProductDto>(p))
                .ToListAsync();

            return products;
        }

        // In ProductService.cs
        public async Task<VisibilityToggleResult> ToggleProductVisibilityAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return new VisibilityToggleResult
                {
                    Success = false,
                    Error = "NotFound",
                    Message = "Product not found"
                };
            }

            product.IsVisible = !product.IsVisible;
            await _context.SaveChangesAsync();

            return new VisibilityToggleResult
            {
                Success = true,
                IsVisible = product.IsVisible,
                Message = product.IsVisible ? "Product is now visible" : "Product is now hidden"
            };
        }
    }
}