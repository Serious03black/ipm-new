const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    videoUrl: { 
        type: String, 
        required: true 
    },
    publicId: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['reel'], 
        default: 'reel' 
    }, // Distinguishes between regular videos and reels
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('reel', videoSchema);
