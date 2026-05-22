import { Product, ProductCategoryEnum, ProductModel } from '@/models/product.model';
import handlePagination, { IPagination } from '@/utils/handlePagination';
import stringToObjectId from '@/utils/stringToObjectId';
import { QueryFilter } from 'mongoose';

export const createProduct = async (payload: Omit<Product, 'productId'>): Promise<Product> => {
  return ProductModel.create({ ...payload });
};

export const getProductById = (id: string) => {
  return ProductModel.findById(stringToObjectId(id));
};

export const getProductByProductId = (productId: string) => {
  return ProductModel.findOne({ productId });
};

export const getAllProducts = async (
  page: number,
  limit: number,
  category: string,
  search: string,
): Promise<{
  data: Product[];
  pagination: IPagination;
}> => {
  const filterOptions: QueryFilter<Product> = {};
  if (Object.values(ProductCategoryEnum).includes(category as ProductCategoryEnum)) {
    filterOptions.category = category;
  }

  if (search) {
    filterOptions.$or = [
      { productId: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
  }

  return handlePagination<Product>(ProductModel, page, filterOptions, limit);
};

export const getAllProductsUnPaginated = () => {
  return ProductModel.find();
};
