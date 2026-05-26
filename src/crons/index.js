import { handleExpiredRaffles } from "./raffle.cron.js";
import { drawnRaffle } from "./drawRaffle.cron.js";
import { missedDraws } from "./missedDraws.cron.js";
import { checkKycDeadlines } from "./kyc.cron.js";

export const initCronJobs = () => {
  handleExpiredRaffles();
  checkKycDeadlines();
  // missedDraws()
  // drawnRaffle()
};