import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { detectFileType } from '../src/services/watermark.service';
import { verifyPaymentSignature } from '../src/services/payment.service';

test('verifies Razorpay signatures and rejects tampered signatures', () => {
  const secret = 'test-only-razorpay-secret';
  const orderId = 'order_test_123';
  const paymentId = 'pay_test_456';
  process.env.RAZORPAY_KEY_SECRET = secret;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  assert.equal(verifyPaymentSignature(orderId, paymentId, signature), true);
  assert.equal(verifyPaymentSignature(orderId, paymentId, `${signature}tampered`), false);
});

test('detects supported file types from file extensions', () => {
  assert.equal(detectFileType('portfolio.PNG'), 'image');
  assert.equal(detectFileType('demo-video.mp4'), 'video');
  assert.equal(detectFileType('requirements.pdf'), 'document');
  assert.equal(detectFileType('voice-note.ogg'), 'audio');
  assert.equal(detectFileType('archive.bin'), 'other');
});
