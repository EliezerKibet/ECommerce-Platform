
export { CategoryList } from './CategoryList'
export { CategoryForm } from './CategoryForm'
export { CategoryDetailsModal } from './CategoryDetailsModal'
export interface CategoryDto {
    id: number;
    name: string;
    description?: string;
    imageUrl?: string;
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    // Optional fields for statistics (if your API provides them)
    productCount?: number;
    totalSales?: number;
}

export interface CategoryWithStatus extends CategoryDto {
    isActive: boolean; // Make this required instead of optional
}

export interface CategoryCreateUpdateDto {
    name: string;
    description?: string;
    isActive: boolean;
    image?: File; // For image upload
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;
}