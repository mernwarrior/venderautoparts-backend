import { drawRaffleWinner } from "../services/drawn.service.js";
import raffleModel from "../models/raffle.model.js";
export const drawnRaffle = () => {

    cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  const rafflesToDraw = await raffleModel.find({
    drawDate: { $lte: now },
    drawStatus: 'pending',
  }).select('_id');

  for (const raffle of rafflesToDraw) {
    await drawRaffleWinner(raffle._id);
  }
});

    };