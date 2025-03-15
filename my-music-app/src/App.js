import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2'; // Import for charting
import Chart from 'chart.js/auto'; // Chart.js

import './styles.css'; // Import the CSS file

const MusicApp = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [selectedTag, setSelectedTag] = useState("disco"); // Default to disco tag

  const candleEffectPlugin = {
    id: "candleEffect",
    beforeDraw: (chart) => {
      const { ctx, chartArea, tooltip } = chart;
      if (!chartArea) return;
  
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        dataset.data.forEach((value, index) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          const bar = meta.data[index];
          if (!bar) return;
  
          // 🕯️ Create a waxy gradient effect
          const gradient = ctx.createLinearGradient(0, bar.y, 0, chartArea.bottom);
          gradient.addColorStop(0, "#f8e4b5"); // Melted wax (lighter)
          gradient.addColorStop(0.7, "#fbf5c8"); // Creamy wax
          gradient.addColorStop(1, "#e1c699"); // Deeper wax tone
  
          // Apply the gradient to the bar
          bar.options.backgroundColor = gradient;
  
          // 🔥 Detect if the bar is hovered
          const isHovered = tooltip?.dataPoints?.some(dp => dp.index === index);
  
          // Set flame size based on hover state
          const flameSize = isHovered ? 12 : 6; // Flame grows when hovered
  
          // 🎨 Draw the flame
          ctx.beginPath();
          ctx.arc(bar.x, bar.y - 8, flameSize, 0, Math.PI * 2); // Adjust position
          ctx.fillStyle = "#ff7b00"; // Fiery orange
          ctx.fill();
        });
      });
    },
  };
  
  
  

  // Default API call to fetch top tracks based on selected tag
  useEffect(() => {
    const fetchTopTracks = async (tag = "disco") => {
      setError(null); // Reset error before fetching
      try {
        const response = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${tag}&api_key=861a1e87e8b6e6acb1337ea583ddccd1&format=json`
        );
        const data = await response.json();

        // Check if there are no tracks or an error message in the response
        if (data.error || !data.tracks || !data.tracks.track.length) {
          setError(`No tracks found for the tag "${tag}". Please try another tag.`);
          setTopTracks([]); // Clear any existing top tracks
        } else {
          // Fetch additional track info using track.getInfo for each track
          const detailedTracks = await Promise.all(
            data.tracks.track.map(async (track) => {
              try {
                const trackInfoResponse = await fetch(
                  `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=861a1e87e8b6e6acb1337ea583ddccd1&format=json&artist=${track.artist.name}&track=${track.name}`
                );
                const trackInfoData = await trackInfoResponse.json();

                // Return the track info with the playcount
                return {
                  name: track.name,
                  playcount: trackInfoData.track ? trackInfoData.track.playcount : 0, // Fallback to 0 if playcount is missing
                  artist: track.artist.name,
                };
              } catch (trackError) {
                console.error("Error fetching track details:", trackError);
                return {
                  name: track.name,
                  playcount: 0, // Fallback to 0 if there's an error fetching track details
                  artist: track.artist.name,
                };
              }
            })
          );
          setTopTracks(detailedTracks.slice(0, 10)); // Take the top 10 tracks with playcounts
        }
      } catch (error) {
        console.error("Error fetching top tracks:", error);
        setError("Something went wrong with fetching the data!");
      }
    };

    fetchTopTracks(selectedTag); // Fetch tracks for selected tag on first load
  }, [selectedTag]);

  // Handle tag button clicks
  const handleTagClick = (tag) => {
    setSelectedTag(tag); // Update selected tag when a button is clicked
  };

  // Handle search for a tag
  const handleSearch = async () => {
    if (!searchTerm) return;
    setError(null); // Reset error before fetching

    try {
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${searchTerm}&api_key=861a1e87e8b6e6acb1337ea583ddccd1&format=json`
      );
      const data = await response.json();

      // Check if there are no tracks or an error message in the response
      if (data.error || !data.tracks || !data.tracks.track.length) {
        setError(`Invalid or empty tag "${searchTerm}". Please try another tag.`);
        setTopTracks([]); // Clear top tracks on error
      } else {
        // Fetch additional track info using track.getInfo for each track
        const detailedTracks = await Promise.all(
          data.tracks.track.map(async (track) => {
            try {
              const trackInfoResponse = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=861a1e87e8b6e6acb1337ea583ddccd1&format=json&artist=${track.artist.name}&track=${track.name}`
              );
              const trackInfoData = await trackInfoResponse.json();

              // Return the track info with the playcount
              return {
                name: track.name,
                playcount: trackInfoData.track ? trackInfoData.track.playcount : 0, // Fallback to 0 if playcount is missing
                artist: track.artist.name,
              };
            } catch (trackError) {
              console.error("Error fetching track details:", trackError);
              return {
                name: track.name,
                playcount: 0, // Fallback to 0 if there's an error fetching track details
                artist: track.artist.name,
              };
            }
          })
        );
        setTopTracks(detailedTracks.slice(0, 10)); // Take the top 10 tracks with playcounts
      }
    } catch (error) {
      console.error("Error fetching search data:", error);
      setError("Something went wrong with fetching the tag data!");
    }
  };

  // Bar chart data for top tracks visualization
  // const chartData = {
  //   labels: topTracks.map((track, index) => `${index + 1}. ${track.name}`), // Display track rank + name
  //   datasets: [
  //     {
  //       label: "Track Popularity",
  //       data: topTracks.map((track) => track.playcount),
  //       backgroundColor: 'rgba(75, 192, 192, 0.2)',
  //       borderColor: 'rgba(75, 192, 192, 1)',
  //       borderWidth: 1,
  //     },
  //   ],
  // };
  const chartData = {
    labels: topTracks.map((track, index) => `${index + 1}. ${track.name}`),
    datasets: [
      {
        label: "Track Popularity",
        data: topTracks.map((track) => track.playcount),
        backgroundColor: topTracks.map(() => '#fbf5c8'), // Wax color (Cream Candle Yellow)
        borderColor: '#bc8c64', // Brownish border (Candle outline)
        borderWidth: 2,
        borderRadius: { topLeft: 10, topRight: 10 }, // Rounds the top like a candle
        hoverBackgroundColor: topTracks.map(() => '#a32c05'), // Fiery Orange on hover
      },
    ],
  };
  
  

  return (
    <div className="container">
      <header className="header">
      </header>
      <h1>Music</h1>

      {/* Tag Buttons */}
      <div className="buttons-container">
        <button onClick={() => handleTagClick("disco")}>Disco</button>
        <button onClick={() => handleTagClick("pop")}>Pop</button>
        <button onClick={() => handleTagClick("jazz")}>Jazz</button>
        {/* Add more tags as needed */}
      </div>

      {/* Search Input and Button */}
      <div className="input-container">
        <input
          type="text"
          placeholder="Search for a Tag"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch}>🔍</button>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-popup">
          {error}
        </div>
      )}

      {/* Display Top Tracks for tag search */}
      <div className="top-tracks-container">
        <h2>Top Tracks for {selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)}</h2> {/* Display selected tag */}
        <ul className="top-tracks-list">
          {topTracks.map((track, index) => (
            <li key={track.name}>
              <span>{index + 1}. {track.name} by {track.artist}</span>
              <span>{track.playcount ? track.playcount : "No playcount available"} plays</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Chart for Visualization */}
      <div className="chart-container">
        <h3>Track Popularity (Candle Chart)</h3>
        <Bar 
          data={chartData} 
          options={{ 
            responsive: true,
            hover: { mode: 'nearest', intersect: true } // Ensures hover detection
          }} 
          plugins={[candleEffectPlugin]} // ✅ Plugin with growing flame effect
        />
      </div>
    </div>
  );
};

export default MusicApp;
