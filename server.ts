import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function inferMimeType(name: string, provided?: string): string {
  if (provided && provided !== 'application/octet-stream') {
    return provided;
  }
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'csv') return 'text/csv';
  if (ext === 'txt' || ext === 'md' || ext === 'log') return 'text/plain';
  return provided || 'application/pdf';
}

function extractReadableError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'Unexpected server error contacting Gemini API.');
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      return String(parsed.error.message);
    }
  } catch {
    // not JSON
  }
  return raw;
}

function isRetryableError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('resource_exhausted') ||
    msg.includes('overloaded') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('aborted') ||
    msg.includes('econnreset') ||
    msg.includes('fetch failed')
  );
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: Parameters<GoogleGenAI['models']['generateContent']>[0]['contents'];
    systemInstruction: string;
    thinkingLevel: ThinkingLevel;
    responseMimeType?: string;
    responseSchema?: unknown;
  }
) {
  const attempts: Array<{
    model: string;
    thinkingLevel: ThinkingLevel;
    waitBeforeMs: number;
    timeoutMs: number;
  }> = [
    { model: 'gemini-4-hydrogen', thinkingLevel: params.thinkingLevel, waitBeforeMs: 0, timeoutMs: 8500 },
    { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.LOW, waitBeforeMs: 150, timeoutMs: 20000 },
    { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL, waitBeforeMs: 400, timeoutMs: 20000 },
  ];

  let lastErr: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    if (attempt.waitBeforeMs > 0) {
      await delay(attempt.waitBeforeMs);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), attempt.timeoutMs);

    try {
      const config: Record<string, unknown> = {
        systemInstruction: params.systemInstruction,
        thinkingConfig: { thinkingLevel: attempt.thinkingLevel },
        abortSignal: controller.signal,
      };
      if (params.responseMimeType) {
        config.responseMimeType = params.responseMimeType;
      }
      if (params.responseSchema) {
        config.responseSchema = params.responseSchema;
      }

      const response = await Promise.race([
        ai.models.generateContent({
          model: attempt.model,
          contents: params.contents,
          config,
        }),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener(
            'abort',
            () => reject(new Error(`Gemini (${attempt.model}) request timed out after ${attempt.timeoutMs}ms.`)),
            { once: true }
          );
        }),
      ]);

      if (response.text && response.text.trim()) {
        return { text: response.text, modelUsed: attempt.model };
      }

      const finishReason = response.candidates?.[0]?.finishReason;
      throw new Error(
        `Gemini (${attempt.model}) returned an empty response${finishReason ? ` (finishReason: ${finishReason})` : ''}.`
      );
    } catch (err) {
      lastErr = err;
      const retryable = isRetryableError(err) || (err instanceof Error && err.message.includes('empty response'));
      console.warn(
        `[Gemini attempt ${i + 1}/${attempts.length} via ${attempt.model}] Failed: ${extractReadableError(err)}`
      );
      if (!retryable && i >= 1) {
        const msg = extractReadableError(err).toLowerCase();
        if (!msg.includes('not found') && !msg.includes('unsupported')) {
          throw err;
        }
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastErr;
}

interface ChatMessageInput {
  role: 'user' | 'assistant';
  text: string;
}

interface AttachmentInput {
  name: string;
  mimeType: string;
  base64Data?: string;
  textContent?: string;
}

const COPILOT_SYSTEM_INSTRUCTION = `You are FinSight AI Copilot, an enterprise Chartered Accountancy practice assistant built for A Y & COMPANY – Chartered Accountants (Jaipur, Rajasthan, India).

Follow these strict operating rules:
1. GROUNDED PRACTICE INTELLIGENCE:
   When asked about clients, missing documents, overdue GST/ROC/TDS/ITR tasks, employee workload, compliance risk scores, or financial anomalies, answer strictly and accurately using ONLY the live PRACTICE_CONTEXT JSON supplied in the request.
   - Cite exact client names, client codes (e.g., AYC-101), employee names, dates, INR amounts, and document filenames from PRACTICE_CONTEXT.
   - Never invent clients, filings, or numbers that do not appear in PRACTICE_CONTEXT.
   - If the requested item does not exist in PRACTICE_CONTEXT, state that clearly.

2. VERBATIM DOCUMENT EXTRACTION & BRIEFING:
   When a user attaches/uploads a document (PDF, image, CSV, or text statement):
   - Extract and brief the document contents EXACTLY as written in the source document.
   - Preserve every invoice number, date, GSTIN, PAN, HSN/SAC code, party name, line item description, quantity, rate, taxable value, CGST/SGST/IGST, cess, bank balance, and total amount VERBATIM without rounding, altering, guessing, or omitting values.
   - Do NOT synthesize or extrapolate missing values. If a field is illegible or absent from the document, explicitly write "Not found in document".
   - Highlight any arithmetic discrepancies (e.g., taxable + tax != total, GST rate mismatches, duplicate lines) clearly under an "Anomalies / Observations for CA Review" heading, while keeping the raw extracted numbers untouched.

3. COMMUNICATION STYLE:
   - Be concise, structured, and audit-ready. Use clean headings and bullet points.
   - Clearly distinguish automated observations from formal Chartered Accountant sign-off or professional financial advice.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  app.post('/api/copilot/chat', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Add GEMINI_API_KEY in the Settings > Secrets panel to run live FinSight AI Copilot queries and document extraction.',
      });
    }

    try {
      const {
        messages,
        practiceContext,
        attachment,
      }: {
        messages?: ChatMessageInput[];
        practiceContext?: unknown;
        attachment?: AttachmentInput;
      } = req.body || {};

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'At least one chat message is required.' });
      }

      // Ensure Gemini contents always start with a 'user' turn and alternate roles cleanly
      const trimmed = messages.slice(-10).filter((m) => m && typeof m.text === 'string' && m.text.trim());
      const firstUserIdx = trimmed.findIndex((m) => m.role === 'user');
      const normalizedMessages = firstUserIdx >= 0 ? trimmed.slice(firstUserIdx) : trimmed;

      if (normalizedMessages.length === 0) {
        return res.status(400).json({ error: 'At least one user message is required.' });
      }

      const historyParts = normalizedMessages.map((m, idx) => {
        const isLast = idx === normalizedMessages.length - 1;
        const parts: Array<
          | { text: string }
          | { inlineData: { mimeType: string; data: string } }
        > = [];

        if (isLast && m.role === 'user') {
          if (practiceContext) {
            parts.push({
              text: `LIVE_PRACTICE_CONTEXT (JSON):\n${JSON.stringify(practiceContext)}`,
            });
          }
          if (attachment) {
            const resolvedMime = inferMimeType(attachment.name, attachment.mimeType);
            if (attachment.textContent) {
              parts.push({
                text: `ATTACHED_DOCUMENT_FILENAME: ${attachment.name}\nVERBATIM_FILE_CONTENT:\n${attachment.textContent}`,
              });
            } else if (attachment.base64Data) {
              parts.push({
                text: `ATTACHED_DOCUMENT_FILENAME: ${attachment.name} (${resolvedMime}). Extract and brief all data verbatim without altering any number, ID, or line item.`,
              });
              parts.push({
                inlineData: {
                  mimeType: resolvedMime,
                  data: attachment.base64Data,
                },
              });
            }
          }
        }

        parts.push({ text: m.text });
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        };
      });

      const result = await generateWithFallback(ai, {
        contents: historyParts,
        systemInstruction: COPILOT_SYSTEM_INSTRUCTION,
        thinkingLevel: attachment ? ThinkingLevel.MEDIUM : ThinkingLevel.LOW,
      });

      return res.json({ reply: result.text, modelUsed: result.modelUsed });
    } catch (err) {
      const message = extractReadableError(err);
      console.error('[/api/copilot/chat] Error:', message);
      return res.status(502).json({ error: message });
    }
  });

  app.post('/api/copilot/extract-document', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets to extract uploaded documents with Gemini.',
      });
    }

    try {
      const { name, mimeType, base64Data, textContent }: AttachmentInput = req.body || {};
      if (!name || (!base64Data && !textContent)) {
        return res.status(400).json({ error: 'Document filename and file payload are required.' });
      }

      const resolvedMime = inferMimeType(name, mimeType);
      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [
        {
          text: `Perform a STRICT VERBATIM extraction of the attached financial/compliance document "${name}".
Copy every identifier, party name, date, line item, and currency figure verbatim without modifying, rounding, or guessing.
If a numeric field is not present, return null. If a text field is absent, return "Not found in document".
Verify GST/tax arithmetic: ONLY add entries to anomaliesDetected if there is an actual mathematical mismatch, duplicate entry, or missing mandatory tax ID; leave anomaliesDetected as [] if all extracted figures reconcile cleanly.`,
        },
      ];

      if (textContent) {
        parts.push({ text: `VERBATIM_TEXT_CONTENT:\n${textContent}` });
      } else if (base64Data) {
        parts.push({
          inlineData: {
            mimeType: resolvedMime,
            data: base64Data,
          },
        });
      }

      const result = await generateWithFallback(ai, {
        contents: [{ role: 'user', parts }],
        systemInstruction: COPILOT_SYSTEM_INSTRUCTION,
        thinkingLevel: ThinkingLevel.MEDIUM,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentTitle: { type: Type.STRING },
            detectedCategory: {
              type: Type.STRING,
              enum: [
                'PAN Card',
                'Aadhaar',
                'GST Registration Certificate',
                'Sales Invoices',
                'Purchase Invoices',
                'Bank Statements',
                'Income Tax Returns',
                'TDS Certificates',
                'Form 16',
                'Balance Sheets',
                'Profit & Loss Statements',
                'Audit Reports',
                'Other Financial Documents',
              ],
            },
            partyName: { type: Type.STRING },
            counterpartyName: { type: Type.STRING },
            pan: { type: Type.STRING },
            gstin: { type: Type.STRING },
            invoiceOrRefNo: { type: Type.STRING },
            documentDate: { type: Type.STRING },
            period: { type: Type.STRING },
            taxableValue: { type: Type.NUMBER, nullable: true },
            cgst: { type: Type.NUMBER, nullable: true },
            sgst: { type: Type.NUMBER, nullable: true },
            igst: { type: Type.NUMBER, nullable: true },
            gstAmount: { type: Type.NUMBER, nullable: true },
            totalAmount: { type: Type.NUMBER, nullable: true },
            verbatimLineItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            anomaliesDetected: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            executiveBriefing: { type: Type.STRING },
          },
          required: [
            'documentTitle',
            'detectedCategory',
            'partyName',
            'invoiceOrRefNo',
            'documentDate',
            'verbatimLineItems',
            'anomaliesDetected',
            'executiveBriefing',
          ],
        },
      });

      const cleanedJson = result.text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const extracted = JSON.parse(cleanedJson);
      return res.json({ extracted, modelUsed: result.modelUsed });
    } catch (err) {
      const message = extractReadableError(err);
      console.error('[/api/copilot/extract-document] Error:', message);
      return res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FinSight server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
