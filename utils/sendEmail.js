const nodeMailer =require("nodemailer");
  const transporter=nodeMailer.createTransport({
   host: 'smtp.gmail.com', // Replace with your SMTP server
port: 465, // Typically 587 for START
 secure: true, // true for 465, false for other ports
   auth: {
    user: 'wandlahooper@gmail.com', // Your email username
   pass: 'pteg zpkk jgdv tmdo'
   } // Your email password  }
});
const sendEmail = async (options) => {
   try {
    await transporter.sendMail({
      from: '"Ecommerce" <wandlahooper@gmail.com>', // sender address
    to:options.email ,// list of receivers
   subject:options.subject, // Subject line
   text:options.message,
      });
     console.log('Email sent successfully');
   } catch (error) {
    console.error('Error sending email:', error);
    throw new Error("error sending email");
   }};
 module.exports=sendEmail;
