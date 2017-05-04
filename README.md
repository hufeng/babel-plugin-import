# 感谢babel-plugin-import

Modular import plugin for babel

## Example

Converts

```javascript
import { Button } from 'antd';

ReactDOM.render(<div>
  <Button>xxxx</Button>
</div>);
```

(roughly) to

```javascript
var _button = require('antd/lib/button');

ReactDOM.render(<div>
  <_button>xxxx</_button>
</div>);
```

## Usage

```bash
npm install babel-plugin-import --save-dev
```

Via `.babelrc` or babel-loader.

```js
{
  "plugins": [["import", options]]
}
```

### options

`options` can be object.

```javascript
{
  "libraryName": "antd",
  "style": true,   // or 'css'
}
```

```javascript
{
  "libraryName": "material-ui",
  "libraryDirectory": "components",  // default: lib
  "camel2DashComponentName": false,  // default: true
}
```

`options` can be an array.

For Example:

```javascript
[
  {
    "libraryName": "antd",
    "libraryDirectory": "lib",   // default: lib
    "style": true
  },
  {
    "libraryName": "antd-mobile",
    "libraryDirectory": "component",
  },
]
```

## 支持的模块名字的规则
默认的babel-plugin-import支持的模块名字的规则是
camel2DashComponentName或者camel2UnderlineComponentName

常常我们的命名风格并不完全符合这两种规则，所有我们改进支持自定义的模块命名风格,如：


```javascript
//.babelrc
{
  "plugins": [
    ["import", {
      "libraryName": "qmkit",
      "libraryDirectory": "",   // default: lib
      "resources": {
        "noop": "noop",
        "_": "common/util",
        "AsyncRouter": "async-router",
        "routeWithSubRoutes": "route-with-subroutes",
        "Api": "api",
        "QMkit": "kit",
        "QMImage": "image",
        "UploadImage": "upload/upload-image",
      }
    }]
  ]
}
```
```javascript
import {noop, _, listview, QMkit, UploadImg, Api} from 'qmkit'

```
(roughly) to

```javascript
import noop from 'qmkit/noop'
import _ from 'qmkit/common/util'
import listview from 'qmkit/list-view'
import UploadImage from 'qmkit/upload-image'
```

### 配合typescript的使用
```javascript
//tsconfig.json
{
    "compilerOptions": {
      "module": "es2015", //不能使用commonjs
      "target": "es6",
      "allowSyntheticDefaultImports": true,
      "moduleResolution": "node"
    }
  }
}
```
