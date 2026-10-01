import { Request, Response } from "express";
import { env } from "../config/environment.js";

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
      // Calculate current local time in Georgia (UTC+4) dynamically
      const now = new Date();
      const tbilisiFormatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Tbilisi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const referenceTime = `${tbilisiFormatter.format(now).replace(' ', 'T')}+04:00`;

      const contextObj = {
        reference_time: referenceTime,
        timezone: "Asia/Tbilisi"
      };

      const contextStr = encodeURIComponent(JSON.stringify(contextObj));
      const url = `https://api.wit.ai/message?v=20260630&q=${encodedText}&context=${contextStr}`;

      console.log(`💬 Proxying message to Wit.ai: "${text}" with reference_time: ${referenceTime}`);
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${env.WIT_AI_TOKEN}`
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
