const User = require('../models/user')
const asyncHandler = require('express-async-handler')
const {generateAccessToken, generateRefreshToken} = require('../middlewares/jwt')
const jwt = require('jsonwebtoken')
const sendMail = require('../utils/sendMail')
const crypto = require('crypto')

const register = asyncHandler(async(req, res) => {
    const {email, password, firstName, lastName} = req.body
    if(!email || !password || !firstName || !lastName){
        return res.status(400).json({
            success: false,
            mes: 'Missing inputs'
        })
    }
    const user = await User.findOne({email})
    if(user){
        throw new Error('User has existed!')
    }else{
        const newUser = await User.create(req.body)
        return res.status(200).json({
            // Nếu tạo thành công trả về true ngược lại false
            success: newUser ? true : false,    
            mes: newUser ? 'Register is successfully. Please go login' : 'Something went wrong' 
        })
    }
})

// Refresh Token => Cấp mới access Token
// Access Token => Xác thực người dùng, Phân quyền người dùng
const login = asyncHandler(async(req, res) => {
    const {email, password} = req.body
    if(!email || !password){
        return res.status(400).json({
            success: false,
            mes: 'Missing inputs'
        })
    }
    const response = await User.findOne({email})
    if(response && await response.isCorrectPassword(password)){
        //Tách password và role ra khỏi response
        const { password, role, ...userData} = response.toObject()
        //Tạo access Token
        const accessToken = generateAccessToken(response._id, role)
        //Tạo refresh Token
        const refreshToken = generateRefreshToken(response._id)
        //Nếu để new là false thì findByIdAndUpdate sẽ trả về user trươc khi update còn true thì sau khi update
        //Lưu refreshToken vào db
        await User.findByIdAndUpdate(response._id, { refreshToken }, { new: true })
        //Lưu refresh Token vào cookie
        res.cookie('refreshToken', refreshToken, {httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000})
        return res.status(200).json({
            success: true,
            accessToken,
            userData
        })
    }else{
        throw new Error('Invalid credentials')
    }
})

const getCurrent = asyncHandler(async(req, res) => {
    const {_id} = req.user

    const user = await User.findById(_id)
    return res.status(200).json({
        success: user ? true : false,
        rs: user ? user : 'User not found'
    })
})

const refreshAccessToken = asyncHandler( async(req, res) => {
    // Lấy Token từ cookies
    const cookie = req.cookies
    // Check xem có Token hay không
    if(!cookie && !cookie.refreshToken){
        throw new Error('No refresh token in cookies')
    }
    //Check Token có hợp lệ không
    const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET)
    const response = await User.findOne({_id: rs._id, refreshToken: cookie.refreshToken})
    return res.status(200).json({
        success: response ? true : false,
        newAccessToken: response ? generateAccessToken(response._id, response.role) : 'Refresh token not matched'
    })

    // jwt.verify(cookie.refreshToken, process.env.JWT_SECRET, async (err, decode) => {
    //     if(err) {
    //         throw new Error('Invalid refresh token')
    //     }
    //     //check xem token này có khớp với token đã lưu trong db không
    //     const response = await User.findOne({_id: decode._id, refreshToken: cookie.refreshToken})

    //     return res.status(200).json({
    //         success: response ? true : false,
    //         newAccessToken: response ? generateAccessToken(response._id, response.role) : 'Refresh token not matched'
    //     })
    // })
})

const logout = asyncHandler(async(req, res) => {
    const cookie = req.cookies
    if(!cookie || !cookie.refreshToken){
        throw new Error('No refresh token in cookies')
    }
    // {refreshToken: cookie.refreshToken} <=> where, {refreshToken: ''} <=> update
    // Xoa refresh token ở db
    await User.findOneAndUpdate({refreshToken: cookie.refreshToken}, {refreshToken: ''}, {new: true})

    // Xóa refresh token ở cookie trình duyệt
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true
    })
    return res.status(200).json({
        success: true,
        mes: 'Logout is done'
    })
})

// Client gửi email
// Server check email có hợp lệ hay không => Gửi email + kèm theo link (Password change token)
// Client check mail => click link
// Client gửi api kèm token
// Check token có giống với token mà server gửi mail hay không
// Change password

const forgotPassword = asyncHandler(async(req, res) => {
    const {email} = req.query

    if(!email){
        throw new Error('Missing email')
    }

    const user = await User.findOne({email})
    if(!user){
        throw new Error('User not found')
    }

    //Dùng hàm tự định nghĩa trong model phải save lại
    const resetToken = user.createPasswordChangedToken()
    await user.save()

    const html = `
                Xin vui lòng click vào link dưới đây để thay đổi mật khẩu của bạn. 
                Link này sẽ hết hạn sau 15 phút kể từ bây giờ. 
                <a href=${process.env.URL_SERVER}/api/user/reset-password/${resetToken}>Click here</a>
                `;
    
    const data = {
        email,
        html
    }

    const rs = await sendMail(data)
    return res.status(200).json({
        success: true,
        rs
    })

})

const resetPassword = asyncHandler(async(req, res) => {
    const {password, token} = req.body
    if(!password || !token){
        throw new Error('Missing inputs')
    }

    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex')
    //gt: greater than
    //passwordResetExpires phải lớn hơn thời gian hiện tại 
    const user = await User.findOne({passwordResetToken, passwordResetExpires: {$gt: Date.now()}})
    if(!user) {
        throw new Error('Invalid reset token')
    }
    user.password = password
    user.passwordResetToken=undefined

    //Lưu lại thời gian thay đổi mật khẩu
    user.passwordChangedAt=Date.now()
    user.passwordResetExpires=undefined
    //Lưu những trường gán vào db
    await user.save()
    return res.status(200).json({
        success: user ? true : false,
        mes: user ? 'Updated password' : 'Something went wrong'
    })
})

// Phải có quyền admin
const getUsers = asyncHandler(async(req, res) => {
    const response = await User.find()
    return res.status(200).json({
        success: response ? true : false,
        users: response
    })
})

const deleteUser = asyncHandler(async(req, res) => {
    const { _id } = req.query
    if(!_id){
        throw new Error('Missing inputs')
    }
    const response = await User.findByIdAndDelete(_id)
    return res.status(200).json({
        success: response ? true : false,
        deleteUser: response ? `User with email ${response.email} deleted` : 'No user delete'
    })
})

const updateUser = asyncHandler(async(req, res) => {
    const { _id } = req.user
    if(!_id || Object.keys(req.body).length === 0){
        throw new Error('Missing inputs')
    }
    const response = await User.findByIdAndUpdate(_id, req.body, {new: true})
    return res.status(200).json({
        success: response ? true : false,
        updateUser: response ? response : 'Something went wrong'
    })
})

const updateUserByAdmin = asyncHandler(async(req, res) => {
    const { uid } = req.params
    if(Object.keys(req.body).length === 0){
        throw new Error('Missing inputs')
    }
    const response = await User.findByIdAndUpdate(uid, req.body, {new: true})
    return res.status(200).json({
        success: response ? true : false,
        updateUser: response ? response : 'Something went wrong'
    })
})

module.exports = {  
    register,
    login,
    getCurrent,
    refreshAccessToken,
    logout,
    forgotPassword,
    resetPassword,
    getUsers,
    deleteUser,
    updateUser,
    updateUserByAdmin
}