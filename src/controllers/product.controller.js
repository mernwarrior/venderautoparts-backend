// controllers/product.controller.js

import Product from '../models/product.model.js';
import fs from 'fs';
import path from 'path';

// ─── GET PRODUCTS ────────────────────────────────────────────────
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const category = req.query.category;
    const subCategory = req.query.subCategory;
    const search = req.query.search;

    const filter = {
      isActive: true,
    };

    if (category) {
      filter.category = {
        $regex: category,
        $options: 'i',
      };
    }

    if (subCategory) {
      filter.subCategory = {
        $regex: subCategory,
        $options: 'i',
      };
    }

    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          brandTitle: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          stockId: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      perPage: limit,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};

// ─── GET PRODUCT BY SLUG ─────────────────────────────────────────
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      urlSlug: req.params.slug,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};

// ─── CREATE PRODUCT ──────────────────────────────────────────────
export const createProduct = async (req, res) => {
  try {
    const {
      category,
      subCategory,
      title,
      description,
      stockId,
      amount,
      saleAmount,
      brandTitle,
    } = req.body;

    const product = await Product.create({
      category,
      subCategory,
      title,
      description,
      stockId,
      amount,
      saleAmount,
      brandTitle,

      // image path
      image: req.file ? req.file.relativePath : '',
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};

// ─── UPDATE PRODUCT ──────────────────────────────────────────────
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const {
      category,
      subCategory,
      title,
      description,
      stockId,
      amount,
      saleAmount,
      brandTitle,
    } = req.body;

    // delete old image
    if (req.file && product.image) {
      const oldImagePath = path.join(process.cwd(), product.image);

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // update fields
    product.category = category || product.category;
    product.subCategory = subCategory || product.subCategory;
    product.title = title || product.title;
    product.description = description || product.description;
    product.stockId = stockId || product.stockId;
    product.amount = amount || product.amount;
    product.saleAmount = saleAmount || product.saleAmount;
    product.brandTitle = brandTitle || product.brandTitle;

    // update image
    if (req.file) {
      product.image = req.file.relativePath;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};

// ─── DELETE PRODUCT ──────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // delete image
    if (product.image) {
      const imagePath = path.join(process.cwd(), product.image);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    product.isActive = false;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};