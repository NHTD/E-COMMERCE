const router = require('express').Router()
const controllers = require('../controllers/user')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')

router.post('/register', controllers.register)
router.post('/login', controllers.login)
router.get('/current', verifyAccessToken, controllers.getCurrent)
router.post('/refreshtoken', controllers.refreshAccessToken)
router.get('/logout', controllers.logout)
router.get('/forgotpassword', controllers.forgotPassword)
router.put('/resetpassword', controllers.resetPassword)
//Để trong ngoặc vuông để phân biệt middlewares
router.get('/', [verifyAccessToken, isAdmin], controllers.getUsers)
router.delete('/', [verifyAccessToken, isAdmin], controllers.deleteUser)
router.put('/current', verifyAccessToken, controllers.updateUser)
router.put('/:uid', [verifyAccessToken, isAdmin], controllers.updateUserByAdmin)

module.exports = router