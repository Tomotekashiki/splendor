import { env } from '../config/environment.js';

export class PaymentService {
  /**
   * Mock card verification/processing.
   */
  static async processCardPayment(
    amount: number,
    cardNumber: string
  ): Promise<{ success: boolean; transactionId: string; error?: string }> {
    console.log(`Processing online payment of ₾${amount}...`);

    if (env.PAYMENT_MOCK_MODE) {
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (cardNumber.startsWith("4111") || cardNumber === "success") {
        return {
          success: true,
          transactionId: "TXN_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        };
      } else {
        return {
          success: false,
          transactionId: "",
          error: "Card declined by local gateway. Please check card credentials.",
        };
      }
    } else {
      // In production, integrate with local bank API or payment provider
      return {
        success: true,
        transactionId: "TXN_PROD_12345",
      };
    }
  }
}
