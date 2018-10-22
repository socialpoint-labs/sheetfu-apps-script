/**
 * Constructor which creates a Selector object to query Items in a Table.
 * @param {Table} table: The Table object where to evaluate the criteria.
 * @param {Array} criteria: an array used as filter as an AND of ORs (see CNF). Examples:
 * >>> [{date: today}, [{tag: 1},{tag: 2}]] // (date === today && (tags === 1 || tags === 2))
 * >>> [[{assigneeId: 'GO'}, {assigneeId: 'AM'}]] // (assigneeId === 'GO' || assigneeId === 'AM')
 * >>> [{name: 'Guillem'}, {surname: 'Orpinell'}] // (name === 'Guillem' && surname === 'Orpinell')
 * >>> {name: 'Guillem', surname: 'Orpinell'} // (name === 'Guillem' && surname === 'Orpinell')
 * @constructor
 */
function Selector(table, criteria) {
  this.table = table;
  this.criteria = criteria;
  this.queryItems = new GridArray();
}


/**
 * Method to get the query items in a Selector object.
 */
Selector.prototype.getQueryItems = function() {
  return this.queryItems;
}


/**
 * Method to evaluate a criteria within a Table object.
 */
Selector.prototype.evaluate = function() {
  if (Array.isArray(this.criteria)) {
    var andsArray = this.criteria;
  }
  else if (isObject(this.criteria)) {
    var andsArray = [this.criteria];
  } else {
    throw 'Oops! Criteria should be an Array or an Object. Fix it and try again.'
  }
  
  for (var i = 0; i < this.table.items.length; i++) {
    var item = this.table.items[i];
    if (isMatching(item, andsArray)) {
      this.queryItems.push(item);
    }
  }
  return this
}


/**
 * Function to evaluate a criteria within an Item object.
 * @param {Item} item: The Item object where to evaluate the criteria.
 * @param {Array} criteria: an array used as filter as an AND of ORs (see CNF).
 @return {Boolean}
 */
function isMatching(item, andsArray) {  
  for (var i=0; i < andsArray.length; i++) {
    var clause = andsArray[i];
    if (isObject(clause) && someUnmatch(item, clause)) { //AND logic
      return false;
    }
    else if (Array.isArray(clause) && noneMatches(item, clause)) { //OR logic
      return false;
    }
  }
  return true;
}

/**
 * Function
 */
function someUnmatch(item, object) {
  for (var field in object) {
    if (!valuesMatch(object[field], item.getFieldValue(field))) {
      return true;
    }
  }
  return false;
}

/**
 * Function
 */
function noneMatches(item, orsArray) {
  for (var i=0; i < orsArray.length; i++) {
    var object = orsArray[i];
    if (!isObject(object)) {
      throw 'Oops! The ORs array must be an array of Objects. Fix it and try again.'
    }
    for (var field in object) {
      if (valuesMatch(object[field], item.getFieldValue(field))) {
        return false;
      }
    }
  }
  return true;
}
    
/**
 * Function to check a matching between two values, considering also value as a Date.
 */
function valuesMatch(value1, value2) {
  return ((value1 instanceof Date && value1.getTime() === value2.getTime()) || value1 === value2)
}

/** 
 * Returns if a value is an object
 */
function isObject (value) {
  return value && typeof value === 'object' && value.constructor === Object;
}