/**
 * Constructor for an item in a Table object.
 * @param {Number} i: id/order of the item in the Table frame. Start at 0 (first item in grid).
 * @param {Range} range: the grid range the item is from.
 * @param {Array} header: The header array.
 * @constructor
 */
function Item(i, header, row, column, sheet) {
  this.fields = {};
  
  this.table = {};
  this.table.header = header;
  this.table.row = row;
  this.table.column = column;
  this.table.sheet = sheet;
  
  this.i = i;
  this.authorizedToCommit = true;
}

/**
 * Method to add a new field to the item, given a value, note, background, formula and font color.
 * @param {String} label: The name of the field.
 * @param {String|Number|Date} value: The value from a cell.
 * @param {String} note: The note from a cell.
 * @param {String} background: The background color of a cell (can be string for basic colors or hex code string).
 * @param {String} formula: The R1C1 format formula.
 * @param {String} font: The font color.
 */
Item.prototype.addField = function(label, value, note, background, formula, font) {
  this.fields[label] = {"value": value, "note": note, "background": background, "formula": formula, "font": font};
  for (var param in this.fields[label]) {
    if (this.fields[label][param] === undefined) {
      this.fields[label][param] = "";
    }
  }
};

/**
 * Commit a single item line in spreadsheet if the items order has not been changed since instantiating the grid.
 */
Item.prototype.commit = function () {
  if (!(this.authorizedToCommit)) {
    throw "Forbidden to commit this item. The order of the grid it is associated to has changed or it has been deleted."
  }

  var rowValues = [];
  var rowNotes = [];
  var rowBackgrounds = [];
  var rowWraps = [];
  var rowFontColors = [];

  for (var j = 0; j < this.table.header.length; j++) {
    var field = this.table.header[j];
    var value = this.getFieldValue(field);
    var formula = this.getFieldFormula(field);

    (formula)? rowValues.push(formula) : rowValues.push(value);
    rowNotes.push(this.getFieldNote(field));
    rowBackgrounds.push(this.getFieldBackground(field));
    rowWraps.push(false);
    rowFontColors.push(this.getFieldFontColor(field))
  }

  var lineRange = this.getLineRange();
  lineRange.setValues([rowValues]);
  lineRange.setNotes([rowNotes]);
  lineRange.setBackgrounds([rowBackgrounds]);
  lineRange.setWraps([rowWraps]);
  lineRange.setFontColors([rowFontColors]);
};


/**
 * Commit a whole item values. Disregarded other dimensions.
 */
Item.prototype.commitValues = function () {
  if (!(this.authorizedToCommit)) {
    throw "Forbidden to commit this item. The order of the grid it is associated to has changed or it has been deleted."
  }

  var rowValues = [];

  for (var j = 0; j < this.table.header.length; j++) {
    var field = this.table.header[j];
    var value = this.getFieldValue(field);
    var formula = this.getFieldFormula(field);

    (formula)? rowValues.push(formula) : rowValues.push(value);
  }

  var lineRange = this.getLineRange();
  lineRange.setValues([rowValues]);
};


/**
 * Commit a whole item backgrounds. Disregarded other dimensions.
 */
Item.prototype.commitBackgrounds = function () {
  if (!(this.authorizedToCommit)) {
    throw "Forbidden to commit this item. The order of the grid it is associated to has changed."
  }
  var rowBackgrounds = [];
  for (var j = 0; j < this.table.header.length; j++) {
    var field = this.table.header[j];
    var background = this.getFieldBackground(field);
    rowBackgrounds.push(background)
  }
  var lineRange = this.getLineRange();
  lineRange.setBackgrounds([rowBackgrounds]);
};


/**
 * Commit a single item field in spreadsheet if the items order has not been changed since instantiating the grid.
 * @param {String} field: the field of the item to commit in spreadsheet.
 */
Item.prototype.commitField = function (field) {
  if (!(this.authorizedToCommit)) {
    throw "Forbidden to commit this item field. The order of the grid it is associated to has changed or it has been deleted."
  }
  var cellRange = this.getFieldRange(field);
  if (this.getFieldFormula(field)) {
    cellRange.setValue(this.getFieldFormula(field));  
  } else {
    cellRange.setValue(this.getFieldValue(field));
  }

  cellRange.setNote(this.getFieldNote(field));
  cellRange.setBackground(this.getFieldBackground(field));
  cellRange.setWrap(false);
  cellRange.setFontColor(this.getFieldFontColor(field));
};


/**
 * Commit a single item field value in spreadsheet if the items order has not been changed since instantiating the grid.
 * @param {String} field: the field of the item to commit the value from, in spreadsheet.
 */
Item.prototype.commitFieldValue = function (field) {
  if (!(this.authorizedToCommit)) {
    throw "Forbidden to commit this item field. The order of the grid it is associated to has changed or it has been deleted."
  }
  var cellRange = this.getFieldRange(field);
  if (this.getFieldFormula(field)) {
    cellRange.setValue(this.getFieldFormula(field));
  } else {
    cellRange.setValue(this.getFieldValue(field)); 
  }
};


/**
 * Get the line range of the item in the spreadsheet it is from.
 * @return {Range} line: The line range.
 */
Item.prototype.getLineRange = function () {
  var headerOffset = 1;
  var rangePositionOffset = this.table.row;
  var row = this.i + headerOffset + rangePositionOffset;
  var column = this.table.column;
  var sheet = this.table.sheet;
  return sheet.getRange(row, column, 1, this.table.header.length);
};


/**
 * Get the cell range of a given field of the item.
 * @param {string} field: A field string.
 * @return {Number} line: The line number.
 */
Item.prototype.getFieldRange = function (field) {
  var columnIndexOffset = 1;    // columns starts at 1.
  var columnField = this.table.header.indexOf(field) + columnIndexOffset;
  return this.getLineRange().getCell(1, columnField);
};



/**
 * Method to get the value of a given field.
 * @param {String} field: The name of the field.
 */
Item.prototype.getFieldValue = function(field) {
  var fieldParams = this.fields[field];
  if(!fieldParams) {
    var error = "The field '" + field + 
        "' cannot be found in the Table located in '"+ this.table.sheet.getSheetName() +
        "' sheet.\nCheck if the field exists, it's properly written and it's included in the Table range.";
    throw error;  
  }
  return fieldParams["value"];
};


/**
 * Method to set a value for a given field.
 * @param {String} field: The name of the field.
 * @param {String|Number|Date} value: The value to set.
 */
Item.prototype.setFieldValue = function(field, value) {
  if(!this.fields[field]) {    
    var error = "The field '" + field + 
        "' cannot be found in the Table located in '"+ this.table.sheet.getSheetName() +
        "' sheet.\nCheck if the field exists, it's properly written and it's included in the Table range.";
    throw error;
  }
  this.fields[field]["value"] = value;
  this.fields[field]["formula"] = '';
  return this;
};


/**
 * Method to get note for a given field.
 * @param {String} field: The name of the field.
 */
Item.prototype.getFieldNote = function(field) {
  return this.fields[field]["note"];
};


/**
 * Method to set note for a given field.
 * @param {String} field: The name of the field.
 * @param {String} note: The note to set.
 */
Item.prototype.setFieldNote = function(field, note) {
  this.fields[field]["note"] = note;
  return this
};


/**
 * Method to get background for a given field.
 * @param {String} field: The name of the field.
 */
Item.prototype.getFieldBackground = function(field) {
  return this.fields[field]["background"];
};


/**
 * Method to set background for a given field.
 * @param {String} field: The name of the field.
 * @param {String} background: The background to set (color string or hex code string).
 */
Item.prototype.setFieldBackground = function(field, background) {
  this.fields[field]["background"] = background;
  return this;
};


/**
 * Method to set background on the whole item.
 * @param {String} color: The name or hex of the color.
 */
Item.prototype.setBackground = function(color) {
  for (var i = 0; i < this.table.header.length; i++) {
    var field = this.table.header[i];
    this.fields[field]["background"] = color;
  }
  return this;
};


/**
 * Method to get formula for a given field.
 * @param {String} field: The name of the field.
 */
Item.prototype.getFieldFormula = function(field) {
  return this.fields[field]["formula"]
};

/**
 * Method to set formula for a given field.
 * @param {String} field: The name of the field.
 * @param {String} formula: The formula to set (must start with "=").
 */
Item.prototype.setFieldFormula = function(field, formula) {
  this.fields[field]["formula"] = formula;
  return this;
};


/**
 * Method to get font color for a given field.
 * @param {String} field: The name of the field.
 */
Item.prototype.getFieldFontColor = function(field) {
  return this.fields[field]["font"];
};


/**
 * Method to set font color for a given field.
 * @param {String} field: The name of the field.
 * @param {String} fontColor: The font color to set.
 */
Item.prototype.setFieldFontColor = function(field, fontColor) {
  this.fields[field]["font"] = fontColor;
  return this;
};


/**
 * Method to get the cell range for a specific field.
 * @param {String} field: The name of the field.
 * @return {Range} the cell range of the field.
 */
Item.prototype.getFieldRange = function(field) {
  var fieldIndex = this.table.header.indexOf(field);
  return this.getLineRange().getCell(1, fieldIndex + 1);
};

