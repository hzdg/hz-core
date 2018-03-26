/* eslint-env jest */
import React from 'react';
import renderer from 'react-test-renderer';
import FadeIntoView from '../../src';

describe('FadeIntoView', () => {
  it('should render something', () => {
    const item = (
      <FadeIntoView direction="Up" activate>
        <div>Boo!</div>
      </FadeIntoView>
    );
    const renderedItem = renderer.create(item).toJSON();
    expect(renderedItem).toMatchSnapshot();
  });
});
