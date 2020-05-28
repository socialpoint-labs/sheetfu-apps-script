/**
 * Use this function when you need to find item values in a table by index field.
 * Unlike the original method getItemById, this function does not create a sheetfu table.
 * It is a convenient alternative in large databases where the search performance is key.
 * For example, look up a price of an automotive part by the part number.
 *
 * @param {String} sheetName: Name of the target sheet.
 * @param {Number} headerRow: Row number where the header is.
 * @param {String} indexField: Field name in header where you want to lookup the value.
 * @param {*} lookupValue: Value you want to look up.
 * @param {Boolean} isSorted: Whether the index field is sorted or not.
 * @return {Object} An object item containing only values, where fields match the header values.
 */
function getItemValuesById(sheetName, headerRow, indexField, lookupValue, isSorted) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  var numColumns = sheet.getLastColumn();
  var numRows = sheet.getLastRow();
  var header = sheet.getRange(headerRow, 1, 1, numColumns).getValues();
  var idColumnIndex = header[0].indexOf(indexField) + 1;
  var ids = sheet.getRange(headerRow + 1, idColumnIndex, numRows - headerRow, 1).getValues();
  
  var rowIndex = (isSorted)? ids.binaryIndexOf(lookupValue) : ids.indexOf2d(lookupValue);
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
    currentElement = this[currentIndex][columnIndex];
    
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



