const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const PORT = process.env.PORT;
const db = require("./config/keys").MongoURI;
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const upload = require("express-fileupload");
const fs = require("fs");
const http = require("http");
const https = require("https");
const User = require("./models/User");
require("dotenv").config();

app.use(upload()); //! For file uploads

// ! MongoDB config
mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log("DataBase connected"))
  .catch((err) => console.log(err));

// ! Certificates
var privateKey, certificate, ca, credentials, httpsServer;
if (process.env.PRODUCTION == 1) {
  privateKey = fs.readFileSync(
    "/etc/letsencrypt/live/redbeltacademy.in/privkey.pem",
    "utf8"
  );
  certificate = fs.readFileSync(
    "/etc/letsencrypt/live/redbeltacademy.in/cert.pem",
    "utf8"
  );
  ca = fs.readFileSync(
    "/etc/letsencrypt/live/redbeltacademy.in/chain.pem",
    "utf8"
  );

  credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
  };
}

// ! Passport Config
require("./config/passport")(passport);
// ! for layouts
app.use(expressLayouts);
// ! for setting ejs to default
app.set("view engine", "ejs");
// ! Body Parser to get data from my forms
app.use(express.urlencoded({ extended: true }));
// ! express session
app.use(
  session({
    secret: "funnyBone",
    resave: false,
    saveUninitialized: true,
  })
);
if(process.env.PRODUCTION==1){
app.use(function (req, res, next) {
  if (req.secure) {
    // request was via https, so do no special handling
    next();
  } else {
    // request was via http, so redirect to https
    res.redirect("https://" + req.headers.host + req.url);
  }
});
}
app.use(express.static(__dirname + "/public"));
// ! Initialising Passport Middleware (Order is important)
app.use(passport.initialize());
app.use(passport.session());
app.engine("html", require("ejs").renderFile);
// ! connect flash
app.use(flash());
// ! Global Variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;
  next();
});
app.use(function (req, res, next) {
  res.locals.login = req.isAuthenticated();
  next();
});

// !routes defined in the routes folder
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/user"));
app.use("/register", require("./routes/index"));
//  Error Page for an undefined route
app.get("*", function (req, res) {
  res.status(404).render("404");
});

const httpServer = http.createServer(app);
if (process.env.PRODUCTION == 1) {
  httpsServer = https.createServer(credentials, app);
}

httpServer.listen(process.env.PORT, () => {
  console.log("HTTP Server running on port " + process.env.PORT);
});

if (process.env.PRODUCTION == 1) {
  app.get("*", function (req, res) {
    res.redirect("https://" + req.headers.host + req.url);
  });
  httpsServer.listen(443, () => {
    console.log("HTTPS Server running on port 443");
  });
}
// hello
