import * as kycService from "../services/kyc.service.js";

export const submitKyc = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await kycService.submitKyc(req.params.ticketId, req.files);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Buy Ticket Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};



export const getAllKycProof = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await kycService.getAllKycProof(req.query);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Buy Ticket Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

//Admin approve or reject kyc
export const kycApproved = async (req, res) => {
  try {
    const result = await kycService.kycApproved(req.params.id, req.body);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Buy Ticket Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

export const submitHostProof = async (req, res) => {
  try {
    const userId = req.user._id;
    if(!req.files.document || !req.files.document.length){
      return res.status(400).json({
        status: "error",  
        message: "please upload at least one document",
      });
    }
    const result = await kycService.submitHostProof(req.params.raffleId, userId, req.files);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Buy Ticket Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};


export const submitWinnerProof = async (req, res) => {
  try {
        if(!req.files.document || !req.files.document.length){
      return res.status(400).json({
        status: "error",  
        message: "please upload at least one document",
      });
    }

    const userId = req.user._id;
    const result = await kycService.submitWinnerProof(req.params.ticketId, userId, req.files);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Buy Ticket Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};


export const adminApproveAndRelease = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await kycService.adminApproveAndRelease(req.params.raffleId, req.body);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Buy Ticket Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

