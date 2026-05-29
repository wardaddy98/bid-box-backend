import { BadRequestError } from '@/middlewares/handleError';
import { GetAllQuery } from '@/types/common';
import { handleResponse } from '@/utils/handleResponse';
import { generateSignedUrl, handleMultipleDelete, handleMultipleUpload } from '@/utils/s3Utils';
import { Request, Response } from 'express';
import _ from 'lodash';
import 'multer';
import {
  createProduct,
  editProduct,
  getAllProducts,
  getAllProductsUnPaginated,
  getProductByProductId,
  IProductImage,
} from './service';

export const handleCreateProduct = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];

  if (!files?.length) {
    throw new BadRequestError('Atleast one product image is required!');
  }

  let objectKeys: string[] = [];
  try {
    objectKeys = await handleMultipleUpload(files, 'products');

    const product = (await createProduct({ ...req.body, productImages: objectKeys })).toObject();

    const productImages: IProductImage[] = await Promise.all(
      product.productImages.map(async objectKey => {
        return {
          objectKey,
          signedUrl: await generateSignedUrl(objectKey),
        };
      }),
    );

    return handleResponse(res, 200, 'Product created successfully', {
      data: { ...product, productImages },
    });
  } catch (err) {
    if (objectKeys?.length) {
      await handleMultipleDelete(objectKeys);
    }
    throw err;
  }
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

export const handleEditProduct = async (req: Request, res: Response) => {
  const productId = req?.params?.productId as string;

  if (!productId) {
    throw new BadRequestError('Product id missing!');
  }

  const productData = await getProductByProductId(productId).lean();

  if (_.isEmpty(productData)) {
    throw new BadRequestError('Product does not exist!');
  }

  let newObjectKeys: string[] = [];
  try {
    const files = (req.files as Express.Multer.File[]) ?? [];
    //this will be string if single/ array is multiple due to formData behavior
    const deletedFilesObjectKeys: string[] = req.body?.deletedFilesObjectKeys
      ? Array.isArray(req.body?.deletedFilesObjectKeys)
        ? req.body?.deletedFilesObjectKeys
        : [req.body?.deletedFilesObjectKeys]
      : [];

    if (files?.length) {
      newObjectKeys = await handleMultipleUpload(files, 'products');
    }

    const updatedProductImagesSet = new Set(productData.productImages);
    newObjectKeys.forEach(key => updatedProductImagesSet.add(key));
    deletedFilesObjectKeys.forEach(key => updatedProductImagesSet.delete(key));

    const product = await editProduct(productId, {
      $set: {
        availableStock: req.body.availableStock,
        description: req.body.description,
        sellingPrice: req.body.sellingPrice,
        productImages: Array.from(updatedProductImagesSet),
      },
    });

    const productImages: IProductImage[] = await Promise.all(
      product.productImages.map(async objectKey => {
        return {
          objectKey,
          signedUrl: await generateSignedUrl(objectKey),
        };
      }),
    );

    if (deletedFilesObjectKeys?.length) {
      await handleMultipleDelete(deletedFilesObjectKeys);
    }

    return handleResponse(res, 200, '', { data: { ...product, productImages } });
  } catch (err) {
    if (newObjectKeys?.length) {
      await handleMultipleDelete(newObjectKeys);
    }
    throw err;
  }
};
