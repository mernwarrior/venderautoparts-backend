import slugify from "slugify";
import Category from "../models/category.model.js";
import { HTTP_STATUS, RESPONSE_STATUS } from "../utils/constant.js";
import { RESPONSE_MESSAGES } from "../utils/response.js";
import { getCache, setCache, deleteCache} from "../utils/cacheService.js";
import { deleteFile } from "../utils/index.js";

export const createCategory = async (payload, files) => {

  try {
    const { name } = payload;

    const existing = await Category.findOne({ name });

    if (existing) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.ALREADY_EXISTS('Catgeory'),
        httpStatus: HTTP_STATUS.CONFLICT,
      };
    }

    const slug = slugify(name, { lower: true });
    if (files) payload.image = files.relativePath;
    

    await Category.create({ name, slug, image:payload.image});

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.CREATED('Category'),
      httpStatus: HTTP_STATUS.OK,
    };
  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

export const getCategoryById = async (catId) => {
  try {
    const category = await Category.findById(catId);

    if (!category) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND('Category'),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE('Category'),
      data: category,
      httpStatus: HTTP_STATUS.OK,
    };
  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

export const getAllCategory = async (query) => {
  try {
    const matchCriteria = {}
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const keyword = query.keyword?.trim()
        const cacheKey = `category:${page}:${limit}:${keyword || "all"}`;
   const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    if (keyword) {
      matchCriteria.name = { $regex: keyword, $options: "i" }
    }

    const skip = (page - 1) * limit
    const pipeline = [
      { $match: matchCriteria },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ]

    const result = await Category.aggregate(pipeline)

    const data = result[0].data || []
    const total = result[0].totalCount[0]?.count || 0

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Category"),
      data,
      totalCount: total,
      currentCount: data.length,
      httpStatus: HTTP_STATUS.OK,
    };


    await setCache(cacheKey, response, 120);

    return response;
  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

export const updateCategory = async (catId, payload) => {
  try {
    const { name, image } = payload;

    const category = await Category.findById(catId);

    if (!category) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("Category"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

      if (image) {
        const newImagePath = "uploads/" + image.split("uploads/")[1];
        if (category.image) {
          deleteFile(category.image);
        }
        category.image = newImagePath;
      }

    if (name) {
      const existingCategory = await Category.findOne({
        name,
        _id: { $ne: catId },
      });

      if (existingCategory) {
        return {
          status: RESPONSE_STATUS.ERROR,
          message: RESPONSE_MESSAGES.ALREADY_EXISTS("Category"),
          httpStatus: HTTP_STATUS.CONFLICT,
        };
      }

      category.name = name;
      category.slug = slugify(name, {
        lower: true,
        strict: true,
      });
    }

    await category.save();

        await deleteCache("category:*");
    

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED("Category"),
      httpStatus: HTTP_STATUS.OK,
    };
  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

export const deleteCategory = async (catId) => {
  try {
    const category = await Category.findById(catId);

    if (!category) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND('Category'),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    await Category.findByIdAndDelete(catId);

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.DELETED('Category'),
      httpStatus: HTTP_STATUS.OK,
    };
  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};