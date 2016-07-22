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

  const features = geodata.features.reduce((memo, f) => {
    const id = f.properties.SA1;
    const feature = memo[id] ? merge(turf.featureCollection([memo[id], f])) : f;
    return Object.assign(memo, {
      [id]: feature,
    });
  }, {});

  async.map(proposal.districts, (district, cb) => {
    const districtFeatures = district.SA1.reduce((memo, pairs) => {
      const [start, end] = pairs;

      if (end) {
        const set = _.range(start, end + 1).map(x => features[x]);
        return [...memo, ...set];
      }
      return [...memo, features[start]];
    }, []);

    const geography = merge(turf.featureCollection(districtFeatures));
    const properties = {
      name: district.name,
      current: _.sumBy(districtFeatures, 'properties.Enrolment'),
      future: _.sumBy(districtFeatures, 'properties.ProjectedEnrolment'),
    };

    cb(null, Object.assign(geography, { properties }));
  }, (err, data) => {
    const geojson = turf.featureCollection(data);
    fs.writeFile(path.join(__dirname, 'data/proposal.geojson'), JSON.stringify(geojson));
  });
});
