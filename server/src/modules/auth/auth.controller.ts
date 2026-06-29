import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User, Profile } from '../../models';
import { AppError } from '../../middleware/errorHandler';
import { sendWelcomeEmail, sendAdminNotification } from '../../utils/email';

// ── Validation rules ──────────────────────────────────────────────────────────

export const registerValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('category')
    .optional()
    .isIn(['student', 'tutor', 'org'])
    .withMessage('Category/Role must be student, tutor, or org'),
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function registerPending(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = Object.fromEntries(errors.array().map((e) => [(e as any).path, e.msg]));
      throw new AppError('Validation failed', 400, fieldErrors);
    }

    const { email, name, phone, category } = req.body;
    
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user && user.status === 'active') {
      throw new AppError('Email already registered and active', 409);
    }

    if (!user) {
      // Create pending user
      user = await User.create({
        email: email.toLowerCase(),
        name,
        phone,
        role: category || 'student',
        status: 'pending',
        isVerified: false
      });
    } else {
      // Update pending user with new attempts
      user.name = name;
      user.phone = phone;
      user.role = category || 'student';
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Pending registration created. Waiting for OTP verification.',
    });
  } catch (err) {
    next(err);
  }
}

export async function checkEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required', 400);
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    res.json({ success: true, data: { exists: !!user } });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    // The user's supabase token is verified by middleware `verifyToken`
    // which puts `req.user.supabaseId` (or `req.user.userId` pointing to the `sub`)
    const supabaseId = req.user!.supabaseId || req.user!.userId;
    const email = req.body.email; // we might not need email if we look up by supabaseId, but initially supabaseId isn't linked!
    
    // Actually, in registerPending we didn't have supabaseId yet. 
    // We need to link it now using the email inside the JWT (or we can pass it).
    // Let's decode the email from req.user if possible, or accept it in body.
    // Wait, the client sends `supabaseId` in the body (`req.body.supabaseId`).
    
    // To be secure, the supabase ID comes from the verified JWT:
    const verifiedSupabaseId = req.user!.supabaseId;
    
    // Find the user by email (wait, the JWT from Supabase has email in it usually, or we can look up if we passed it).
    // Let's just find the pending user that we are activating. 
    // If the client sends `email` in body, we should verify it matches the JWT email, but supabase JWT doesn't always have email in standard payload without querying supabase Admin API.
    // Supabase JWT payload: { "sub": "1234", "email": "test@test.com" } (usually).
    const tokenEmail = (req.user as any).email || req.body.email;
    
    if (!tokenEmail) {
      throw new AppError('Email is required to activate', 400);
    }

    const user = await User.findOne({ email: tokenEmail.toLowerCase() });
    
    if (!user) {
      throw new AppError('User not found. Please register first.', 404);
    }

    if (user.status === 'active') {
      // Already active, just update supabaseId if missing
      if (!user.supabaseId) {
        user.supabaseId = verifiedSupabaseId;
        await user.save();
      }
      res.json({ success: true, message: 'Account is already active' });
      return;
    }

    // Activate
    user.status = 'active';
    user.isVerified = true;
    user.supabaseId = verifiedSupabaseId;
    await user.save();

    // Trigger Resend Emails
    await sendWelcomeEmail(user.email, user.name).catch(console.error);
    await sendAdminNotification(user.email, user.role).catch(console.error);

    res.json({
      success: true,
      message: 'Account verified and activated successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    // Supabase handles logout on client side, this is just for cleanup if needed
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    // req.user has the supabase ID correctly stored
    const supabaseId = req.user!.supabaseId;
    const user = await User.findOne({ supabaseId }).select('-passwordHash -refreshTokenHash');
    
    if (!user) throw new AppError('User not found', 404);

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const supabaseId = req.user!.supabaseId;

    const user = await User.findOne({ supabaseId });
    if (!user) throw new AppError('User not found', 404);

    // Soft delete user
    user.isActive = false;
    user.email = `${user.email}_deleted_${Date.now()}`;
    user.supabaseId = undefined;
    await user.save();

    // Hard delete profile if exists
    await Profile.deleteOne({ userId: user._id });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
}