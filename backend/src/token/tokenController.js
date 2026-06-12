import { supabase } from "../shared/supabase.js";

// ─── Get current user's token balance + usage stats ───
export const getBalance = async (req, res, next) => {
  const userId = req.user.id;
  try {
    let { data, error } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userId)
      .single();

    // If no row exists yet, create one with 40 tokens
    if (error && error.code === 'PGRST116') {
      const { data: newRow, error: insertErr } = await supabase
        .from('user_tokens')
        .insert({ user_id: userId, balance: 40 })
        .select('balance')
        .single();
      if (insertErr) throw insertErr;
      data = newRow;
    } else if (error) {
      throw error;
    }

    // Fetch usage stats from token_transactions
    const [{ data: credits }, { data: debits }] = await Promise.all([
      supabase.from('token_transactions').select('amount').eq('user_id', userId).gt('amount', 0),
      supabase.from('token_transactions').select('amount').eq('user_id', userId).lt('amount', 0),
    ]);

    // totalEarned = signup bonus (40) + all positive transactions (purchases, admin adjustments)
    const totalEarned = 40 + (credits || []).reduce((s, t) => s + t.amount, 0);
    const totalUsed   = Math.abs((debits || []).reduce((s, t) => s + t.amount, 0));

    res.json({ balance: data.balance, totalUsed, totalEarned });
  } catch (error) {
    console.error("getBalance ERROR:", error.message);
    next(error);
  }
};

// ─── Get transaction history ───
export const getTransactions = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const { data, error } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ transactions: data });
  } catch (error) {
    next(error);
  }
};

// ─── Deduct tokens (optimistic lock) — called internally from other controllers ───
export async function deductToken(userId, amount, type, description) {
  // Step 1: read current balance
  const { data: tokenRow, error: fetchErr } = await supabase
    .from('user_tokens')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (fetchErr) throw new Error('Could not fetch token balance');
  if (!tokenRow || tokenRow.balance < amount) {
    const err = new Error('Insufficient tokens');
    err.status = 403;
    throw err;
  }

  const newBalance = tokenRow.balance - amount;

  // Step 2: update only if balance hasn't changed (optimistic lock)
  const { error: upErr } = await supabase
    .from('user_tokens')
    .update({ balance: newBalance })
    .eq('user_id', userId)
    .eq('balance', tokenRow.balance);

  if (upErr) throw upErr;

  await supabase.from('token_transactions').insert({
    user_id: userId,
    amount: -amount,
    type,
    description,
  });

  return newBalance;
}

// ─── Add tokens — called after successful payment verification ───
export async function addTokens(userId, amount, description) {
  // Fetch current balance, then update with optimistic lock
  const { data: tokenRow, error: fetchErr } = await supabase
    .from('user_tokens')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (fetchErr) {
    // Row doesn't exist — create it
    await supabase.from('user_tokens').insert({ user_id: userId, balance: amount });
  } else {
    const newBalance = tokenRow.balance + amount;
    await supabase
      .from('user_tokens')
      .update({ balance: newBalance })
      .eq('user_id', userId)
      .eq('balance', tokenRow.balance); // optimistic lock
  }

  await supabase.from('token_transactions').insert({
    user_id: userId,
    amount,
    type: 'purchase',
    description,
  });
}
