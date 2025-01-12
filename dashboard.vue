  <template>
    <v-container style="background-color: rgb(156, 255, 255);" fluid>
      <v-row>
        <!-- Control Section -->
        <v-col cols="12" md="3" style="padding-right: 50px;"> 
          <v-row>
            <v-col>
              <div class="control-container">
                <h1>Control Speaker</h1>
                <v-card-actions>
                  <v-switch
                    v-model="isSpeakerOn"
                    :label="isSpeakerOn ? 'Turn On' : 'Turn Off'"
                    :color="isSpeakerOn ? 'blue' : 'blue'"
                    @change="handleSpeakerToggle"
                  ></v-switch>
                </v-card-actions> 
                <v-card-actions>
                  <v-switch
                    style="margin-top: -50px;"
                    v-model="isAutoMode"
                    :label="isAutoMode ? 'Enable Auto Mode' : 'Disable Auto Mode'"
                    :color="isAutoMode ? 'blue' : 'blue'"
                    @change="handleAutoModeToggle"
                  ></v-switch>
                </v-card-actions>

                <h1> Status </h1><br>
                <v-row>
                  <v-col cols="12">
                    <v-chip :color="isSpeakerOn ? 'green' : 'red'" label>
                      {{ isSpeakerOn ? 'Speaker On' : 'Speaker Off' }}
                    </v-chip>
                  </v-col>
                  <v-col cols="12">
                    <v-chip :color="isAutoMode ? 'green' : 'red'" label>
                      {{ isAutoMode ? 'Auto Mode On' : 'Auto Mode Off' }}
                    </v-chip>
                  </v-col>
                </v-row>
              </div>
            </v-col>
          </v-row>
        </v-col>

        <!-- Detection Data and Statistics Section -->
        <v-col cols="12" md="9" style="margin-top: 50px;"> 
          <v-row>
            <v-col>
              <v-card-title>
                <h2 style="text-align: center;">Statistics</h2><br>
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col>
                    <v-card class="pa-4" color="blue-grey lighten-2">
                      <v-card-title>Total Detections</v-card-title>
                      <v-card-text class="display-1">{{ totalDetections }}</v-card-text>
                    </v-card>
                  </v-col>
                  <v-col>
                    <v-card class="pa-4" color="green lighten-2">
                      <v-card-title>Last Detected</v-card-title>
                      <v-card-text>{{ lastDetected }}</v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-card-title>
                <h2 style="text-align: center;">Detection Data</h2><br>
              </v-card-title>
              <v-data-table
                :headers="headers"
                :items="detections"
                class="elevation-1"
                :items-per-page="5"
                :pagination.sync="pagination"
              >
                <template v-slot:no-data>
                  <v-alert type="info" :value="true">
                    No data available
                  </v-alert>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </template>


  <script>
  import mqtt from 'mqtt';

  export default {
    data() {
      return {
        detections: [],
        headers: [
          { text: 'Order', value: 'id' },
          { text: 'Date and Time', value: 'detected_time' },
          { text: 'Detected', value: 'detected' },
        ],
        isSpeakerOn: false,
        isAutoMode: false,
        client: null,
        pagination: { sortDesc: true },
        totalDetections: 0,
        lastDetected: 'N/A',
      };
    },
    created() {
      this.connectToMQTT();
    },
    methods: {
      connectToMQTT() {
        this.client = mqtt.connect('mqtt://broker.emqx.io:1883');

        this.client.on('connect', () => {
          console.log('Connected to MQTT broker');
          this.client.subscribe('testtopic/project');
        });

        this.client.on('message', (topic, message) => {
          const data = JSON.parse(message.toString());
          this.addDetection(data);

          // ถ้าอยู่ในโหมดอัตโนมัติและตรวจพบการเคลื่อนไหว
          if (this.isAutoMode && data.detected) {
            this.toggleSpeaker(true); // เปิดลำโพง
          }
        });
      },
      addDetection(data) {
        const newDetection = {
          id: this.detections.length + 1,
          detected_time: new Date().toLocaleString(),
          detected: data.detected,
        };
        this.detections.push(newDetection);
        this.updateStatistics(newDetection);
        this.saveDetectionToDatabase(data);
      },
      updateStatistics(detection) {
        this.totalDetections = this.detections.length;
        this.lastDetected = detection.detected_time;
      },
      saveDetectionToDatabase(data) {
        fetch('http://localhost/save_detection.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            detected_time: new Date().toISOString(),
            detected: data.detected,
          }),
        })
          .then((response) => response.json())
          .then((result) => {
            console.log('Data saved to database:', result);
          });
      },
      handleSpeakerToggle() {
        const command = this.isSpeakerOn ? '1' : '0';
        this.client.publish('your_speaker_control_topic', command);
        console.log(`Speaker turned ${this.isSpeakerOn ? 'ON' : 'OFF'}`);
      },
      handleAutoModeToggle() {
        if (this.isSpeakerOn) {
          this.isAutoMode = false; // Prevent toggling when Speaker is active
          return;
        }
        console.log(`Auto mode ${this.isAutoMode ? 'enabled' : 'disabled'}`);
      },
    },
  };
  </script>

  <style scoped>

  .control-container {
    background-color: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 2px solid #797979; /* เพิ่มเส้นกรอบ */
    height: 710px;
  }

  .headline {
    font-weight: bold;
    font-size: 2rem;
  }

  .v-btn {
    font-weight: bold;
    text-transform: none;
    margin-right: 10px;
  }
  </style>
