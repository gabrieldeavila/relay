import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Routes reached through secret links or by other apps, without a login. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
