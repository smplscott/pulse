import type { IncomingMessage, ServerResponse } from "http";
import type { Express } from "express";
import { createApp } from "../server/app";

/**
 * Vercel Node function entry. All /api/* requests are rewritten here.
 * bodyParser is disabled so Express can read the raw request body.
 */
export const config = {
  maxDuration: 60,
  api: {
    bodyParser: false,
  },
};

let appPromise: Promise<Express> | undefined;

async function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = createApp().then(({ app }) => app);
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  app(req, res);
}
