const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksController');

router.get('/', tasksController.getAllTasks);
router.post('/', tasksController.createTask);
router.post('/:id/approve', tasksController.approveTask);  // must be before /:id
router.post('/:id/test', tasksController.testTask);        // must be before /:id
router.get('/:id', tasksController.getTaskById);
router.put('/:id', tasksController.updateTask);
router.delete('/:id', tasksController.deleteTask);


module.exports = router;
