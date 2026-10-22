import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
export const metadata: Metadata = { title: "SehatMitra Care", description: "Offline-first healthcare coordination for Indian care teams." };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body><PwaRegister/>{children}</body></html>; }
