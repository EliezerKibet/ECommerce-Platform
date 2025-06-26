// Interfaces/IProductService.cs
using ECommerce.API.DTOs;
using ECommerce.API.Models;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.API.Interfaces
{
    public interface IProductService
    {
        Task<IEnumerable<ProductDto>> GetAllProductsAsync();
        Task<ProductDto> GetProductByIdAsync(int id);
        Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(int categoryId);
        Task<IEnumerable<ProductDto>> SearchProductsAsync(string searchTerm);
        Task<ProductDto> CreateProductAsync(ProductCreateUpdateDto productDto, IFormFile image);
        Task<ProductDto> UpdateProductAsync(int id, ProductCreateUpdateDto productDto);
        Task DeleteProductAsync(int id);
        Task<List<ProductDto>> GetProductsByIdsAsync(List<int> productIds);
        Task<List<ProductDto>> GetSimilarProductsAsync(int productId, int count);
        // Add this to your IProductService interface

        // Add this method to IProductService.cs interface
        /// <summary>
        /// Gets products by category ID with optional limit
        /// </summary>
        /// <param name="categoryId">The category ID to filter by</param>
        /// <param name="limit">Maximum number of products to return</param>
        /// <returns>List of products in the specified category</returns>
        Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(int categoryId, int limit = 10);
        Task<VisibilityToggleResult> ToggleProductVisibilityAsync(int id);
        ProductDto MapToDto(Product product);
    }
}