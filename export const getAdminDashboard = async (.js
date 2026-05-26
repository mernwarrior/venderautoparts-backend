export const getAdminDashboard = async () => {
  try {

    // ─── Cache ───────────────────────────────────────────────────────────────
    const cacheKey   = `dashboard:admin:stats`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) return cachedData;

    // ─── All queries parallel ─────────────────────────────────────────────────
    const [
      activeRaffles,
      pendingApprovals,
      activeUsers,
      salesData,
      escrowData,
    ] = await Promise.all([

      // 1. Active raffles — approved + not ended
      Raffle.countDocuments({
        status:        RAFFAL_STATUS.APPROVE,
        raffleEndDate: { $gte: new Date() },
      }),

      // 2. Pending approvals — submitted but not reviewed yet
      Raffle.countDocuments({
        status: RAFFAL_STATUS.PENDING,
      }),

      // 3. Active users — verified + not blocked + not deleted
      User.countDocuments({
        isEmailVerified: true,
        isBlocked:       false,
        isDeleted:       false,
        status:          USER_STATUS.ACTIVE,
      }),

      // 4. Sales volume — total successful orders
      Order.aggregate([
        { $match: { paymentStatus: "success" } },
        {
          $group: {
            _id:         null,
            totalSales:  { $sum: "$amount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),

      // 5. Escrow balance — all locked earnings
      RaffleEarning.aggregate([
        {
          $group: {
            _id:            "$status",
            totalAmount:    { $sum: "$netAmount" },
            totalGross:     { $sum: "$grossAmount" },
            totalFees:      { $sum: "$platformFee" },
            count:          { $sum:1 },
          },
        },
      ]),

    ]);

    // ─── Parse sales ─────────────────────────────────────────────────────────
    const salesVolume  = salesData?.[0]?.totalSales  || 0;
    const totalOrders  = salesData?.[0]?.totalOrders || 0;

    // ─── Parse escrow ─────────────────────────────────────────────────────────
    const escrowLocked   = escrowData.find((e) => e._id === "locked");
    const escrowReleased = escrowData.find((e) => e._id === "released");

    const escrowBalance     = escrowLocked?.totalAmount   || 0;
    const escrowGross       = escrowLocked?.totalGross    || 0;
    const escrowFees        = escrowLocked?.totalFees     || 0;
    const escrowCount       = escrowLocked?.count         || 0;
    const releasedBalance   = escrowReleased?.totalAmount || 0;
    const releasedCount     = escrowReleased?.count       || 0;

    // ─── Response ─────────────────────────────────────────────────────────────
    const response = {
      status:     RESPONSE_STATUS.SUCCESS,
      message:    RESPONSE_MESSAGES.RETRIEVE("Dashboard"),
      httpStatus: HTTP_STATUS.OK,
      data: {
        raffles: {
          active:          activeRaffles,
          pendingApproval: pendingApprovals,
        },
        users: {
          active: activeUsers,
        },
        sales: {
          volume:      salesVolume,
          totalOrders,
        },
        escrow: {
          locked: {
            balance:      escrowBalance,
            grossAmount:  escrowGross,
            platformFees: escrowFees,
            raffleCount:  escrowCount,
          },
          released: {
            balance:     releasedBalance,
            raffleCount: releasedCount,
          },
        },
      },
    };

    // Cache — 5 min
    await setCache(cacheKey, response, 300);
    return response;

  } catch (error) {
    console.error("getAdminDashboard Error:", error);
    throw error;
  }
};