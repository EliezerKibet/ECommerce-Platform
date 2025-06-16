// Interfaces/IRepository.cs
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.API.Interfaces
{
    public interface IRepository<T> where T : class
    {
        // READ operations
        Task<IEnumerable<T>> GetAllAsync();
        Task<T> GetByIdAsync(int id);

        // CREATE operation
        Task<T> AddAsync(T entity);

        // UPDATE operation
        Task UpdateAsync(T entity);

        // DELETE operation
        Task DeleteAsync(int id);
    }
}