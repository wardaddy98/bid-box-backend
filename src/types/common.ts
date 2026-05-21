import { ProductCategoryEnum } from '@/models/product.model';

export interface GetAllQuery {
  page?: string;
  limit?: string;
  category?: ProductCategoryEnum | 'all_categories';
  search?: string;
}
