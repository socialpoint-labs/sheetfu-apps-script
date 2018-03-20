/**
 * Function to create a Table Object for a whole sheet
 * @param {string} sheetName: Name of the sheet to create a Table from
 * @param {number} headerRow: Row number where the header is.
 * @param {String} indexField: Field name you want to create an index with (commonly for ID field for fast lookup).
 * @returns {Table}
 */
function getTable(sheetName, headerRow, indexField) {
  if (typeof headerRow === undefined) {
    headerRow = 1;
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var numberOfRows = sheet.getLastRow() - headerRow + 1;
  var tableRange = sheet.getRange(headerRow, 1, numberOfRows, sheet.getLastColumn());
  if (indexField === undefined) {
    return new Table(tableRange);
  } else {
    return new Table(tableRange, indexField);
  }
}


/** Constructor which create a Table object to query data, get and post. Object to use when rows in sheet are not uniquely
 * identifiable (no id). Use Table Class for DB-like queries instead (when unique id exist for each row).
 * @param {Range} gridRange: a range object from Google spreadsheet. First row of range must be the headers.
 * @param {String} indexField: Field name you want to create an index with (commonly for ID field for fast lookup).
 * @constructor
 */
function Table(gridRange, indexField) {

  this.gridRange = gridRange;
  this.header = this.getHeader();
  this.items = this.initiateItems();

  if (indexField !== undefined) {
    this.index = this.getIndex(indexField)
  }
}


/**
 * Method to extract headers of a grid.
 * @return {Array} The list of labels.
 */
Table.prototype.getHeader = function () {
  return this.gridRange.getValues()[0];
};


/**
 * Method to create an index as a hash table for a given field. Make sure the field guarantees unique values. Perfect for IDs.
 * @return {Object} Hash table in the format {fieldIndex : TableItem}
 */
Table.prototype.getIndex = function (indexField) {
  var index = {};
  for (var i = 0; i < this.items.length; i++) {
    var key = this.items[i].getFieldValue(indexField);
    index[key] = this.items[i]
  }
  return index
};


/**
 * Method to extract data from the grid range as Item objects (using header labels).
 * @return {Item[]} List of Item objects.
 * The i attribute is the index of the object in the list of Table.items (starting at 0) (not the line in spreadsheet).
 */
Table.prototype.initiateItems = function() {
  var rawValues = this.gridRange.getValues().slice(1);    // we disregard first row because it is header.
  var rawNotes = this.gridRange.getNotes().slice(1);
  var rawBackgrounds = this.gridRange.getBackgrounds().slice(1);
  var rawFormulas = this.gridRange.getFormulasR1C1().slice(1);
  var rawFontColors = this.gridRange.getFontColors().slice(1);

  var items = new GridArray();

  for (var row = 0; row < rawValues.length; row++) {
    var parseItem = new Item(row, this.gridRange, this.header);
    for (var column = 0; column < this.header.length; column++) {
      var label = this.header[column];
      parseItem.addField(
        label=label,
        value=rawValues[row][column],
        note=rawNotes[row][column],
        background=rawBackgrounds[row][column],
        formula=rawFormulas[row][column],
        font=rawFontColors[row][column]
      )
    }
    items.push(parseItem)
  }
  return items
};


/**
 * Method to commit the items into the associated sheet (regardless if number of items have changed).
 */
Table.prototype.commit = function() {
  var dataToSend = this.getGridData();
  var itemsRange = this.getItemsRange();
  this.resetGrid();
  itemsRange.setValues(dataToSend['values']);
  itemsRange.setNotes(dataToSend['notes']);
  itemsRange.setBackgrounds(dataToSend['backgrounds']);
  itemsRange.setWraps(dataToSend['wraps']);
  itemsRange.setFontColors(dataToSend['fonts'])
};


/**
 * Method to commit the items values into the associated sheet (regardless if number of items have changed).
 */
Table.prototype.commitValues = function() {
  var values = this.getGridValues();
  var itemsRange = this.getItemsRange();
  this.resetGrid();
  itemsRange.setValues(values)
};


/**
 * Method to get the new Range for the items, based on lenght of Table.items.
 */
Table.prototype.getItemsRange = function() {
  var row = this.gridRange.getRow() + 1;    // +1 to disregard header row
  var column = this.gridRange.getColumn();
  var sheet = this.gridRange.getSheet();
  return sheet.getRange(row, column, this.items.length, this.header.length)
};


/**
 * Method to create both values and notes 2D arrays from grid items.
 * @return {object} with attributes "values" and "notes".
 */
Table.prototype.getGridData = function() {
  var values = [];
  var notes = [];
  var backgrounds = [];
  var wraps = [];
  var fontColors =[];

  for (var i = 0; i < this.items.length; i++) {
    var rowValues = [];
    var rowNotes = [];
    var rowBackgrounds = [];
    var rowWraps = [];
    var rowFontColors = [];
    var item = this.items[i];

    for (var j = 0; j < this.header.length; j++) {
      var field = this.header[j];
      var value = item.getFieldValue(field);
      var formula = item.getFieldFormula(field);

      (formula !== "")? rowValues.push(formula) : rowValues.push(value);
      rowNotes.push(item.getFieldNote(field));
      rowBackgrounds.push(item.getFieldBackground(field));
      rowWraps.push(false);
      rowFontColors.push(item.getFieldFontColor(field))
    }
    values.push(rowValues);
    notes.push(rowNotes);
    backgrounds.push(rowBackgrounds);
    wraps.push(rowWraps);
    fontColors.push(rowFontColors)
  }
  return {"values": values, "notes": notes, "backgrounds": backgrounds, "wraps": wraps, "fonts": fontColors}
};


/**
 * Method to create 2D array of the values of every grid items.
 * @return {Array[]} The values 2D array.
 */
Table.prototype.getGridValues = function() {
  var values = [];

  for (var i = 0; i < this.items.length; i++) {
    var rowValues = [];
    var item = this.items[i];

    for (var j = 0; j < this.header.length; j++) {
      var field = this.header[j];
      var value = item.getFieldValue(field);
      var formula = item.getFieldFormula(field);

      (formula !== "")? rowValues.push(formula) : rowValues.push(value);
    }
    values.push(rowValues);
  }
  return values
};


/**
 * Method to query rows from a Table, given exact match attributes.
 * @return {object} filteredObject: Object with key/value pair filtered (exact match).
 */
Table.prototype.select = function(filterObject) {
  var queryItems = new GridArray();

  for (var i = 0; i < this.items.length; i++) {

    var currentRow = this.items[i];
    var matching = true;

    for (var label in filterObject) {
      if (currentRow.getFieldValue(label) instanceof Date) {
        if(currentRow.getFieldValue(label).getTime() !== filterObject[label].getTime()) {
          matching = false;
          break
        }
      } else {
        if (currentRow.getFieldValue(label) !== filterObject[label]) {
          matching = false;
          break
        }
      }
    }
    if (matching === true) {
      queryItems.push(currentRow)
    }
  }
  return queryItems
};


/**
 * Method to update one item within items grid.
 * @param {object} item: an item from items.
 * The index value is the value where the item is in the Table.items array. Needed to be able to change the value in Table.
 */
Table.prototype.update = function(item) {
  this.items[item['_i']] = item
};


/**
 * Method to update many items within items grid.
 * @param {object[]} manyItems: list of objects to update.
 */
Table.prototype.updateMany = function(manyItems) {
  for (var i = 0; i < items.length; i++) {
    var index = manyItems[i]['_i'];
    this.items[index] = manyItems[i]
  }
};


/**
 * Method to delete all rows in a Table.
 */
Table.prototype.resetGrid = function() {
  this.gridRange.clearContent();
  var header = this.getHeaderRange();
  header.setValues([this.header])
};


/**
 * Method to get the range of the header.
 * @return {Range} headerRange: the range of the header only (basically top row).
 */
Table.prototype.getHeaderRange = function() {
  var row = this.gridRange.getRow();
  var column = this.gridRange.getColumn();
  var sheet = this.gridRange.getSheet();
  return sheet.getRange(row, column, 1, this.header.length)
};


/**
 * Method to add a new item into the Table.
 * @param {object} raw_item: an object item containing only values. Field must be matching header values.
 */
Table.prototype.add = function(raw_item) {
  var newItem = new Item(this.items.length, this.gridRange, this.header);

  for (var i = 0; i < this.header.length; i++) {
    var label = this.header[i];
    if (raw_item[label] === undefined) {
      raw_item[label] = "";
    }
    newItem.addField(field=label, value=raw_item[label])
  }
  this.items.push(newItem);
  return newItem
};


/**
 * Method to sort Table.items for a given field/key/label value.
 * Only works for numbers and date fields.
 * @param {string} key: the key label that we need to sort items from.
 * @param {boolean} ascending: If True it sorts ascending, if false, it sort descending.
 * @return {object[]} items: Table.items attribute.
 */
Table.prototype.sortBy = function(key, ascending) {

  this.items.sort(function(a, b){

    if (a.getFieldValue(key) instanceof Date) {
      var keyA = a.getFieldValue(key).getTime();
      var keyB = b.getFieldValue(key).getTime();

    } else {
      var keyA = a.getFieldValue(key);
      var keyB = b.getFieldValue(key);
    }

    // Compare the 2 keys
    if(keyA < keyB) return -1;
    if(keyA > keyB) return 1;
    return 0;

  });

  if (ascending === false) {
    this.items.reverse()
  }

  // updating '_i'
  for (var i = 0; i < this.items.length; i++) {
    this.items[i].i = i;
    this.items[i].authorizedToCommit = false;       // to prevent committing lines when order has changed.
  }
  return this.items
};


/**
 * Method to set background color for a given item.
 * @param {object} item: An item object.
 * @param {string} color: The color we want as background.
 * @return {object} item: The mutated item.
 */
Table.prototype.setItemBackground = function (item, color) {
  for (var field in item.fields) {
    item.setFieldBackground(field, color)
  }
  return item
};


/**
 * Method to clear background colors on every items.
 */
Table.prototype.clearBackgrounds = function () {
  var itemRange = this.getItemsRange();
  return itemRange.clearFormat()
};


Table.prototype.getItemById = function (itemId) {
  return this.index[itemId]
};


/**
 * Function to clone an object and simulate inheritance.
 */
function cloneObj(obj) {
  function F() { }
  F.prototype = obj;
  return new F();
}


/**
 * SubArray class constructor to have more ORM like methods to the arrays used in the Table class.
 */
function GridArray() {}
GridArray.prototype = cloneObj(Array.prototype);


/**
 * Method to return only the first result of an array. Useful when result of selection.
 */
GridArray.prototype.first = function() {
  return this[0]
};


/**
 * Method to return the first x results of an array. Useful when result of selection.
 */
GridArray.prototype.limit = function(x) {
  if(this.length > x) {
    return this.slice(0, x)
  } else {
    return this
  }
};


