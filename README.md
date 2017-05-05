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
npm install babel-plugin-import-resolve --save-dev
```

Via `.babelrc` or babel-loader.

```js
{
  "plugins": [["import-resolve", options]]
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
    ["import-resolve", {
      "libraryName": "qmkit",
      "libraryDirectory": "",   // default: lib
      "libraryName": "qmkit",
        "libraryDirectory": "",
        "moduleResolver": {
          "noop": {
            "path": "noop",
            "type": "default"
          },
          "_": {
            "path": "common/util",
            "type": "*"
          },
          "AsyncRouter": {
            "path": "async-router",
            "type": "default"
          },
          "routeWithSubRoutes": {
            "path": "route-with-subroutes",
            "type": "default"
          },
          "Api": {
            "path": "api",
            "type": "*"
          },
          "Alert": {
            "path": "modal",
            "type": "Alert"
          }
        }
      }
    }]
  ]
}
```
```javascript
import {noop, _, AsyncRouter, Api, Alert} from 'qmkit'

```
(roughly) to

```javascript
import noop from 'qmkit/noop'
import * as _ from 'qmkit/common/util'
import AsyncRouter from 'qmkit/async-router'
import * as Api from 'qmkit/api'
import {Alert} from 'qmkit/modal'
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


### screencast
![screencast](https://raw.githubusercontent.com/hufeng/babel-plugin-import/master/images/screencast.png)
