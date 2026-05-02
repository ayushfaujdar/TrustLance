import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

let _razorpay: Razorpay | null = null;

const getRazorpay = (): Razorpay => {
  if (!_razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
    }
    _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _razorpay;
};

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}

export const createOrder = async (
  amountInPaise: number,
  receipt: string,
  notes?: Record<string, string>
): Promise<CreateOrderResult> => {
  const order = await getRazorpay().orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    notes: notes || {},
  });

  return {
    orderId: order.id,
    amount: order.amount as number,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID || '',
  };
};

export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
};

export const fetchPayment = async (paymentId: string) => {
  return getRazorpay().payments.fetch(paymentId);
};

export const createPayout = async (
  accountNumber: string,
  ifsc: string,
  name: string,
  amountInPaise: number,
  purpose: string
) => {
  // Note: Razorpay Payouts API requires RazorpayX account
  // For Phase 1, we'll queue payouts for manual processing
  // In production, use razorpay.payouts.create()
  return {
    id: `payout_${Date.now()}`,
    amount: amountInPaise,
    status: 'queued',
    account_number: accountNumber,
    ifsc,
    name,
    purpose,
    created_at: new Date(),
  };
};

export default {
  createOrder,
  verifyPaymentSignature,
  fetchPayment,
  createPayout,
};
