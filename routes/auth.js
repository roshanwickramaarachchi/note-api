const express = require('express')
const {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    updateDetails,
    updatePassword,
    verify,
} = require('../controllers/auth')

const router = express.Router()

const { protect } = require('../middleware/auth')

router.post('/register', register)
router.post('/login', login)
// router.get('/logout', logout)
router.get('/me', protect, getMe)
router.put('/updateDetails', protect, updateDetails)
router.put('/updatepassword', protect, updatePassword)
router.post('/forgotPassword', forgotPassword)
router.put('/resetPassword/:resettoken', resetPassword)
router.get('/verify/:id', verify)

module.exports = router
