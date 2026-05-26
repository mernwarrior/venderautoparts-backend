import * as txnService from "../services/transaction.service.js";


export const getAllTransaction = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const result = await txnService.getAllTransaction(userId, role, req.query);
     return res.status(result.httpStatus).json(result);


  } catch (error) {
    next(error);
  }
};
