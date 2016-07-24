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

  const features = geodata.features.reduce((memo, feat) => {
    const id = feat.properties.SA1;
    return Object.assign(memo, {
      [id]: memo[id] ? [...memo[id], feat] : [feat],
    });
  }, {});

  async.map(proposal.districts, (district, cb) => {
    const districtFeatures = district.SA1.reduce((memo, pairs) => {
      const [start, end] = pairs;

      if (end && end - start >= 100) {
        cb(`Invalid pair: ${start} ${end}`);
      }
      const set = _.range(start, (end || start) + 1).map((x) => {
        if (!features[x]) {
          cb(`Invalid SA1: ${x}`);
        }
        return features[x];
      });
      const flatSet = _.flatten(set);

      return [...memo, ...flatSet];
    }, []);

    const geography = merge(turf.featureCollection(districtFeatures));
    const properties = {
      name: district.name,
      current: _.sumBy(districtFeatures, 'properties.Enrolment'),
      future: _.sumBy(districtFeatures, 'properties.ProjectedEnrolment'),
      area: Math.floor(turf.area(geography)),
    };

    cb(null, Object.assign(geography, { properties }));
  }, (err, data) => {
    if (err) {
      throw err;
    }
    const geojson = turf.featureCollection(data);
    fs.writeFile(path.join(__dirname, 'data/proposal.geojson'), JSON.stringify(geojson));
  });
});
