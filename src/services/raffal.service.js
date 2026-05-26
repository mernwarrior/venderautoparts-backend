import { HTTP_STATUS, RAFFAL_STATUS, RESPONSE_STATUS, ROLE_TYPE, TICKET_STATUS, USER_STATUS } from "../utils/constant.js";
import Raffle from "../models/raffle.model.js";
import { RESPONSE_MESSAGES } from "../utils/response.js";
import { deleteCache, getCache, setCache } from "../utils/cacheService.js";
import mongoose from "mongoose";
import slugify from "slugify";
import { deleteFile } from "../utils/index.js";
import { cancelRaffleDraw, rescheduleRaffleDraw, scheduleRaffleDraw } from "../queues/raffleDraw.queue.js";


export const createRaffal = async (payload) => {
  try {

    const { files, userId, ...raffleData } = payload;

    const existingRaffle = await Raffle.findOne({ title: raffleData.title })
      .select("_id")
      .lean();

    if (existingRaffle) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.ALREADY_EXISTS('This title'),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    const slug = slugify(payload.title, { lower: true });

    let featureMedia = null;
    let prizeProfDoc = null;
    let featureImage = [];


    if (files?.featureMedia?.length) {
      featureMedia = files.featureMedia[0].relativePath;
    }

    if (files?.prizeProfDoc?.length) {
      prizeProfDoc = files.prizeProfDoc[0].relativePath;
    }
    if (files?.featureImage?.length) {
  featureImage = files.featureImage.map(file => file.relativePath);
}

    const newRaffle = await Raffle.create({
      ...raffleData,
      featureMedia,
      prizeProfDoc,
      featureImage,
      userId: userId,
      slug
    });

    await scheduleRaffleDraw(newRaffle._id, newRaffle.drawDate);

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.CREATED('Raffal'),
      httpStatus: HTTP_STATUS.OK
    };

  } catch (error) {
    console.error(error);

    return {
      status: RESPONSE_STATUS.ERROR,
      message: "Something went wrong",
      httpStatus: HTTP_STATUS.SERVER_ERROR
    };
  }
};

export const getRaffalByUser = async (id, query) => {
  try {
    const matchCriteria = {userId:id}
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const keyword = query.keyword?.trim()

    const cacheKey = `raffal-by-user:${page}:${limit}:${id}:${query.status}:${keyword || "rf-user-all"}`;
   const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    if (query.status && query.status !== "all") {
      matchCriteria.status = query.status;
    }
    if (keyword) {
      matchCriteria.title = { $regex: keyword, $options: "i" }
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

    const result = await Raffle.aggregate(pipeline)

    const data = result[0].data || []
    const total = result[0].totalCount[0]?.count || 0

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Raffal"),
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

// export const getAllRaffal = async (query) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       keyword,
//       status,
//       category,
//       date
//     } = query;

//     const pageNumber = parseInt(page);
//     const limitNumber = parseInt(limit);

//     const skip = (pageNumber - 1) * limitNumber;

//     const matchCriteria = {};

//     /* ---------------- STATUS FILTER ---------------- */

//     if (status) {
//       matchCriteria.status = status;
//     }

//     /* ---------------- CATEGORY FILTER ---------------- */

//     if (category && mongoose.Types.ObjectId.isValid(category)) {
//       matchCriteria.category = new mongoose.Types.ObjectId(category);
//     }

//     /* ---------------- KEYWORD SEARCH ---------------- */

//     if (keyword?.trim()) {
//       matchCriteria.title = {
//         $regex: keyword.trim(),
//         $options: "i",
//       };
//     }

//     /* ---------------- DATE FILTER ---------------- */

//     if (date) {

//       const now = new Date();
//       let startDate;

//       switch (date) {

//         case "today":
//           startDate = new Date();
//           startDate.setHours(0, 0, 0, 0);
//           break;

//         case "week":
//           startDate = new Date();
//           startDate.setDate(startDate.getDate() - 7);
//           break;

//         case "month":
//           startDate = new Date();
//           startDate.setMonth(startDate.getMonth() - 1);
//           break;

//         case "year":
//           startDate = new Date();
//           startDate.setFullYear(startDate.getFullYear() - 1);
//           break;
//       }

//       if (startDate) {
//         matchCriteria.createdAt = { $gte: startDate };
//       }
//     }

//     /* ---------------- CACHE KEY ---------------- */

//     const cacheKey = `raffle:${pageNumber}:${limitNumber}:${keyword || "all"}:${status || "all"}:${category || "all"}:${date || "all"}`;

//     const cachedData = await getCache(cacheKey);

//     if (cachedData) {
//       return cachedData;
//     }

//     /* ---------------- AGGREGATION PIPELINE ---------------- */

//     const pipeline = [

//       {
//         $match: matchCriteria,
//       },

//       {
//         $sort: { createdAt: -1 },
//       },

//       {
//         $lookup: {
//           from: "categories",
//           localField: "category",
//           foreignField: "_id",
//           as: "category",
//           pipeline: [
//             {
//               $project: {
//                 name: 1,
//               },
//             },
//           ],
//         },
//       },

//       {
//         $unwind: {
//           path: "$category",
//           preserveNullAndEmptyArrays: true,
//         },
//       },

//       {
//         $lookup: {
//           from: "users",
//           localField: "userId",
//           foreignField: "_id",
//           as: "user",
//           pipeline: [
//             {
//               $project: {
//                 firstName: 1,
//                 lastName: 1,
//                 email: 1,
//                 userName:1,
//                 avatar:1
//               },
//             },
//           ],
//         },
//       },

//       {
//         $unwind: {
//           path: "$user",
//           preserveNullAndEmptyArrays: true,
//         },
//       },

//       {
//   $addFields: {
//     remainingTickets: {
//       $subtract: ["$totalTickets", "$soldTickets"]
//     },
//     soldPercentage: {
//       $cond: {
//         if: { $gt: ["$totalTickets", 0] },
//         then: {
//           $round: [
//             {
//               $multiply: [
//                 { $divide: ["$soldTickets", "$totalTickets"] },
//                 100
//               ]
//             },
//             2  // 2 decimal places
//           ]
//         },
//         else: 0
//       }
//     },
//     isSoldOut: {
//       $gte: ["$soldTickets", "$totalTickets"]
//     }
//   }
// },

//       {
//         $facet: {
//           data: [
//             { $skip: skip },
//             { $limit: limitNumber }
//           ],
//           totalCount: [
//             { $count: "count" }
//           ]
//         }
//       }
//     ];

//     const result = await Raffle.aggregate(pipeline);

//     const data = result[0]?.data || [];
//     const totalCount = result[0]?.totalCount[0]?.count || 0;

//     const response = {
//       status: RESPONSE_STATUS.SUCCESS,
//       message: RESPONSE_MESSAGES.RETRIEVE("Raffle"),
//       data,
//       totalCount,
//       currentCount: data.length,
//       httpStatus: HTTP_STATUS.OK,
//     };

//     /* ---------------- CACHE STORE ---------------- */

//     await setCache(cacheKey, response, 120);

//     return response;

//   } catch (error) {

//     console.error("Get All Raffle Error:", error);

//     return {
//       status: RESPONSE_STATUS.ERROR,
//       message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
//       httpStatus: HTTP_STATUS.SERVER_ERROR,
//     };
//   }
// };

export const getAllRaffal = async (query) => {
  try {
    const {
      page = 1,
      limit = 10,
      keyword,
      status,
      category,
      date,
      type,        // ← naya
    } = query;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const matchCriteria = {};
    const now = new Date();

    /* ---------------- TYPE FILTER ---------------- */

    switch (type) {
      case "upcoming":
        matchCriteria.status = RAFFAL_STATUS.APPROVE;
        matchCriteria.raffleStartDate = { $gt: now };
        break;

      case "active":
        matchCriteria.status = RAFFAL_STATUS.APPROVE;
        matchCriteria.raffleStartDate = { $lte: now };
        matchCriteria.raffleEndDate = { $gte: now };
        break;

      case "ended":
        matchCriteria.status = RAFFAL_STATUS.ENDED;
        break;

      case "completed":
        matchCriteria.status = RAFFAL_STATUS.COMPLETED;
        break;

      default:
        // type nahi aaya — normal status filter chale
        if (status) matchCriteria.status = status;
        break;
    }

    /* ---------------- CATEGORY FILTER ---------------- */

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      matchCriteria.category = new mongoose.Types.ObjectId(category);
    }

    /* ---------------- KEYWORD SEARCH ---------------- */

    if (keyword?.trim()) {
      matchCriteria.title = { $regex: keyword.trim(), $options: "i" };
    }

    /* ---------------- DATE FILTER ---------------- */

    if (date) {
      let startDate;

      switch (date) {
        case "today":
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      if (startDate) {
        matchCriteria.createdAt = { $gte: startDate };
      }
    }

    /* ---------------- CACHE KEY ---------------- */

    const cacheKey = `raffle:${pageNumber}:${limitNumber}:${keyword || "all"}:${status || "all"}:${category || "all"}:${date || "all"}:${type || "all"}`;

    const cachedData = await getCache(cacheKey);
    if (cachedData) return cachedData;

    /* ---------------- AGGREGATION PIPELINE ---------------- */

    const pipeline = [
      { $match: matchCriteria },
      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            { $project: { firstName: 1, lastName: 1, email: 1, userName: 1, avatar: 1 } },
          ],
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // Revenue lookup
      {
        $lookup: {
          from: "orders",
          let: { raffleId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $and: [
                  { $eq: ["$raffleId", "$$raffleId"] },
                  { $eq: ["$paymentStatus", "success"] },
                ]},
              },
            },
            { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
          ],
          as: "revenueData",
        },
      },

      {
        $addFields: {
          // Ticket stats
          remainingTickets: { $subtract: ["$totalTickets", "$soldTickets"] },
          soldPercentage: {
            $cond: {
              if: { $gt: ["$totalTickets", 0] },
              then: {
                $round: [
                  { $multiply: [{ $divide: ["$soldTickets", "$totalTickets"] }, 100] },
                  2,
                ],
              },
              else: 0,
            },
          },
          isSoldOut: { $gte: ["$soldTickets", "$totalTickets"] },

          // Revenue
          totalRevenue: {
            $ifNull: [{ $arrayElemAt: ["$revenueData.totalRevenue", 0] }, 0],
          },

          // Raffle current state — frontend ko computed milega
          raffleState: {
            $switch: {
              branches: [
                { case: { $gt: ["$raffleStartDate", now] }, then: "upcoming" },
                {
                  case: {
                    $and: [
                      { $lte: ["$raffleStartDate", now] },
                      { $gte: ["$raffleEndDate", now] },
                    ],
                  },
                  then: "active",
                },
                { case: { $lt: ["$raffleEndDate", now] }, then: "ended" },
              ],
              default: "unknown",
            },
          },

          // Countdown fields
          startsInDays: {
            $cond: {
              if: { $gt: ["$raffleStartDate", now] },
              then: {
                $ceil: {
                  $divide: [{ $subtract: ["$raffleStartDate", now] }, 86400000],
                },
              },
              else: null,
            },
          },
          endsInDays: {
            $cond: {
              if: { $gte: ["$raffleEndDate", now] },
              then: {
                $ceil: {
                  $divide: [{ $subtract: ["$raffleEndDate", now] }, 86400000],
                },
              },
              else: null,
            },
          },
        },
      },

      { $unset: "revenueData" },

      {
        $facet: {
          data: [
            { $skip: skip }, 
            { $limit: limitNumber },
             {
        $project: {
          description: 0,  // ← bas yeh add karo
        }
      }
          ],
          totalCount: [{ $count: "count" }],
          
        },
      },
    ];

    const result = await Raffle.aggregate(pipeline);

    const data = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Raffle"),
      data,
      totalCount,
      currentCount: data.length,
      httpStatus: HTTP_STATUS.OK,
    };

    await setCache(cacheKey, response, 120);
    return response;

  } catch (error) {
    console.error("Get All Raffle Error:", error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};
export const getRaffalById = async (raffalId) => {
  try {
    const cacheKey = `raffal:${raffalId}`
    const cachedData = await getCache(cacheKey)
    if(cachedData){
      return cachedData
    }
    const pipeline = [
      {
        $match:{_id: new mongoose.Types.ObjectId(raffalId)}
      },{
        $lookup:{
          from:'categories',
          localField:'category',
          foreignField:"_id",
          as:"category",
          pipeline:[
            {
              $project:{
                name:1
              }
            }
          ]
        }
      },
      {
          $unwind:{
            path: "$category",
            preserveNullAndEmptyArrays:true
          }
        },

        {
          $lookup:{
            from:"users",
            localField:"userId",
            foreignField:"_id",
            as:"users",
            pipeline:[
              {
                $project:{
                  firstName:1,
                  lastName:1,
                  email:1,
                  userName:1,
                  avatar:1
                }
              }
            ]
          }
        },
        {
          $unwind:{
            path: "$host",
            preserveNullAndEmptyArrays:true
          }
        }
    ]
     const result = await Raffle.aggregate(pipeline);
    const raffle = result[0];

    if (!raffle) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("Raffle"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Raffle"),
      data: raffle,
      httpStatus: HTTP_STATUS.OK,
    };

    // cache for 2 minutes
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

export const getRaffalByRaffleId = async (raffleId) => {
  try {
    const cacheKey = `raffle:code:${raffleId}`;
    const cachedData = await getCache(cacheKey)
    if(cachedData){
      return cachedData
    }
    const pipeline = [
      {
        $match:{raffleId}
      },{
        $lookup:{
          from:'categories',
          localField:'category',
          foreignField:"_id",
          as:"category",
          pipeline:[
            {
              $project:{
                name:1
              }
            }
          ]
        }
      },
      {
          $unwind:{
            path: "$category",
            preserveNullAndEmptyArrays:true
          }
        },

        {
          $lookup:{
            from:"users",
            localField:"userId",
            foreignField:"_id",
            as:"users",
            pipeline:[
              {
                $project:{
                  firstName:1,
                  lastName:1,
                  email:1,
                  userName:1,
                  avatar:1
                }
              }
            ]
          }
        },
        {
          $unwind:{
            path: "$host",
            preserveNullAndEmptyArrays:true
          }
        }
    ]
     const result = await Raffle.aggregate(pipeline);
    const raffle = result[0];

    if (!raffle) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("Raffle"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Raffle"),
      data: raffle,
      httpStatus: HTTP_STATUS.OK,
    };

    // cache for 2 minutes
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

export const updateRaffal = async (id, payload = {}) => {
  try {

    const { files, userId, ...raffleData } = payload;

    const existingRaffle = await Raffle.findById(id);

    if (!existingRaffle) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("Raffle"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    // duplicate title check
    if (raffleData.title) {
      const duplicate = await Raffle.findOne({
        title: raffleData.title,
        _id: { $ne: id },
      }).lean();

      if (duplicate) {
        return {
          status: RESPONSE_STATUS.ERROR,
          message: RESPONSE_MESSAGES.ALREADY_EXISTS("This title"),
          httpStatus: HTTP_STATUS.BAD_REQUEST,
        };
      }

           
      
    }
    
    if(payload.title){
       raffleData.slug = slugify(payload.title, { lower: true, strict: true });
    }

    // ===== FEATURE MEDIA =====
    if (files?.featureMedia?.length) {

      // delete old
      deleteFile(existingRaffle.featureMedia);

      raffleData.featureMedia = files.featureMedia[0].relativePath;
    }

    // ===== PRIZE DOC =====
    if (files?.prizeProfDoc?.length) {

      deleteFile(existingRaffle.prizeProfDoc);

      raffleData.prizeProfDoc = files.prizeProfDoc[0].relativePath;
    }

    // ===== FEATURE IMAGES =====
    if (files?.featureImage?.length) {

      // delete old images
      if (existingRaffle.featureImage?.length) {
        existingRaffle.featureImage.forEach((img) => deleteFile(img));
      }

      raffleData.featureImage = files.featureImage.map(
        (file) => file.relativePath
      );
    }

        if (
      raffleData.drawDate &&
      existingRaffle.drawStatus === TICKET_STATUS.PENDING &&
      new Date(raffleData.drawDate).getTime() !==
        new Date(existingRaffle.drawDate).getTime()
    ) {
      await rescheduleRaffleDraw(id, raffleData.drawDate);
    }

    await Raffle.findByIdAndUpdate(
      id,
      { $set: raffleData },
      { returnDocument: 'after' }
    );

        await deleteCache("raffle:*");
        await deleteCache("raffal-by-user:*");


    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED("Raffle"),
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

export const deleteRaffal = async (raffleId) => {
  try {

    const raffle = await Raffle.findById(raffleId); 

    if (!raffle) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("Raffle"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }
        if (raffle.drawStatus === TICKET_STATUS.PENDING) {
      await cancelRaffleDraw(raffleId);
    }

    await Raffle.findByIdAndDelete(raffleId);

    // optional cache clear
        await deleteCache("raffle:*");

    await deleteCache(`raffle:${raffleId}`);
    await deleteCache(`raffle:code:${raffle.raffleId}`);

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.DELETED("Raffle"),
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

export const updateRaffalStatus = async (currentUserId, id, payload) => {
  try {
    // console.log('paylaod', payload)
    const { status, rejectionReason } = payload;

    const existingRaffle = await Raffle.findById(id);

    if (!existingRaffle) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("Raffle"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    if (status === RAFFAL_STATUS.REJECTED && !rejectionReason) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Rejection reason is required when rejecting raffle",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    const raffleData = {
      status,
    };

    // If Approved
    if (status === RAFFAL_STATUS.APPROVE) {
      raffleData.approvedBy = currentUserId;
      raffleData.approvedAt = new Date();
    }

    // If Rejected
    if (status === RAFFAL_STATUS.REJECTED) {
      raffleData.rejectionReason = rejectionReason;
      raffleData.rejectedBy = currentUserId;
      raffleData.rejectedAt = new Date();
    }

    await Raffle.findByIdAndUpdate(
      id,
      { $set: raffleData },
      { returnDocument: 'after' }
    );

    await deleteCache("raffle:*");

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED("Raffle"),
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