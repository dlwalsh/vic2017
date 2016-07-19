import React, { Component, PropTypes } from 'react';
import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';

const propTypes = {
  clearEntries: PropTypes.func.isRequired,
  entries: PropTypes.array.isRequired,
};

class Selections extends Component {
  constructor(...args) {
    super(...args);
    this.state = {
      data: {},
    };
  }

  componentDidMount() {
    fetch('/data/sa1.geojson')
      .then(response => response.json())
      .then(json => {
        this.setState({
          data: json.features.reduce(
            (memo, feat) => Object.assign(memo, {
              [feat.properties.SA1]: {
                current: feat.properties.Enrolment,
                district: feat.properties.DistrictId,
                projected: feat.properties.ProjectedEnrolment,
              },
            })
          , {}),
        });
      });
  }

  render() {
    const { clearEntries, entries } = this.props;
    const { data } = this.state;

    const groupedEntries = groupBy(entries, e => data[e] && data[e].district);
    const totalCurrent = sumBy(entries, e => data[e] && data[e].current || 0);
    const totalProjected = sumBy(entries, e => data[e] && data[e].projected || 0);

    return (
      <div className="selections">
        <table>
          <thead>
            <tr>
              <th>SA1</th>
              <th>Current</th>
              <th>Projected</th>
            </tr>
          </thead>
          <tfoot>
            <tr>
              <td>Total</td>
              <td style={{ textAlign: 'right' }}>
                {totalCurrent}
              </td>
              <td style={{ textAlign: 'right' }}>
                {totalProjected}
              </td>
            </tr>
          </tfoot>
          {Object.keys(groupedEntries).map(group => (
            <tbody key={group}>
              <tr>
                <th colSpan="3">District {group}</th>
              </tr>
              {groupedEntries[group].map(entry => (
                <tr key={entry}>
                  <td>{entry}</td>
                  <td style={{ textAlign: 'right' }}>
                    {data[entry] && data[entry].current}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {data[entry] && data[entry].projected}
                  </td>
                </tr>
              ))}
              <tr>
                <td>Subtotal</td>
                <td style={{ textAlign: 'right' }}>
                  {sumBy(groupedEntries[group], e => data[e] && data[e].current || 0)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {sumBy(groupedEntries[group], e => data[e] && data[e].projected || 0)}
                </td>
              </tr>
            </tbody>
          ))}
        </table>
        <div style={{ display: 'none', position: 'absolute', top: '5px', right: '10px' }}>
          <button type="button" onClick={clearEntries}>
            Clear all
          </button>
        </div>
      </div>
    );
  }
}

Selections.propTypes = propTypes;

export default Selections;
