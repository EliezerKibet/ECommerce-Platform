// Helpers/MappingProfiles.cs
using AutoMapper;
using ECommerce.API.DTOs;
using ECommerce.API.Models;

namespace ECommerce.API.Helpers
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            // Product mappings
            CreateMap<Product, ProductDto>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name));

            CreateMap<ProductCreateUpdateDto, Product>();

            // Category mappings
            CreateMap<Category, CategoryDto>();
            CreateMap<CategoryCreateUpdateDto, Category>();




            // Add more mappings for other entities
        }
    }
}