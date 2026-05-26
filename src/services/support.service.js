import Support from "../models/support.model.js";
import Message from "../models/message.model.js";
import { HTTP_STATUS, RESPONSE_STATUS, ROLE_TYPE, SUPPORT_STATUS } from "../utils/constant.js";
import { RESPONSE_MESSAGES } from "../utils/response.js";
// import Counter from "../models/counter.model.js";
import mongoose from "mongoose";
import { getCache, setCache } from "../utils/cacheService.js";



// ✅ Create Ticket
export const createTicket = async (payload, files, userId) => {

    try {

   let screenshotMedia = null;

    if (files?.screenshot?.length) {
      screenshotMedia = files.screenshot[0].relativePath;
    }
  const ticket = await Support.create({
    ...payload,
    userId: userId,
    screenshot:screenshotMedia
  });

  await Message.create({
    supportId: ticket._id,
    sender: userId,
    message:payload.message
  });

      return {
        status: RESPONSE_STATUS.SUCCESS,
        message: RESPONSE_MESSAGES.CREATED('Support Ticket'),
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

// ✅ Send Message
export const sendMessage = async (ticketId, payload, user) => {
  try {
    const { message } = payload;

    const ticket = await Support.findById(ticketId);

    if (!ticket) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("Ticket"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    if (ticket.status === SUPPORT_STATUS.CLOSED) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Ticket is already closed",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    const isAdmin = user.role === ROLE_TYPE.ADMIN;

    const msg = await Message.create({
      supportId: ticketId, 
      sender: user._id,
      message,
      isAdmin,
    });

    const updateData = {
      lastMessage: message,
      lastMessageAt: new Date(),
    };

    if (isAdmin) {
      updateData.unreadCount = 0;
    } else {
      updateData.$inc = { unreadCount: 1 };
    }

    await Support.findByIdAndUpdate(ticketId, updateData);

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.CREATED("Message"),
      httpStatus:HTTP_STATUS.SUCCESS,
      // data: msg,
    };
  } catch (error) {
    return {
      status: RESPONSE_STATUS.ERROR,
      message: "Something went wrong",
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

// // ✅ Get Messages (pagination)
export const getMessages = async (ticketId) => {
  try {
    const pipeline = [
      {
        $match: {
          supportId: new mongoose.Types.ObjectId(ticketId),
        },
      },

    //   {
    //     $lookup: {
    //       from: "users",
    //       localField: "sender",
    //       foreignField: "_id",
    //       as: "sender",
    //       pipeline: [
    //         {
    //           $project: {
    //             firstName: 1,
    //             lastName: 1,
    //             username: 1,
    //             avatar: 1,
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$sender",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },

      {
        $sort: { createdAt: 1 },
      },

      {
        $project: {
          message: 1,
          isAdmin: 1,
          read: 1,
          createdAt: 1,
          sender: 1,
        },
      },
    ];

    const result = await Message.aggregate(pipeline);
    // console.log('result', result)

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Messages"),
      data: result,
      httpStatus:HTTP_STATUS.OK
    };
  } catch (error) {
    throw error;
  }
};

// // ✅ Get Tickets
export const getTickets = async (userId, role, query) => {
        const matchCriteria = {};

    try {

           const {page = 1,  limit = 10,  keyword} = query;


    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

        const cacheKey = `supports:${role}:${userId}:${pageNumber}:${limitNumber}:${keyword || 'all'}`;
    
        const cachedData = await getCache(cacheKey);
        if (cachedData) return cachedData;

  if (role !== ROLE_TYPE.ADMIN) {
      matchCriteria.userId = new mongoose.Types.ObjectId(userId);
    }

    const keywordFilter = keyword
  ? {
      $or: [
        { "user.firstName": { $regex: keyword, $options: "i" } },
        { "user.lastName": { $regex: keyword, $options: "i" } },
        { "user.userName": { $regex: keyword, $options: "i" } },
      ],
    }
  : {};

// console.log(matchCriteria, 'matchCriteria')


const pipeline = [
  { $match: matchCriteria },

  ...(role === ROLE_TYPE.ADMIN
    ? [
        // 🔹 user lookup
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
            pipeline: [
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  username: 1,
                  email: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 🔹 keyword search (IMPORTANT)
        ...(keyword ? [{ $match: keywordFilter }] : []),

        // 🔹 unread count lookup
        {
          $lookup: {
            from: "messages",
            let: { supportId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$supportId", "$$supportId"] },
                      { $eq: ["$isAdmin", false] },
                      { $eq: ["$read", false] },
                    ],
                  },
                },
              },
              { $count: "unreadCount" },
            ],
            as: "unreadData",
          },
        },
        {
          $addFields: {
            unreadCount: {
              $ifNull: [
                { $arrayElemAt: ["$unreadData.unreadCount", 0] },
                0,
              ],
            },
          },
        },
        {
          $project: { unreadData: 0 },
        },
      ]
    : []),

  { $sort: { createdAt: -1 } },

  {
    $facet: {
      data: [{ $skip: skip }, { $limit: limitNumber }],
      totalCount: [{ $count: "count" }],
    },
  },
];


        const result = await Support.aggregate(pipeline);
    
        const data = result[0]?.data || [];
        const totalCount = result[0]?.totalCount[0]?.count || 0;
    
    
        const response = {
          status: RESPONSE_STATUS.SUCCESS,
          message: RESPONSE_MESSAGES.RETRIEVE("Support"),
          httpStatus: HTTP_STATUS.OK,
          data,
          totalCount,
          currentCount: data.length,   
    
        };

           await setCache(cacheKey, response, 60);
        
            return response;
        
    } catch (error) {
           return errorResponse(
              error.message || RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
              HTTP_STATUS.SERVER_ERROR
            );
    }

};

// // ✅ Close Ticket
export const closeTicket = async (ticketId) => {
  try {

        const ticket = await Support.findById(ticketId);

    if (!ticket) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("Ticket"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }


        if (ticket.status === SUPPORT_STATUS.CLOSED) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Ticket is already closed",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    await Support.findByIdAndUpdate(
    ticketId,
    { status: SUPPORT_STATUS.CLOSED },
    { returnDocument: 'after' }
  );

      return {
      status: RESPONSE_STATUS.SUCCESS,
      message: "Ticket is closed successfully!",
      httpStatus:HTTP_STATUS.SUCCESS,
      // data: msg,
    };
    
  } catch (error) {
       return errorResponse(
          error.message || RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
          HTTP_STATUS.SERVER_ERROR
        );
  }

};