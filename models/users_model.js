const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'civilian', 'rescuer'], required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [38.24600, 21.73500] }, // Default coordinates
    },
});

// Encrypt password 
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};
// Indexing the location for geospatial queries
userSchema.index({ location: '2dsphere' });


// Models
const User = mongoose.models.User || mongoose.model('User', userSchema);


module.exports = User;
