import { Request, Response } from "express";

export class ChatController {
  /**
   * Proxies message requests to Wit.ai securely.
   * Prevents revealing the API key on the client side.
   */
  static async proxyWitMessage(req: Request, res: Response) {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text parameter 'text' is required in request body." });
      }

      // Encode the text parameter to handle Georgian (UTF-8) characters properly
      const encodedText = encodeURIComponent(text);
      const url = `https://api.wit.ai/message?v=20260630&q=${encodedText}`;

      // Calculate current local time in Georgia (UTC+4) dynamically
      const now = new Date();
      const tzOffsetMs = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
      const localTimeMs = now.getTime() + (now.getTimezoneOffset() * 60000) + tzOffsetMs;
      const georgiaDate = new Date(localTimeMs);
      const referenceTime = georgiaDate.toISOString().replace("Z", "+04:00");

      const contextObj = {
        reference_time: referenceTime
      };

      console.log(`💬 Proxying message to Wit.ai: "${text}" with reference_time: ${referenceTime}`);
      const response = await fetch(url, {
        headers: {
          "Authorization": "Bearer AL67M6GXBIYZR2RVD53ALBYW34ZFF6T4",
          "X-Wit-Context": JSON.stringify(contextObj)
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Wit.ai proxy call failed with status ${response.status}: ${errorText}`);
        return res.status(response.status).json({ error: "Wit.ai API error", details: errorText });
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error: any) {
      console.error("🔥 Error in ChatController.proxyWitMessage:", error);
      return res.status(500).json({ error: error.message || "Internal server error contacting Wit.ai API." });
    }
  }
}
