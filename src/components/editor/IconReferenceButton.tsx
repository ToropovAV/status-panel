import React from 'react';
import { Button } from '@grafana/ui';

export const IconReferenceButton: React.FC = () => (
  <a
    href="https://developers.grafana.com/ui/latest/index.html?path=/story/iconography-icon--icons-overview"
    target="_blank"
    rel="noopener noreferrer"
    style={{ textDecoration: 'none' }}
  >
    <Button variant="secondary" size="sm" icon="external-link-alt" fill="outline">
      Icon reference
    </Button>
  </a>
);
