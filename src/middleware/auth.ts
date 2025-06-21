import { createClient } from '@supabase/supabase-js';
import { NextFunction, Request, Response } from 'express';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    'Supabase URL or Service Role Key is not defined in environment variables.'
  );
  process.exit(1); // Exit if essential Supabase credentials are missing
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];

    const { data: userData, error } = await supabase.auth.getUser(token);

    if (error || !userData.user) {
      console.error(
        'JWT verification error:',
        error ? error.message : 'User not found'
      );
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    req.userId = userData.user.id; // Attach the Supabase user ID to the request
    next();
  } catch (err) {
    console.error('Authentication middleware error:', err);
    return res
      .status(500)
      .json({ message: 'Internal server error during authentication' });
  }
};
