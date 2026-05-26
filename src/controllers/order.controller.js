import * as orderService from "../services/order.service.js";


export const buyTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await orderService.buyTickets(req.body, userId, req);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Buy Ticket Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

export const capturePayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paypalOrderId } = req.body;
    const result = await orderService.capturePaypalPayment(paypalOrderId, userId, req);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};


export const getAllOrders = async (req, res) => {
  try {
    // const userId = req.user._id;

    const result = await orderService.getAllOrders(req.query);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Get All Orders Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};