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
                    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Refers to Product model
                    category: String,
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
    donations: [
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
                    name: String,
                    category: String,
                    details: [
                        {
                            name: String,
                            value: String,
                        },
                    ],
                },
            ],
            deliveryDate: String,
            deliveryTimeSlot: {
                hours: String,
                minutes: String,
            },
        },
    ],
    tasks: [{
        type: {
            type: String,
            enum: ['request', 'donation'],
            required: true
        },
        civilianId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Refers to the Civilian model
            required: true
        },
        details: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'completed'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
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

// Method to add a task for a rescuer
userSchema.methods.addTask = async function(type, civilianId, details) {
    this.tasks.push({
        type,
        civilianId,
        details
    });
    await this.save();
};

// Indexing the location for geospatial queries
userSchema.index({ location: '2dsphere' });


// Models
const User = mongoose.models.User || mongoose.model('User', userSchema);


module.exports = User;
