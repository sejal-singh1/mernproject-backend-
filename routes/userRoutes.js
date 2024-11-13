const express = require("express");
const router = express.Router();
const User = require("../module/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const sendToken = require("../utils/jwtToken.js");
const sendEmail=require("../utils/sendEmail.js");
const  crypto=require("crypto");
const { isAuthenticated, authorizeRoles } = require("../middleware/authen.js");
const { Console } = require("console");


// Register a user
router.post("/register", wrapAsync(async (req, res,next) => {
    const { name, email,password ,username} = req.body;
    const user = await User.create({
         name, email,password,username
    });
     sendToken(user,200,res);
}))
    



//login user
router.post("/login", wrapAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ExpressError("Please enter email and password", 400));
    }
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ExpressError("Invalid username", 401));
    }
    const isPassWordMatched = await user.comparePassword(password); // Password compare
    if (!isPassWordMatched) {
        return next(new ExpressError("Invalid Email or Password", 401));
    }
    sendToken(user,200,res);
    }));


    //forget password
    router.post("/password/forget",wrapAsync(async(req,res,next)=>{
        const user=await User.findOne({email:req.body.email});
        if(!user){
            return next(new ExpressError("User not found",404))
        }
        //get reset password token
        const resetToken=user.getResetPasswordToken();
        await user.save({validateBeforeSave:false});
        //prepare the link for email
        const resetPasswordUrl=`${req.protocol}://${req.get("host")}/api/users/password/reset/${resetToken}`
        //made the message for email
        const message=`Your Pssword reset Token is :\n\n ${resetPasswordUrl}\n\nIf you have not requested this email please ignore it.`;
        try{
await sendEmail({
email:user.email,
subject:`Let's Shop  Password Recovery`,
message,


});
res.status(200).json({
    success:true,
    message:`Email send to ${user.email} successfully`,
})
        }catch(error){
            user.resetPasswordToken=undefined;
            user.resetPasswordExpire=undefined;
            await user.save({validateBeforeSave:false});
            return next(new ExpressError("error sending email please try again later.",500));
        }
    }));

   // reset password
router.put("/password/reset/:token",wrapAsync(async(req,res,next)=>{
    //creating token hash
    try{
    
    const resetPasswordToken=crypto.createHash("sha256").update(req.params.token).digest("hex");
    //creating token use found user
    const user=await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{$gt:Date.now()},
    });
    
if(!user){
    return next(new ExpressError("Reset Password token is Invalid or has Expire",404));
}

if(req.body.password!==req.body.confirmPassword){
return next(new ExpressError("Passwords do not match", 400));
} // This should be an error
user.password=req.body.password;
user.resetPasswordToken=undefined;
user.resetPasswordExpire=undefined;
 await user.save();

// password change after login
sendToken(user,200,res);
}catch(error) {
    return next(new ExpressError("Error resetting password", 500));
}
}));

    //logout user
    router.get("/logout",wrapAsync(async(req,res,next)=>{
        res.cookie("token",null,{
expires:new Date(Date.now()),
httpOnly:true,
        });
res.status(200).json({
    success:true,
    message:"logged out",
});
    }));
    //login user only access
    router.get("/me",isAuthenticated,wrapAsync(async(req,res,next)=>{
const user=await User.findById(req.user._id);
if (!user) {
    return next(new ExpressError("User not found is id", 404));
}
    res.status(200).json({
        success:true,
        user,
    });
    }));
    //change password
    router.put("/password/update",isAuthenticated,wrapAsync(async(req,res,next)=>{
        const user=await User.findById(req.user._id).select("+password");
        const isPassWordMatched = await user.comparePassword(req.body.oldPassword); 
    if (!isPassWordMatched) {
        return next(new ExpressError("Old Password is Incorrect", 401));
    }
    if(req.body.newPassword!==req.body.confirmPassword){
        return next(new ExpressError("password not matched", 401));
    }
    user.password=req.body.newPassword;
    await user.save();
    sendToken(user,200,res);
    }));
    //update profile not include password
    router.put("/me/update",isAuthenticated,wrapAsync(async(req,res,next)=>{
        const newUserData={
            name:req.body.name,
            email:req.body.email,
        };
        const user= await User.findByIdAndUpdate(req.user._id,newUserData,{new:true,runValidators:true,usefindAndModify:false,})
    res.status(200).json({
        success:true,
        user,
    });
}));
        //get all users (only show admin)
        router.get("/admin/users",isAuthenticated, authorizeRoles("admin"),wrapAsync(async(req,res,next)=>{
            
            const users=await User.find();
            console.log(users); 
            res.status(200).json({
                success:true,
                users,
            });
        
        
        }));
//get single user(only show admin)
router.get("/admin/user/:id",isAuthenticated, authorizeRoles("admin"),wrapAsync(async(req,res,next)=>{
    const user=await User.find(req.params._id);
    if(!user){
        return next(new ExpressError(`not user found based ob id :${req.params._id}`,404)); 
    }
    res.status(200).json({
        success:true,
        user,
    });
}));
// update user role ---(only admin can update)
router.put("/admin/user/:id",isAuthenticated, authorizeRoles("admin"),wrapAsync(async(req,res,next)=>{
    const newUserData={
        name:req.body.name,
        email:req.body.email,
        role:req.body.role,
    };
    const user= await User.findByIdAndUpdate(req.user._id,newUserData,{new:true,runValidators:true,userfindAndModify:false,})
res.status(200).json({
    success:true,
    user,
});
}));
    //delete user ----(only admin can delete)
    router.delete("/admin/user/:id",isAuthenticated, authorizeRoles("admin"),wrapAsync(async(req,res,next)=>{
        
        const user= await User.findById(req.params.id);

        // Log to see if user exists
    console.log("User found for deletion: ", user);

        if(!user){
            return next(new ExpressError(`not user found based ob id :${req.params.id}`,404)); 
    }





    await user.deleteOne();
        res.status(200).json({
            success:true,
            message: "User Deleted Successfully",
            
        });
    }
    ));

module.exports = router;
