const ExpressError = require("../utils/ExpressError");
const wrapAsync = require("../utils/wrapAsync");
const jwt=require("jsonwebtoken");
const User = require("../module/user.js");
exports.isAuthenticated=wrapAsync(async(req,res,next)=>{
    const {token}=req.cookies;
    if(!token){
        return next( new ExpressError("please login to access this resoure",401));
    }
    try{
    const decodedData=jwt.verify(token,process.env.JWT_SECRET );
    
    //find user id from token
    req.user=await User.findById(decodedData.id);

    //check is user exists
    if (!req.user) {
        return next(new ExpressError("User not found", 404));
    }
    next();
}catch(error){
    
    //  Handle any errors that occur during verification
    return next(new ExpressError("Authentication failed, please try again", 401));
}
});

    //only admin  access kr skta
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ExpressError(`Role: ${req.user.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};
