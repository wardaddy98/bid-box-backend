import { BadRequestError } from '@/middlewares/handleError';
import { Product, ProductCategoryEnum, ProductModel } from '@/models/product.model';
import { Review, ReviewModel } from '@/models/review.model';
import handlePagination from '@/utils/handlePagination';
import { generateSignedUrl } from '@/utils/s3Utils';
import stringToObjectId from '@/utils/stringToObjectId';
import { DocumentType } from '@typegoose/typegoose';
import _ from 'lodash';
import { QueryFilter, UpdateQuery } from 'mongoose';

export interface IProductImage {
  objectKey: string;
  signedUrl: string;
}

export interface IProductWithSignedUrl extends Omit<Product, 'productImages'> {
  productImages: IProductImage[];
}

export const createProduct = async (
  payload: Omit<Product, 'productId'>,
): Promise<DocumentType<Product>> => {
  return ProductModel.create({ ...payload });
};

export const getProductById = (id: string) => {
  return ProductModel.findById(stringToObjectId(id)).lean();
};

export const getProductByProductId = (productId: string) => {
  return ProductModel.findOne({ productId });
};

export const getAllProducts = async (
  page: number,
  limit: number,
  category: string,
  search: string,
) => {
  const filterOptions: QueryFilter<Product> = {};
  if (Object.values(ProductCategoryEnum).includes(category as ProductCategoryEnum)) {
    filterOptions.category = category as ProductCategoryEnum;
  }

  if (search) {
    filterOptions.$or = [
      { productId: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
  }

  const response = await handlePagination<Product>(ProductModel, page, filterOptions, limit);
  const products = _.cloneDeep(response.data);

  const dataWithProductImages: IProductWithSignedUrl[] = await Promise.all(
    products?.map(async (product: Product) => {
      const productImages = await Promise.all(
        product.productImages.map(async (objectKey: string) => {
          return {
            objectKey,
            signedUrl: await generateSignedUrl(objectKey),
          };
        }),
      );

      return { ...product, productImages };
    }),
  );

  return {
    ...response,
    data: dataWithProductImages,
  };
};

export const getAllProductsUnPaginated = () => {
  return ProductModel.find();
};

export const editProduct = async (productId: string, updateQuery: UpdateQuery<Product>) => {
  const updated = await ProductModel.findOneAndUpdate({ productId }, updateQuery, {
    returnDocument: 'after',
  }).lean();
  if (!updated) {
    throw new BadRequestError('Product not found!');
  }
  return updated;
};

export const createProductReview = async (createOptions: Omit<Review, '_id'>) => {
  return (await ReviewModel.create(createOptions)).toObject();
};

export const findOneReview = async (findOptions: QueryFilter<Review>) => {
  return ReviewModel.findOne(findOptions);
};
