function getItemValuesById(sheetName, headerRow, indexField, id, isSorted) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  var numColumns = sheet.getLastColumn();
  var numRows = sheet.getLastRow();
  var header = sheet.getRange(headerRow, 1, 1, numColumns).getValues();
  var idColumnIndex = header[0].indexOf(indexField) + 1;
  var ids = sheet.getRange(headerRow + 1, idColumnIndex, numRows - headerRow, 1).getValues();
  
  var rowIndex = (isSorted)? ids.binaryIndexOf(id) : ids.indexOf2d(id);
  if (rowIndex === -1) {
    return undefined
  }
  var itemRow = sheet.getRange(rowIndex + headerRow + 1, 1, 1, numColumns).getValues();
  var item = {};
  for (var i = 0; i < itemRow[0].length; i++) {
    var value = itemRow[0][i];
    var field = header[0][i];
      item[field] = value;
  }
  return item
}

/**
 * An indexOf search on a host 2d array.
 *
 * @param {*} searchElement The item to search for within the array.
 * @param {Number} columnIndex The index where to search in the inner array (0 by default).
 * @return {Number} The index of the element which defaults to -1 when not found.
 */
Array.prototype.indexOf2d = function(searchElement, columnIndex) {
  if (!columnIndex) {
    columnIndex = 0;
  }
  for (var i = 0; i < this.length; i++) {
    if (this[i][columnIndex] === searchElement) {
      return i;
    }
  }
  return -1;
}


/**
 * Performs a binary search on the host 2d array.
 *
 * @param {*} searchElement The item to search for within the array.
 * @param {Number} columnIndex The index where to search in the inner array (0 by default).
 * @return {Number} The index of the element which defaults to -1 when not found.
 */
Array.prototype.binaryIndexOf = function(searchElement, columnIndex) {
  if (!columnIndex) {
    columnIndex = 0;
  }
  var minIndex = 0;
  var maxIndex = this.length - 1;
  var currentIndex;
  var currentElement;
  
  while (minIndex <= maxIndex) {
    currentIndex = (minIndex + maxIndex) / 2 | 0;
    currentElement = this[currentIndex][0];
    
    if (currentElement < searchElement) {
      minIndex = currentIndex + 1;
    }
    else if (currentElement > searchElement) {
      maxIndex = currentIndex - 1;
    }
    else {
      return currentIndex;
    }
  }
  return -1;
}