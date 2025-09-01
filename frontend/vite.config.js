import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Expense-Tracker/",
  test: { environment: "jsdom", setupFiles: "./setupTests.js" }
});
