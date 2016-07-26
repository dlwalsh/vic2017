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

    let geography;
    try {
      geography = merge(turf.featureCollection(districtFeatures));
    } catch (e) {
      cb(`merge failed for ${district.name}: ${e.message}`);
    }

    console.log(`Processed ${district.name}`);

    const area = turf.area(geography) / 1000000;
    const current = _.sumBy(districtFeatures, 'properties.Enrolment');
    const future = _.sumBy(districtFeatures, 'properties.ProjectedEnrolment');
    const phantom = area > 100000 ? Math.floor(0.02 * area) : 0;

    const properties = _.pickBy({
      name: district.name,
      current,
      future,
      phantom,
      adjustedCurrent: phantom ? current + phantom : null,
      adjustedFuture: phantom ? future + phantom : null,
      area: Math.floor(area),
    });

    cb(null, Object.assign(geography, { properties }));
  }, (err, data) => {
    if (err) {
      throw err;
    }
    const geojson = turf.featureCollection(data);
    fs.writeFile(path.join(__dirname, 'data/proposal.geojson'), JSON.stringify(geojson));
  });
});
