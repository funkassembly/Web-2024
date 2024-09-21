const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Base user schema
const baseOptions = {
    discriminatorKey: 'role', // Define the key for differentiating user types
    collection: 'users', // Ensure all user types go into the same collection
};

const baseUserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' }, 
        coordinates: { type: [Number], default: [38.24600, 21.73500] } // Default coordinates
    }
}, baseOptions);

// Encrypt password before saving
baseUserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Password comparison method
baseUserSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Method for adding tasks (shared by all roles)
baseUserSchema.methods.addTask = async function (task) {
    this.tasks.push(task);
    await this.save();
};

// Index location if needed for geospatial queries
baseUserSchema.index({ location: '2dsphere' });

const taskSchema = new mongoose.Schema({
    type: { type: String, enum: ['request', 'donation'], required: true },
    status: { type: String, enum: ['pending', 'processed', 'delivered'], default: 'pending' },
    civilianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the Civilian
    address: {
        street: String,
        number: String,
        city: String,
        zip: String,
        country: String,
    },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    itemCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Reference to Category
    quantity: { type: Number, required: true },
    dateSubmitted: { type: Date, default: Date.now },
    rescuerUsername: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}, // Filled when processed
    dateServed: { type: Date }

})

// Civilian schema (inherits from baseUserSchema)
const civilianSchema = new mongoose.Schema({
    name: { type: String, required: true },
    cellphone: { type: String, required: true },
    address: {
        street: String,
        number: String,
        city: String,
        zip: String,
        country: String,
    },
    tasks: [taskSchema]
});

// Rescuer schema (inherits from baseUserSchema)
const rescuerSchema = new mongoose.Schema({
    cargo: [
        {
            item: { type: String, ref: 'Item', required: true },
            itemCategory: { type: String, ref: 'Category', required: true },
            quantity: { type: Number, required: true }
        }
    ],
    tasks: [taskSchema]
});

// Admin schema (inherits from baseUserSchema)
const adminSchema = new mongoose.Schema({
    announcements: [
        {
            type: [{
                date: { type: String },
                announcement: { type: String },
                items: { type: String }
            }]
        }
    ]
});

// Create the base model
const User = mongoose.model('User', baseUserSchema);

// Define role-specific models using discriminators
const Civilian = User.discriminator('civilian', civilianSchema);
const Rescuer = User.discriminator('rescuer', rescuerSchema);
const Admin = User.discriminator('admin', adminSchema);

module.exports = {
    User,
    Civilian,
    Rescuer,
    Admin
};
