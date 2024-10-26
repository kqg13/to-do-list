const mongoose = require('mongoose');

const connectionState = {
    isConnected: false,
    connect: async () => {
        try {
            await mongoose.connect(process.env.MONGO_URI, {
              // No need to include useNewUrlParser or useUnifiedTopology
            });
            connectionState.isConnected = true;
            console.log("Connected to MongoDB");
        } catch (error) {
            console.error("MongoDB connection error:", error);
        }
    },
    disconnect: async () => {
        if (connectionState.isConnected) {
            await mongoose.disconnect();
            connectionState.isConnected = false;
            console.log("Disconnected from MongoDB");
        }
    },
};

module.exports = connectionState;
