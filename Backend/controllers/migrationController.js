const { query } = require('../config/database');

const runMigration = async (req, res) => {
  try {
    console.log('Running payment_pending status migration...');
    
    // 1. Modify enum to include payment_pending
    await query(`
      ALTER TABLE appointments 
      MODIFY COLUMN status ENUM('payment_pending','pending','confirmed','in_progress','completed','cancelled') 
      DEFAULT 'payment_pending'
    `);
    console.log('✓ Added payment_pending status to enum');
    
    // 2. Update existing pending appointments without payments
    const result = await query(`
      UPDATE appointments a 
      LEFT JOIN payments p ON a.id = p.appointment_id AND p.status = 'success'
      SET a.status = 'payment_pending' 
      WHERE a.status = 'pending' AND p.id IS NULL
    `);
    console.log(`✓ Updated ${result.affectedRows} existing appointments to payment_pending`);
    
    res.json({
      success: true,
      message: 'Migration completed successfully',
      updatedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
};

module.exports = { runMigration };