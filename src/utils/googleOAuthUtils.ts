import constants from '@/constants';
import { BadRequestError } from '@/middlewares/handleError';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

const googleClient = new OAuth2Client(constants.GOOGLE_OAUTH_CLIENT_ID);

export const verifyGoogleToken = async (credential: string): Promise<TokenPayload> => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: constants.GOOGLE_OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new BadRequestError('Google Sign-in failed');
    }

    return payload;
  } catch (err) {
    throw new BadRequestError('Google Sign-in failed!');
  }
};
