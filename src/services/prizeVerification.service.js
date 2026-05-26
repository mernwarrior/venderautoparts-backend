// services/prizeVerification.service.js
import mongoose from "mongoose";

import Ticket from '../models/ticket.model.js'
import Raffle from '../models/raffle.model.js'
import PrizeVerification from '../models/prizeVerification.model.js';
import Notification from "../models/notification.model.js"
import RaffleEarning from '../models/raffleEarning.model.js';
import { DRAW_STATUS, HTTP_STATUS, RESPONSE_STATUS } from "../utils/constant.js";

const errorResponse = (message, httpStatus = HTTP_STATUS.BAD_REQUEST) => ({
    status: RESPONSE_STATUS.ERROR,
    message,
    httpStatus,
});

// Winner — KYC submit kare
export const submitKyc = async (raffleId, winnerId, kycFilePath) => {
    
  const verification = await PrizeVerification.findOneAndUpdate(
    { raffleId, winnerId, status: DRAW_STATUS.KYC_PENDING },
    { kycDocument: kycFilePath, kycSubmittedAt: new Date(), status: 'kyc_verified' },
    { new: true }
  );

  if (!verification) return errorResponse('Verification not found or already submitted');

  await Raffle.findByIdAndUpdate(raffleId, { drawStatus: DRAW_STATUS.PRIZE_IN_DELIVERY });

  // Host ko notify karo — deliver karo
  await Notification.create({
    userId:  verification.hostId,
    message: `Winner verified for "${raffle.title}". Please deliver the prize.`,
    // meta: { raffleId, type: NOTIFICATION_TYPE.DELIVER_PRIZE },
  });

  return { status: 'success' };
};

// Host — delivery proof upload kare
export const submitHostProof = async (raffleId, hostId, proofFilePath) => {
  await PrizeVerification.findOneAndUpdate(
    { raffleId, hostId },
    { hostDeliveryProof: proofFilePath, hostProofAt: new Date() },
  );

  await Raffle.findByIdAndUpdate(raffleId, { drawStatus: DRAW_STATUS.PRIZE_IN_DELIVERY });

  // Winner ko notify — confirm karo
  await Notification.create({
    userId:  verification.winnerId,
    message: `Host has delivered your prize for "${raffle.title}". Please confirm receipt.`,
    // meta: { raffleId, type: NOTIFICATION_TYPE.CONFIRM_RECEIPT },
  });

  return { status: 'success' };
};

// Winner — receipt confirm kare (ticket page pe button)
export const submitWinnerProof = async (raffleId, winnerId, proofFilePath) => {
  await PrizeVerification.findOneAndUpdate(
    { raffleId, winnerId },
    { winnerProof: proofFilePath, winnerProofAt: new Date(), status: DRAW_STATUS.PROOF_SUBMITTED },
  );

  await Raffle.findByIdAndUpdate(raffleId, { drawStatus: DRAW_STATUS.PROOF_SUBMITTED });

  // Admin ko notify — review karo
  await Notification.create({
    userId:  ADMIN_USER_ID,
    message: `Both proofs submitted for "${raffle.title}". Review pending.`,
    // meta: { raffleId, type: NOTIFICATION_TYPE.ADMIN_REVIEW },
  });

  return { status: 'success' };
};

// Admin — approve kare, escrow release
export const adminApproveAndRelease = async (raffleId, adminNote) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const verification = await PrizeVerification.findOne({ raffleId }).session(session);
    const earning      = await RaffleEarning.findOne({ raffleId }).session(session);

    // Escrow release — host wallet me credit
    await User.findByIdAndUpdate(
      earning.hostId,
      { $inc: { wallet: earning.netAmount } },
      { session }
    );

    await RaffleEarning.findByIdAndUpdate(earning._id, {
      status:     'released',
      releasedAt: new Date(),
    }, { session });

    await PrizeVerification.findByIdAndUpdate(verification._id, {
      status:          'approved',
      adminApprovedAt: new Date(),
      adminNote,
    }, { session });

    await Raffle.findByIdAndUpdate(raffleId, {
      drawStatus: 'completed',
    }, { session });

    // Host ko notify
    await Notification.create([{
      userId:  earning.hostId,
      message: `Prize verified. $${earning.netAmount} added to your wallet.`,
      //meta: { raffleId, type: NOTIFICATION_TYPE.WALLET_CREDITED },
    }], { session });

    await session.commitTransaction();
    return { status: 'success' };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
