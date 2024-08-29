const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'civilian', 'rescuer'], required: true },
    
    // Fields specific to Civilian
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [38.24600, 21.73500] }, // Default coordinates
    },
    requests: [
        {
            date: String,
            time: String,
            address: {
                longitude: String,
                latitude: String,
                street: String,
                number: String,
                city: String,
                country: String,
                postalcode: String,
            },
            products: [
                {
                    category: String,
                    product: String,
                    people: Number,
                }
            ],
            deliveryDate: String,
            deliveryTimeSlot: {
                hours: String,
                minutes: String
            }
        }
    ],
    
    // Fields specific to Rescuer
    cargo: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ],
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
