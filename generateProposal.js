const async = require('async');
const fs = require('fs');
const merge = require('turf-merge');
const path = require('path');
const turf = require('turf');
const _ = require('lodash');

async.parallel({
  proposal(cb) {
    fs.readFile(path.join(__dirname, 'data/proposal.json'), cb);
  },
  geodata(cb) {
    fs.readFile(path.join(__dirname, 'data/sa1.geojson'), cb);
  },
}, (error, results) => {
  if (error) {
    throw error;
  }

  const proposal = JSON.parse(results.proposal);
  const geodata = JSON.parse(results.geodata);

  async.map(proposal.districts, (district, cb) => {
    const list = district.SA1.reduce((memo, pairs) => {
      const [start, end] = pairs;

      if (end) {
        const set = _.range(start, end + 1);
        return [...memo, ...set];
      }
      return [...memo, start];
    }, []).map(x => x.toString());

    const filtered = geodata.features.filter(f => list.includes(f.properties.SA1));

    const geography = merge(turf.featureCollection(filtered));
    const properties = {
      name: district.name,
      current: _.sumBy(filtered, 'properties.Enrolment'),
      future: _.sumBy(filtered, 'properties.ProjectedEnrolment'),
    };

    cb(null, Object.assign(geography, { properties }));
  }, (err, data) => {
    const geojson = turf.featureCollection(data);
    fs.writeFile(path.join(__dirname, 'data/proposal.geojson'), JSON.stringify(geojson));
  });
});
