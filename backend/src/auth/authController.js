import axios from "axios";
import { supabase } from "../shared/supabase.js";
import dotenv from "dotenv";

dotenv.config();

export const githubAuth = async (req, res, next) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    if (response.data.error) {
      return res.status(400).json({ error: response.data.error_description });
    }

    res.json({ token: response.data.access_token });
  } catch (error) {
    next(error);
  }
};

export const signUp = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const logIn = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};
