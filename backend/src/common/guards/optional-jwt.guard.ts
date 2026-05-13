import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard — does NOT throw if token is missing.
 * Sets req.user if a valid token is provided, otherwise req.user is undefined.
 * Use this for endpoints that are partially public but can give richer data to authenticated users.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<T>(err: Error | null, user: T): T {
    // Override: do not throw even if no user / invalid token
    return user;
  }
}
