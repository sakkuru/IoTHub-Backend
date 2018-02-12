
# IoT Hub Backend app

* Receive message from a device
* Receive Device Twin reported properties
  * You need to create a route and to set the Data Source equal to twinChangeEvents
* Send message to the device constantly
* Send Device twin desired properties
* [Device side sample code](https://github.com/sakkuru/IoTHub-Device)

## How to run

```
npm install
DeviceId="{Your device's ID}" DeviceConnectionString="{Your device's connection string}" npm start
```
