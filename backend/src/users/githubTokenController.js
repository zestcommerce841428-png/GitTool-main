import { supabase } from '../shared/supabase.js';
import { encrypt, decrypt } from '../shared/encryption.js';

export const saveGithubToken = async (req, res, next) => {
    const userId = req.user.id;
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token required" });

    try {
        const { iv, encryptedData } = encrypt(token);
        
        const { error } = await supabase
            .from('github_tokens')
            .upsert({ user_id: userId, encrypted_token: encryptedData, iv: iv, updated_at: new Date() }, { onConflict: 'user_id' });

        if (error) throw error;
        res.json({ success: true, message: "Token saved securely" });
    } catch (err) { next(err); }
};

export const getGithubTokenStatus = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const { data, error } = await supabase.from('github_tokens').select('updated_at').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') throw error;
        if (!data) return res.json({ connected: false });
        res.json({ connected: true, updated_at: data.updated_at });
    } catch (err) { next(err); }
};

export const fetchDecryptedToken = async (userId) => {
    const { data, error } = await supabase.from('github_tokens').select('encrypted_token, iv').eq('user_id', userId).single();
    if (error || !data) {
        const err = new Error("GitHub account disconnected or token missing. Please reconnect GitHub in your profile to proceed.");
        err.status = 401;
        err.code = "GITHUB_AUTH";
        throw err;
    }
    try {
        return decrypt(data.encrypted_token, data.iv);
    } catch (decryptErr) {
        const err = new Error("Stored GitHub token is invalid or corrupted. Please reconnect GitHub in your profile to proceed.");
        err.status = 401;
        err.code = "GITHUB_AUTH";
        throw err;
    }
};
