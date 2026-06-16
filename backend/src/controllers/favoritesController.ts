import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../shared/errors/errorHandler';
import { BadRequestError } from '../shared/errors/AppError';
import { DBService } from '../services/db-service';
import {
  isFavoritesSchemaReady,
  listFavoriteWashIds,
  addFavorite as addFav,
  removeFavorite as removeFav,
} from '../services/favoritesService';

/**
 * @desc    List the authenticated user's favorite car washes
 * @route   GET /api/favorites
 * @access  Private
 */
export const getFavorites = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) throw new BadRequestError('User not authenticated');

  // Degrade gracefully if the table hasn't been provisioned yet.
  if (!(await isFavoritesSchemaReady())) {
    res.json({ success: true, data: [] });
    return;
  }

  const ids = await listFavoriteWashIds(req.user.id);
  if (ids.length === 0) {
    res.json({ success: true, data: [] });
    return;
  }

  const washes = await DBService.getCarWashes(true);
  const byId = new Map<string, any>(washes.map((w: any) => [w.id, w]));

  const data = ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((w: any) => ({
      id: w.id,
      name: w.carWashName || w.name || 'Car wash',
      address: w.location || '',
      rating: Number(w.rating || w.averageRating || 0),
      services: (w.services || []).map((s: any) => s.name).filter(Boolean).slice(0, 5),
    }));

  res.json({ success: true, data });
});

/**
 * @desc    Add a car wash to the authenticated user's favorites
 * @route   POST /api/favorites   body: { carWashId }
 * @access  Private (client)
 */
export const addFavorite = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) throw new BadRequestError('User not authenticated');
  const carWashId = req.body?.carWashId || req.body?.car_wash_id;
  if (!carWashId) throw new BadRequestError('carWashId is required');

  if (!(await isFavoritesSchemaReady())) {
    throw new BadRequestError('Favorites are not available yet. Run the favorites migration.');
  }

  await addFav(req.user.id, carWashId);
  res.status(201).json({ success: true, message: 'Added to favorites' });
});

/**
 * @desc    Remove a car wash from favorites
 * @route   DELETE /api/favorites/:id   (:id = car wash id)
 * @access  Private
 */
export const removeFavorite = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) throw new BadRequestError('User not authenticated');

  if (await isFavoritesSchemaReady()) {
    await removeFav(req.user.id, req.params.id);
  }
  res.json({ success: true, message: 'Removed from favorites' });
});
