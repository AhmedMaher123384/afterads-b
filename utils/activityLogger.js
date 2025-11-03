import ActivityLog from '../models/ActivityLog.js';

/**
 * Log user activity
 * @param {string} userId - User ID
 * @param {string} userName - User name
 * @param {string} userRole - User role
 * @param {string} action - Action performed
 * @param {string} details - Activity details
 * @param {object} req - Express request object
 * @param {boolean} success - Whether the action was successful
 * @param {string} orderId - Order ID (optional)
 * @param {string} orderNumber - Order number (optional)
 * @param {string} previousValue - Previous value (optional)
 * @param {string} newValue - New value (optional)
 * @param {string} notes - Additional notes (optional)
 */
export const logActivity = async (
  userId,
  userName,
  userRole,
  action,
  details,
  req,
  success = true,
  orderId = null,
  orderNumber = null,
  previousValue = null,
  newValue = null,
  notes = null
) => {
  try {
    const activityLog = new ActivityLog({
      userId,
      userName,
      userRole,
      action,
      orderId,
      orderNumber,
      details,
      previousValue,
      newValue,
      notes,
      ipAddress: req ? (req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown') : 'unknown',
      userAgent: req ? req.get('User-Agent') : 'unknown'
    });

    await activityLog.save();
    console.log(`✅ Activity logged: ${action} by ${userName}`);
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

/**
 * Log login attempt
 * @param {string} email - User email
 * @param {string} userName - User name
 * @param {string} userRole - User role
 * @param {boolean} success - Whether login was successful
 * @param {string} failureReason - Reason for failure (if any)
 * @param {object} req - Express request object
 * @param {string} userId - User ID (if login successful)
 * @param {string} sessionId - Session ID (if login successful)
 */
export const logLogin = async (
  email,
  userName,
  userRole,
  success,
  failureReason,
  req,
  userId = null,
  sessionId = null
) => {
  try {
    const LoginLog = (await import('../models/LoginLog.js')).default;
    
    const loginLog = new LoginLog({
      userId,
      userName,
      email,
      userRole,
      success,
      failureReason,
      ipAddress: req ? (req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown') : 'unknown',
      userAgent: req ? req.get('User-Agent') : 'unknown',
      sessionId
    });

    await loginLog.save();
    console.log(`✅ Login logged: ${success ? 'Success' : 'Failed'} for ${email}`);
  } catch (error) {
    console.error('❌ Error logging login:', error);
    // Don't throw error to avoid breaking the main operation
  }
};