using AutoMapper;
using ECommerce.API.DTOs;
using ECommerce.API.Models;

namespace ECommerce.API.Helpers
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            CreateMap<Product, ProductDto>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name));

            CreateMap<ProductCreateUpdateDto, Product>();

            CreateMap<Category, CategoryDto>();
            CreateMap<CategoryCreateUpdateDto, Category>();


        }
    }
}