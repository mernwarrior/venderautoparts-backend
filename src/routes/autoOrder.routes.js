import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/autoOrder.Controller.js';

const router = express.Router();

router.post('/orders', createOrder);
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;