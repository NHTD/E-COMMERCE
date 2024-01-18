const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
//trim: true (tự động bỏ dấu cách ở hai đầu)
var productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim: true
    },
    // đồng hồ apple - dong-ho-apple
    slug:{
        type:String,
        required:true,
        unique:true,
        lowercase: true
    },
    description:{
        type:String,
        required:true,
        unique:true,
    },
    brand:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    category:{
        type: mongoose.Types.ObjectId,
        ref: 'Category'
    },
    quantity:{
        type:Number,
        default: 0
    },
    sold:{
        type:Number,
        required:0
    },
    sold:{
        type:Array
    },
    color:{
        type:String,
        enum: ['Black', 'Grown', 'Red']
    },
    //Đánh giá
    rating:[
        {
            star: {type: Number},
            postedBy: {type: mongoose.Types.ObjectId, ref: 'User'},
            comment: {type: String}
        }
    ],
    totalRatings: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

//Export the model
module.exports = mongoose.model('Product', productSchema);