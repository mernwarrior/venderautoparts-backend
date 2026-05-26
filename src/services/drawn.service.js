// services/draw.service.js
import mongoose from "mongoose";
import Raffle from "../models/raffle.model.js";
import Ticket from "../models/ticket.model.js";
import PrizeVerification from '../models/prizeVerification.model.js'
import Order from "../models/order.model.js";
import Transaction from "../models/transaction.model.js"
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js"
import RaffleEarning from "../models/raffleEarning.model.js"
import { DRAW_STATUS, TICKET_STATUS } from "../utils/constant.js";
import { sendEmail } from "../utils/emailService.js";
import { getWinnerTemplate } from "../utils/emailTemplates/winnerTemplate.js";
import { DEFAULT_SETTINGS } from "../utils/constant.js";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const drawRaffleWinner = async (raffleId, isRedraw = false) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const raffle = await Raffle.findById(raffleId).session(session);
    if (!raffle || raffle.drawStatus !== TICKET_STATUS.PENDING) {
      await session.abortTransaction();
      return;
    }


        const tickets = await Ticket.find({raffleId, isWinner: false, }).session(session); // redraw me previous winner exclude

         if (!tickets.length) {
      await session.abortTransaction();
      return;
    }

    // console.log('tickets', tickets)
   

    // if (!tickets.length) {
    //   // Koi ticket nahi bika — raffle cancel, earning record bhi delete
    //   await Raffle.findByIdAndUpdate(raffleId, { drawStatus: TICKET_STATUS.DRAWN }, { session });
    //   await RaffleEarning.findOneAndDelete({ raffleId }, { session });
    //   await session.commitTransaction();
    //   return;
    // }

       // KYC deadline 
    const kycDeadline = new Date(Date.now() + DEFAULT_SETTINGS.KYC_DEAD_LINE * ONE_DAY_MS);

    const winnerTicket = tickets[Math.floor(Math.random() * tickets.length)];
        // console.log('winnerTicket', tickets)


    await Ticket.updateMany({ raffleId }, { $set: { status: TICKET_STATUS.DRAWN } },  { session });

    await Ticket.findByIdAndUpdate(winnerTicket._id, { isWinner: true}, { session });


    await Raffle.findByIdAndUpdate(raffleId, {
      drawStatus: DRAW_STATUS.KYC_PENDING,
      winnerId: winnerTicket.userId,
      winnerTicketId: winnerTicket._id,
      kycDeadline,
      $inc: { redrawCount: isRedraw ? 1 : 0 },
    }, { session });

        // PrizeVerification record banao
    await PrizeVerification.create([{
      raffleId,
      ticketId:winnerTicket._id,
      winnerId: winnerTicket.userId,
      hostId:   raffle.userId,
      status:   DRAW_STATUS.KYC_PENDING,
    }], { session });


    // Winner ko notify karo — prize accept karne ka option
    await Notification.create([{
      userId: winnerTicket.userId,
      message: `🎉 You won "${raffle.title}"! Submit your ID within ${kycDeadline.toLocaleString()} hours to claim..`,
      meta: { raffleId, type: 'PRIZE_CONFIRM_REQUIRED' }
    }], { session });

    // Host ko notify karo
    await Notification.create([{
      userId: raffle.userId,
      message: `Winner drawn for "${raffle.title}". Deliver the prize to unlock your earnings.`,
      meta: { raffleId, type: 'DELIVER_PRIZE' }
    }], { session });

    const winnerUser = await User.findById(winnerTicket.userId);

        sendEmail(
          winnerUser.email,
          "🎉 Congratulations! You won a raffle!",
          getWinnerTemplate(winnerUser.userName, raffle.title, winnerTicket.ticketNumber, kycDeadline.toLocaleString())
        );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    console.error('drawRaffleWinner error:', err);
  } finally {
    session.endSession();
  }
};

//  yarn add bullmq ioredis @bull-board/api @bull-board/express