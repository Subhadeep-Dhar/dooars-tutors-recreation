import { User, IUserDocument } from '../../models';
import { importerLogger } from './logger';

const SYSTEM_IMPORTER_EMAIL = 'importer@dooars-tutors.com';
const SYSTEM_IMPORTER_NAME = 'SYSTEM_IMPORTER_USER';

/**
 * Finds or creates a dedicated user for imported profiles.
 * This ensures imported data is isolated from manual tutor profiles.
 */
export async function getOrCreateSystemImporterUser(): Promise<IUserDocument> {
  try {
    let user = await User.findOne({ email: SYSTEM_IMPORTER_EMAIL });

    if (!user) {
      importerLogger.info(`Creating system importer user: ${SYSTEM_IMPORTER_NAME}`);
      user = await User.create({
        email: SYSTEM_IMPORTER_EMAIL,
        name: SYSTEM_IMPORTER_NAME,
        passwordHash: 'INTERNAL_ONLY_NO_LOGIN_' + Math.random().toString(36),
        role: 'admin',
        isVerified: true,
        isActive: true
      });
    }

    return user;
  } catch (err) {
    importerLogger.error('Failed to get or create system importer user', err);
    throw err;
  }
}
