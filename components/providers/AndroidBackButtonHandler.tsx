"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";

export default function AndroidBackButtonHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let active = true;
    let listener: PluginListenerHandle | undefined;

    const registerBackButton = async () => {
      try {
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            void App.exitApp();
          }
        });

        if (active) {
          listener = handle;
        } else {
          await handle.remove();
        }
      } catch (error) {
        console.error("[HAVLOOK_ANDROID_BACK] Listener registration failed:", error);
      }
    };

    void registerBackButton();

    return () => {
      active = false;
      if (listener) void listener.remove();
    };
  }, []);

  return null;
}
