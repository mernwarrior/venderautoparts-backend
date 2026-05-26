import * as raffalService from "../services/raffal.service.js";
import { HTTP_STATUS, RESPONSE_STATUS } from "../utils/constant.js";


export const createRaffal = async (req, res, next) => {
  try {
    const result = await raffalService.createRaffal({ ...req.body, files: req.files, userId: req.user._id});

    res.status(result.httpStatus).json({
        message: result.message,
        status: result.status,
      });




  } catch (error) {
    next(error); 
  }
};

//For Admin
export const getRaffalById = async (req, res, next) => {
  try {
            const raffalId = req.params.id
    

    const result = await raffalService.getRaffalById(raffalId);

    res.status(result.httpStatus).json({
        message: result.message ,
        status: result.status,
        data:result.data
      });

  } catch (error) {
    next(error); 
  }
};

export const getRaffalByRaffleId = async (req, res, next) => {
  try {
            const raffalId = req.params.raffleId
    
        if (!raffalId) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            status: RESPONSE_STATUS.ERROR,
            message: "Raffal Id is required",
          });
        }
    const result = await raffalService.getRaffalByRaffleId(raffalId);

    res.status(result.httpStatus).json({
        message: result.message ,
        status: result.status,
        data:result.data
      });

  } catch (error) {
    next(error); 
  }
};

export const getRaffalByUser = async (req, res, next) => {
  try {
    // console.log(req.user)
      const userId = req.user._id  

    const result = await raffalService.getRaffalByUser(userId, req.query);

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

export const getAllRaffal = async (req, res, next) => {
  try {
    const result = await raffalService.getAllRaffal(req.query);

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

export const updateRaffal = async (req, res, next) => {
  try {
 const result = await raffalService.updateRaffal(
    req.params.id,
    {
      ...req.body,
      files: req.files,
      userId: req.user._id
    }
  );
    res.status(result.httpStatus).json({
        message: result.message,
        status: result.status,
      });

  } catch (error) {
    next(error); 
  }
};

export const deleteRaffal = async (req, res, next) => {
  try {
        
    const result = await raffalService.deleteRaffal(req.params.id);

    res.status(result.httpStatus).json({
        message: result.message ,
        status: result.status,
      });

  } catch (error) {
    next(error); 
  }
};

//Update Raffal Status by Admin
export const updateRaffalStatus = async (req, res, next) => {
  try {
      const currentUserId = req.user.userId
    const result = await raffalService.updateRaffalStatus(currentUserId, req.params.id, req.body);

    res.status(result.httpStatus).json({
        message: result.message ,
        status: result.status,
      });

  } catch (error) {
    next(error); 
  }
};