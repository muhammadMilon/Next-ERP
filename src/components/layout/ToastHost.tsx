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
          background: "#171a21",
          color: "#f5f7fa",
          border: "1px solid #272c37",
          borderRadius: "12px",
          boxShadow: "0 18px 40px -12px rgb(0 0 0 / 0.7), 0 2px 8px rgb(0 0 0 / 0.4)",
          fontSize: "13px",
          fontWeight: 500,
          padding: "10px 14px",
          maxWidth: "380px",
        },
        success: {
          iconTheme: { primary: "#2fbe83", secondary: "#0d1117" },
          style: { borderLeft: "3px solid #2fbe83" },
        },
        error: {
          iconTheme: { primary: "#f0575c", secondary: "#0d1117" },
          style: { borderLeft: "3px solid #f0575c" },
        },
        loading: {
          iconTheme: { primary: "#4d8df6", secondary: "#0d1117" },
          style: { borderLeft: "3px solid #4d8df6" },
        },
      }}
    />
  );
}
