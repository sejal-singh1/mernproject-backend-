const express = require("express");
const router = express.Router();
const Order = require("../module/ordermodel.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Product = require("../module/productmodel.js");
const { isAuthenticated, authorizeRoles } = require("../middleware/authen.js");

//create newOrder

router.post("/order/new",isAuthenticated,wrapAsync(async (req, res) => {
      const{shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
         phoneNO,
        country,
    image}
        =req.body
      const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        phoneNO,
        country,
        image,

        paidAt:Date.now(),
        user:req.user._id,

      });
      return res.status(201).json({
        success:true,
        order,
      });
    }));
    //get single order
    router.get("/order/:id",isAuthenticated,authorizeRoles("admin"),wrapAsync(async (req, res,next) => {
        const order=await Order.findById(req.params.id).populate(
            "user",
            "name email"
        );
if(!order){
    return next(new ExpressError("order not found with this id",404));
}
        return res.status(201).json({
            success:true,
            order,
        });
    }));
    //get only logged in user can access
    router.get("/orders/me",isAuthenticated,wrapAsync(async (req, res) => {
        const orders=await Order.find({user:req.user._id});
    
 
   return  res.status(201).json({
        success:true,
        orders,
    });
}));
//get all order--admin
router.get("/admin/orders",isAuthenticated,authorizeRoles("admin"),wrapAsync(async (req, res) => {
  const orders=await Order.find();
let totalAmount=0;
orders. forEach((order)=>{
  totalAmount+=order.totalPrice
});

return  res.status(201).json({
  success:true,
totalAmount,
orders,
});
}));
//update order ----admin
router.put("/admin/orders/:id",isAuthenticated,authorizeRoles("admin"),wrapAsync(async (req, res,next) => {
  const order=await Order.findById(req.params.id);
 
 
 
  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }

 
 
  if(order.orderStatus==="Delivered"){


return next(new ExpressError("you have already deliverd this order",400));
  }


  if (req.body.status === "Shipped") {

  order.orderItems.forEach(async(item)=>{
    await  updateStoke(item.product,item.quantity);
  });
}
  order.orderStatus=req.body.status;
  if(req.body.status==="Delivered"){
    order.deliveredAt=Date.now();
  }
  await order.save({validateBeforeSave:false});
return  res.status(201).json({
  success:true,
});
}));
async function updateStoke(id,quantity){
  const product =await Product.findById(id);

product.Stoke-=quantity;
await product.save({validateBeforeSave:false});
}
//delete order ---admin
router.delete("/admin/order/:id",isAuthenticated,authorizeRoles("admin"),wrapAsync(async (req, res) => {
  const order=await Order.findById(req.params.id);
  if(!order){
    return next(new ExpressError("order not found by id",400));
      }
      await Order.findByIdAndDelete(req.params.id); 

return  res.status(200).json({
  success:true,
});
}));
  module.exports=router;