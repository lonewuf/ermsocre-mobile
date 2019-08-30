const express = require('express');
const router = express.Router();
const passport = require('passport');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const auth = require('../config/auth');
const userAuth = require('../config/userauth');

// // Get Models
const User = require('../models/users');
// const Sale = require('../models/sales');
const ForgotPassword = require('../models/forgotpassword');
const VariableStore = require('../models/variablestore')
const CompanyNum = require('../models/companyNum') 
const Report = require('../models/reports')
const Leave = require('../models/leaves')

router.get('/', auth.isUser, (req, res) => {
  User.findOne({email: req.user.email})
    .then(foundUser => {
      res.render('user-profile/index', {
        foundUser : foundUser,
        user: req.user

      })
    })
    .catch(err => console.log(err))
});

router.post('/insert-report', auth.isUser,(req, res) => {
  var date = req.body.date
  var report = req.body.report

  User.findOne({email: req.user.email})
    .then(foundUser => {

      if(foundUser._id != req.user._id) {
        req.flash('danger', 'You can\'t do that')
        res.redirect('back')
      }

      var newReport = {
        date: date,
        report: report,
        name: req.user.name,
        email: req.user.email,
        user_company_id: req.user._id
      }

      Report.create(newReport)
        .then(createdReport => {
          foundUser.reports.push(createdReport._id)
          foundUser.save()
            .then(updatedFoundUser => {
              req.flash('success', 'Report sent successfully')
              res.redirect('back');
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
})


router.post('/leaves', auth.isUser,(req, res) => {
  var date_from = req.body.date_from
  var date_to = req.body.date_to
  var leave = req.body.leave;
  
  var day = req.body.day
  var reason = req.body.reason

  User.findOne({email: req.user.email})
    .then(foundUser => {

      if(foundUser._id != req.user._id) {
        req.flash('danger', 'You can\'t do that')
        res.redirect('back')
      }

      var newLeave = {
        date_from: date_from,
        date_to: date_to,
        reason: reason,
        sick_leave: leave == 'sick_leave' ? parseInt(day) : 0,
        vacation_leave: leave == 'vacation_leave' ? parseInt(day) : 0,
        name: req.user.name,
        email: req.user.email,
        user_company_id: req.user._id
      }

      Leave.create(newLeave)
        .then(createdLeave => {
          foundUser.leaves.push(createdLeave._id)
          foundUser.save()
            .then(updatedFoundUser => {
              req.flash('success', 'Leave request sent successfully')
              res.redirect('back');
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
})

router.get('/user', auth.isUser, (req, res) => {
  User.findOne({email: req.user.email})
    .populate('reports')
    .populate('leaves')
    .then(foundUser => {
      console.log(foundUser)
      res.render('user-profile/home', {
        foundUser : foundUser,
        user: req.user

      })
    })
    .catch(err => console.log(er))
});


router.get('/user/:id', auth.isAdmin, (req, res) => {
  User.findOne({_id: req.params.id})
    .populate('reports')
    .populate('leaves')
    .then(foundUser => {
      console.log(foundUser)
      res.render('user-profile/home', {
        foundUser,
        user: req.user
      })
    })
    .catch(err => console.log(err))  
});

// // Forgot password - GET
// router.get('/forgot-password', (req, res) => {
//   res.render('forgot_password', {
//       title: 'Forgot Password'
//   })
// })

// Exports
module.exports = router;