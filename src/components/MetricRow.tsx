import React from 'react';
import { Tooltip } from '@grafana/ui';
import { DisplayDataItem, StatusLevel } from '../types';

interface Props {
  item: DisplayDataItem;
  inline: boolean;
  colorizeMetrics: boolean;
  getColor: (status: StatusLevel) => string;
  textColor: string;
}

export const MetricRow: React.FC<Props> = ({
  item,
  inline,
  colorizeMetrics,
  getColor,
  textColor,
}) => {
  // Build badge style if colorizeMetrics is on and metric has a non-ok status
  const badgeColor =
    colorizeMetrics && item.status && item.status !== 'ok'
      ? getColor(item.status)
      : null;

  const badgeStyle: React.CSSProperties = badgeColor
    ? {
        backgroundColor: badgeColor,
        color: textColor,
        borderRadius: '3px',
        padding: '0 4px',
        display: 'inline-block',
      }
    : {
        color: textColor,
      };

  const content = item.url ? (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ ...badgeStyle, textDecoration: 'underline' }}
    >
      {item.text}
    </a>
  ) : (
    <span style={badgeStyle}>{item.text}</span>
  );

  const wrapped = item.tooltip ? (
    <Tooltip content={<div style={{ whiteSpace: 'pre-wrap' }}>{item.tooltip}</div>}>
      <span style={{ cursor: 'help' }}>{content}</span>
    </Tooltip>
  ) : (
    content
  );

  if (inline) {
    return <span style={{ marginRight: 4 }}>{wrapped}</span>;
  }

  return <div>{wrapped}</div>;
};
