import * as supportService from "../services/support.service.js"
import mongoose from "mongoose";

export const createTicket = async (req, res, next) => {
    try {
         const ticket = await supportService.createTicket(req.body, req.files, req.user._id);
  res.json({ status: "success", data: ticket });
        
    } catch (error) {
        next(error);
    }
 
};

export const sendMessage = async (req, res, next) => {

    try {

                   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID"
            });
        }
        
       const result = await supportService.sendMessage(req.params.id, req.body, req.user);
               return res.status(result.httpStatus).json(result);

    } catch (error) {
         next(error);
    }
  
};

export const getMessages = async (req, res, next) => {

    try {

        const result = await supportService.getMessages(req.params.id);
        return res.status(result.httpStatus).json(result);
        
    } catch (error) {
        next(error);
    }
  
};

export const getTickets = async (req, res, next) => {
    try {

          const userId = req.user._id;
    const role = req.user.role;

          const result = await supportService.getTickets(userId, role, req.query );
          return res.status(result.httpStatus).json(result);
        
    } catch (error) {
        next(error);
    }

};

export const closeTicket = async (req, res, next) => {
    try {

           if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID"
            });
        }



          const result = await supportService.closeTicket(req.params.id);
                    return res.status(result.httpStatus).json(result);


        
    } catch (error) {
         next(error);
        
    }
};