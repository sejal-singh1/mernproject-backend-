const mongoose=require("mongoose");
const orderSchema=new mongoose.Schema({
    shippingInfo:{
        fullName:{
            type:String,
            required:true,
            min:[2, 'Full Name must be at least 2 characters long'],
        },
        phoneNO:{
            type:Number,
            required:true,
            matches:[/^[0-9]+$/, 'Phone Number must be only digits'],
            
        },
        pinCode:{
            type:Number,
            required:true,
            matches:[/^[0-9]{6}$/, 'Pincode must be exactly 6 digits'],
        },
       
        state:{
            type:String,
            required:true,
        },
        city:{
            type:String,
            required:true,
        },
        houseNumber:{
            type:String,
            
        },
        roadName: {
            type:String,
            required:true,  
        },
        country:{
            type:String,
            required:true,
        },
        addressType:{
            type:String,
        oneOf:(['home', 'work'], 'Address Type must be either Home or Work'),
        
        },
        


        
        
        
    },
    orderItems:[
    {
        name:{
            type:String,
            required:true,
        },
        price:{
            type:Number,
            required:true,
        },
        quantity:{
            type:Number,
            required:true,
        },
        image:{
            type:String,
            required:true,
        },
        product:{
            type:mongoose.Schema.ObjectId,
            ref:"Product",
            required:true
        },
    },
    ],
    user:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        required:true
    },
    paymentInfo:{
        id:{
            type:String,
            required:true
        },
        status:{
            type:String,
            required:true
        },
    },
        paidAt:{
            type:Date,
            required:true
        },
        itemsPrice:{
            type:Number,
            required:true,
            default:0
        },
        taxPrice:{
            type:Number,
            required:true,
            default:0
        },
        shippingPrice:{
            type:Number,
            required:true,
            default:0
        },
        totalPrice:{
            type:Number,
            required:true,
            default:0
        },
        orderStatus:{
            type:String,
            required:true,
            default:"processing"
        },
        deliveredAt:Date,
        createdAt:{
            type:Date,
            default:Date.now,
        },
    
})
const Order=mongoose.model("Order",orderSchema);
module.exports=Order;
