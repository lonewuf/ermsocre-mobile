const mongoose = require('mongoose');

// User Schema
const ReportSchema = mongoose.Schema({
   
    name: {
      type: String,
      require: true
    },
    email: {
      type: String,
      require: true
    },
    user_company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date_logged: {
      type: Date,
      default: Date.now()
    },
    report: {
      type: String,
      require: true
    }

});

module.exports = mongoose.model('Report', ReportSchema);

