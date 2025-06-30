
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
    productCount?: number;
    totalSales?: number;
}

export interface CategoryWithStatus extends CategoryDto {
    isActive: boolean;
}

export interface CategoryCreateUpdateDto {
    name: string;
    description?: string;
    isActive: boolean;
    image?: File; 
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;
}