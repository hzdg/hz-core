import React from 'react';
import {ScaleOrdinal} from 'd3-scale';
import {LegendOrdinal, LegendItem, LegendLabel} from '@vx/legend';

export interface LegendProps {
  colorScale: ScaleOrdinal<string, string>;
}

const formatLabel = (label: string): string => `${label.split('-').shift()}`;

export default function Legend({colorScale}: LegendProps): JSX.Element {
  return (
    <LegendOrdinal scale={colorScale} labelFormat={formatLabel}>
      {labels => {
        return (
          <div style={{display: 'flex', flexDirection: 'row'}}>
            {labels.map((label, i) => {
              const size = 15;
              return (
                <LegendItem key={`legend-${i}`} margin={'0 5px'}>
                  <svg width={size} height={size}>
                    <rect fill={label.value} width={size} height={size} />
                  </svg>
                  <LegendLabel align={'left'} margin={'0 0 0 4px'}>
                    {label.text}
                  </LegendLabel>
                </LegendItem>
              );
            })}
          </div>
        );
      }}
    </LegendOrdinal>
  );
}
