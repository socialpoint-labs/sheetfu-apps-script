### Sheetfu Table Class



A Table object gives us the capability to treat a spreadsheet in a more ORM-like syntax in the Google Apps script environment.
Let's see an example in an app script context, using a "people" sheet as below:
 
 | first_name | last_name | age |
 | ---------- | --------- | --- |
 | Philippe   | Oger      | 36  |
 | Guillem    | Orpinell  | 25  |
 | John       | Doe       | 32  |
 | Jane       | Doe       | 32  |


```javascript

function tableClassQuickstart() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("people");
    var gridRange = sheet.getDataRange();
    
    
     // we put the range of the whole sheet but work with smaller range too.
    var table = new Table(gridRange);       
    
    // Let's search for the person named Philippe
    var philippe = table.select({"first_name": "Philippe"}).first();
    
    // Now we have the philippe Table item. We can do plenty of things with it.
    
    var age = philippe.getFieldValue("age");  // 36
    
    // More importantly, we can set values, colors, notes.
    // This will add the note on the "age" field.
    philippe.setFieldNote("age", "His birthday is coming soon");  
    
    // This will set the new "age" value.
    philippe.setFieldValue("age", 37); 
    
    // This will turn the cell "age" into red.
    philippe.setFieldBackground("age", "red");  

    // VERY IMPORTANT STEP
    // When you set values, background or anything, you need to commit your data, otherwise nothing will be updated.
    philippe.commit()    
}

```

We can also add new entries:

```javascript
function addNewPerson() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("people");
    var gridRange = sheet.getDataRange();
    
    var grid = new Table(gridRange);

    var newEmployee = {
        "first_name": "Albert", 
        "last_name": "Einstein", 
        "age": 138
    };
    grid.add(newEmployee);
    grid.commit()
}

```

More importantly, you can loop through every rows/items in the table the following way:

```javascript
function loopThroughItems() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("people");
    var gridRange = sheet.getDataRange();
    
    var table = new Table(gridRange);
    
    for (var i = 0; i < table.items.length; i ++) {
        var item = table.items[i];
        // This will print in gas console the first name of everyone in the Table.
        Logger.log(item.getFieldValue("first_name"))    
    }
    
    // You can commit the whole table instead of committing per item too
    table.commit()
}

```

You can also create a Table object in just one line if your sheet only contains the table (which is probably in most cases).

```javascript

function createTableFast() {
    var headerRow = 1;
    var sheetName = "people";
    var table = getTable(sheetName, headerRow);
    
    // This means you do not have to find the range for your table. Easier.

}

```


Some comments/caveats:

* You must not have duplicate fields in your header (columns with same field name).
* In theory, a table is not necessarily a whole sheet, it can be any smaller range within a sheet.
* The range used for creating a Table object must contain the header in the first row.
* The Table object takes all the sheet data in memory, you can then manipulate, query it as you wish, but this will not change the data on the sheet until you commit the data (on grid level or item level).
* To update grid data, you need to commit it using the commit() method.



### Installation


You can use this code in 2 ways:
* GIT clone this repo and create your own app script file using this code.
* Access it as an app script library from the app script editor.
    * Go to Resources > Libraries ...
    * In the 'Add a library' placeholder, add the following key: 1mONx8BnHcZUF1UbZZ5ZVCYt8xIRaFjVpmT6Qs1PZMAgYl6XVqeWsjBDi
    * 'Sheetfu' should be prompted. Select the last version. 
    * You can then access the Table class by using Sheetfu.Table() in your code.



