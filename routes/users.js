const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const userAuth = require('../config/userauth');
const auth = require('../config/auth');

// // Get Models
const User = require('../models/users');
// const Sale = require('../models/sales');
const ForgotPassword = require('../models/forgotpassword');
const VariableStore = require('../models/variablestore')
const CompanyNum = require('../models/companyNum')

// router.get('/register', auth.isLoggedIn, function (req, res) {

//   res.render('register', {
//       title: 'Register'
//   }); 

// });

router.post('/register', auth.isLoggedIn,function (req, res) {

  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.pswd;
  var address = req.body.address;
  var phone_number = req.body.phone_number;
  var company_num = !!req.body.company_num ? req.body.company_num : 'empty';
  var password2 = req.body.pswd2;

  req.checkBody('name', 'Name is required!').notEmpty();
  req.checkBody('address', 'Address is required!').notEmpty();
  req.checkBody('company_num', 'Address is required!').notEmpty();
  // req.checkBody('company_num', 'Company Number is required!').notEmpty();
  req.checkBody('email', 'Email is required!').isEmail();
  req.checkBody('pswd', 'Password is required!').notEmpty();
  req.checkBody('pswd2', 'Passwords do not match!').equals(password);

  var errors = req.validationErrors();

  if (errors) {
    res.render('index', { 
        errors: errors,
        user: null,
        title: 'Register'
    }); 
  } else {
    User.findOne({email: email}, function (err, user) {
        if (err)
            console.log(err);

        if (user) {
            console.log('error')
            req.flash('danger', 'Email exists, choose another!');
            res.redirect('/');
        } else {

            CompanyNum.findById(company_num)
                .then(foundID => {

                    if(!foundID.used){
                    
                        CompanyNum.updateOne({_id: company_num}, {$set: {used: true}})
                            .then(updatedCompanyNum => {

                                var user = new User({
                                    _id: company_num,
                                    name: name,
                                    email: email,
                                    password: password,
                                    address: address,
                                    phone_number: phone_number,
                                    company_num: company_num,
                                    admin: 0
                                });
                    
                                bcrypt.genSalt(10, function (err, salt) {
                                    bcrypt.hash(user.password, salt, function (err, hash) {
                                        if (err)
                                            console.log(err);
                    
                                        user.password = hash;
                    
                                        user.save(function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                req.flash('success', 'You are now registered!');
                                                res.redirect('/')
                                            }
                                        });
                                    });
                                });

                            })
                            .catch(err => console.log('error updating company num', err))

                    } else {
                        req.flash('danger', 'Company ID is already used')
                        res.redirect('back')
                    }

                    
                })
                .catch(err => {
                    req.flash('danger','Company ID is not registered in system')
                    res.redirect('back');
                })

            
        }
    });
  }

});

// router.get('/login', auth.isLoggedIn, function (req, res) {

//   if (res.locals.user) res.redirect('/');
  
//   res.render('login', {
//       title: 'Log in'
//   });

// });
/*
 * GET login
 */
router.post('/login', auth.isLoggedIn, function (req, res, next) {

  passport.authenticate('local', {
      successRedirect: '/profile',
      failureRedirect: '/',
      failureFlash: true
  })(req, res, next);
    
});

// router.post('/login-from-billing', auth.isLoggedIn, function (req, res, next) {

//   passport.authenticate('local', {
//       successRedirect: '/cart/payment-method',
//       failureRedirect: '/cart/payment-method',
//       failureFlash: true
//   })(req, res, next);
    
// });

/*
 * GET logout
 */
router.get('/logout', function (req, res) {

  req.logout();
  req.flash('success', 'You are logged out!');
  res.redirect('/');

});

// // Get user profile
// router.get('/product-status/:username', auth.isUser, (req, res) => {
//   User.findOne({username: req.params.username})
//       .then(foundUser => {
//           Sale.find({buyer: foundUser.username})
//               .then(sales => {
//                   res.render('user-profile', 
//                   {   foundUser, 
//                       sales, 
//                       title: `${foundUser.name}'s Profile`,
//                       currentUser: req.user
//                   });
//               })
//               .catch(err => console.log(err));
//       })
//       .catch(err => {
//           req.flash('danger', 'User is not present')
//           res.redirect('/');
//       });
// });

// router.get('/profile/:username', auth.isUser, (req, res) => {
//   User.findOne({username: req.params.username})
//       .then(foundUser => {

//           res.render('profile', {
//               foundUser,
//               title: `${foundUser.name}'s Profile`
//           })
//       })
//       .catch(err => {
//           req.flash('danger', 'User is not present')
//           res.redirect('/');
//       });
// });

// // Forgot password - GET
// router.get('/forgot-password', (req, res) => {
//   res.render('forgot_password', {
//       title: 'Forgot Password'
//   })
// })

// Forgot password - POST
router.post('/forgot-password', (req, res) => {
    
  const email = req.body.email

  User.findOne({email: email}, (err, foundUser) => {
      if(err) {
          throw(err)
      } else {

          if(!foundUser) {
            req.flash('success', 'We will send you an email if your email is in our system')
            res.redirect('/');
          } else {

          var transporter = nodemailer.createTransport({
          service: userAuth.tMail,
          auth: {
                  user: userAuth.uName,
                  pass: userAuth.pW
              }
          });

          ForgotPassword.create({email: email})
              .then(createdFoundPassword => {
                  const mailOptions = {
                      from: userAuth.uName, // sender address
                      to: email, // list of receivers
                      subject: 'ERMSCORE - Forgot Password', // Subject line
                      html: `<h2>Hi ${foundUser.name}</h2>
                      <br><br>
                      <p>Click the link to change your password.</p>
                      <br>
                      <a href="${userAuth.hostDev}/forgot-password/${foundUser._id}/${createdFoundPassword._id}">Change password</a>`// plain text body
                  };
                  transporter.sendMail(mailOptions)
                      .then(info => {
                          req.flash('success', 'We will send you an email if your email is in our system')
                          res.redirect('/');
                      })
                      .catch(err => console.log(err))
              })
              .catch(err => console.log(err))
      }
    }
  })

})

router.get('/forgot-password/:id/:change_pass_id', (req, res) => {
    
  const id = req.params.id
  const change_pass_id = req.params.change_pass_id

  ForgotPassword.findById(change_pass_id)
      .then(foundForgotPW => {
          User.findById(id)
              .then(foundUser => {
                  res.render('forgot_password_submit', {
                      title: 'Forgot Password',
                      id,
                      change_pass_id,
                      user: req.user
                  })
              })
              .catch(err => console.log(err))
      })
      .catch(err => console.log(err))
})

router.post('/forgot-password/:id/:change_pass_id', (req, res) => {
    
  const id = req.params.id
  const change_pass_id = req.params.change_pass_id
  var password = req.body.password;
  const password2 = req.body.password2;

  console.log('errors')

  req.checkBody('password', 'Password is required!').notEmpty();
  req.checkBody('password2', 'Passwords do not match!').equals(password);

  var errors = req.validationErrors();

  ForgotPassword.findById(change_pass_id)
      .then(foundForgotPW => {
          if (errors) {
              req.flash('danger', 'Make sure that fill up all the and Passwords should match')
              res.redirect(`/forgot-password/${id}/${change_pass_id}`);
          }
          bcrypt.genSalt(10, function (err, salt) {
              bcrypt.hash(password, salt, function (err, hash) {
                  if (err)
                      console.log(err);

                  password = hash;

                  User.updateOne({_id: id}, {$set: {"password": password}})
                      .then(foundUser => {
                          ForgotPassword.findByIdAndDelete(change_pass_id)
                              .then(() => {
                                  console.log('changes')
                                  req.flash('success', 'Your Password is changed')
                                  res.redirect('/');
                              })
                              .catch(err => console.log(err))
                      })
                      .catch(err => console.log(err))
                  
              });
          });

          
      })
      .catch(err => console.log(err))
    
})

router.get('/', (req, res) => {
    if(req.user) {
        res.redirect('/profile')
    }
    res.render('index')
});

// Exports
module.exports = router;