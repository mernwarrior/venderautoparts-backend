// routes/product.routes.js

import express from 'express';

import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
} from '../controllers/product.controller.js';

import { createUploader } from '../utils/uploadMulter.js';

const router = express.Router();

const uploadImage = createUploader('product').single('image');

// GET ALL PRODUCTS
router.get('/product', getProducts);

// GET PRODUCT BY SLUG
router.get('/product/:slug', getProductBySlug);
router.get('/product/:id', getProductById);
// CREATE PRODUCT
router.post(
  '/product',
  uploadImage,
  createProduct
);

// UPDATE PRODUCT
router.put(
  '/product/update/:id',
  uploadImage,
  updateProduct
);

// DELETE PRODUCT
router.delete(
  '/product/delete/:id',
  deleteProduct
);

export default router;