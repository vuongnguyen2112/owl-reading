import { HttpContextToken } from '@angular/common/http';

export const SKIP_AUTH_REFRESH = new HttpContextToken(() => false);
export const AUTH_REFRESH_RETRIED = new HttpContextToken(() => false);
