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
      if (!text || typeof text !== "string" || text.trim().length === 0 || text.length > 500) {
        return res.status(400).json({ error: "Invalid text parameter. Must be a string between 1 and 500 characters." });
      }

      const cleanText = text.trim();

      // Encode the text parameter to handle Georgian (UTF-8) characters properly
      const encodedText = encodeURIComponent(cleanText);
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

      // Post-process Wit.ai response to accurately align Georgian dates if Wit.ai defaulted to reference_time
      enhanceWitDatetime(data, text);

      return res.status(200).json(data);
    } catch (error: any) {
      console.error("🔥 Error in ChatController.proxyWitMessage:", error);
      return res.status(500).json({ error: error.message || "Internal server error contacting Wit.ai API." });
    }
  }
}

function enhanceWitDatetime(data: any, text: string) {
  if (!data || !data.entities || !text) return;

  const lower = text.toLowerCase();
  const now = new Date();
  const tbilisiOffsetMs = 4 * 60 * 60 * 1000;
  const tbilisiNow = new Date(now.getTime() + tbilisiOffsetMs);

  let targetYear = tbilisiNow.getUTCFullYear();
  let targetMonth = tbilisiNow.getUTCMonth(); // 0-indexed
  let targetDay: number | null = null;
  let targetHour: number | null = null;
  let targetMinute: number | null = null;

  // 1. Month names
  const geoMonths = [
    { regex: /იანვ(?:არს|არი|რის)?/, m: 0 },
    { regex: /თებერვ(?:ალს|ალი|ლის)?/, m: 1 },
    { regex: /მარტ(?:ს|ი|ის)?/, m: 2 },
    { regex: /აპრილ(?:ს|ი|ის)?/, m: 3 },
    { regex: /მაის(?:ს|ი|ის)?/, m: 4 },
    { regex: /ივნის(?:ს|ი|ის)?/, m: 5 },
    { regex: /ივლის(?:ს|ი|ის)?/, m: 6 },
    { regex: /აგვისტ(?:ოს|ო)?/, m: 7 },
    { regex: /სექტემბ(?:ერს|ერი|რის)?/, m: 8 },
    { regex: /ოქტომბ(?:ერს|ერი|რის)?/, m: 9 },
    { regex: /ნოემბ(?:ერს|ერი|რის)?/, m: 10 },
    { regex: /დეკემბ(?:ერს|ერი|რის)?/, m: 11 },
  ];

  for (const gm of geoMonths) {
    const mMatch = lower.match(new RegExp('(\\d{1,2})\\s*' + gm.regex.source)) ||
                   lower.match(new RegExp(gm.regex.source + '\\s*(\\d{1,2})'));
    if (mMatch) {
      const dVal = parseInt(mMatch[1], 10);
      if (dVal >= 1 && dVal <= 31) {
        targetDay = dVal;
        targetMonth = gm.m;
        if (targetMonth < tbilisiNow.getUTCMonth()) {
          targetYear = tbilisiNow.getUTCFullYear() + 1;
        }
        break;
      }
    }
  }

  // 2. Day of month: "15 რიცხვში", "15-ში", "15ში", "15-ს", "15ს", "15 რიცხვი"
  if (targetDay === null) {
    const dayMatch = lower.match(/(?:^|\s|[.,!?])(\d{1,2})\s*(?:რიცხვ(?:ში|ს|ი)?|-?ში(?![ა-ჰa-zA-Z])|-?ს(?![ა-ჰa-zA-Z])|-?ე(?![ა-ჰa-zA-Z]))/);
    if (dayMatch) {
      const dVal = parseInt(dayMatch[1], 10);
      if (dVal >= 1 && dVal <= 31) {
        targetDay = dVal;
        if (dVal < tbilisiNow.getUTCDate()) {
          targetMonth = (tbilisiNow.getUTCMonth() + 1) % 12;
          if (targetMonth === 0) targetYear++;
        }
      }
    }
  }

  // 3. Standalone number: e.g. "5", "16", "28"
  if (targetDay === null) {
    const standaloneMatch = lower.match(/^\s*(\d{1,2})\s*$/);
    if (standaloneMatch) {
      const dVal = parseInt(standaloneMatch[1], 10);
      if (dVal >= 1 && dVal <= 31) {
        targetDay = dVal;
        if (dVal < tbilisiNow.getUTCDate()) {
          targetMonth = (tbilisiNow.getUTCMonth() + 1) % 12;
          if (targetMonth === 0) targetYear++;
        }
      }
    }
  }

  // 4. Wit.ai number entity: e.g. { value: 5 }
  if (targetDay === null && data.entities) {
    const numEnt = data.entities['wit$number:number'] || data.entities['wit$number'];
    if (numEnt && numEnt[0] && typeof numEnt[0].value === 'number') {
      const dVal = numEnt[0].value;
      if (dVal >= 1 && dVal <= 31) {
        targetDay = dVal;
        if (dVal < tbilisiNow.getUTCDate()) {
          targetMonth = (tbilisiNow.getUTCMonth() + 1) % 12;
          if (targetMonth === 0) targetYear++;
        }
      }
    }
  }

  // 5. Numeric date: "15.10", "15/10"
  if (targetDay === null) {
    const numDateMatch = lower.match(/(?:^|\s)(\d{1,2})[./\-](\d{1,2})(?:[./\-](\d{2,4}))?(?:\s|$|[.,!?])/);
    if (numDateMatch) {
      const dVal = parseInt(numDateMatch[1], 10);
      const mVal = parseInt(numDateMatch[2], 10) - 1;
      if (dVal >= 1 && dVal <= 31 && mVal >= 0 && mVal <= 11) {
        targetDay = dVal;
        targetMonth = mVal;
        if (numDateMatch[3]) {
          const y = parseInt(numDateMatch[3], 10);
          targetYear = y < 100 ? 2000 + y : y;
        }
      }
    }
  }

  // 6. Relative dates: "დღეს", "ხვალ", "ზეგ"
  if (targetDay === null) {
    if (lower.includes('დღეს') || lower.includes('today')) {
      targetDay = tbilisiNow.getUTCDate();
      targetMonth = tbilisiNow.getUTCMonth();
    } else if (lower.includes('ხვალ') || lower.includes('tomorrow')) {
      const d = new Date(tbilisiNow.getTime() + 24 * 60 * 60 * 1000);
      targetDay = d.getUTCDate();
      targetMonth = d.getUTCMonth();
      targetYear = d.getUTCFullYear();
    } else if (lower.includes('ზეგ')) {
      const d = new Date(tbilisiNow.getTime() + 48 * 60 * 60 * 1000);
      targetDay = d.getUTCDate();
      targetMonth = d.getUTCMonth();
      targetYear = d.getUTCFullYear();
    }
  }

  // 7. Weekdays: "კვირას", "ორშაბათს", etc.
  if (targetDay === null) {
    const weekdays = [
      { regex: /კვირ(?:ას|ა)?/, day: 0 },
      { regex: /ორშაბათ(?:ს|ი)?/, day: 1 },
      { regex: /სამშაბათ(?:ს|ი)?/, day: 2 },
      { regex: /ოთხშაბათ(?:ს|ი)?/, day: 3 },
      { regex: /ხუთშაბათ(?:ს|ი)?/, day: 4 },
      { regex: /პარასკევ(?:ს|ი)?/, day: 5 },
      { regex: /შაბათ(?:ს|ი)?/, day: 6 },
    ];
    for (const wd of weekdays) {
      if (wd.regex.test(lower)) {
        const curDay = tbilisiNow.getUTCDay();
        let diff = wd.day - curDay;
        if (diff <= 0) diff += 7;
        const target = new Date(tbilisiNow.getTime() + diff * 24 * 60 * 60 * 1000);
        targetDay = target.getUTCDate();
        targetMonth = target.getUTCMonth();
        targetYear = target.getUTCFullYear();
        break;
      }
    }
  }

  // Time extraction
  const timeExact = lower.match(/(?:^|\s|[.,!?])(\d{1,2}):(\d{2})/);
  if (timeExact) {
    const h = parseInt(timeExact[1], 10);
    const m = parseInt(timeExact[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      targetHour = h;
      targetMinute = m;
    }
  } else {
    const timeWord = lower.match(/(?:^|\s|[.,!?])(\d{1,2})\s*(?:საათზე|საათი|სთ-ზე|სთ|-ზე(?![ა-ჰa-zA-Z]))/);
    if (timeWord) {
      let h = parseInt(timeWord[1], 10);
      if (h >= 1 && h <= 8) h += 12;
      if (h >= 0 && h <= 23) {
        targetHour = h;
        targetMinute = 0;
      }
    }
  }

  // Check if Wit.ai returned wit$datetime
  const dtKey = Object.keys(data.entities).find(k => k.startsWith('wit$datetime'));
  const pad = (n: number) => String(n).padStart(2, '0');

  if (targetDay !== null) {
    const hasSpecificTime = targetHour !== null;
    const finalH: number = targetHour !== null ? targetHour : 0;
    const finalM: number = targetMinute !== null ? targetMinute : 0;
    const grain = hasSpecificTime ? 'minute' : 'day';
    const updatedIso = `${targetYear}-${pad(targetMonth + 1)}-${pad(targetDay)}T${pad(finalH)}:${pad(finalM)}:00.000+04:00`;

    if (dtKey && data.entities[dtKey] && data.entities[dtKey][0]) {
      const ent = data.entities[dtKey][0];
      ent.value = updatedIso;
      ent.grain = grain;
      if (Array.isArray(ent.values)) {
        ent.values.forEach((v: any) => { 
          v.value = updatedIso; 
          v.grain = grain;
        });
      }
    } else {
      // Create wit$datetime entry so clients see it
      data.entities['wit$datetime:datetime'] = [{
        confidence: 1,
        value: updatedIso,
        body: text,
        grain,
        name: 'wit$datetime',
        role: 'datetime',
        type: 'value',
        values: [{ value: updatedIso, grain, type: 'value' }]
      }];
    }
  }
}
