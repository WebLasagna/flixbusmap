<template>
  <header>
    <h1><span>FlixBus</span> map</h1>
  </header>
  <aside v-if="selected">
    <span class="title">{{ selected.through_the_stations }}</span>
    <span class="stop" v-for="stop in selected.stops.slice(1).slice(0, -1)" :key="stop.uuid">{{ stop.name }}</span>
    <i class="material-icons close" @click="selected = null">close</i>
  </aside>
  <main ref="map"></main>
  <button class="geolocate" @click="geolocate()"><i class="material-icons" v-if="!geolocating">my_location</i><i class="material-icons" v-else>location_searching</i></button>
  <footer>
    <span>Made by <a href="https://octave.cafe" target="_blank">Octave</a></span>
  </footer>
</template>

<script>
import mapbox from 'mapbox-gl'

let map, geolocationMarkerEl

export default {
  data() {
    return {
      selected: null,
      geolocating: false
    }
  },
  mounted() {
    mapbox.accessToken = "pk.eyJ1Ijoid2VibGFzYWduYSIsImEiOiJja2p6dnF0N3gwYmtkMm9rMnR6d3h1Nmh2In0.rJKMv0HFIrHzfVKP4_hP9g"

    map = new mapbox.Map({
      container: this.$refs.map,
      style: "mapbox://styles/mapbox/dark-v10",
      center: [2.338, 48.859],
      zoom: 4.5,
      maxZoom: 17,
      maxPitch: 0,
      defaultLanguage: 'fr'
    })

    map.on('load', () => {
      this.$io.on('rides', rides => {
        /* console.log('rides', rides) */
        
        const ridesGeoJSONData = {
          type: 'FeatureCollection',
          features: rides.filter(r => r.coords).map(ride => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: ride.coords
            },
            properties: ride
          }))
        }
        if(!map.getSource('rides')) {
          map.addSource('rides', {
            type: 'geojson',
            data: ridesGeoJSONData
          })

          map.addLayer({
            id: 'rides',
            type: 'circle',
            source: 'rides',
            paint: {
              'circle-radius': 5,
              'circle-color': '#73d700'
            }
          })

          map.on('click', 'rides', e => {
            const ride = map.queryRenderedFeatures(e.point)[0].properties
            ride.stops = JSON.parse(ride.stops)
            this.selected = ride
          })
        }
        else map.getSource('rides').setData(ridesGeoJSONData)
      })
    })
  },
  methods: {
    geolocate() {
      this.geolocating = true
      const geolocatingInterval = setInterval(() => {
        this.geolocating = !this.geolocating
      }, 500)
      navigator.geolocation.getCurrentPosition(position => {
        clearInterval(geolocatingInterval)
        this.geolocating = false
        if(geolocationMarkerEl) geolocationMarkerEl.remove()
        geolocationMarkerEl = document.createElement('div')
        geolocationMarkerEl.classList.add('geolocation-marker')
        new mapbox.Marker({
          element: geolocationMarkerEl
        })
          .setLngLat([position.coords.longitude, position.coords.latitude])
          .addTo(map)
        
        map.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 16
        })
      })
    }
  }
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://api.mapbox.com/mapbox-gl-js/v2.4.1/mapbox-gl.css');

body {
  margin: 0;
  font-family: 'Inter', Arial, Helvetica, sans-serif;
  font-size: 1.1rem;
  color: #eee;
}


main {
  position: fixed;
  top: 0;
  height: 100vh;
  width: 100vw;
}

* {
  -webkit-tap-highlight-color: transparent;
}

header {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
  padding: 21px;

  h1 {
    margin: 0;

    span {
      color: #73d700;
    }
  }
}

aside {
  display: flex;
  flex-flow: column nowrap;
  position: fixed;
  bottom: 0;
  right: 0;
  min-height: 80px;
  margin: 20px;
  padding: 20px;
  border-radius: 20px;
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  backdrop-filter: saturate(180%) blur(10px);
  z-index: 2;

  .title {
    font-size: 1.6rem;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .close {
    position: fixed;
    bottom: 0;
    right: 0;
    margin: 20px;
    cursor: pointer;
  }
}

a {
  color: #ffffff;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 0.5px solid #ffffff;
  cursor: pointer;
  transition: all .3s;

  &:hover {
    color: #bdbdbd;
    border-bottom: 0.5px solid #bdbdbd;
  }
  
  &:active {
    transform: translateY(1px);
  }

  &.back {
    display: block;
    width: fit-content;
    margin: 20px auto 0;
  }
}

button {
  margin-top: 20px;
  background-color: #000;
  color: #eee;
  font-family: 'nyt-cheltenham', Arial, Helvetica, sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  outline: none;
  border-radius: 15px;
  padding: 10px 15px;
  transition: .3s;
  cursor: pointer;

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    background-color: #222222;
    color: #7a7a7a;
    cursor: default;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;
  }
}

footer {
  position: fixed;
  bottom: 0;
  padding: 20px;
}

.geolocate {
  position: fixed;
  bottom: 0;
  right: 0;
  margin: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 1.9rem;
  padding: 1px;
}

.geolocation-marker {
  width: 10px;
  height: 10px;
  background-color: #4285F4;
  border: 2px solid white;
  border-radius: 50%;
  -webkit-box-shadow: 0px 0px 0px 8px rgba(66,133,244,0.2);
  -moz-box-shadow: 0px 0px 0px 8px rgba(66,133,244,0.2);
  box-shadow: 0px 0px 0px 8px rgba(66,133,244,0.2);
}

.mapboxgl-control-container {
  display: none;
}
</style>