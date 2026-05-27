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
router.get('/', getProducts);

// GET PRODUCT BY SLUG
router.get('/:slug', getProductBySlug);
router.get('/:id', getProductById);
// CREATE PRODUCT
router.post(
  '/',
  uploadImage,
  createProduct
);

// UPDATE PRODUCT
router.put(
  '/update/:id',
  uploadImage,
  updateProduct
);

// DELETE PRODUCT
router.delete(
  '/delete/:id',
  deleteProduct
);

export default router;