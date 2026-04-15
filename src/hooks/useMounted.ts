"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

export function useMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
