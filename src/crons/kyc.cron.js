import cron from "node-cron";
import Ticket from '../models/ticket.model.js'
import Raffle from '../models/raffle.model.js'
import { DRAW_STATUS } from '../utils/constant.js';
import { drawRaffleWinner } from '../services/drawn.service.js';

export const checkKycDeadlines = () => {
  // Har 15 min me check karo
  cron.schedule('*/15 * * * *', async () => {
    const expired = await Raffle.find({
      $or: [
        { drawStatus: DRAW_STATUS.KYC_PENDING, kycDeadline: { $lte: new Date() } },
        { drawStatus: DRAW_STATUS.KYC_FAILED }
      ],
    });

    for (const raffle of expired) {
      console.warn(`KYC expired for raffle ${raffle._id}, triggering redraw`);

      // Previous winner ka ticket reset karo
      await Ticket.findByIdAndUpdate(raffle.winnerTicketId, { isWinner: false });

      await Raffle.findByIdAndUpdate(raffle._id, {
        drawStatus:    DRAW_STATUS.KYC_FAILED,
        winnerId:      null,
        winnerTicketId: null,
      });

      // Turant redraw
      await drawRaffleWinner(raffle._id, true);
    }
  });
};
