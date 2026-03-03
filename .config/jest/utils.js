const nodeModulesToTransform = (moduleNames) =>
  `node_modules\/(?!(${moduleNames.join('|')})\/)`; 

const grafanaESModules = [
  'd3', 'd3-color', 'd3-force', 'd3-interpolate',
  'd3-scale-chromatic', 'ol', 'react-colorful', 'uuid',
];

module.exports = { nodeModulesToTransform, grafanaESModules };
