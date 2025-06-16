// Controllers/PromotionsController.cs
using ECommerce.API.Interfaces;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/promotions")]
public class PromotionsController : ControllerBase
{
    private readonly IPromotionService _promotionService;
    private readonly ILogger<PromotionsController> _logger;

    public PromotionsController(
        IPromotionService promotionService,
        ILogger<PromotionsController> logger)
    {
        _promotionService = promotionService;
        _logger = logger;
    }

    [HttpGet("active")]
    public async Task<ActionResult<List<PromotionDto>>> GetActivePromotions()
    {
        try
        {
            var promotions = await _promotionService.GetActivePromotionsAsync();
            return Ok(promotions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active promotions");
            return StatusCode(500, "An error occurred while retrieving active promotions");
        }
    }

    [HttpGet("products/{productId}")]
    public async Task<ActionResult<PromotionDto>> GetProductPromotion(int productId)
    {
        try
        {
            var promotion = await _promotionService.GetProductPromotionAsync(productId);
            return Ok(promotion);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving promotion for product {ProductId}", productId);
            return StatusCode(500, "An error occurred while retrieving the promotion");
        }
    }
}