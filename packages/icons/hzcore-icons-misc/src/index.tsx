import React from 'react';

export const FirstDownload = color => {
  return (
    <svg width="32" height="31" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0)">
        <path
          d="M16 27.41l-7.71-7.7 1.42-1.42 5.29 5.3V3h2v20.59l5.29-5.3 1.42 1.42-7.71 7.7zM28 26v3H4v-3H2v5h28v-5h-2z"
          fill={color}
        />
      </g>
      <defs>
        <clipPath id="clip0">
          <path fill="#fff" d="M0 0h32v40H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const SecondDownload = color => {
  return (
    <svg
      height="32px"
      viewBox="0 -25 400 400"
      width="32px"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill={color}>
        <path d="m390 333.6875h-380c-5.523438 0-10 4.476562-10 10s4.476562 10 10 10h380c5.523438 0 10-4.476562 10-10s-4.476562-10-10-10zm0 0" />
        <path d="m123.925781 89.285156 66.074219-57.363281v229.84375c0 5.523437 4.476562 10 10 10s10-4.476563 10-10v-229.84375l66.074219 57.363281c4.179687 3.535156 10.421875 3.058594 14.011719-1.074218 3.585937-4.132813 3.1875-10.382813-.898438-14.023438l-82.632812-71.742188c-.03125-.027343-.066407-.050781-.097657-.078124-.117187-.097657-.238281-.1875-.359375-.28125s-.257812-.199219-.390625-.292969c-.132812-.089844-.246093-.164063-.371093-.242188s-.28125-.175781-.425782-.257812c-.125-.070313-.257812-.136719-.390625-.203125-.128906-.070313-.292969-.148438-.441406-.214844s-.273437-.117188-.414063-.175781c-.136718-.054688-.296874-.113281-.453124-.164063-.15625-.054687-.285157-.09375-.429688-.136718-.164062-.046876-.324219-.085938-.484375-.125-.140625-.035157-.28125-.066407-.421875-.09375-.1875-.035157-.378906-.0625-.566406-.085938-.121094-.015625-.242188-.0351562-.363282-.046875-.628906-.0625-1.265624-.0625-1.898437 0-.121094.0117188-.238281.03125-.363281.046875-.1875.023438-.375.050781-.5625.085938-.144532.027343-.28125.058593-.421875.09375-.164063.039062-.324219.078124-.484375.125-.144532.042968-.289063.085937-.429688.136718-.144531.046875-.300781.105469-.457031.164063-.15625.0625-.277344.113281-.414063.175781-.136718.0625-.300781.136719-.441406.214844-.140625.074218-.261718.132812-.390625.203125-.128906.074219-.28125.167969-.421875.257812-.140625.089844-.25.160157-.375.242188-.121094.085937-.257812.191406-.386718.292969-.128907.097656-.242188.183593-.359376.28125-.03125.027343-.066406.050781-.101562.078124l-82.628906 71.742188c-4.085938 3.640625-4.488282 9.890625-.898438 14.023438 3.589844 4.132812 9.832032 4.609374 14.011719 1.074218zm0 0" />
      </g>
    </svg>
  );
};

export const ThirdDownload = color => {
  return (
    <svg
      ariaHidden="true"
      focusable="false"
      class="svg-inline--fa fa-github fa-w-16"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width="30"
      fill={color}
    >
      <g>
        <g>
          <g>
            <path
              d="M330.667,384h-21.333c-5.891,0-10.667,4.776-10.667,10.667v74.667h-256V42.667h256v74.667
              c0,5.891,4.776,10.667,10.667,10.667h21.333c5.891,0,10.667-4.776,10.667-10.667V42.667C341.333,19.103,322.231,0,298.667,0h-256
              C19.103,0,0,19.103,0,42.667v426.667C0,492.898,19.103,512,42.667,512h256c23.564,0,42.667-19.102,42.667-42.667v-74.667
              C341.333,388.776,336.558,384,330.667,384z"
            />
            <path
              d="M508.542,248.135l-128-117.333c-3.125-2.844-7.656-3.625-11.5-1.896c-3.875,1.698-6.375,5.531-6.375,9.76V160
              c0,3.021,1.281,5.906,3.531,7.927l74.151,66.74H138.667c-5.896,0-10.667,4.771-10.667,10.667v21.333
              c0,5.896,4.771,10.667,10.667,10.667h301.682l-74.151,66.74c-2.25,2.021-3.531,4.906-3.531,7.927v21.333
              c0,4.229,2.5,8.063,6.375,9.76c1.375,0.615,2.844,0.906,4.292,0.906c2.615,0,5.198-0.969,7.208-2.802l128-117.333
              C510.75,261.844,512,258.99,512,256S510.75,250.156,508.542,248.135z"
            />
          </g>
        </g>
      </g>
    </svg>
  );
};
