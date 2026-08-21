import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();

  async googleLogin(credential: string) {
    if (!credential) {
      throw new UnauthorizedException(
        'Google credential is required',
      );
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException(
          'Invalid Google token',
        );
      }

      return {
        id: payload.sub,
        name: payload.name ?? '',
        email: payload.email ?? '',
        picture: payload.picture ?? '',
        accountType: 'Google',
      };
    } catch {
      throw new UnauthorizedException(
        'Invalid Google authentication',
      );
    }
  }
}