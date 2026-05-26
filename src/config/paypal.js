import { Client, Environment, OrdersController } from "@paypal/paypal-server-sdk";
import { PAYPAL_CLIENT_KEY, PAYPAL_MODE, PAYPAL_SECRET_KEY } from "./const.js";

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_KEY,
    oAuthClientSecret: PAYPAL_SECRET_KEY,
  },
  environment:
    PAYPAL_MODE === "live"
      ? Environment.Production
      : Environment.Sandbox,
});

export const paypal = new OrdersController(client);