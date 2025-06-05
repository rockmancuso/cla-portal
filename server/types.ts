import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    isAuthenticated?: boolean;
    hubspotContactEmail?: string;
    hubspotAccessToken?: string;
    hubspotRefreshToken?: string;
  }
}