// Create the src/types directory if it doesn't exist
// mkdir -p src/types

// Product types
export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    imageUrl: string;
    categoryId: number;
    categoryName: string;
    cocoaPercentage: string;
    origin: string;
    flavorNotes: string;
    isOrganic: boolean;
    isFairTrade: boolean;
    ingredients: string;
    weightInGrams: number;
    allergenInfo: string;
    averageRating: number;
    reviewCount: number;
}

export interface ProductDtoPagedResult {
    items: Product[];
    totalItems: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

// Category types
export interface Category {
    id: number;
    name: string;
    description: string;
    imageUrl?: string;
}

// Cart types
export interface CartItem {
    id: number;
    productId: number;
    productName: string;
    productPrice: number;
    quantity: number;
    productImageUrl: string;
    subtotal: number;
}

export interface Cart {
    items: CartItem[];
    totalItems: number;
    subtotal: number;
}

// User types
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}