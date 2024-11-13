const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
const { isAuthenticated} =require('../middleware/authen.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


router.post("/payment/process",isAuthenticated,wrapAsync(async(req,res,next)=>{
   try{
    const myPayment=await stripe.paymentIntents.create({
        amount:req.body.amount,
        currency:"inr",
        
        

    });
res.status(200)
.json({success:true,client_secret: myPayment.client_secret});
   }catch(error){
res.status(500).send({error:error.message});
   }
}));


router.get("/stripeapkey",isAuthenticated,wrapAsync(async(req,res,next)=>{
    try {
        const stripeApiKey = process.env.STRIPE_API_KEY;
        if (!stripeApiKey) {
          console.error("Stripe API key is not defined");
          return res.status(500).json({ message: 'Stripe API key not found' });
        }
        res.json({ stripeApiKey });
      } catch (error) {
        console.error("Error in fetching Stripe API key:", error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
}));

module.exports=router; 