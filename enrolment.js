const async = require('async');
const fs = require('fs');
const path = require('path');

function enrolment(callback) {
  async.parallel({
    sa1(cb) {
      return fs.readFile(path.join(__dirname, 'data/sa1.geojson'), 'utf8', cb);
    },
    districts(cb) {
      return fs.readFile(path.join(__dirname, 'data/districts.geojson'), 'utf8', cb);
    },
  }, (error, { sa1, districts }) => {
    if (error) {
      callback(error);
    }

    const sa1Data = JSON.parse(sa1);
    const distData = JSON.parse(districts);

    const distLookup = distData.features.reduce((memo, d) => (
      d.properties ? Object.assign(memo, {
        [d.properties.DistrictId]: d.properties.District,
      }) : memo
    ), {});

    async.reduce(sa1Data.features, {}, (memo, item, cb) => {
      const {
        DistrictId: id,
        Enrolment: current,
        ProjectedEnrolment: future,
      } = item.properties;

      const intermediate = Object.assign({}, memo, {
        [id]: {
          current: memo[id] ? memo[id].current + current : current,
          future: memo[id] ? memo[id].future + future : future,
        },
      });

      process.nextTick(() => cb(null, intermediate));
    }, (err, figures) => {
      callback(null, Object.keys(figures).map(id => Object.assign({
        id,
        name: distLookup[id],
      }, figures[id])));
    });
  });
}

module.exports = enrolment;
