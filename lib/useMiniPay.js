"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook to detect and connect to MiniPay wallet.
 * MiniPay injects window.ethereum with isMiniPay === true.
 * Connection is implicit inside MiniPay — no connect button needed.
 */
export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detect() {
      if (typeof window === "undefined" || !window.ethereum) {
        setLoading(false);
        return;
      }

      const miniPay = window.ethereum.isMiniPay === true;
      setIsMiniPay(miniPay);

      if (miniPay) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
          }
        } catch (err) {
          console.error("MiniPay connect error:", err);
        }
      }

      setLoading(false);
    }

    detect();
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        return accounts[0];
      }
    } catch (err) {
      console.error("Wallet connect error:", err);
    }
    return null;
  }, []);

  return { isMiniPay, address, loading, connect };
}
