import { BadRequestError } from '@/middlewares/handleError';
import { User, UserModel } from '@/models/user.model';
import { generateHash } from '@/utils/hashing';
import _ from 'lodash';

export const createUser = async (payload: User): Promise<User> => {
  const existingUser = await UserModel.find({ email: payload.email }).lean();

  if (!_.isEmpty(existingUser)) {
    throw new BadRequestError('User Already Exists!');
  }
  const hash = await generateHash(payload.password);
  return UserModel.create({ ...payload, password: hash });
};
