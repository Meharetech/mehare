const express = require('express');
const {
    getUsers,
    updateUser,
    deleteUser
} = require('../controllers/user');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// All routes here are protected and restricted to admin
router.use(protect);
router.use(authorize('admin'));

router
    .route('/')
    .get(getUsers);

router
    .route('/:id')
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;
