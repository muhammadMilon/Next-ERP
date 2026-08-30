"use client";

import { Toaster } from "react-hot-toast";

/** One toast surface for the whole product, styled to the brand. */
export function ToastHost() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      toastOptions={{
        duration: 3000,
        style: {
          background: "#ffffff",
          color: "#0f172a",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 10px 30px -10px rgb(15 23 42 / 0.22), 0 2px 8px rgb(15 23 42 / 0.06)",
          fontSize: "13px",
          fontWeight: 500,
          padding: "10px 14px",
          maxWidth: "380px",
        },
        success: {
          iconTheme: { primary: "#17805b", secondary: "#ffffff" },
          style: { borderLeft: "3px solid #17805b" },
        },
        error: {
          iconTheme: { primary: "#b91c1c", secondary: "#ffffff" },
          style: { borderLeft: "3px solid #b91c1c" },
        },
        loading: {
          iconTheme: { primary: "#eb6834", secondary: "#ffffff" },
          style: { borderLeft: "3px solid #eb6834" },
        },
      }}
    />
  );
}
