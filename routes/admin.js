const express = require('express');
const router = express.Router();
const passport = require('passport');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const auth = require('../config/auth');
const userAuth = require('../config/userauth');

// // Get Models
const User = require('../models/users');
const VariableStore = require('../models/variablestore')
const CompanyNum = require('../models/companyNum')
const Leave = require('../models/leaves')
const Report = require('../models/reports')

router.get('/', auth.isAdmin, (req, res) => {
  CompanyNum.find({})
    .then(foundCompanyID => {
      Report.find({})
        .then(foundReports => {
          Leave.find({})
            .then(foundLeaves => {

              User.find({})
                .populate('reports')
                .populate('leaves')
                .then(foundUsers => {
                  res.render('admin/index', {
                    foundCompanyID,
                    foundReports,
                    foundLeaves,
                    user: req.user,
                    foundUsers,
                    user: req.user

                  })
                })
                .catch(err => console.log(err))

              
              
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
      
    })
    .catch(err => console.log(err))
  
});

router.get('/generate-employee-number', auth.isAdmin,(req, res) => {

  VariableStore.updateOne({target: 'secret-target'}, {$inc: {counter: 1}})
    .then(updatedCounter => {
      const company_num = new CompanyNum({
        number: updatedCounter.counter
      })

      CompanyNum.create({number: updatedCounter.counter})
        .then(createdCompanyNum => {
          console.log(company_num)
          req.flash('success', `New company number is generated: ${createdCompanyNum._id}`)
          res.redirect('/admin');
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
})

// router.get('/user', auth.isUser, (req, res) => {
//   User.findOne({email: req.user.email})
//     .then(foundUser => {
//       res.render('user-profile/home', {
//         foundUser
//       })
//     })
//     .catch(err => console.log(err))
// });


// router.get('/profile/:id', auth.isAdmin, (req, res) => {
//   User.findOne({_id: req.params.id})
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

router.post('/send-company-id/:id', auth.isAdmin,(req, res) => {
    
  const email = req.body.email
  const id = req.params.id

  var transporter = nodemailer.createTransport({
  service: userAuth.tMail,
  auth: {
          user: userAuth.uName,
          pass: userAuth.pW
      }
  });

  const mailOptions = {
    from: userAuth.uName, // sender address
    to: email, // list of receivers
    subject: 'ERMSCORE - Company ID', // Subject line
    html: `<h2>Hi Mr./Mrs./Ms. </h2>
    <br><br>
    <p>This is your Company ID for your registration in our website: ${id}</p>
    <br>`
  };

  transporter.sendMail(mailOptions)
    .then(info => {
        req.flash('success', 'Email sent')
        res.redirect('back');
    })
    .catch(err => console.log(err))
  })

// Exports
module.exports = router;