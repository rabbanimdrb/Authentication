//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set("view engine" , "ejs" );
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
  secret: "ThisIsaSpecialSecret_",
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB" , {useNewUrlParser: true});
// mongoose.set("useCreateIndex" , true);

const userSchema = new mongoose.Schema(
    {
        email : String,
        password : String,
        googleId : String
    }
);

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);//logs the profile of the user in the console 
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});


app.get("/secrets" , function(req, res){
    if (req.isAuthenticated()) {
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

app.post("/login", function(req, res){

    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.login(user, function(err){
        if (err) {
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    })

});

app.get("/register", function(req, res){
    res.render("register");
});

app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));

app.post("/register", function(req, res){

    User.register({username : req.body.username} , req.body.password,function(err, user){

        if (err) {
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });

});

app.get("/logout", function(req, res){
    
    req.logout(function(err){
        if (err) {
            console.log(err)
        }else{
            console.log("Logout done")
        }
    });
    res.redirect("/");

});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});