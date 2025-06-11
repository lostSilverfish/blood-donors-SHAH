const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { 
  createDonorSchema, 
  updateDonorSchema, 
  bloodTypeQuerySchema 
} = require('../validators/donorValidators');

const router = express.Router();

// Helper function to calculate next donation date (3 months from last donation)
const calculateNextDonationDate = (lastDonationDate) => {
  if (!lastDonationDate) return null;
  
  const nextDate = new Date(lastDonationDate);
  nextDate.setMonth(nextDate.getMonth() + 3);
  return nextDate.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
};

// @route   GET /api/donors/blood-type/:bloodType
// @desc    Get all donors by blood type
// @access  Public
router.get('/blood-type/:bloodType', async (req, res) => {
  try {
    const { bloodType } = req.params;
    
    // Validate blood type
    const { error } = bloodTypeQuerySchema.validate({ blood_type: bloodType });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood type',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Query parameters for filtering
    const { 
      available_only = 'false', 
      page = 1, 
      limit = 10,
      search = '',
      sort_by = 'donor_name',
      sort_order = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build WHERE clause dynamically
    let whereConditions = ['blood_type = ?', 'is_active = 1'];
    let queryParams = [bloodType];
    
    // Add search filter
    if (search) {
      whereConditions.push('(donor_name LIKE ? OR contact_number LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Add availability filter
    if (available_only === 'true') {
      whereConditions.push('(next_donation_date IS NULL OR next_donation_date <= CURDATE())');
    }

    const whereClause = whereConditions.join(' AND ');

    // Execute main query
    const [donors] = await pool.query(
      `SELECT * FROM donors WHERE ${whereClause} ORDER BY donor_name ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      queryParams
    );

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM donors WHERE ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

    res.json({
      success: true,
      message: `Found ${donors.length} donors with blood type ${bloodType}`,
      data: {
        donors,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalCount / parseInt(limit)),
          total_donors: totalCount,
          donors_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get donors by blood type error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/donors/public-stats
// @desc    Get public donor statistics (no auth required)
// @access  Public
router.get('/public-stats', async (req, res) => {
  try {
    // Get total donors count
    const [totalDonorsResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM donors WHERE is_active = 1'
    );
    const totalDonors = totalDonorsResult[0].total;

    // Get total donations count
    const [totalDonationsResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM donation_history'
    );
    const totalDonations = totalDonationsResult[0].total;

    // Get available donors count
    const [availableDonorsResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM donors 
       WHERE is_active = 1 
       AND (next_donation_date IS NULL OR next_donation_date <= CURDATE())`
    );
    const availableDonors = availableDonorsResult[0].total;

    res.json({
      success: true,
      data: {
        totalDonors,
        totalDonations,
        availableDonors
      }
    });

  } catch (error) {
    console.error('Get public stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/donors/stats
// @desc    Get donor statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get total donors count
    const [totalDonorsResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM donors'
    );
    const totalDonors = totalDonorsResult[0].total;

    // Get active donors count
    const [activeDonorsResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM donors WHERE is_active = 1'
    );
    const activeDonors = activeDonorsResult[0].total;

    // Get total donations count
    const [totalDonationsResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM donation_history'
    );
    const totalDonations = totalDonationsResult[0].total;

    // Get this month's donations
    const [thisMonthResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM donation_history 
       WHERE MONTH(donation_date) = MONTH(CURDATE()) 
       AND YEAR(donation_date) = YEAR(CURDATE())`
    );
    const thisMonthDonations = thisMonthResult[0].total;

    // Get additional useful stats
    const [availableDonorsResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM donors 
       WHERE is_active = 1 
       AND (next_donation_date IS NULL OR next_donation_date <= CURDATE())`
    );
    const availableDonors = availableDonorsResult[0].total;

    res.json({
      success: true,
      data: {
        totalDonors,
        activeDonors,
        totalDonations,
        thisMonthDonations,
        availableDonors,
        inactiveDonors: totalDonors - activeDonors
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/donors
// @desc    Get all donors with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      search = '',
      blood_type = '',
      is_active = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build the WHERE clause dynamically
    let whereConditions = ['is_active = 1'];
    let queryParams = [];
    
    if (search) {
      whereConditions.push('(donor_name LIKE ? OR contact_number LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (blood_type) {
      whereConditions.push('blood_type = ?');
      queryParams.push(blood_type);
    }
    
    if (is_active !== '') {
      whereConditions[0] = `is_active = ${is_active === 'true' ? 1 : 0}`;
    }

    const whereClause = whereConditions.join(' AND ');
    
    // Get the donors with pagination
    const [donors] = await pool.query(
      `SELECT * FROM donors WHERE ${whereClause} ORDER BY donor_name ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      queryParams
    );
    
    // Get total count for pagination
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM donors WHERE ${whereClause}`,
      queryParams
    );
    
    const totalCount = countResult[0].total;
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.json({
      success: true,
      message: `Found ${donors.length} donors`,
      data: {
        donors,
        totalPages,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_donors: totalCount,
          donors_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all donors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/donors/:id
// @desc    Get single donor by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid donor ID is required'
      });
    }

    const [donors] = await pool.execute(
      `SELECT 
        id, donor_name, blood_type, date_of_last_donation, 
        contact_number, next_donation_date, is_active, created_at, updated_at
      FROM donors WHERE id = ?`,
      [id]
    );

    if (donors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Get donation history
    const [history] = await pool.execute(
      `SELECT id, donation_date, blood_units, donation_center, notes, created_at
       FROM donation_history WHERE donor_id = ? ORDER BY donation_date DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        donor: donors[0],
        donation_history: history
      }
    });

  } catch (error) {
    console.error('Get donor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/donors
// @desc    Add new donor
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createDonorSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const {
      donor_name,
      blood_type,
      date_of_last_donation,
      contact_number
    } = value;

    // Convert empty string to null for date field
    const lastDonationDate = date_of_last_donation === '' ? null : date_of_last_donation;

    // Calculate next donation date
    const next_donation_date = calculateNextDonationDate(lastDonationDate);

    // Check if donor with same contact number already exists
    const [existingDonors] = await pool.execute(
      'SELECT id FROM donors WHERE contact_number = ? AND is_active = true',
      [contact_number]
    );

    if (existingDonors.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Donor with this contact number already exists'
      });
    }

    // Insert new donor
    const [result] = await pool.execute(
      `INSERT INTO donors 
       (donor_name, blood_type, date_of_last_donation, contact_number, next_donation_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        donor_name, blood_type, lastDonationDate, contact_number, next_donation_date
      ]
    );

    // Get the created donor
    const [newDonor] = await pool.execute(
      'SELECT * FROM donors WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Donor added successfully',
      data: {
        donor: newDonor[0]
      }
    });

  } catch (error) {
    console.error('Add donor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   PUT /api/donors/:id
// @desc    Update donor
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid donor ID is required'
      });
    }

    // Validate request body
    const { error, value } = updateDonorSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Check if donor exists
    const [existingDonors] = await pool.execute(
      'SELECT id, date_of_last_donation FROM donors WHERE id = ?',
      [id]
    );

    if (existingDonors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        // Convert empty strings to null for date fields
        let fieldValue = value[key];
        if (key === 'date_of_last_donation' && fieldValue === '') {
          fieldValue = null;
        }
        updateFields.push(`${key} = ?`);
        updateValues.push(fieldValue);
      }
    });

    // Update next donation date if last donation date changed
    if (value.date_of_last_donation !== undefined) {
      const lastDonationDate = value.date_of_last_donation === '' ? null : value.date_of_last_donation;
      updateFields.push('next_donation_date = ?');
      updateValues.push(calculateNextDonationDate(lastDonationDate));
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const updateQuery = `UPDATE donors SET ${updateFields.join(', ')} WHERE id = ?`;

    await pool.execute(updateQuery, updateValues);

    // Get updated donor
    const [updatedDonor] = await pool.execute(
      'SELECT * FROM donors WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Donor updated successfully',
      data: {
        donor: updatedDonor[0]
      }
    });

  } catch (error) {
    console.error('Update donor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/donors/:id
// @desc    Delete (soft delete) donor
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid donor ID is required'
      });
    }

    // Check if donor exists
    const [existingDonors] = await pool.execute(
      'SELECT id, donor_name FROM donors WHERE id = ? AND is_active = true',
      [id]
    );

    if (existingDonors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found or already deactivated'
      });
    }

    // Soft delete (set is_active to false)
    await pool.execute(
      'UPDATE donors SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Donor deactivated successfully',
      data: {
        donor_id: id,
        donor_name: existingDonors[0].donor_name
      }
    });

  } catch (error) {
    console.error('Delete donor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/donors/:id/donation
// @desc    Record a new donation for a donor
// @access  Private
router.post('/:id/donation', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { donation_date, blood_units = 1.0, donation_center, notes } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid donor ID is required'
      });
    }

    if (!donation_date) {
      return res.status(400).json({
        success: false,
        message: 'Donation date is required'
      });
    }

    // Check if donor exists
    const [existingDonors] = await pool.execute(
      'SELECT id FROM donors WHERE id = ? AND is_active = true',
      [id]
    );

    if (existingDonors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Record donation history
      await connection.execute(
        `INSERT INTO donation_history 
         (donor_id, donation_date, blood_units, donation_center, notes) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, donation_date, blood_units, donation_center, notes]
      );

      // Find the most recent donation date from all donations for this donor
      const [latestDonation] = await connection.execute(
        'SELECT donation_date FROM donation_history WHERE donor_id = ? ORDER BY donation_date DESC LIMIT 1',
        [id]
      );

      const mostRecentDonationDate = latestDonation.length > 0 ? latestDonation[0].donation_date : null;
      const nextDonationDate = calculateNextDonationDate(mostRecentDonationDate);

      // Update donor's last donation date and next donation date
      await connection.execute(
        `UPDATE donors 
         SET date_of_last_donation = ?, next_donation_date = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [mostRecentDonationDate, nextDonationDate, id]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Donation recorded successfully',
        data: {
          donor_id: id,
          donation_date,
          next_donation_date: nextDonationDate
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Record donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/donors/:donorId/donation/:donationId
// @desc    Delete a specific donation from donor's history
// @access  Private
router.delete('/:donorId/donation/:donationId', authenticateToken, async (req, res) => {
  try {
    const { donorId, donationId } = req.params;

    if (!donorId || isNaN(donorId) || !donationId || isNaN(donationId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid donor ID and donation ID are required'
      });
    }

    // Check if donor exists and donation belongs to this donor
    const [existingDonations] = await pool.execute(
      'SELECT id, donation_date FROM donation_history WHERE id = ? AND donor_id = ?',
      [donationId, donorId]
    );

    if (existingDonations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found or does not belong to this donor'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Delete the donation record
      await connection.execute(
        'DELETE FROM donation_history WHERE id = ? AND donor_id = ?',
        [donationId, donorId]
      );

      // Recalculate donor's last donation date and next donation date
      const [latestDonation] = await connection.execute(
        'SELECT donation_date FROM donation_history WHERE donor_id = ? ORDER BY donation_date DESC LIMIT 1',
        [donorId]
      );

      let lastDonationDate = null;
      let nextDonationDate = null;

      if (latestDonation.length > 0) {
        lastDonationDate = latestDonation[0].donation_date;
        nextDonationDate = calculateNextDonationDate(lastDonationDate);
      }

      // Update donor's last donation date and next donation date
      await connection.execute(
        `UPDATE donors 
         SET date_of_last_donation = ?, next_donation_date = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [lastDonationDate, nextDonationDate, donorId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Donation deleted successfully',
        data: {
          donor_id: donorId,
          deleted_donation_id: donationId,
          new_last_donation_date: lastDonationDate,
          new_next_donation_date: nextDonationDate
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Delete donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router; 