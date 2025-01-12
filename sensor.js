var mqtt = require('mqtt');

const MQTT_SERVER = "broker.emqx.io";
const MQTT_PORT = "1883";
//if your server don't have username and password let blank.
const MQTT_USER = ""; 
const MQTT_PASSWORD = "";
let tmp = 2;
let temp = 10;
// Connect MQTT
var client = mqtt.connect({
    host: MQTT_SERVER,
    port: MQTT_PORT,
    username: MQTT_USER,
    password: MQTT_PASSWORD
});

client.on('connect', function () {
    // Subscribe any topic
    console.log("MQTT Connect");
    client.subscribe('room/sw01', function (err) {
        if (err) {
            console.log(err);
        }
    });
});

// Receive Message and print on terminal
client.on('message', function (topic, message) {
    // message is Buffer
    console.log(message.toString());
});

let st = setInterval(() => {
    temp = temp + tmp;
    console.log('temp',temp)
    client.publish("room/sw02", String(temp));
}, 3000);

if(temp >= 10) {
    console.log('Over Temp')
    temp = 0;
    clearInteerval(st);
}