# PolyNodeLink
The NodeJS library to use for [PolygonDB](https://github.com/PolygonDB/PolygonDB)<br/>
## Example Local Usage:
```js
const {localdb} = require('polynodelink');
// Where you have your PolygonDB Installed
const polyDBPath = 'C:\\...\\PolygonDB\\'
const polylocal = new localdb(polyDBPath)
// Get the version of PolygonDB
main();
async function main(){
console.log(await polylocal.getversion())
}
```
Read the [WIKI](https://github.com/PolygonDB/PolyNodeLink/wiki) for all functions and usage