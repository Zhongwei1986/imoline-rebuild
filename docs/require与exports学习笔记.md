## 1 module、module.exports、exports
### 1.1 module
Node内部提供一个Module构造函数，所有模块都是这个构造函数的实例
```javascript
function Module(id, parent) {
  this.id = id;
  this.parent = parent;
  this.exports = {};
  //....
}
```
每个模块内部都有一个module对象，代表当前模块，该对象的主要属性：

```javascript
module.id  模块的识别符，通常是带有绝对路径的模块文件名。
module.filename  模块的文件名，带有绝对路径。
module.loaded  返回一个布尔值，表示模块是否已经完成加载。
module.parent  返回一个对象，表示调用该模块的模块。
module.children  返回一个数组，表示该模块要用到的其他模块。
module.exports  表示模块对外输出的值。
```
### 1.2 module.exports 
根据上一节的分析，module.exports表示当前模块对外输出的接口，其它文件使用require加载此模块时，相当于读取module.exports这个属性

### 1.3 exports
为了方便，Node为每个模块提供一个exports变量，指向module.exports，相当于在每个模块顶部使用

```javascript
var exports = module.exports
```

给exports添加方法就相当于给module.exports添加方法，如
```javascript
exports.area = function (r) {
	return Math.PI*r*r;
};
```

不能直接将exports指向一个值，这样会断开它与module.exports的关系，也就是exports不再表示当前模块的对外接口了
```javascript
//错误用法，相当于给exports重新赋值
exports = function(x){console.log(x)};
```
下面也是错误用法

```javascript
exports.hello = function() {
  return 'hello';
};

module.exports = 'Hello world';
```
因为module.exports被重新赋值指向字符串，hello函数将无法在外部调用

### 1.4 总结
给模块输出接口添加方法函数时可以使用exports，如果无法区分exports和module.exports，就一直使用module.exports


## 2 require命令

### 2.1 基本用法
require命令的基本功能是，读入并执行一个JavaScript文件，然后返回该模块的exports对象。如果没有发现指定模块，会报错。
### 2.2 加载规则
require命令用于加载文件，后缀名默认为.js。
```javascript
var foo = require('foo');
//  等同于
var foo = require('foo.js');
```
根据参数的不同格式，require命令去不同路径寻找模块文件。

（1）如果参数字符串以“/”开头，则表示加载的是一个位于绝对路径的模块文件。比如，require('/home/marco/foo.js')将加载/home/marco/foo.js。

（2）如果参数字符串以“./”开头，则表示加载的是一个位于相对路径（跟当前执行脚本的位置相比）的模块文件。比如，require('./circle')将加载当前脚本同一目录的circle.js。

（3）如果参数字符串不以“./“或”/“开头，则表示加载的是一个默认提供的核心模块（位于Node的系统安装目录中），或者一个位于各级node_modules目录的已安装模块（全局安装或局部安装）。

（4）如果参数字符串不以“./“或”/“开头，而且是一个路径，比如require('example-module/path/to/file')，则将先找到example-module的位置，然后再以它为参数，找到后续路径。

（5）如果指定的模块文件没有发现，Node会尝试为文件名添加.js、.json、.node后，再去搜索。.js件会以文本格式的JavaScript脚本文件解析，.json文件会以JSON格式的文本文件解析，.node文件会以编译后的二进制文件解析。

（6）如果想得到require命令加载的确切文件名，使用require.resolve()方法。

### 2.3 目录的加载规则
通常，我们会把相关的文件会放在一个目录里面，便于组织。这时，最好为该目录设置一个入口文件，让require方法可以通过这个入口文件，加载整个目录。

在目录中放置一个package.json文件，并且将入口文件写入main字段。下面是一个例子。

```javascript
// package.json
{ "name" : "some-library",
  "main" : "./lib/some-library.js" }
```
require发现参数字符串指向一个目录以后，会自动查看该目录的package.json文件，然后加载main字段指定的入口文件。如果package.json文件没有main字段，或者根本就没有package.json文件，则会加载该目录下的index.js文件或index.node文件。

### 2.4 模块的缓存
第一次加载某个模块时，Node会缓存该模块。以后再加载该模块，就直接从缓存取出该模块的module.exports属性。

```javascript
require('./example.js');
require('./example.js').message = "hello";
require('./example.js').message
// "hello"
```
上面代码中，连续三次使用require命令，加载同一个模块。第二次加载的时候，为输出的对象添加了一个message属性。但是第三次加载的时候，这个message属性依然存在，这就证明require命令并没有重新加载模块文件，而是输出了缓存。

如果想要多次执行某个模块，可以让该模块输出一个函数，然后每次require这个模块的时候，重新执行一下输出的函数。

所有缓存的模块保存在require.cache之中，如果想删除模块的缓存，可以像下面这样写。

```javascript**
// 删除指定模块的缓存
delete require.cache[moduleName];

// 删除所有模块的缓存
Object.keys(require.cache).forEach(function(key) {
  delete require.cache[key];
})
```

注意，缓存是根据绝对路径识别模块的，如果同样的模块名，但是保存在不同的路径，require命令还是会重新加载该模块。

### 2.5 环境变量NODE_PATH
Node执行一个脚本时，会先查看环境变量NODE_PATH。它是一组以冒号分隔的绝对路径。在其他位置找不到指定模块时，Node会去这些路径查找。

可以将NODE_PATH添加到.bashrc。
```javascript
export NODE_PATH="/usr/local/lib/node"
```
## 3 应用举例
### 3.1 示例代码
foo.js

```javascript
var circle = require('./circle.js');
console.log('The area of a circle of radius 4 is '+circle.area(4));
console.log('The circumference of radius 5 is '+circle.circumference(5));
```

circle.js
```javascript
const PI = Math.PI;
exports.area = (r) => PI * r * r;
//ES5格式
//exports.area = function(r){reutern PI*r*r;};
exports.circumference = (r) => 2 * PI * r;
//ES5格式
//exports.circumference = function(r) {return 2*PI*r;};
```
以上代码输出
```javascript
The area of a circle of radius 4 is 50.25

The circumference of radius 5 is 31.40
```
### 3.2 代码解析

```javascript
exports.area = (r) =>PI*r*r;
//相当于为该模块的输出对象添加一个area()方法

var circle = require('./circle.js');
//相当于将circle.js模块的module.exports对象赋给circle变量

console.log('The area of a circle of radius 4 is '+circle.area(4));
//调用的其实是circle.js中module.exports对象的area()函数。

console.log('The circumference of radius 5 is '+circle.circumference(5));
//调用的其实是circle.js中module.exports对象的circumference()函数。
```

## 4 参考链接

[阮一峰《JavaScript标准参考教程》](http://javascript.ruanyifeng.com/nodejs/module.html#toc0)


