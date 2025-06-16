// Services/CategoryService.cs
using AutoMapper;
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using ECommerce.API.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.API.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly IMapper _mapper;

        public CategoryService(ICategoryRepository categoryRepository, IMapper mapper)
        {
            _categoryRepository = categoryRepository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
        {
            var categories = await _categoryRepository.GetAllAsync();
            return _mapper.Map<IEnumerable<CategoryDto>>(categories);
        }

        public async Task<CategoryDto> GetCategoryByIdAsync(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            return _mapper.Map<CategoryDto>(category);
        }

        public async Task<CategoryDto> CreateCategoryAsync(CategoryCreateUpdateDto categoryDto)
        {
            var category = _mapper.Map<Category>(categoryDto);
            var createdCategory = await _categoryRepository.AddAsync(category);
            return _mapper.Map<CategoryDto>(createdCategory);
        }

        public async Task<CategoryDto> UpdateCategoryAsync(int id, CategoryCreateUpdateDto categoryDto)
        {
            var existingCategory = await _categoryRepository.GetByIdAsync(id);
            if (existingCategory == null)
                throw new KeyNotFoundException($"Category with ID {id} not found");

            _mapper.Map(categoryDto, existingCategory);
            await _categoryRepository.UpdateAsync(existingCategory);

            return _mapper.Map<CategoryDto>(existingCategory);
        }

        public async Task DeleteCategoryAsync(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                throw new KeyNotFoundException($"Category with ID {id} not found");

            await _categoryRepository.DeleteAsync(id);
        }
    }
}