const express = require('express');
const router = express.Router();
const { User, Civilian, Rescuer, Admin } = require('../models/usersModel');

// Route to get the total number of rescuers and civilians
router.get('/rescuer-civilian-count', async (req, res) => {
    try {
        const totalRescuers = await Rescuer.countDocuments();
        const totalCivilians = await Civilian.countDocuments();

        res.json({
            totalRescuers,
            totalCivilians
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch counts' });
    }
});

// Helper function to count tasks by type and status
const countTasksByTypeAndStatus = async (type, status, startDate, endDate) => {
    return User.aggregate([
        { $unwind: '$tasks' },
        { 
            $match: { 
                'tasks.type': type, 
                'tasks.status': status, 
                'tasks.dateSubmitted': { $gte: startDate, $lte: endDate } 
            } 
        },
        { $count: 'total' }
    ]);
};

// API to get chart data
router.get('/chart-data', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate the provided dates
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return res.status(400).json({ error: 'Start date cannot be after end date.' });
        }

        // Fetching total requests and donations
        const totalRequests = await countTasksByTypeAndStatus('request', 'pending', start, end);
        const totalDonations = await countTasksByTypeAndStatus('donation', 'pending', start, end);

        // Fetching completed requests and donations
        const completedRequests = await countTasksByTypeAndStatus('request', 'delivered', start, end);
        const completedDonations = await countTasksByTypeAndStatus('donation', 'delivered', start, end);

        res.json({
            totalRequests: totalRequests[0]?.total || 0,
            totalDonations: totalDonations[0]?.total || 0,
            completedRequests: completedRequests[0]?.total || 0,
            completedDonations: completedDonations[0]?.total || 0
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to get request and donation stats by time period
router.get('/stats', async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        const matchDate = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };

        // Aggregate for total and completed requests
        const requestStats = await User.aggregate([
            { $unwind: "$tasks" },
            { $match: { "tasks.dateSubmitted": matchDate, "tasks.type": "request" } },
            {
                $group: {
                    _id: null,
                    totalRequests: { $sum: 1 },
                    completedRequests: {
                        $sum: {
                            $cond: [{ $eq: ["$tasks.status", "delivered"] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Aggregate for total and completed donations
        const donationStats = await User.aggregate([
            { $unwind: "$tasks" },
            { $match: { "tasks.dateSubmitted": matchDate, "tasks.type": "donation" } },
            {
                $group: {
                    _id: null,
                    totalDonations: { $sum: 1 },
                    completedDonations: {
                        $sum: {
                            $cond: [{ $eq: ["$tasks.status", "delivered"] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Send the results back as JSON
        res.json({
            totalRequests: requestStats[0]?.totalRequests || 0,
            completedRequests: requestStats[0]?.completedRequests || 0,
            totalDonations: donationStats[0]?.totalDonations || 0,
            completedDonations: donationStats[0]?.completedDonations || 0
        });

    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
