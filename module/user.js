const mongoose=require ("mongoose");
const validator=require("validator");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const crypto=require("crypto");


const userSchema=new mongoose.Schema({
        name:{
            type:String,
            required:[true,"please Enter Your Name"],
            
            maxLength:[30,"Name cannot exceed 30 characters"],
            minLength:[4,"Name should have more than 4 characters"]
    },
    email:{
        type:String,
            required:[true,"please Enter Your email"],
            unique:true,
            validate:[validator.isEmail,"please enter valid email"]
    },
    password:{
        type:String,
        required:[true,"please Enter Your Password"],
        minLength:[5,"Password should have more than 8 characters"],
        select:false
    },
    username:{
        type:String,
        unique:true,
        sparse:true
    },
    role:{
        type:String,
        default:"user"
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date,
    
});

userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
         return next();
    }
this.password= await bcrypt.hash(this.password,10);
next();
});

//user login in register time
userSchema.methods.getJwtToken=function(){
    return jwt.sign({id:this._id},
    process.env.JWT_SECRET,{
    expiresIn:process.env.JWT_EXPIRE,
        }
    );
}
//compare password
userSchema.methods.comparePassword = async function (enteredpassword) {
    return await bcrypt.compare(enteredpassword, this.password);
};
//generate password reset token
userSchema.methods.getResetPasswordToken=function(){
//generate token
const resetToken=crypto.randomBytes(20).toString("hex");
//hashing and adding reset password token schema
this.resetPasswordToken=crypto.createHash("sha256").update(resetToken).digest("hex");
this.resetPasswordExpire=Date.now()+50*60*1000;
return resetToken;
};

const User=mongoose.model("User",userSchema);
module.exports=User;