import { Model, QueryFilter } from 'mongoose';

export interface IPagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

const handlePagination = async <T>(
  model: Model<T>,
  page: number,
  filterOptions: QueryFilter<T> = {},
  limit: number = 10,
): Promise<{
  data: T[];
  pagination: IPagination;
}> => {
  const currentPage = Math.max(1, Number(page) || 1);
  const skip = (currentPage - 1) * limit;

  const [data, totalCount] = await Promise.all([
    model.find(filterOptions).skip(skip).limit(limit),
    model.countDocuments(filterOptions),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data,
    pagination: {
      totalCount,
      totalPages,
      currentPage,
    },
  };
};

export default handlePagination;
