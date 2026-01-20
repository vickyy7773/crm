const cron = require('node-cron');
const { pool } = require('../config/database');

/**
 * Calculate and store daily stats for all active telecallers
 * Runs automatically at 7:00 PM IST every day
 */

const calculateDailyStats = async () => {
  try {
    console.log('📊 Starting daily stats calculation...');

    // Get all active telecallers
    const [telecallers] = await pool.query(
      `SELECT id, name FROM users WHERE role = 'Telecaller' AND status = 'active'`
    );

    console.log(`Found ${telecallers.length} active telecallers`);

    for (const telecaller of telecallers) {
      try {
        // Get today's call logs for this telecaller
        const [callLogs] = await pool.query(
          `SELECT call_outcome FROM call_history
           WHERE caller_id = ? AND DATE(call_date) = CURDATE()`,
          [telecaller.id]
        );

        const totalCalls = callLogs.length;

        // Skip if no calls today
        if (totalCalls === 0) {
          console.log(`  ⏭️  ${telecaller.name}: No calls today, skipping...`);
          continue;
        }

        // Count outcomes
        let contactedCount = 0;
        let interestedCount = 0;
        let negativeOutcomeCount = 0;
        let wrongNumberCount = 0;
        let notReachableCount = 0;

        const negativeOutcomes = ['Not Interested', 'Wrong Number', 'Not Reachable', 'Switched Off'];
        const positiveOutcomes = ['Contacted', 'Interested', 'Call Back'];

        callLogs.forEach(log => {
          if (log.call_outcome === 'Contacted') contactedCount++;
          if (log.call_outcome === 'Interested') interestedCount++;
          if (log.call_outcome === 'Wrong Number') wrongNumberCount++;
          if (log.call_outcome === 'Not Reachable') notReachableCount++;
          if (negativeOutcomes.includes(log.call_outcome)) negativeOutcomeCount++;
        });

        // Count missed follow-ups (overdue today)
        const [missedFollowups] = await pool.query(
          `SELECT COUNT(*) as count FROM leads
           WHERE assigned_to = ?
           AND next_followup_date < NOW()
           AND DATE(next_followup_date) = CURDATE()
           AND status NOT IN ('Converted', 'Not Interested', 'Wrong Number')`,
          [telecaller.id]
        );

        const followupsMissed = missedFollowups[0].count;

        // Calculate ratios
        const negativeOutcomeRatio = totalCalls > 0
          ? ((negativeOutcomeCount / totalCalls) * 100).toFixed(2)
          : 0;

        const interestedRatio = totalCalls > 0
          ? ((interestedCount / totalCalls) * 100).toFixed(2)
          : 0;

        // Determine abuse flag (80%+ negative AND 5% or less interested)
        const abuseFlag = (parseFloat(negativeOutcomeRatio) >= 80 && parseFloat(interestedRatio) <= 5);

        // Insert or update daily stats
        await pool.query(
          `INSERT INTO telecaller_daily_stats (
            telecaller_id,
            date,
            total_calls,
            contacted_count,
            interested_count,
            negative_outcome_count,
            wrong_number_count,
            not_reachable_count,
            followups_missed,
            negative_outcome_ratio,
            interested_ratio,
            abuse_flag
          ) VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            total_calls = VALUES(total_calls),
            contacted_count = VALUES(contacted_count),
            interested_count = VALUES(interested_count),
            negative_outcome_count = VALUES(negative_outcome_count),
            wrong_number_count = VALUES(wrong_number_count),
            not_reachable_count = VALUES(not_reachable_count),
            followups_missed = VALUES(followups_missed),
            negative_outcome_ratio = VALUES(negative_outcome_ratio),
            interested_ratio = VALUES(interested_ratio),
            abuse_flag = VALUES(abuse_flag),
            updated_at = CURRENT_TIMESTAMP`,
          [
            telecaller.id,
            totalCalls,
            contactedCount,
            interestedCount,
            negativeOutcomeCount,
            wrongNumberCount,
            notReachableCount,
            followupsMissed,
            negativeOutcomeRatio,
            interestedRatio,
            abuseFlag
          ]
        );

        console.log(`  ✅ ${telecaller.name}: ${totalCalls} calls, ${negativeOutcomeRatio}% negative, ${interestedRatio}% interested ${abuseFlag ? '🚨 FLAGGED' : ''}`);

      } catch (error) {
        console.error(`  ❌ Error processing ${telecaller.name}:`, error.message);
      }
    }

    console.log('✅ Daily stats calculation completed successfully!');

  } catch (error) {
    console.error('❌ Daily stats calculation failed:', error.message);
  }
};

/**
 * Initialize the cron job
 * Runs at 7:00 PM IST (13:30 UTC) every day
 */
const initDailyStatsJob = () => {
  // Schedule: 7:00 PM IST = 13:30 UTC (IST = UTC+5:30)
  // Cron format: minute hour day month weekday
  // 30 13 * * * = 1:30 PM UTC = 7:00 PM IST

  const cronSchedule = '30 13 * * *'; // 7:00 PM IST daily

  cron.schedule(cronSchedule, async () => {
    console.log('\n🕖 Daily Stats Job Triggered (7:00 PM IST)');
    await calculateDailyStats();
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('⏰ Daily Stats Cron Job initialized - Will run at 7:00 PM IST every day');
};

/**
 * Manual trigger endpoint (for testing or manual execution)
 */
const triggerManual = async (req, res) => {
  try {
    await calculateDailyStats();
    res.json({
      success: true,
      message: 'Daily stats calculation completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate daily stats: ' + error.message
    });
  }
};

module.exports = {
  initDailyStatsJob,
  triggerManual,
  calculateDailyStats
};
