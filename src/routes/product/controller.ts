import { GetAllQuery } from '@/types/common';
import { handleResponse } from '@/utils/handleResponse';
import { Request, Response } from 'express';
import { createProduct, getAllProducts, getAllProductsUnPaginated } from './service';

export const handleCreateProduct = async (req: Request, res: Response) => {
  const product = await createProduct(req.body);

  return handleResponse(res, 200, 'Product created successfully', { product });
};

export const handleGetAllProducts = async (req: Request, res: Response) => {
  const queryStrings: GetAllQuery = req.query;

  const paginatedData = await getAllProducts(
    Number(queryStrings?.page ?? 1),
    Number(queryStrings?.limit ?? 10),
    queryStrings.category ?? '',
    queryStrings.search ?? '',
  );

  return handleResponse(res, 200, '', paginatedData);
};

export const handleGetAllProductsUnpaginated = async (req: Request, res: Response) => {
  const products = await getAllProductsUnPaginated();

  return handleResponse(res, 200, '', { data: products });
};
