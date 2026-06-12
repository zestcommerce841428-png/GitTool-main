-- Missing indexes for query performance
-- token_transactions is queried by user_id on every balance/history fetch
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id
    ON token_transactions (user_id);

-- payments is looked up by razorpay_order_id on every verify-payment call
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id
    ON payments (razorpay_order_id);

-- payments is also filtered by user_id in admin user-detail views
CREATE INDEX IF NOT EXISTS idx_payments_user_id
    ON payments (user_id);
