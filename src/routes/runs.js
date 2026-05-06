const express = require('express');
const router = express.Router();
const runsController = require('../controllers/runsController');

router.get('/', runsController.getAllRuns);
router.post('/', runsController.createRun);
router.get('/:id', runsController.getRunById);
router.delete('/:id', runsController.deleteRun);

module.exports = router;
