const express = require('express');
const router = express.Router();
const passport = require('passport');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const fs = require('fs-extra');
const path = require('path');
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
  date = new Date(date)
  var report = req.body.report
  var fileF = typeof req.files.fileUp !== "undefined" ? req.files.fileUp.name : "";

  req.checkBody('date', 'Date is required!').notEmpty();
  if(fileF)
    req.checkBody('fileUp', 'You must upload an image').isValidFile(fileF);
  var errors = req.validationErrors();

  if (errors) {
    User.findOne({email: req.user.email})
    .populate('reports')
    .populate('leaves')
    .then(foundUser => {
      res.render('user-profile/home', {
        foundUser : foundUser,
        user: req.user,
        errors: errors
      })
    })
    .catch(err => console.log(er))
  } else {
    if(fileF == '' && report == '') {
      req.flash('danger', 'Please fill up the report form OR upload a file for your report')
      res.redirect('back');
    } else {

      if(Date.now() < date) {
        req.flash('danger', 'You can\'t submit report in future days')
        res.redirect('back');
      } else {
        User.findOne({email: req.user.email})
          .then(foundUser => {

            if(foundUser._id != req.user.id) {
              req.flash('danger', 'You can\'t do that')
              res.redirect('back')
            } else {
              var newReport = {
                date: date,
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate() + 1,
                report: report,
                employee: req.user._id,
                file: fileF
              }

              Report.create(newReport)
                .then(createdReport => {
                  foundUser.reports.push(createdReport._id)
                  foundUser.save()
                    .then(updatedFoundUser => {
                      if(fileF != "") {
                        var reportFile = req.files.fileUp;
                        var pathFile = `public/employee_images/${foundUser._id}/files/${fileF}`
                        var fExtension = (path.extname(reportFile.name)).toLowerCase();
                        var newFileName = `${foundUser.name}-${foundUser.company_num}-(${createdReport.month}-${createdReport.day}-${createdReport.month})${fExtension}`
                        reportFile.mv(pathFile, err => {
                          console.log(err);
                        });
                        
                        fs.rename(pathFile, `public/employee_images/${foundUser._id}/files/${newFileName}`, function (err) {
                          if (err) throw err;
                          console.log('File Renamed.');
                        });
                        createdReport.file = newFileName
                        createdReport.save()
                          .then(() => {
                            req.flash('success', 'Report sent successfully')
                            res.redirect('/profile/user');
                          })
                          .catch(err => console.log(err))

                      }
                      
                    })
                    .catch(err => console.log(err))
                })
                .catch(err => console.log(err))
            }
          })
          .catch(err => console.log(err)) 
      
      }
    } //2
  }
})


router.post('/leaves', auth.isUser,(req, res) => {
  var date_from = req.body.date_from
  var date_to = req.body.date_to
  var leave = req.body.leave;
  var reason = req.body.reason

  if(date_from == '') {
    req.flash('danger', 'Date from is required')
    res.redirect('back');
  } else {
    if(date_to == '') {
      req.flash('danger', 'Date to is required')
      res.redirect('back');
    } else {
      if(leave == '') {
        req.flash('danger', 'Type of leave is required')
        res.redirect('back');
      } else {
        if(reason == '') {
          req.flash('danger', 'Type of leave is required')
          res.redirect('back');
        } else {
          
          date_from = new Date(date_from)
          date_to = new Date(date_to)
          var diffTime = date_to.getTime() - date_from.getTime()
          var daysLeave = diffTime / (1000 * 3600 * 24);
          if(date_from >= date_to) {
            req.flash('danger', 'Date from is greater than Date to')
            res.redirect('back');
          } else {
            if(daysLeave <= 0) {
              req.flash('danger', 'Invalid Date from and Date to')
              res.redirect('back');
            } else {
              User.findOne({email: req.user.email})
                .then(foundUser => {

                  if(foundUser._id != req.user.id) {
                    req.flash('danger', 'You can\'t do that')
                    res.redirect('back')
                  }

                  var newLeave = {
                    date_from: date_from,
                    date_to: date_to,
                    days_leave: parseInt(daysLeave),
                    reason: reason,
                    type_leave: leave,
                    employee: req.user._id
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
            }
          }
        }
      }
    }
  }
})

router.get('/user', auth.isUser, (req, res) => {
  User.findOne({email: req.user.email})
    .populate('reports')
    .populate('leaves')
    .then(foundUser => {

      var sortedArr = []

      foundUser.reports.sort((a, b) => {
        return a.date_logged.getTime() > b.date_logged.getTime() ? 1 : -1;
      })

      for(let i = foundUser.reports.length - 1; i >= 0; i--) {
        sortedArr.push(foundUser.reports[i])
      }

      foundUser.reports = sortedArr

      res.render('user-profile/home', {
        foundUser : foundUser,
        user: req.user
      })
    })
    .catch(err => console.log(err))
});


router.get('/user/:id', auth.isAdmin, (req, res) => {
  User.findOne({_id: req.params.id})
    .populate('reports')
    .populate('leaves')
    .then(foundUser => {

      var sortedArr = []

      foundUser.reports.sort((a, b) => {
        return a.date_logged.getTime() > b.date_logged.getTime() ? 1 : -1;
      })

      for(let i = foundUser.reports.length - 1; i >= 0; i--) {
        sortedArr.push(foundUser.reports[i])
      }

      foundUser.reports = sortedArr

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