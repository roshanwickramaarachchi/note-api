const crypto = require('crypto')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const sendEmail = require('../utils/sendEmail')
const User = require('../models/User')
const jwt = require('jsonwebtoken')

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
    const {
        email, password,
    } = req.body;

    // Create user
    const user = await User.create({
        email,
        password,
    });

    // Create token
    const token = user.getSignedJwtToken()

    // Email the user a unique verification link
    const url = `${req.protocol}://${req.get('host')}/api/v1/auth/verify/${token}`
    const message = `Click <a href = '${url}'>here</a> to confirm your email and then login.`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Verify Account',
            message,
        });

        // res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        console.log(err);
        return next(new ErrorResponse('Email could not be sent', 500));
    }

    res.status(200).json({ success: true, token })
});


// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body

    // Validate email & password
    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400))
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
        return next(new ErrorResponse('Invalid credentials', 401))
    }

    // Ensure the account has been verified
    if(!user.verified){
        return next(new ErrorResponse('Verify your Account.', 403))        
   }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401))
    }

    // Create token
    const token = user.getSignedJwtToken()

    res.status(200).json({ success: true, token })
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc      Update user details
// @route     PUT /api/v1/auth/updatedetails
// @access    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
        email: req.body.email
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc      Update password
// @route     PUT /api/v1/auth/updatepassword
// @access    Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse('Password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    // Create token
    const token = user.getSignedJwtToken()

    res.status(200).json({ success: true, token })
});

// @desc      Forgot password  
// @route     POST /api/v1/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorResponse('There is no user with that email', 404));
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    // console.log(resetToken)
    // console.log(resetToken.slice(-4))
    // console.log(resetToken.slice(1, -4))  

    await user.save({ validateBeforeSave: false });

    // Create reset url
    //const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT this values to mobile app: \n\n ${resetToken}`;
    //const message = `You are receiving this email because you (or someone else) has requested the reset of a password.Please Click to reset password <a href = '${resetUrl}'>here</a> `    

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password reset token',
            message,
        });

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        console.log(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorResponse('Email could not be sent', 500));
    }

    // res.status(200).json({
    //     success: true,
    //     data: user,
    // });
});

// @desc      Reset password
// @route     PUT /api/v1/auth/resetpassword/:resettoken
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
    
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorResponse('Invalid token', 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Create token
    const token = user.getSignedJwtToken()

    res.status(200).json({ success: true, token })
});

exports.verify = asyncHandler(async (req, res, next) => {
    const token = req.params
    //console.log(token);
    // Check we have an id
    if (!token.id) {
        return next(new ErrorResponse('Missing Token', 422));
    }
    // Step 1 -  Verify the token from the URL
    let payload = null

    payload = jwt.verify(
        token.id,
        process.env.JWT_SECRET
    );
    //console.log(payload);

    // Step 2 - Find user with matching ID
    const user = await User.findOne({ id: payload.ID }).exec();
    if (!user) {
        return next(new ErrorResponse('User does not  exists', 404));
    }
    // Step 3 - Update user verification status to true
    user.verified = true;
    await user.save();


    res.status(200).json({ success: true })

});
// exports.verify = async (req, res) => {
//     const token = req.params
//     console.log(token.id);
//     // Check we have an id
//     if (!token.id) {
//         return res.status(422).send({ 
//              message: "Missing Token" 
//         });
//     }
//     // Step 1 -  Verify the token from the URL
//     let payload = null
//     try {
//         payload = jwt.verify(
//            token.id,
//            process.env.USER_VERIFICATION_TOKEN_SECRET
//         );
//     } catch (err) {
//         console.log('error first');
//         //return res.status(500).send(err);        
//     }
//     try{
//         // Step 2 - Find user with matching ID
//         const user = await User.findOne({ id: payload.ID }).exec();
//         if (!user) {
//            return res.status(404).send({ 
//               message: "User does not  exists" 
//            });
//         }
//         // Step 3 - Update user verification status to true
//         user.verified = true;
//         await user.save();
//         return res.status(200).send({
//               message: "Account Verified"
//         });
//      } catch (err) {
//         return res.status(500).send(err);

//      }
// }