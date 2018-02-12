'use strict';
require('dotenv').config();

const IoTHub = require('azure-iothub');
const IoTHubClient = require('azure-iothub').Client;
const Message = require('azure-iot-common').Message;
const EventHubClient = require('azure-event-hubs').Client;

const connectionString = process.env.IoTHubConnectionString;
const deviceId = process.env.DeviceId;

const registry = IoTHub.Registry.fromConnectionString(connectionString);
const iotHubClient = IoTHubClient.fromConnectionString(connectionString);
const eventHubClient = EventHubClient.fromConnectionString(connectionString);

//////////////////////
// Event Hub settings
//////////////////////
const printError = err => {
    console.log(err.message);
};

const printMessage = message => {
    console.log('Message received from device:');
    console.log(message.body);
    console.log();
};

// Receive Twin update and Message from device
eventHubClient.open()
    .then(eventHubClient.getPartitionIds.bind(eventHubClient))
    .then(partitionIds => {
        return partitionIds.map(partitionId => {
            return eventHubClient.createReceiver('$Default', partitionId, { 'startAfterTime': Date.now() })
                .then(receiver => {
                    receiver.on('errorReceived', printError);
                    receiver.on('message', printMessage);
                });
        });
    })
    .catch(printError);

//////////////////////
// IoT Hub settings
//////////////////////
const printResultFor = op => {
    return (err, res) => {
        if (err) console.log(op + ' error: ' + err.toString());
        if (res) console.log(op + ' status: ' + res.constructor.name);
        console.log();
    };
}

const receiveFeedback = (err, receiver) => {
    receiver.on('message', msg => {
        console.log('Feedback received.\n');
    });
}

iotHubClient.open(err => {
    if (err) {
        console.error('Could not connect: ' + err.message);
        return;
    }
    iotHubClient.getFeedbackReceiver(receiveFeedback);
    const text = { text: 'Cloud to Device message.' }
    const message = new Message(JSON.stringify(text));

    setInterval(() => {
        sendMessage(message);
    }, 10000);
});

const sendMessage = message => {
    message.ack = 'full';
    message.messageId = "My Message ID";
    console.log('Sending message: ' + message.getData());
    iotHubClient.send(deviceId, message, printResultFor('send'));
};

registry.getTwin(deviceId, (err, twin) => {
    if (err) {
        console.error(err.constructor.name + ': ' + err.message);
        return;
    }
    const patch = {
        properties: { desired: { telemetryConfig: { sendFrequency: 50000 } } }
    };

    // Send twin desired update
    twin.update(patch, err => {
        console.log('Update Twin:', patch);
        if (err) {
            console.error('Could not update twin: ' + err.constructor.name + ': ' + err.message);
            return;
        }
        console.log(twin.deviceId + '\'s twin updated successfully!');
    });
});