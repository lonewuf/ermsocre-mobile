const mongoose = require('mongoose');

// User Schema
const UserSchema = mongoose.Schema({
   
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    company_num: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    admin: {
        type: Number
    },
    phone_number: {
        type: String,
        // required: true
    },
    address: {
        type: String,
        //required: true
    },
    skill: [],
    reports: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Report'
        }
    ],
    leaves: [
        {
            type:  mongoose.Schema.Types.ObjectId,
            ref: 'Leave'
        }
    ]

    
});

module.exports = mongoose.model('User', UserSchema);


 