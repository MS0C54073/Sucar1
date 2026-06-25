import express from 'express';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favoritesController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', getFavorites);
router.post('/', authorize('client'), addFavorite);
router.delete('/:id', removeFavorite);

export default router;
