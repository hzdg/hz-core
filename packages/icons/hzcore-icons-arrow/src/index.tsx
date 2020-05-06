import React from 'react';
import {useState} from 'react';

export const ThinLeftArrow = ({
  color,
  size = '35',
  hoverColor,
  horizontalSpacing,
}) => {
  const [isShown, setIsShown] = useState(false);
  const hColor = hoverColor === undefined ? color : hoverColor;
  return (
    <span style={{padding: horizontalSpacing}}>
      <svg
        x="0px"
        y="0px"
        width={size}
        fill={isShown ? hColor : color}
        viewBox="0 0 477.175 477.175"
        onMouseEnter={() => setIsShown(true)}
        onMouseLeave={() => setIsShown(false)}
      >
        <g>
          <path
            d="M145.188,238.575l215.5-215.5c5.3-5.3,5.3-13.8,0-19.1s-13.8-5.3-19.1,0l-225.1,225.1c-5.3,5.3-5.3,13.8,0,19.1l225.1,225
    c2.6,2.6,6.1,4,9.5,4s6.9-1.3,9.5-4c5.3-5.3,5.3-13.8,0-19.1L145.188,238.575z"
          />
        </g>
      </svg>
    </span>
  );
};

export const ThinRightArrow = ({
  color,
  size = '35',
  hoverColor,
  horizontalSpacing,
}) => {
  const [isShown, setIsShown] = useState(false);
  const hColor = hoverColor === undefined ? color : hoverColor;
  return (
    <span style={{padding: horizontalSpacing}}>
      <svg
        x="0px"
        y="0px"
        width={size}
        fill={isShown ? hColor : color}
        viewBox="0 0 477.175 477.175"
        onMouseEnter={() => setIsShown(true)}
        onMouseLeave={() => setIsShown(false)}
      >
        <g>
          <path
            d="M360.731,229.075l-225.1-225.1c-5.3-5.3-13.8-5.3-19.1,0s-5.3,13.8,0,19.1l215.5,215.5l-215.5,215.5
        c-5.3,5.3-5.3,13.8,0,19.1c2.6,2.6,6.1,4,9.5,4c3.4,0,6.9-1.3,9.5-4l225.1-225.1C365.931,242.875,365.931,234.275,360.731,229.075z
        "
          />
        </g>
      </svg>
    </span>
  );
};

export const ThinUpArrow = ({
  color,
  size = '35',
  hoverColor,
  horizontalSpacing,
}) => {
  const [isShown, setIsShown] = useState(false);
  const hColor = hoverColor === undefined ? color : hoverColor;
  return (
    <span style={{padding: horizontalSpacing}}>
      <svg
        x="0px"
        y="0px"
        width={size}
        viewBox="0 0 490.656 490.656"
        fill={isShown ? hColor : color}
        onMouseEnter={() => setIsShown(true)}
        onMouseLeave={() => setIsShown(false)}
      >
        <path
          d="M487.536,355.12L252.869,120.453c-4.16-4.16-10.923-4.16-15.083,      0L3.12,355.12c-4.16,4.16-4.16,10.923,0,15.083
      c4.16,4.16,10.923,4.16,15.083,0l227.115-227.136l227.115,227.136c2.091,2.069,4.821,3.115,7.552,3.115s5.461-1.045,7.552-3.115
      C491.696,366.043,491.696,359.28,487.536,355.12z"
        />
      </svg>
    </span>
  );
};

export const ThinDownArrow = ({
  color,
  size = '35',
  hoverColor,
  horizontalSpacing,
}) => {
  const [isShown, setIsShown] = useState(false);
  const hColor = hoverColor === undefined ? color : hoverColor;
  return (
    <span style={{padding: horizontalSpacing}}>
      <svg
        x="0px"
        y="0px"
        width={size}
        viewBox="0 0 490.656 490.656"
        fill={isShown ? hColor : color}
        onMouseEnter={() => setIsShown(true)}
        onMouseLeave={() => setIsShown(false)}
      >
        <g>
          <g>
            <path
              d="M487.536,120.445c-4.16-4.16-10.923-4.16-15.083,0L245.339,347.581L18.203,120.467c-4.16-4.16-10.923-4.16-15.083,0
        c-4.16,4.16-4.16,10.923,0,15.083l234.667,234.667c2.091,2.069,4.821,3.115,7.552,3.115s5.461-1.045,7.531-3.136l234.667-234.667
        C491.696,131.368,491.696,124.605,487.536,120.445z"
            />
          </g>
        </g>
      </svg>
    </span>
  );
};

export const LeftArrow = ({
  color,
  link,
  horizontalSpacing,
  size = '35',
  hoverColor,
}) => {
  const [isShown, setIsShown] = useState(false);
  const hColor = hoverColor === undefined ? color : hoverColor;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer">
      <span style={{padding: horizontalSpacing}}>
        <svg
          x="0px"
          y="0px"
          width={size}
          viewBox="0 0 512 395"
          fill={isShown ? hColor : color}
          onMouseEnter={() => setIsShown(true)}
          onMouseLeave={() => setIsShown(false)}
        >
          <g>
            <g>
              <path
                d="M492,236H68.442l70.164-69.824c7.829-7.792,7.859-20.455,0.067-28.284c-7.792-7.83-20.456-7.859-28.285-0.068
          l-104.504,104c-0.007,0.006-0.012,0.013-0.018,0.019c-7.809,7.792-7.834,20.496-0.002,28.314c0.007,0.006,0.012,0.013,0.018,0.019
          l104.504,104c7.828,7.79,20.492,7.763,28.285-0.068c7.792-7.829,7.762-20.492-0.067-28.284L68.442,276H492
          c11.046,0,20-8.954,20-20C512,244.954,503.046,236,492,236z"
              />
            </g>
          </g>
        </svg>
      </span>
    </a>
  );
};

export const RightArrow = ({
  color,
  link,
  horizontalSpacing,
  size = '35',
  hoverColor,
}) => {
  const [isShown, setIsShown] = useState(false);
  const hColor = hoverColor === undefined ? color : hoverColor;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer">
      <span style={{padding: horizontalSpacing}}>
        <svg
          x="0px"
          y="0px"
          width={size}
          viewBox="0 0 512 395"
          fill={isShown ? hColor : color}
          onMouseEnter={() => setIsShown(true)}
          onMouseLeave={() => setIsShown(false)}
        >
          <g>
            <g>
              <path
                d="M506.134,241.843c-0.006-0.006-0.011-0.013-0.018-0.019l-104.504-104c-7.829-7.791-20.492-7.762-28.285,0.068
          c-7.792,7.829-7.762,20.492,0.067,28.284L443.558,236H20c-11.046,0-20,8.954-20,20c0,11.046,8.954,20,20,20h423.557
          l-70.162,69.824c-7.829,7.792-7.859,20.455-0.067,28.284c7.793,7.831,20.457,7.858,28.285,0.068l104.504-104
          c0.006-0.006,0.011-0.013,0.018-0.019C513.968,262.339,513.943,249.635,506.134,241.843z"
              />
            </g>
          </g>
        </svg>
      </span>
    </a>
  );
};
