import React from 'react';

export const ThickPlus = ({
  color = 'black',
  size = '50',
  horizontalSpacing = '10px',
}) => {
  return (
    <span style={{padding: horizontalSpacing}}>
      <svg x="0px" y="0px" width={size} fill={color} viewBox="0 0 492 492">
        <g>
          <g>
            <path
              d="M465.064,207.566l0.028,0H284.436V27.25c0-14.84-12.016-27.248-26.856-27.248h-23.116
          c-14.836,0-26.904,12.408-26.904,27.248v180.316H26.908c-14.832,0-26.908,12-26.908,26.844v23.248
          c0,14.832,12.072,26.78,26.908,26.78h180.656v180.968c0,14.832,12.064,26.592,26.904,26.592h23.116
          c14.84,0,26.856-11.764,26.856-26.592V284.438h180.624c14.84,0,26.936-11.952,26.936-26.78V234.41
          C492,219.566,479.904,207.566,465.064,207.566z"
            />
          </g>
        </g>
      </svg>
    </span>
  );
};

export const ThickMinus = ({
  color = 'black',
  size = '50',
  horizontalSpacing = '10px',
}) => {
  return (
    <span style={{padding: horizontalSpacing}}>
      <svg
        viewBox="0 0 500 90"
        width={size}
        x="0px"
        y="0px"
        height="50"
        fill={color}
      >
        <path d="m405.332031 43h-384c-11.773437 0-21.332031-9.558594-21.332031-21.332031 0-11.777344 9.558594-21.335938 21.332031-21.335938h384c11.777344 0 21.335938 9.558594 21.335938 21.335938 0 11.773437-9.558594 21.332031-21.335938 21.332031zm0 0" />
      </svg>
    </span>
  );
};

export const ThinPlus = ({
  color = 'black',
  size = '50',
  horizontalSpacing = '10px',
}) => {
  return (
    <span style={{padding: horizontalSpacing}}>
      <svg x="0px" y="0px" width={size} viewBox="0 0 42 42" fill={color}>
        <polygon points="42,19 23,19 23,0 19,0 19,19 0,19 0,23 19,23 19,42 23,42 23,23 42,23 " />
      </svg>
    </span>
  );
};

export const ThinMinus = ({
  color = 'black',
  size = '50',
  horizontalSpacing = '10px',
}) => {
  return (
    <span style={{padding: horizontalSpacing}}>
      <svg
        x="0px"
        y="0px"
        width={size}
        viewBox="0 0 490.656 490.656"
        fill={color}
      >
        <g>
          <g>
            <rect y="236" width="512" height="40" />
          </g>
        </g>
      </svg>
    </span>
  );
};

export const CirclePlus = ({
  color = 'black',
  size = '50',
  horizontalSpacing = '10px',
}) => {
  return (
    <span style={{padding: horizontalSpacing}}>
      <svg x="0px" y="0px" width={size} viewBox="0 0 512 512" fill={color}>
        <g>
          <g>
            <path
              d="M256,0C114.833,0,0,114.833,0,256s114.833,256,256,256s256-114.853,256-256S397.167,0,256,0z M256,472.341
c-119.275,0-216.341-97.046-216.341-216.341S136.725,39.659,256,39.659S472.341,136.705,472.341,256S375.295,472.341,256,472.341z
"
            />
          </g>
        </g>
        <g>
          <g>
            <path
              d="M355.148,234.386H275.83v-79.318c0-10.946-8.864-19.83-19.83-19.83s-19.83,8.884-19.83,19.83v79.318h-79.318
c-10.966,0-19.83,8.884-19.83,19.83s8.864,19.83,19.83,19.83h79.318v79.318c0,10.946,8.864,19.83,19.83,19.83
s19.83-8.884,19.83-19.83v-79.318h79.318c10.966,0,19.83-8.884,19.83-19.83S366.114,234.386,355.148,234.386z"
            />
          </g>
        </g>
      </svg>
    </span>
  );
};

export const CircleMinus = ({
  color = 'black',
  size = '50',
  horizontalSpacing = '10px',
}) => {
  return (
    <span style={{padding: horizontalSpacing}}>
      <svg x="0px" y="0px" width={size} viewBox="0 0 512 512" fill={color}>
        <path d="m256 512c-141.164062 0-256-114.835938-256-256s114.835938-256 256-256 256 114.835938 256 256-114.835938 256-256 256zm0-480c-123.519531 0-224 100.480469-224 224s100.480469 224 224 224 224-100.480469 224-224-100.480469-224-224-224zm0 0" />
        <path d="m368 272h-224c-8.832031 0-16-7.167969-16-16s7.167969-16 16-16h224c8.832031 0 16 7.167969 16 16s-7.167969 16-16 16zm0 0" />
      </svg>
    </span>
  );
};
