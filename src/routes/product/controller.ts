import { ProductCategoryEnum } from '@/models/product.model';
import { handleResponse } from '@/utils/handleResponse';
import { Request, Response } from 'express';
import { createProduct, getAllProducts } from './service';

export interface GetAllProductsQuery {
  page?: string;
  limit?: string;
  category?: ProductCategoryEnum | 'all_categories';
  search?: string;
}

export const handleCreateProduct = async (req: Request, res: Response) => {
  const product = await createProduct(req.body);

  return handleResponse(res, 200, 'Product created successfully', { product });
};

export const handleGetAllProducts = async (req: Request, res: Response) => {
  const queryStrings: GetAllProductsQuery = req.query;

  const paginatedData = await getAllProducts(
    Number(queryStrings?.page ?? 1),
    Number(queryStrings?.limit ?? 10),
    queryStrings.category ?? '',
    queryStrings.search ?? '',
  );

  return handleResponse(res, 200, '', paginatedData);
};
