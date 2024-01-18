const router = require('express').Router()
const controllers = require('../controllers/product')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')

router.post('/', [verifyAccessToken, isAdmin], controllers.createProduct)
router.get('/', controllers.getAllProduct)

router.get('/:pid', controllers.getProduct)
router.put('/:pid', [verifyAccessToken, isAdmin], controllers.updateProduct)
router.delete('/:pid', [verifyAccessToken, isAdmin], controllers.deleteProduct)

module.exports = router