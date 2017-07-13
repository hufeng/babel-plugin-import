const babel = require('babel-core');
const ImportResolve = require('../lib').default;

describe('new varaible', () => {
  it('test new', () => {
    const example = `
    import {Loading, noop, Star} from 'uikit'
    const l = new Loading();
    console.log(noop());
    console.log(Star);
    `;
    const { code } = babel.transform(example, {
      plugins: [
        [
          ImportResolve,
          {
            libraryName: 'uikit',
            libraryDirectory: '',
            moduleResolver: {
              Loading: {
                path: 'Loading',
                type: 'default'
              },
              noop: {
                path: 'noop',
                type: 'default'
              },
              Star: {
                path: 'star',
                type: '*'
              }
            }
          }
        ]
      ]
    });
    expect(code).toMatchSnapshot();
  });
});
