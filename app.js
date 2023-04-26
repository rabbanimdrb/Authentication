//jshint esversion:6
require('dotenv').config()
console.log(process.env) // remove this after you've confirmed it is working
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set("view engine" , "ejs" );
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB" , {useNewUrlParser: true});

const userSchema = new mongoose.Schema(
    {
        email : String,
        password : String
    }
);

const secretKey = process.env.SECRET_KEY;
userSchema.plugin(encrypt, {secret : secretKey, encryptedFields : ["password"] }); //encrypt password field using the secretKey

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", function(req, res){

    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email : username}).then((foundUser)=>{
        if (foundUser) {
            if (foundUser.password === password ) {
                console.log(foundUser.password); //It will log the decrypted password in the console
                res.render("secrets");
            }
        }
    }).catch((err)=>{
        console.log(err);
    });

});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){

    const newUser = new User({
        email : req.body.username,
        password : req.body.password
    });

    newUser.save().then(()=>{
        console.log(newUser);
        res.render("secrets");
    }).catch((err)=>{
        console.log(err);
    });

});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});