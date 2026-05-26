import * as ticketService from "../services/ticket.service.js";


export const getAllTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    const result = await ticketService.getAllTickets(userId, req.query);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Get All Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

export const getTicketsStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await ticketService.getTicketStats(userId, req.query);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Get All Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};
export const getAllTicketsByAdmin = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await ticketService.getAllTicketsByAdmin(req.query);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Get All Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};
