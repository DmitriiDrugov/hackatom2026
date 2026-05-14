"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { ScenarioComparison, ScenarioInputs, ScenarioKey, ScenarioPayload } from "@/lib/domain";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const EXPLICIT_MOCK = process.env.NEXT_PUBLIC_USE_MOCK;
const USE_MOCK = EXPLICIT_MOCK ? EXPLICIT_MOCK === "true" : process.env.NODE_ENV === "development";

type RequestOptions = RequestInit & {
  retryAttempts?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function resolveUrl(path: string) {
  const apiPath = path.startsWith("/") ? path : `/${path}`;

  if (USE_MOCK) {
    return `/api/mock${apiPath}`;
  }

  return `${normalizeBaseUrl(API_URL)}/api${apiPath}`;
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const retryAttempts = options.retryAttempts ?? 3;
  const { retryAttempts: _retryAttempts, ...fetchOptions } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt < retryAttempts; attempt += 1) {
    try {
      const response = await fetch(resolveUrl(path), {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed with ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;

      if (attempt === retryAttempts - 1) {
        break;
      }

      await sleep(250 * 2 ** attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}

function useSlowFlag(isFetching: boolean, thresholdMs = 500) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isFetching) {
      setIsSlow(false);
      return;
    }

    const timer = window.setTimeout(() => setIsSlow(true), thresholdMs);
    return () => window.clearTimeout(timer);
  }, [isFetching, thresholdMs]);

  return isSlow;
}

export function useScenarioQuery(scenario: ScenarioKey) {
  const query = useQuery({
    queryKey: ["scenario", scenario],
    queryFn: () => requestJson<ScenarioPayload>(`/scenario/${scenario}`),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
  const isSlow = useSlowFlag(query.isFetching);

  return useMemo(() => ({ ...query, isSlow }), [query, isSlow]);
}

export function useScenarioMutation() {
  const mutation = useMutation({
    mutationFn: (inputs: ScenarioInputs) =>
      requestJson<ScenarioComparison>("/scenario", {
        method: "POST",
        body: JSON.stringify(inputs),
      }),
  });
  const isSlow = useSlowFlag(mutation.isPending);

  return useMemo(() => ({ ...mutation, isSlow }), [mutation, isSlow]);
}

export const apiClientConfig = {
  apiUrl: API_URL,
  mockMode: USE_MOCK,
};
