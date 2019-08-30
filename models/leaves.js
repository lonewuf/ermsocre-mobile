const mongoose = require('mongoose');

// User Schema
const LeavesSchema = mongoose.Schema({
   
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
    date_from: {
      type: Date,
      require: true
    },
    date_to: {
      type: Date,
      require: true
    },
    sick_leave: {
      type: Number,
      require: true
    },
    vacation_leave: {
      type: Number,
      require: true
    },
    reason: {
      type: String,
      require: true
    }

});

module.exports = mongoose.model('Leave', LeavesSchema);

