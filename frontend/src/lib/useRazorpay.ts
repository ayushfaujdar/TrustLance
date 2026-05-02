/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UseRazorpayOptions {
  onSuccess?: (data: { paymentId: string; orderId: string; signature: string }) => void;
  onError?: (error: string) => void;
}

export const useRazorpay = (options: UseRazorpayOptions = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const openCheckout = useCallback(
    async (amountInRupees: number) => {
      if (amountInRupees < 1) {
        toast.error("Minimum deposit is ₹1");
        return;
      }

      setIsProcessing(true);

      try {
        // Step 1: Create order on backend
        const { data: order } = await api.post("/wallet/create-order", {
          amount: amountInRupees,
        });

        // Step 2: Open Razorpay checkout modal
        const razorpayOptions = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "YougMinds",
          description: `Add ₹${amountInRupees.toLocaleString()} to wallet`,
          order_id: order.orderId,
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // Step 3: Verify payment on backend
              const { data: verification } = await api.post(
                "/wallet/verify-payment",
                {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }
              );

              toast.success(verification.message || "Payment successful!");
              options.onSuccess?.({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
              });
            } catch (verifyError: any) {
              const msg =
                verifyError?.response?.data?.message ||
                "Payment verification failed";
              toast.error(msg);
              options.onError?.(msg);
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: "",
            email: "",
            contact: "",
          },
          theme: {
            color: "#1A6B4A",
            backdrop_color: "rgba(0,0,0,0.6)",
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              toast("Payment cancelled", { icon: "✕" });
            },
            escape: true,
            confirm_close: true,
          },
        };

        if (typeof window.Razorpay === "undefined") {
          toast.error("Payment gateway is loading. Please try again.");
          setIsProcessing(false);
          return;
        }

        const rzp = new window.Razorpay(razorpayOptions);

        rzp.on("payment.failed", (response: any) => {
          const errorMsg =
            response?.error?.description || "Payment failed. Please try again.";
          toast.error(errorMsg);
          options.onError?.(errorMsg);
          setIsProcessing(false);
        });

        rzp.open();
      } catch (error: any) {
        const msg =
          error?.response?.data?.message || "Failed to create payment order";
        toast.error(msg);
        options.onError?.(msg);
        setIsProcessing(false);
      }
    },
    [options]
  );

  return { openCheckout, isProcessing };
};
