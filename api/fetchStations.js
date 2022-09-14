import nfetch from 'node-fetch'
import fs from 'fs'

const stations = JSON.parse(fs.readFileSync('./stations.json'))

const randomString = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

for(let i = 0; i < 100; i++) {
  nfetch(`https://global.api.flixbus.com/search/autocomplete/stations?q=${randomString(3)}&lang=fr&country_code=fr&limit=10`)
  .then(r => r.json())
    .then(res => {
      if(res.length) console.log('found', res.length, 'stations')
      res.forEach(station => {
        if(stations.find(s => s.id === station.id)) return
        stations.push(station)
        fs.writeFileSync('./stations.json', JSON.stringify(stations, null, 2))
      })
    })
}