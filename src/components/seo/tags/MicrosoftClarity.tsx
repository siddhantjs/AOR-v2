"use client";

import Clarity from "@microsoft/clarity";
import { useEffect } from "react";

/** Microsoft Clarity project ID (Settings → Overview in Clarity dashboard). */
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

/**
 * Initializes Microsoft Clarity for session recordings and heatmaps.
 * Mount once in the root layout   applies to every App Router page.
 */
export function MicrosoftClarity() {
  useEffect(() => {
    if (!CLARITY_PROJECT_ID) return;
    Clarity.init(CLARITY_PROJECT_ID);
  }, []);

  return null;
}
