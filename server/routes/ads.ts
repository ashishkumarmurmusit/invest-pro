import { Router, Response } from 'express';
import { db } from '../db';

export const adsRouter = Router();

// Public: Get active advertisements by position
adsRouter.get('/', (req, res: Response) => {
  const { position, device } = req.query;
  const now = new Date().getTime();

  let activeAds = db.ads.filter(ad => {
    if (!ad.isEnabled) return false;
    if (ad.startDate && new Date(ad.startDate).getTime() > now) return false;
    if (ad.endDate && new Date(ad.endDate).getTime() < now) return false;
    if (device === 'mobile' && !ad.mobileVisible) return false;
    if (device === 'desktop' && !ad.desktopVisible) return false;
    return true;
  });

  if (position) {
    activeAds = activeAds.filter(ad => ad.position === position);
  }

  // Sort by priority descending
  activeAds.sort((a, b) => b.priority - a.priority);

  // Increment impressions
  activeAds.forEach(a => {
    a.impressions = (a.impressions || 0) + 1;
  });

  return res.json({
    ads: activeAds,
    adsterra: db.adsterra,
  });
});

// Click tracking
adsRouter.post('/click/:id', (req, res: Response) => {
  const ad = db.ads.find(a => a.id === req.params.id);
  if (ad) {
    ad.clicks = (ad.clicks || 0) + 1;
  }
  return res.json({ success: true });
});
