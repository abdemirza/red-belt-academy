const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Sequence = require("../models/Sequence");
const Contestant = require("../models/Contestant");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const getAge = require("age-by-birthdate");
const nodemailer = require("nodemailer");
const randomBytes = require("randombytes");
const resizeImg = require("resize-img");
const fs = require("fs");
const { count, getMaxListeners } = require("../models/Contestant");
const { ensureAuthenticated } = require("../config/auth");
const JoinedTournament = require("../models/JoinedTournament");
const emailVerification = require("../public/js/emailVerification");
require("dotenv").config();

// User.remove({'email':'rizo.shz@gmail.com'},(err)=>{
//   console.log(err)
// })
async function resizePhoto(contestantId) {
  const image = await resizeImg(
    fs.readFileSync(`${__dirname}/../public/UserData/${contestantId}.jpeg`),
    {
      width: 240,
      height: 360,
    }
  );

  fs.writeFileSync(
    __dirname + `/../public/UserData/${contestantId}.jpeg`,
    image
  );
}
// !Step 1 for email sending
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL || "abc@gmail.com", // TODO: your gmail account
    pass: process.env.PASSWORD || "1234", // TODO: your gmail password
  },
});

//Login Page
router.get("/login", (req, res) => {
  res.render("login");
});

//Register Page
router.get("/register", (req, res) => {
  res.render("register");
});

//New User Sign up
router.post("/register", (req, res) => {
  const { name, email, password, password2, role } = req.body;
  if (password != password2)
    res.render("register", { error: "Password Do Not Match" });
  else {
    User.findOne({ email: email }).then((user) => {
      if (user) res.send("User already exists");
      else {
        address = { street_address: "", state: "", city: "", zipcode: "" };
        club_data = {
          club_name: "",
          state: "",
          style_name: "",
          abbreviation: "",
          address: "",
        };
        let verificationKey = randomBytes(16).toString("hex");
        const newUser = new User({
          name,
          email,
          role,
          password,
          address,
          club_data,
          verificationKey,
        });
        // ! Hash Password
        bcrypt.genSalt(10, (err, salt) =>
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;

            let mailOptions = {
              from: "abc@gmail.com", // TODO: email sender
              to: `${email}`, // TODO: email receiver
              subject: "Account Verfication",
              html: emailVerification.emailBody(
                name,
                `${process.env.URL}/users/verify/${newUser._id}/${verificationKey}`
              ),
            };

            // Step 3
            transporter.sendMail(mailOptions, (err, data) => {
              if (err) return log(err);
            });

            newUser
              .save()
              .then((user) => {
                req.flash(
                  "success_msg",
                  "You are now registered and can log in "
                );
                res.redirect("/users/login");
              })
              .catch((err) => res.send(err));
          })
        );
      }
    });
  }
});
// ! Login Handle
router.post("/login", (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) res.send(err);
    else if (user != null && !user.active) {
      req.flash("error_msg", "Please verify your email first.");
      res.redirect("/users/login");
    } else {
      
      passport.authenticate("local", {
        successRedirect: user.admin?"/admin/dashboard":"/dashboard",
        failureRedirect: "/users/login",
        failureFlash: true,
      })(req, res, next);
    }
  });
});
router.get("/verify/:user_id/:verificationKey", (req, res) => {
  User.findById(req.params.user_id, (err, user) => {
    if (user && user.verificationKey == req.params.verificationKey) {
      User.updateOne(
        { _id: req.params.user_id },
        {
          $set: { active: true },
        },
        (err) => {
          if (err) res.send(err);
          else {
            req.flash("success_msg", "Your Account is verified!");
            res.redirect("/users/login");
          }
        }
      );
    } else {
      req.flash("error_msg", "Invalid Authorizarion");
      res.redirect("/users/login");
    }
  });
});
// ! Forgot Password
router.get("/forgotPassword", (req, res) => {
  res.render("forgotPassword");
});
router.post("/forgotPassword/linkSent", (req, res) => {
  let verificationKey = randomBytes(16).toString("hex");
  User.update(
    { email: req.body.email },
    {
      $set: { verificationKey: verificationKey },
    },
    (err, userModified) => {
      if (err) res.send(err);
      else if (userModified.nModified == 0) {
        req.flash("error_msg", "Ooops , email not registered");
        res.redirect("/users/forgotPassword");
      } else {
        User.findOne({ email: req.body.email }, (err, user) => {
          let mailOptions = {
            from: "redbeltacademy@gmail.com", // TODO: email sender
            to: `${req.body.email}`, // TODO: email receiver
            subject: "Reset Password",
            html: emailVerification.resetPassword(
              `${process.env.URL}/users/forgetPassword/${user._id}/${verificationKey}`
            ),
          };
          // Step 3
          transporter.sendMail(mailOptions, (err, data) => {
            if (err) return log(err);
          });
          req.flash(
            "success_msg",
            "Verification link has been sent to your email"
          );
          res.redirect("/users/forgotPassword");
        });
      }
    }
  );
});
router.get("/forgetPassword/:userId/:resetLink", (req, res) => {
  User.findOne({ _id: req.params.userId }, (err, user) => {
    res.render("resetPassword", { name: user.name, userId: user._id });
  });

  // User.updateOne({_id : req.params.userId},{
  //   $set:{

  //   }
  // },(err,updatedPassword)=>{

  // })
});
router.post("/resetPassword/:userId", (req, res) => {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(req.body.password, salt, (err, hash) => {
      if (err) throw err;
      User.updateOne(
        { _id: req.params.userId },
        {
          $set: { password: hash },
        },
        (err, data) => {
          if (err) res.send(err);
          else {
            req.flash("success_msg", "Password updated successfully.");
            res.redirect("/users/login");
          }
        }
      );
    });
  });
});
router.post("/update", (req, res) => {
  User.updateOne(
    { email: req.user.email },
    {
      $set: {
        name: req.body.name,
        contact: req.body.contact,
        address: {
          street_address: req.body.street_address,
          state: req.body.state,
          city: req.body.city,
          zipcode: req.body.zipcode,
        },
      },
    },
    (err, res) => {
      if (err) res.send(err);
    }
  );
  res.redirect("/dashboard");
});

// ! Update Club Details
router.post("/updateClub", (req, res) => {
  User.updateOne(
    { email: req.user.email },
    {
      $set: {
        club_data: {
          club_name: req.body.club_name,
          state: req.body.state,
          style_name: req.body.style_name,
          abbreviation: req.body.abbreviation,
          address: req.body.address,
          zipcode: req.body.zipcode,
        },
      },
    },
    (err, res) => {
      if (err) res.send(err);
    }
  );
  res.redirect("/dashboard");
});

// ! Create Contestant
router.post("/updateCompetitor", (req, res) => {
  photo = req.files.pic;
  if (photo.mimetype != "image/jpeg")
    return res.status(404).send("Upload your in jpeg format only");
  if (!req.files || Object.keys(req.files).length === 0)
    return res.status(400).send("No files were uploaded.");

  if (!req.files || Object.keys(req.files).length === 0)
    return res.status(400).send("No files were uploaded.");
  const { name, gender,state,bd, wt, ht, pic } = req.body;
  gen = gender == 1 ? true : false; // ! saving male as true and female as false
  // ! Calculating age using the node module
  age = getAge(
    bd.split("-")[1] + "-" + bd.split("-")[0] + "-" + bd.split("-")[2]
  );
  Sequence.findOneAndUpdate(
    {},
    {
      $inc: {
        value: 1,
      },
    },
    (err, sequence) => {
      if (err) res.send(err);
      newContestant = new Contestant({
        club_id: req.user.email,
        pid: sequence.value,
        name: name,
        gender: gen,
        state : state,
        birthday: bd,
        age: age,
        weight: wt,
        height: ht,
      });
      newContestant
        .save()
        .then((newContestant) => {
          photo.mv(
            __dirname + `/../public/UserData/${newContestant._id}.jpeg`,
            function (err) {
              if (err) return res.status(500).send(err);
              resizePhoto(newContestant._id);
            }
          );
          res.redirect("/dashboard");
        })
        .catch((err) => res.send(err));
    }
  );
});

// ! Delete Contestant
router.post("/deleteContestant", ensureAuthenticated, (req, res) => {
  console.log(req.body.contestantId);
  JoinedTournament.find(
    { contestant_id: req.body.contestantId },
    (err, joinedTournament) => {
      console.log(joinedTournament);
      console.log(joinedTournament.length);
      if (err) {
        res.send(err);
      } else if (joinedTournament.length > 0)
        return res.send(
          "Cannot delete the participant who has participated in a tournament . "
        );
      else {
        Contestant.findByIdAndDelete(req.body.contestantId, (err, status) => {
          if (err) res.send(err);
          else res.redirect("/dashboard");
        });
      }
    }
  );
});
router.post("/reupload", (req, res) => {
  photo = req.files.picture;
  if (photo.mimetype != "image/jpeg")
    return res.status(404).send("Upload your in jpeg format only");
  if (!req.files || Object.keys(req.files).length === 0)
    return res.status(400).send("No files were uploaded.");
  photo.mv(
    __dirname + `/../public/UserData/${contestantId}.jpeg`,
    function (err) {
      if (err) return res.status(500).send(err);
      resizePhoto(contestantId);
      res.redirect("/dashboard");
    }
  );
});
// ! Logout Handle
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out now");
  res.redirect("/");
});

// Demo change
module.exports = router;
