import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { Component } from 'react';

class Proposal extends Component {
  constructor(...args) {
    super(...args);
    this.state = {
      geodata: null,
      loading: true,
    };
  }

  componentDidMount() {
    fetch('/data/proposal.geojson')
      .then(response => response.json())
      .then(json => this.setState({
        geodata: json,
        loading: false,
      }));
  }

  componentDidUpdate(prevProps, prevState) {
    const { geodata } = this.state;
    if (geodata !== prevState.geodata) {
      this.loadMap(geodata);
    }
  }

  loadMap(data) {
    const map = L.map(this.mapRef, {
      center: [-28, 153.5],
      zoom: 11,
    });

    L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.geoJson(data, {
      style: {
        color: '#0066ff',
        fillOpacity: 0,
        weight: 3,
      },
      onEachFeature(feature, layer) {
        layer.bindPopup(JSON.stringify(feature.properties))
          .addEventListener('popupopen', () => layer.setStyle({ fillOpacity: 0.25 }))
          .addEventListener('popupclose', () => layer.setStyle({ fillOpacity: 0 }));
      },
    }).addTo(map);
  }

  render() {
    const { loading } = this.state;

    return (
      <div className="container">
        <div
          className="map"
          ref={(ref) => {
            this.mapRef = ref;
          }}
        >
          {loading && 'Loading...'}
        </div>
      </div>
    );
  }
}

export default Proposal;
