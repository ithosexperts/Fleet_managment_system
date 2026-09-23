import React from 'react';
import officialLogo from '../../assets/hosexperts-logo.png';

interface Props {
  variant?: 'white' | 'blue' | 'compact';
  height?: number;
  showTagline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Official Corporate HoseXperts Logo Component
 * Renders the authentic high-resolution HoseXperts brand mark and tagline ("working with the flow").
 * Supports dark mode (white monochrome inverted filter), light mode (corporate blue), and compact views.
 */
export const HoseXpertsLogo: React.FC<Props> = ({
  variant = 'blue',
  height = 36,
  className,
  style
}) => {
  const isWhite = variant === 'white';

  // 1600 x 406 aspect ratio is approximately 3.941
  const width = Math.round(height * (1600 / 406));

  if (variant === 'compact') {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: `${height}px`,
          maxWidth: `${Math.round(height * 3.4)}px`,
          overflow: 'hidden',
          ...style
        }}
        title="HoseXperts — working with the flow"
      >
        <img
          src={officialLogo}
          alt="HoseXperts"
          style={{
            height: `${height}px`,
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
            filter: isWhite ? 'brightness(0) invert(1)' : undefined
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: `${height}px`,
        ...style
      }}
      title="HoseXperts — working with the flow"
    >
      <img
        src={officialLogo}
        alt="HoseXperts — working with the flow"
        style={{
          height: `${height}px`,
          width: `${width}px`,
          objectFit: 'contain',
          display: 'block',
          filter: isWhite ? 'brightness(0) invert(1)' : undefined
        }}
      />
    </div>
  );
};
