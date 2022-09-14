import { createServer } from 'http'
import { Server as IOServer } from 'socket.io'
import nfetch from 'node-fetch'
import fs from 'fs'

const io = new IOServer()
const server = createServer()

io.attach(server, {
  cors: {
    origin: '*'
  }
})

const stations = JSON.parse(fs.readFileSync('./api/stations.json'))

const targets = ['paris-bercy', 'berlin-zob', 'london', 'barcelona',
  'amsterdam', 'roma', 'new-york-city-midtown',
  'los-angeles-hub-station', 'san-francisco',
  'rio-de-janeiro-novo-rio', 'kiev-central-bus-station'
]
stations.filter(s => s.country.code === 'fr').forEach(s => targets.push(s.slug))

const focusedStations = stations.filter(s => targets.includes(s.slug))

let cachedRides = [];

(async () => {
  const now = Math.floor(Date.now() / 1000)
  const tomorrow = now + 86400 * 1.5
  for(const station of focusedStations) {
    nfetch(`https://global.api.flixbus.com/gis/v1/station/${station.id}/timetable/arrivals/from-timestamp/${now}/to-timestamp/${tomorrow}`)
      .then(r => r.json())
      .then(async res => {
        if(!res.rides) return
        const rides = res.rides.filter(r => r.deviation)
        for(const ride of rides) {
          let data
          nfetch(`https://global.api.flixbus.com/gis/v1/ride/${ride.ride_uuid}/tracking`)
            .then(r => r.json())
            .then(data => {
              if(data.coordinates) {
                ride.coords = [data.coordinates.longitude, data.coordinates.latitude]
                cachedRides.push(ride)
                setInterval(async () => {
                  let data
                  try {
                    data = await (await nfetch(`https://global.api.flixbus.com/gis/v1/ride/${ride.ride_uuid}/tracking`)).json()
                  } catch {}
                  if(data && data.coordinates && ride.coords[0] !== data.coordinates.longitude) {
                    ride.coords = [data.coordinates.longitude, data.coordinates.latitude]
                  }
                }, 20000)
              }
            }).catch(err => {
              console.log(err)
            })
        }
      }).catch(err => {
        console.log(err)
      })
  }
})()

setInterval(() => {
  io.emit('rides', cachedRides)
}, 5000)

io.on('connection', socket => {
  console.log(socket.id, 'connected')

  console.log(`sent ${cachedRides.length} rides to ${socket.id}`)
  socket.emit('rides', cachedRides)
  
  socket.on('disconnect', () => {
    console.log(socket.id, 'disconnected')
  })
})

server.listen(2754, () => {
  console.log('Listening on http://localhost:2754')
})