import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ROLE_TYPE } from "../utils/constant.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as categoryController from "../controllers/category.controller.js"
import { createCategorySchema, updateCategorySchema } from "../validations/category.validation.js";
import { validateObjectIdParam } from "../middlewares/validateObjectId.js";
import { createUploader } from "../utils/uploadMulter.js";




const router = express.Router();
const uploadCategoryImage = createUploader("category").single("image");

router.post("/",  authMiddleware([ROLE_TYPE.ADMIN]),uploadCategoryImage,validate(createCategorySchema),categoryController.createCategory);
// router.get("/",  authMiddleware([ROLE_TYPE.ADMIN, ROLE_TYPE.ENTRANT, ROLE_TYPE.HOST]), categoryController.getAllCategory);
router.get("/",   categoryController.getAllCategory);
router.get("/:id",  authMiddleware([ROLE_TYPE.ADMIN]), validateObjectIdParam, categoryController.getCategoryById);
router.patch("/:id",  validateObjectIdParam, authMiddleware([ROLE_TYPE.ADMIN]), uploadCategoryImage,validate(updateCategorySchema),categoryController.updateCategory);
router.delete("/:id", authMiddleware([ROLE_TYPE.ADMIN]), validateObjectIdParam, categoryController.deleteCategory);


export default router;