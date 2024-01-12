const mongoose = require('mongoose'); // Erase if already required
const bcrypt = require('bcrypt')

// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique: true
    },
    mobile:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        default:'user'
    },
    cart:{
        type: Array,
        default: []
    },
    address:[
        {
            type: mongoose.Types.ObjectId, ref: 'Address'
        }
    ],
    wishlist: [{type: mongoose.Types.ObjectId, ref: 'Product'}],
    //Chan tai khoan user
    isBlocked:{
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String
    },
    //Quen mat khau
    passwordChangedAt:{
        type: String
    },
    passwordResetToken:{
        type: String
    },
    passwordResetExpires:{
        type: String
    }
}, {
    timestamps: true
});

// Truoc khi luu sẽ thực hiện những đoạn code trong này
//Lưu ý: không được sử dụng Arrow function trong models của mongoose vì userSchema sẽ không hiểu
userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next()
    }
    const salt = bcrypt.genSaltSync(10)
    this.password = await bcrypt.hash(this.password, salt)
})

//Export the model
module.exports = mongoose.model('User', userSchema);