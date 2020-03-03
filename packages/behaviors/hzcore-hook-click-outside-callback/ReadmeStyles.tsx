import styled from 'styled-components';
import miniSvg from 'mini-svg-data-uri';

const colors = {
  primary: '#f38230',
  bg_alt1: '#eee',
};

const infoIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16"><path fill="" fill-rule="evenodd" d="M6.3 5.69a.942.942 0 01-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 01-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"/></svg>`;
const closeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16"><path fill="" fill-rule="evenodd" d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48L7.48 8z"/></svg>`;

const svgUrl = (svg: string, fill: string = '#000'): string => {
  const coloredSvg = svg.replace('fill=""', `fill="${fill}"`);
  const url = miniSvg(coloredSvg);
  console.log(url);
  return `url("${url}")`;
};

export default styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  .clickBox {
    margin: 1.2em;
    background: ${colors.bg_alt1};
    padding: 0.8em 1.2em;
    border: dashed 2px ${colors.primary};
  }

  .stage {
    min-height: 20em;
    width: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.2em;
  }

  .info-popup {
    position: absolute;
    top: 20%;
    right: 33%;
    left: 33%;
    min-height: 33%;

    display: flex;
    flex-direction: column;
    justify-items: flex-start;
    align-items: stretch;

    z-index: 10;
  }

  .info-popup-top {
    background-color: ${colors.primary};
    border-radius: 0.5em 0.5em 0 0;
    width: 100%;
    height: 1.5em;
    position: relative;
    margin-bottom: -2px;
  }

  .info-popup-title {
    color: #fff;
    text-align: center;
    font-weight: bold;
  }

  .info-popup-close {
    background-color: #fff;
    border-radius: 3em;
    position: absolute;
    right: 0.3em;
    top: 0.3em;
    height: 1em;
    width: 1em;
    &:hover {
      transform: scale(1.2);
    }
    &::after {
      content: 'close';
      color: transparent;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-image: ${svgUrl(closeIconSvg, colors.primary)};
      background-repeat: no-repeat;
      background-position: center;
      overflow: hidden;
    }
  }

  .off {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='16' viewBox='0 0 12 16'%3E%3Cpath fill='%23999' fill-rule='evenodd' d='M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48L7.48 8z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
  }

  .info-popup-content {
    padding: 0.5em;
    border: 2px solid ${colors.primary};
    background-color: ${colors.bg_alt1};
    background-image: ${svgUrl(infoIconSvg, '#fff')};
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    border-radius: 0 0 0.5em 0.5em;
    p,
    ul {
      margin: 0.5em 0;
    }
  }
`;
