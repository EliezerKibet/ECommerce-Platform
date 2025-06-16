// Interfaces/ICategoryService.cs
using ECommerce.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.API.Interfaces
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync();
        Task<CategoryDto> GetCategoryByIdAsync(int id);
        Task<CategoryDto> CreateCategoryAsync(CategoryCreateUpdateDto categoryDto);
        Task<CategoryDto> UpdateCategoryAsync(int id, CategoryCreateUpdateDto categoryDto);
        Task DeleteCategoryAsync(int id);
    }
}