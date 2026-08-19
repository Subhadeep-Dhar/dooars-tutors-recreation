import { Request, Response } from 'express';
import { SystemSetting } from '../../models/SystemSetting';

export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const aiDailyLimit = await SystemSetting.findOne({ key: 'aiDailyLimit' });
    
    // Default to 1 if not set in DB
    const limitValue = aiDailyLimit ? aiDailyLimit.value : 1;
    
    res.status(200).json({
      success: true,
      data: {
        aiDailyLimit: limitValue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching settings' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { aiDailyLimit } = req.body;
    
    if (aiDailyLimit !== undefined) {
      await SystemSetting.findOneAndUpdate(
        { key: 'aiDailyLimit' },
        { value: aiDailyLimit, description: 'Daily limit for AI chatbot queries per user' },
        { upsert: true, new: true }
      );
    }
    
    res.status(200).json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating settings' });
  }
};
