export interface BackendArrayResponse<T> {
    $id: string;
    $values: T[];
}

export interface DailySalesData {
    date: string;
    revenue: number;
    orders: number;
}

export function normalizeBackendArray<T>(data: T[] | BackendArrayResponse<T> | null | undefined): T[] {
    if (!data) return [];

    if (Array.isArray(data)) {
        return data;
    }

    if (typeof data === 'object' && '$values' in data && Array.isArray(data.$values)) {
        return data.$values;
    }

    return [];
}

export function normalizeDailyData(dailyData: DailySalesData[] | BackendArrayResponse<DailySalesData> | null | undefined): DailySalesData[] {
    return normalizeBackendArray(dailyData);
}

export function normalizeProducts(products: ProductDto[] | BackendArrayResponse<ProductDto> | null | undefined): ProductDto[] {
    return normalizeBackendArray(products);
}

export function normalizePromotionProducts(products: ProductDto[] | BackendArrayResponse<ProductDto> | null | undefined): ProductDto[] {
    return normalizeBackendArray(products);
}

export function normalizeCategories(categories: CategoryDto[] | BackendArrayResponse<CategoryDto> | null | undefined): CategoryDto[] {
    return normalizeBackendArray(categories);
}

export function normalizeReviews(reviews: AdminReviewDto[] | BackendArrayResponse<AdminReviewDto> | null | undefined): AdminReviewDto[] {
    return normalizeBackendArray(reviews);
}

export function normalizePromotions(promotions: PromotionDto[] | BackendArrayResponse<PromotionDto> | null | undefined): PromotionDto[] {
    return normalizeBackendArray(promotions);
}


export interface SalesSummaryDto {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    periodStart: string;
    periodEnd: string;
    customerBreakdown?: {
        totalUsers: number;
        adminUsers: number;
        customerUsers: number;
        method1Count?: number;
        method2Count?: number;
        adminUsernames?: string[];
    };
    dailyData?: DailySalesData[] | BackendArrayResponse<DailySalesData> | null;
}
export interface CategoryDto {
    isActive: any;
    id: number;
    name: string;
    description?: string;
    imageUrl?: string;
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;
    createdAt?: string;
    updatedAt?: string;
    productCount?: number;
    totalSales?: number;
}

export interface CategoryCreateUpdateDto {
    name: string;
    description?: string;
    image?: File; 
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;
}

export interface AllTimeSalesDto {
    allTimeSales: {
        summary: {
            totalRevenue: number;
            totalOrders: number;
            averageOrderValue: number;
            firstOrderDate: string;
            lastOrderDate: string;
            businessDays: number;
        };
        monthlyData: Array<{
            period: string;
            revenue: number;
            orders: number;
        }>;
        yearlyData: Array<{
            year: number;
            revenue: number;
            orders: number;
        }>;
    };
    totalCustomers: number;
    generatedAt: string;
}

export interface SalesOrderDto {
    orders: Array<{
        orderId: string | number;
        orderNumber?: string;
        orderDate: string;
        customerName: string;
        customerEmail: string;
        totalAmount: number;
        subtotal?: number;
        tax?: number;
        shippingCost?: number;
        discountAmount?: number;
        status: string;
        paymentStatus?: string;
        paymentMethod?: string;
        itemCount: number;
        couponCode?: string;
        orderNotes?: string;
        shippingAddress?: string;
        shippingPhone?: string;
        shippingMethod?: string;
        orderItems: Array<{
            orderItemId?: number;
            productId: number;
            productName: string;
            quantity: number;
            unitPrice: number;
            total: number;
        }>;
    }>;
    pagination: {
        currentPage: number;
        pageSize: number;
        totalOrders: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface ProductDto {
    id: number;
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
    categoryName: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
    weightInGrams: number;

    cocoaPercentage?: string | null;
    origin?: string | null;
    flavorNotes?: string | null;
    isOrganic?: boolean;
    isFairTrade?: boolean;
    ingredients?: string | null;
    allergenInfo?: string | null;
    averageRating?: number;
    reviewCount?: number;
    isVisible: boolean;
}

export interface CreateUpdateCouponDto {
    code: string;
    description: string;
    discountType: 'Percentage' | 'FixedAmount';
    discountAmount: number;
    minimumOrderAmount: number;
    startDate: string;
    endDate: string;
    usageLimit?: number;
    isActive: boolean;
}

export interface CouponDto {
    id: number;
    code: string;
    description: string;
    discountType: 'Percentage' | 'FixedAmount';
    discountAmount: number;
    minimumOrderAmount: number;
    startDate: string;
    endDate: string;
    usageLimit?: number;
    timesUsed: number;
    isActive: boolean;
}

export interface PromotionDto {
    id: number;
    name: string;
    description: string;
    discountPercentage: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    bannerImageUrl?: string;
    type?: number;
    colorScheme?: string;
    timeRemaining?: number;
    products?: ProductDto[] | BackendArrayResponse<ProductDto>;
}

export interface CreateUpdatePromotionDto {
    name: string;
    description: string;
    discountPercentage: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    bannerImageUrl: string; 
    type: number; 
    colorScheme: string;
    productIds: number[];
}

export interface PromotionProductDto {
    product: ProductDto;
    originalPrice: number;
    discountedPrice: number;
    savingsAmount: number;
    savingsPercentage: number;
}

export interface AdminReviewDto {
    id: number;
    productId: number;
    productName: string;
    userId: string;
    userName: string;
    rating: number;
    title: string;
    comment: string;
    isVerifiedPurchase: boolean;
    isApproved: boolean;
    createdAt: string;
    updatedAt?: string;
    approvalStatus: string;
}

export interface CustomerCountFallback {
    totalCustomers: number;
    totalUsers: number;
    adminUsers: number;
    lastUpdated: string;
}

export interface ExtendedError extends Error {
    details?: Record<string, unknown> | null;
    status?: number;
}

export interface ProductFormData {
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
    weightInGrams: number;
    image: File | null;

    cocoaPercentage?: string | number | null;
    origin?: string | null;
    flavorNotes?: string | null;
    isOrganic: boolean;
    isFairTrade: boolean;
    ingredients?: string | null;
    allergenInfo?: string | null;
    isVisible: boolean;
}


export type AspNetValueResponse<T> = {
    $id?: string;
    $values: T[];
};

export type AspNetOrderItem = {
    $id?: string;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
};

export type AspNetOrder = {
    $id?: string;
    orderId?: number;
    orderNumber?: string;
    id?: number;
    orderDate: string;
    customerName?: string;
    customerEmail?: string;
    totalAmount?: number;
    subtotal?: number;
    tax?: number;
    shippingCost?: number;
    discountAmount?: number;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    itemCount?: number;
    couponCode?: string;
    orderNotes?: string;
    shippingAddress?: string;
    shippingPhone?: string;
    shippingMethod?: string;
    orderItems?: AspNetValueResponse<AspNetOrderItem> | AspNetOrderItem[];
};
export function isBackendArrayResponse<T>(data: unknown): data is BackendArrayResponse<T> {
    return (
        typeof data === 'object' &&
        data !== null &&
        '$values' in data &&
        Array.isArray((data as BackendArrayResponse<T>).$values)
    );
}

export function hasValidDailyData(summary: SalesSummaryDto): boolean {
    if (!summary.dailyData) return false;

    if (Array.isArray(summary.dailyData)) return true;

    return isBackendArrayResponse(summary.dailyData);
}

export type PromotionPayload = {
    name: string;
    description: string;
    discountPercentage: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    colorScheme: string;
    type: number;
    productIds: number[];
    bannerImageUrl: string; 
};