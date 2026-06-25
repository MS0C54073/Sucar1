import express from 'express';
import {
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getAllConversations,
  getMyConversations,
} from '../controllers/chatController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/conversations', getAllConversations);
router.get('/my-conversations', getMyConversations);
router.get('/booking/:bookingId', getMessages);
router.get('/conversation/:bookingId', getMessages); // Alias for frontend compatibility
router.post('/send', sendMessage);
router.post('/message', sendMessage); // Alias for frontend compatibility
router.put('/read', markAsRead);
router.put('/read/:bookingId', markAsRead); // Alias for frontend compatibility
router.get('/unread-count', getUnreadCount);

export default router;
