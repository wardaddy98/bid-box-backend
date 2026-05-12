import mongoose from 'mongoose';

const stringToObjectId = (stringId: string): mongoose.Types.ObjectId =>
  new mongoose.Types.ObjectId(stringId);
export default stringToObjectId;
