var express = require('express');
var router = express.Router();
var passport = require('passport');
var multer = require('multer');
var upload = multer({ dest: './public/images/uploads/'});
var config = require('../modules/oauth')
var localStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var User = require('../modules/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register', {
	  title:  'Register'
	});
});

router.get('/login', function(req, res, next) {
  console.log(config.facebook.clientID);
  res.render('login', {
	  title:  'Login'
	});
});

router.post('/register', upload.single('profileimage'), function(req, res, next) {
	// Get Form Values
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var oauthid = 0;

	
	// Check for image Field
	if(req.file){
		console.log('uploading file...');
		console.log(req.file);
		//File Info
		var profileImageOriginalName 	= req.file.originalname;
		var profileImageName 			= req.file.filename;
		var profileImageMime			= req.file.mimetype;
		var profileImagePath 			= req.file.path;
		var profileImageSize			= req.file.size;	
	}else{
		//Set a Default Image
		var profileImageName			= 'noImage.png';
	}
	
	//Form Validation
	req.checkBody('name','Name field is required').notEmpty();
	req.checkBody('email','Email field is required').notEmpty();
	req.checkBody('email','Email not valid').isEmail();
	req.checkBody('username','Username field is required').notEmpty();
	req.checkBody('password','Password field is required').notEmpty();
	req.checkBody('password2','Passwords do not match').equals(req.body.password);
	
	//Check for errors
	var errors = req.validationErrors();
	if (errors){
		res.render('register',{
			errors: errors,
			name: name,
			email: email,
			username: username,
			password: password,
			password2: password2
		});
	}else{
		var newUser = new User({
			name: name,
			email: email,
			username: username,
			password: password,
			profileimage: profileImageName,
			oauthid: oauthid		
		});
		// Create user
		User.createUser(newUser, function(err, user){
			if (err) throw err;
			console.log(user);
		});
		//
		req.flash('success', 'You are now registered and may log in');
		res.location('/');
		res.redirect('/');
	}
	
	
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new localStrategy(
	function(username, password, done){
		User.getUserByUsername(username, function(err, user){
			if (err) throw err;
			if (!user){
				console.log('Unkown User');
				return done(null, false, {message: 'Unknown User'});				
			}
			User.comparePassword(password, user.password, function(err, isMatch){
				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				}else{
					console.log('invalid password');
					return done(null, false, {message: 'invalid password'});
				}
			});
		});
		
	}
));
// config
passport.use(new FacebookStrategy({
 clientID: config.facebook.clientID,
 clientSecret: config.facebook.clientSecret,
 callbackURL: config.facebook.callbackURL
},
function(accessToken, refreshToken, profile, done) {
User.findOne({ oauthID: profile.id }, function(err, user) {
 if(err) { console.log(err); }
 if (!err && user != null) {
   done(null, user);
 } else {
	res.render('register',{
		name: profile.displayName,
		oauthid: profile.id
	});
 }
 });
}
));
router.post('/login', passport.authenticate('local',{failureRedirect: '/users/login', failureFlash: 'Invalid username or password'}), function(req, res){
	console.log('Authentication Succesful');
	req.flash('success', 'You are logged in');
	res.redirect('/');
});

router.post('/login/facebook', passport.authenticate('facebook',{failureRedirect: '/users/login', failureFlash: 'Invalid username or password'}), function(req, res){
	console.log('FB Authentication Succesful');
	req.flash('success', 'You are logged in');
	res.redirect('/');
});

router.get('/logout', function(req, res){
	req.logout();
	req.flash('success','You have logged out');
	res.redirect('/users/login');
})


module.exports = router;
