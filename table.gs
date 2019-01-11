/**
 * Function to create a Table Object for a whole sheet
 * @param {string} sheetName: Name of the sheet to create a Table from
 * @param {number} headerRow: Row number where the header is.
 * @param {String} indexField: Field name you want to create an index with (commonly for ID field for fast lookup).
 * @returns {Table}
 */
function getTable(sheetName, headerRow, indexField) {
  if (!headerRow) {
    headerRow = 1;
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var numberOfRows = sheet.getLastRow() - headerRow + 1;
  var tableRange = sheet.getRange(headerRow, 1, numberOfRows, sheet.getLastColumn());
  return new Table(tableRange, indexField);
}


/**
 * Function to create a Table Object from a Named Range. The range should contain a header in the first row.
 * Named ranges are ranges that have associated string aliases.
 * They can be viewed and edited via the Sheets UI under the Data > Named ranges... menu.
 * @param {string} namedRange: Name of the range to create a Table from
 * @param {String} indexField: Field name you want to create an index with (commonly for ID field for fast lookup).
 * @returns {Table}
 */
function getTableByName(namedRange, indexField) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tableRange = ss.getRangeByName(namedRange);
  if (tableRange == null) {
    throw 'Oops! Error creating a table with the named range '+namedRange+'. It might not exist or it is misspelled.'
  }
  return new Table(tableRange, indexField);
}


/** Constructor which create a Table object to query data, get and post. Object to use when rows in sheet are not uniquely
 * identifiable (no id). Use Table Class for DB-like queries instead (when unique id exist for each row).
 * @param {Range} gridRange: a range object from Google spreadsheet. First row of range must be the headers.
 * @param {String} indexField: Field name you want to create an index with (commonly for ID field for fast lookup).
 * @constructor
 */
function Table(gridRange, indexField) {

  this.gridRange = trimRangeRows(gridRange);
  this.initialGridRange = this.gridRange;
  this.header = this.getHeader();
  this.items = this.initiateItems();

  this.indexField = indexField;
  if (this.indexField !== undefined) {
    this.index = this.getIndex(indexField);
  }
}


/**
 * Function to trim the rows of a range. The range should contain a header in the first row.
 * @param {Range} range: a range object from Google spreadsheet. First row of range must be the headers.
 * @returns {Range}
 */
function trimRangeRows(range) {
  var values = range.getValues();
  for (var rowIndex = values.length - 1; rowIndex >= 0; rowIndex--) {
    if (values[rowIndex].join('') !== '') {
      break;
    }
  }
  return range.offset(rowOffset=0, columnOffset=0, numRows=rowIndex+1);
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
    index[key] = this.items[i];
  }
  return index;
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
    var parseItem = new Item(row, this.header, this.gridRange.getRow(), this.gridRange.getColumn(), this.gridRange.getSheet());
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
    items.push(parseItem);
  }
  return items;
};


/**
 * Method to commit the items into the associated sheet (regardless if number of items have changed).
 */
Table.prototype.commit = function() {
  var dataToSend = this.getGridData();
  var itemsRange = this.getItemsRange();
  this.cleanInitialGrid();
  this.initialGridRange = this.gridRange;
  if(itemsRange !== undefined) {
    itemsRange.setValues(dataToSend['values']);
    itemsRange.setNotes(dataToSend['notes']);
    itemsRange.setBackgrounds(dataToSend['backgrounds']);
    itemsRange.setWraps(dataToSend['wraps']);
    itemsRange.setFontColors(dataToSend['fonts']);
  }
};


/**
 * Method to commit the items values into the associated sheet (regardless if number of items have changed).
 */
Table.prototype.commitValues = function() {
  var values = this.getGridValues();
  var itemsRange = this.getItemsRange();
  this.cleanInitialGrid();
  this.initialGridRange = this.gridRange;
  if(itemsRange !== undefined) {
    itemsRange.setValues(values);
  }
};

/**
 * Method to get the new Range for the items, based on lenght of Table.items.
 * @return {Range} object of the items range. {Undefined} if the items range is empty.
 */
Table.prototype.getItemsRange = function() {
  // We need to check that items is not empty, since Sheet.getRange() throws an exception if numRows or numColumns are 0.
  if(this.items.length === 0) {
    return undefined;
  }
  var row = this.gridRange.getRow() + 1;    // +1 to disregard header row
  var column = this.gridRange.getColumn();
  var sheet = this.gridRange.getSheet();
  return sheet.getRange(row, column, this.items.length, this.header.length);
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

      (formula)? rowValues.push(formula) : rowValues.push(value);
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

      (formula)? rowValues.push(formula) : rowValues.push(value);
    }
    values.push(rowValues);
  }
  return values
};

/**
 * Method to query rows from a Table, given exact match attributes.
 * @param {Array} criteria: an array used as filter as an AND of ORs (see CNF).
 * @return {Item[]} List of Item objects matching the given criteria.
 */
Table.prototype.select = function(criteria) {
  var queryItems = new Selector(this, criteria)
  .evaluate()
  .getQueryItems();
  
  return queryItems;
};


/**
 * Method to update one item within items grid.
 * @param {object} item: an item from items.
 * The index value is the value where the item is in the Table.items array. Needed to be able to change the value in Table.
 */
Table.prototype.update = function(item) {
  this.items[item['_i']] = item;
};


/**
 * Method to update many items within items grid.
 * @param {object[]} manyItems: list of objects to update.
 */
Table.prototype.updateMany = function(manyItems) {
  for (var i = 0; i < this.items.length; i++) {
    var index = manyItems[i]['_i'];
    this.items[index] = manyItems[i];
  }
};



/**
 * Method to delete items from the items grid based on a selection criteria.
 * @param {object} filteredObject: Criteria to select the items to delete. See documentation of the "select" method.
 */
Table.prototype.deleteSelection = function(filterObject) {
  var selectionToDelete = this.select(filterObject);
  return this.deleteMany(selectionToDelete);
};

/**
 * Method to delete several items from the items grid.
 * @param {list} itemList: A list of items that you wish to delete
 * Take into account that deleting items re-calculates the indices of all items with higher index inside Table.items.
 */
Table.prototype.deleteMany = function(itemList) {
  if(itemList.length === this.items.length)
  {
    return this.deleteAll();
  }
  
  // First we sort the list of items to delete by index
  itemList.sort(function(firstItem, secondItem) {
    // Compare the i attribute of both items
    if(firstItem.i < secondItem.i) return -1;
    if(firstItem.i > secondItem.i) return 1;
    return 0;
  });
  
  // Now we iterate the sorted list in inverse order and delete the items
  var indexReduction = itemList.length;
  var lastDeletedIndex = this.items.length - 1;
  for(var i = itemList.length - 1; i >= 0; i--)
  {
    var itemToDelete = itemList[i];
    itemToDelete.authorizedToCommit = false; // To prevent the user from commiting deleted items.
    var indexToDelete = itemToDelete.i;
    if(indexToDelete >= this.items.length) {
      throw "One of the items specified to delete has an out of bounds index.";
    }
    this.items.splice(indexToDelete, 1);
    
    // For every item to delete, we will recalculate the indexes from the item that was deleted
    // to the last item before the previously deleted index.
    for (var k = indexToDelete; k < lastDeletedIndex - 1; k++) {
      var itemToUpdateIndex = this.items[k];
      // We reduce the index by as many items are left to delete
      itemToUpdateIndex.i = itemToUpdateIndex.i - indexReduction;
    }
    lastDeletedIndex = indexToDelete;
    indexReduction--;
  }
  
  // Reduce the gridRange by as many rows as were deleted
  this.gridRange = this.gridRange.offset(0, 0, this.gridRange.getHeight() - itemList.length, this.gridRange.getWidth());
};


/**
 * Method to delete one item from the items grid.
 * @param {item} item: An item from this.items that you wish to delete
 * Take into account that deleting an item re-calculates the indices of all items with higher index inside Table.items.
 */
Table.prototype.deleteOne = function(item) {
  return this.deleteMany([item]);
};


/**
 * Method to delete all items withing the items grid.
 */
Table.prototype.deleteAll = function() {
  this.items = new GridArray();
  this.gridRange = this.getHeaderRange();
};


/**
 * Method to delete all rows inside the initial grid.
 */
Table.prototype.cleanInitialGrid = function() {
  this.initialGridRange.clear({contentsOnly: true, skipFilteredRows: true});
  var header = this.getHeaderRange();
  header.setValues([this.header]);
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
 * Method to add a new item into the Table. Add the item also to index if there is an index.
 * @param {object} input_item: an object item containing only values, or an instance of Item. Field must be matching header values.
 */
Table.prototype.add = function(input_item) { 
  
  var raw_item = input_item;
  if(input_item instanceof Item) {
    raw_item = {}
    for (var field in input_item.fields) { 
      raw_item[field] = input_item.getFieldValue(field); 
    }
  }
  
  var newItem = new Item(this.items.length, this.header, this.gridRange.getRow(), this.gridRange.getColumn(), this.gridRange.getSheet());

  for (var i = 0; i < this.header.length; i++) {
    var label = this.header[i];
    if (raw_item[label] === undefined) {
      raw_item[label] = "";
    }
    newItem.addField(field=label, value=raw_item[label]);
  }
  this.items.push(newItem);
  
  // Increase the gridRange by one row
  this.gridRange = this.gridRange.offset(0, 0, this.gridRange.getHeight()+1, this.gridRange.getWidth());
  
  if (this.index !== undefined) {
    var indexId = newItem.getFieldValue(this.indexField);
    this.index[indexId] = newItem;
  }
  return newItem;
};


/**
 * Method to sort Table.items for a given field/key/label value.
 * Only works for numbers and date fields.
 * @param {string} key: the key label that we need to sort items from.
 * @param {boolean} ascending: If True it sorts ascending, if false, it sort descending.
 * @return {object[]} items: Table.items attribute.
 */
Table.prototype.sortBy = function(key, ascending) {

  this.items.sort(function(a, b) {
    var timeStampA = Date.parse(a.getFieldValue(key));
    var timeStampB = Date.parse(b.getFieldValue(key));
    if (!isNaN(timeStampA) && !isNaN(timeStampB)) {
      var dateA = new Date(a.getFieldValue(key));
      var keyA = dateA.getTime();
      var dateB = new Date(b.getFieldValue(key));
      var keyB = dateB.getTime();
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
 * Method to clear background colors on every items.
 * @return {Range}: The range of items which had their background cleaned. {Undefined} if the items range is empty.
 */
Table.prototype.clearBackgrounds = function () {
  var itemRange = this.getItemsRange();
  if(itemRange !== undefined) {
    return itemRange.clearFormat();
  }
  else {
    return undefined;
  }
};


/**
 * Get an item from the table by its ID (assuming an index field was given when creating the table).
 */
Table.prototype.getItemById = function (valueId) {
  return this.index[valueId]
};
 

/**  
 * Vertical lookup. Searches down the index field of a table (assuming an index field was given when creating the table)
 * for a criteria and returns the value of a specified field in the item found.
 */
Table.prototype.getFieldValueById = function (field, valueId) {
  var itemById = this.getItemById(valueId);
  if(itemById) {
    return itemById.getFieldValue(field);
  } else {
    return undefined;
  }
}


/**
 * Method to return only distinct different values in a field.
 */
Table.prototype.distinct = function(field) {
  var list = [];
  for (var i = 0; i < this.items.length; i++) {
    list.push(this.items[i].getFieldValue(field));
  }
  // It filters the list to return an array with the unique values
  var unique = list.filter(function(value, index, self) { 
    return self.indexOf(value) === index;
  });
  return unique
}


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
  if (this.length === 0) {
    return undefined;
  }
  return this[0];
};


/**
 * Method to return the first x results of an array. Useful when result of selection.
 */
GridArray.prototype.limit = function(x) {
  if(this.length > x) {
    return this.slice(0, x);
  } else {
    return this;
  }
};

