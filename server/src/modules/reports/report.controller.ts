import { Request, Response } from 'express';
import { Report } from '../../models/Report';
import { Profile } from '../../models/Profile';
import { sendReportAdminNotification, sendReportConfirmation } from '../../utils/email';

export async function createReport(req: Request, res: Response): Promise<void> {
  try {
    const { reportedProfileId, reason } = req.body;
    const reporterId = req.user?.userId;
    const reporterEmail = req.user?.email;

    if (!reporterId || !reporterEmail) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!reportedProfileId || !reason) {
      res.status(400).json({ success: false, message: 'Profile ID and reason are required' });
      return;
    }

    const profile = await Profile.findById(reportedProfileId);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Profile not found' });
      return;
    }

    // Check if user already reported this profile
    const existingReport = await Report.findOne({ 
      reporterId, 
      reportedProfileId
    });

    if (existingReport) {
      res.status(400).json({ success: false, message: 'You have already reported this profile.' });
      return;
    }

    const report = new Report({
      reporterId,
      reportedProfileId,
      reason,
      status: 'pending'
    });

    await report.save();

    // Send Emails async
    sendReportAdminNotification(reporterEmail, profile.displayName, reason).catch(e => console.error('Error sending admin notification:', e));
    sendReportConfirmation(reporterEmail, profile.displayName).catch(e => console.error('Error sending confirmation:', e));

    res.status(201).json({ success: true, message: 'Report submitted successfully' });
  } catch (error: any) {
    console.error('Error creating report:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getReports(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const reports = await Report.find()
      .populate('reporterId', 'email role')
      .populate('reportedProfileId', 'displayName type slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments();

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateReportStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error updating report status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
