import { Router, Response } from 'express';
import { db } from '../db';

export const themeRouter = Router();

themeRouter.get('/', (_req, res: Response) => {
  return res.json({
    theme: db.theme,
    settings: {
      websiteName: db.settings.websiteName || db.theme.websiteName,
      logoText: db.settings.logoText || db.theme.logoText,
      logoUrl: db.settings.logoUrl || db.theme.logoUrl,
      announcementTicker: db.settings.announcementTicker,
    },
  });
});
