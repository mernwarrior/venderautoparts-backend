import express from 'express';

import {
  submitContact,
  getAllContacts,
  markAsRead,
} from '../controllers/contactController.js';

const router = express.Router();

router.post('/contact', submitContact);
router.get('/contact', getAllContacts);
router.patch('/contact/:id/read', markAsRead);

export default router;