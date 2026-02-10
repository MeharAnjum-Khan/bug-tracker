const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually read .env to be safe
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
let mongoUri = '';

for (const line of envLines) {
    if (line.startsWith('MONGODB_URI=')) {
        mongoUri = line.split('=')[1].trim();
        break;
    }
}

if (!mongoUri) {
    console.error('Could not find MONGODB_URI in .env');
    process.exit(1);
}

async function clearNotifications() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected.');

        const count = await mongoose.connection.collection('notifications').countDocuments();
        console.log(`Found ${count} notifications. Deleting...`);

        await mongoose.connection.collection('notifications').deleteMany({});
        console.log('Successfully cleared all notifications.');

        process.exit(0);
    } catch (error) {
        console.error('Error clearing notifications:', error);
        process.exit(1);
    }
}

clearNotifications();
