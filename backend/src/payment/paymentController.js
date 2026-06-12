import Razorpay from "razorpay";
import crypto from "crypto";
import { supabase } from "../shared/supabase.js";
import { addTokens } from "../token/tokenController.js";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PACKAGES = {
  starter:   { tokens: 50,  amount: 9900,  label: '50 Tokens' },   // ₹99
  pro:       { tokens: 150, amount: 24900, label: '150 Tokens' },  // ₹249
  unlimited: { tokens: 500, amount: 49900, label: '500 Tokens' },  // ₹499
};

export const createOrder = async (req, res, next) => {
  const { packageId } = req.body;
  const userId = req.user.id;

  const pkg = PACKAGES[packageId];
  if (!pkg) return res.status(400).json({ error: "Invalid package" });

  try {
    const order = await razorpay.orders.create({
      amount: pkg.amount,
      currency: "INR",
      receipt: `tok_${userId.substring(0, 8)}_${Date.now()}`,
      notes: { userId, packageId, tokens: pkg.tokens },
    });

    await supabase.from('payments').insert({
      user_id: userId,
      razorpay_order_id: order.id,
      amount: pkg.amount,
      tokens: pkg.tokens,
      status: 'created',
    });

    res.json({
      orderId: order.id,
      amount: pkg.amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("createOrder ERROR:", error.message);
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.id;

  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', userId)
      .single();

    if (error || !payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.status === 'paid') return res.status(400).json({ error: "Payment already processed" });

    await supabase
      .from('payments')
      .update({ status: 'paid', razorpay_payment_id })
      .eq('id', payment.id);

    await addTokens(userId, payment.tokens, `Purchased ${payment.tokens} tokens`);

    const { data: tokenRow } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userId)
      .single();

    res.json({
      success: true,
      tokensAdded: payment.tokens,
      newBalance: tokenRow?.balance || 0,
    });
  } catch (error) {
    console.error("verifyPayment ERROR:", error.message);
    next(error);
  }
};

export const getPackages = async (req, res) => {
  res.json({
    packages: Object.entries(PACKAGES).map(([id, pkg]) => ({
      id,
      ...pkg,
      priceDisplay: `₹${(pkg.amount / 100).toFixed(0)}`,
    })),
  });
};
