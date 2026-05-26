import * as categoryService from "../services/category.service.js";
import { HTTP_STATUS } from "../utils/constant.js";


export const createCategory = async (req, res, next) => {
  try {


    const result = await categoryService.createCategory(req.body, req.file);

    res.status(result.httpStatus).json({
      message: result.message,
      status: result.status,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
           const catId = req.params.id; // token se user id
    
    const result = await categoryService.getCategoryById(catId);

    res.status(result.httpStatus).json({
        message: result.message ,
        status: result.status,
        data:result.data
      });

  } catch (error) {
    next(error); 
  }
};

export const getAllCategory = async (req, res, next) => {
  try {
    const result = await categoryService.getAllCategory(req.query);

    res.status(result.httpStatus).json({
        message: result.message ,
        status: result.status,
        data:result.data,
        totalCount: result.totalCount,
      currentCount: result.currentCount,
      });

  } catch (error) {
    next(error); 
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      image: req.file?.path, 
    };

    const result = await categoryService.updateCategory(
      req.params.id,
      payload
    );

    res.status(result.httpStatus).json({
      message: result.message,
      status: result.status,
    });
  } catch (error) {
    next(error);
  }
};
export const deleteCategory = async (req, res, next) => {
  try {
        const catId = req.params.id;
    
    const result = await categoryService.deleteCategory(catId);

    res.status(result.httpStatus).json({
        message: result.message ,
        status: result.status,
      });

  } catch (error) {
    next(error); 
  }
};