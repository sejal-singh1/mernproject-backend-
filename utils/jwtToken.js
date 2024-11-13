const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();

  // Verify the value of COOKIE_EXPIRES_TIME
  const cookieExpiresTime = process.env.COOKIE_EXPIRE;
  if (!cookieExpiresTime) {
    throw new Error(
      "COOKIE_EXPIRES_TIME is not set in the environment variables"
    );
  }

  // Option for cookies
  const options = {
    expires: new Date(Date.now() + cookieExpiresTime * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

module.exports = sendToken;
