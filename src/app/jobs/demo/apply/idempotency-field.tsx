"use client";

import { useEffect, useState } from "react";

/** Sets a one-time idempotency key without inline script / dangerouslySetInnerHTML. */
export function IdempotencyKeyField() {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()),
    );
  }, []);

  return <input type="hidden" name="idempotencyKey" value={value} readOnly />;
}
