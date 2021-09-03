const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
            unique: true,
            trim: true,
            maxlength: [50, 'Name can not be more than 50 characters'],
        },
        content: {
            type: String,
            required: [true, 'Please add a content'],
            maxlength: [5000, 'content can not be more than 5000 characters'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    }
)


module.exports = mongoose.model('Note', NoteSchema);