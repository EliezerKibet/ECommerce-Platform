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

        Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(int categoryId, int limit = 10);
        Task<VisibilityToggleResult> ToggleProductVisibilityAsync(int id);
        ProductDto MapToDto(Product product);
    }
}