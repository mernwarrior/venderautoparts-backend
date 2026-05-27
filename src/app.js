import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import passport from "./config/passport.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import raffalRoutes from "./routes/raffal.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import orderRoutes from "./routes/order.routes.js"
import transactionRoutes from "./routes/transaction.routes.js"
import ticketRoutes from "./routes/ticket.routes.js"
import supportRoutes from "./routes/support.routes.js"
import kycRoutes from "./routes/kyc.routes.js"
import bankRoutes from "./routes/bank.routes.js"
import withdrawalRoutes from "./routes/withdrawal.routes.js"
import { errorMiddleware } from "./middlewares/error.middleware.js";
import settingRoutes from "./routes/settings.routes.js";
import path from "path";

// Bull Board
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { raffleDrawQueue } from "./queues/raffleDraw.queue.js";
import smtpSettingRoutes from "./routes/smtpSetting.routes.js";

import autorderRoutes from "./routes/autorder.routes.js";
import productRoutes from "./routes/product.routes.js"
import contactRoutes from "./routes/contact.routes.js";
const app = express();

// ─── Bull Board setup ────────────────────────────────────────────────────────
const bullBoardAdapter = new ExpressAdapter();
bullBoardAdapter.setBasePath("/admin/queues");
createBullBoard({
  queues: [new BullMQAdapter(raffleDrawQueue)],
  serverAdapter: bullBoardAdapter,
});
app.use("/admin/queues", bullBoardAdapter.getRouter());

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://adminvender.vercel.app",
    "https://raffal-frontend.vercel.app",
    "https://www.venderautoparts.com"
  ],
  credentials: true
};

app.use(cors(corsOptions));

// app.options(/.*/, cors());
// app.options("*", cors());
// app.options("/{*splat}", cors());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());
// app.use(passport.session());
app.get("/test", (req, res) => {
  res.json({ ok: true, msg: "NEW DEPLOY WORKING" });
});

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
 
app.use('/api/product', productRoutes);  
app.use('/api', autorderRoutes);    
app.use('/api', contactRoutes);  
app.use(errorMiddleware);

export default app;