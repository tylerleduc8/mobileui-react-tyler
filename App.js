import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { scaleTime, scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { extent, max, min } from 'd3-array';
import axios from 'axios';

const TelemetryPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const screenWidth = Dimensions.get('window').width;
  const graphHeight = 200;
  const graphWidth = screenWidth * 0.9;
  const host = 'https://api.zevx.com';
  const username = 'tleduc';

  useEffect(() => {
    const signInAndGetTelemetryData = async () => {
      setLoading(true);
      try {
        // Authentication step
        const password = 'password';  // Replace this with secure password input in production
        const authResponse = await axios.post(`${host}/auth/signin`, { username, password });
        const authToken = `Bearer ${authResponse.data.token}`;

        // Data fetching step
        const apiUrl = `${host}/v1/trip/telemetry?clientId=43`;
        const requestPayload = {
          signals: ["HUD_HVBtPwr"],
          vehicleId: 75,
          startTime: "2024-05-03T10:07:44-04:00",
          endTime: "2024-05-03T20:17:47-04:00",
        };

        const response = await axios.post(apiUrl, requestPayload, {
          headers: {
            Authorization: authToken,
            'Content-Type': 'application/json',
          },
        });

        const streams = response.data.items[0].streams;
        const parsedData = streams.flatMap(stream => {
          const startTime = new Date(stream.startTime);
          return stream.data.split(',').map((value, index) => ({
            time: new Date(startTime.getTime() + index * 1000),
            value: value ? +value : null
          })).filter(point => point.value !== null);
        });

        setData(parsedData);
      } catch (error) {
        console.error('Error fetching telemetry data:', error);
      } finally {
        setLoading(false);
      }
    };

    signInAndGetTelemetryData();
  }, []);

  const xScale = scaleTime()
    .domain(extent(data, d => d.time))
    .range([0, graphWidth]);

  const yScale = scaleLinear()
    .domain([min(data, d => d.value), max(data, d => d.value)]) // Updated to include negative values
    .range([graphHeight, 0]);

  const telemetryLine = line()
    .x(d => xScale(d.time))
    .y(d => yScale(d.value))
    .defined(d => d.value !== null); // Ensure that line is not drawn for null values

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Telemetry Data</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Svg width={graphWidth} height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`}>
          <Path d={telemetryLine(data)} stroke="blue" fill="none" strokeWidth={2} />
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default TelemetryPage;
