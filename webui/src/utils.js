

// return an array of objects according to key, value, or key and value matching
// copied from https://gist.github.com/iwek/3924925 with slight synthax updates.
function getObjects(obj, key, val) {
  var objects = [];
  for (var i in obj) {
    if (!obj.hasOwnProperty(i)) continue;
    if (typeof obj[i] == 'object') {
      objects = objects.concat(getObjects(obj[i], key, val));
    } else
      //if key matches and value matches or if key matches and value is not passed (eliminating the case where key matches but passed value does not)
      if ((i === key && obj[i] === val) || (i === key && val === '')) { //
        objects.push(obj);
      } else if (obj[i] === val && key === '') {
        //only add if the object is not already in the array
        if (objects.lastIndexOf(obj) === -1) {
          objects.push(obj);
        }
      }
  }
  return objects;
}

const sortData = (sortColumn, sortType, data) => {
  if (sortColumn && sortType) {
    return data.sort((a, b) => {
      let x = a[sortColumn];
      let y = b[sortColumn];
      if (typeof x === 'string') {
        x = x.charCodeAt(0);
      }
      if (typeof y === 'string') {
        y = y.charCodeAt(0);
      }
      if (sortType === 'asc') {
        return x - y;
      } else {
        return y - x;
      }
    });
  }
  return data;
};

export {
  getObjects,
  sortData
}