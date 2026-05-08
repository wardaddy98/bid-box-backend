import brcypt from 'bcrypt';

export const generateHash = (password: string): Promise<string> => {
  return brcypt.hash(password, 10);
};

export const isPasswordValid = (password: string, hash: string): Promise<boolean> => {
  return brcypt.compare(password, hash);
};
