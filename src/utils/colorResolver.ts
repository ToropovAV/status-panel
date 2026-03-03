import { StatusLevel, StatusPanelOptions } from '../types';

/**
 * Maps a status level to the user-configured color for that level.
 */
export function getColorForStatus(status: StatusLevel, options: StatusPanelOptions): string {
  switch (status) {
    case 'ok':          return options.colorOK;
    case 'information': return options.colorInformation;
    case 'warning':     return options.colorWarning;
    case 'average':     return options.colorAverage;
    case 'high':        return options.colorHigh;
    case 'disaster':    return options.colorDisaster;
    case 'disable':     return options.colorDisable;
    case 'na':          return options.colorNa;
    default:            return 'transparent';
  }
}
