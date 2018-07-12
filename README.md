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
    // Let's create a table and search for Philippe.
    var sheetName = 'people';
    var headerRow = 1;
    var table = Sheetfu.getTable(sheetName, headerRow);       
    var item = table.select({"first_name": "Philippe"}).first();
    
    // get values, notes, etc..
    var age = item.getFieldValue("age");  // 36
    var ageNote = item.getFieldNote("age");
    var ageBackground = item.getFieldBackground("age");
    
    // More importantly, we can set values, colors, notes.
    item.setFieldNote("age", "His birthday is coming soon")  
        .setFieldValue("age", 37) 
        .setFieldBackground("age", "red")  
    .commit()    
}

```

We can also add new entries:

```javascript
function addNewPerson() {
    var table = Sheetfu.getTable('people', 1);

    var newEmployee = {
        "first_name": "Albert", 
        "last_name": "Einstein", 
        "age": 138
    };
    table.add(newEmployee);
    table.commit()
}

```

More importantly, you can loop through every rows/items in the table the following way and add the execution worflow that you need.

```javascript
function loopThroughItems() {
    var table = Sheetfu.getTable('people', 1);
    for (var i = 0; i < table.items.length; i ++) {
        var item = table.items[i];
        
        if (item.getFieldValue('age') > 24 ) {
            item.setFieldValue('age', 25)
                .setFieldBackground('age', 'green')
                .setFieldNote('age', 'Happy 25 th birthday')
              .commit()
        }    
    }
}

```


---

If the Item object have a method that is not in our API yet, you can always get the Range object for any given line or field and access every methods available to the GAS Range object documented here: https://developers.google.com/apps-script/reference/spreadsheet/range

   
```javascript

function getItemRanges() {
    var table = Sheetfu.getTable('people', 1);
    
    for (var i = 0; i < table.items.length; i++) {
        var item = table.items[i];
        var lineRange = item.getLineRange();
        var ageRange = item.getFieldRange('age');
    }
}

```

---

Every examples above assume that the target sheet only contains the table data. In many cases, we have more complex sheets that contains multiple mini grid/tables.
Sheetfu can easily handle this situation by creating a table from a Range object instead of a sheet name. The submitted Range object must contain the header on its first line.


```javascript

function getItemRanges() {
    var peopleRange = SpreadsheetApp().getSheetByName('people').getRange(1, 1, 20, 3);
    var animalRange = SpreadsheetApp().getSheetByName('people').getRange(60, 60, 10, 5);
    
    var peopleTable = new Table(peopleRange);
    var animalTable = new Table(animalRange);
    
    
    // Alternatively you can create a table by using a named Range.
    var table = Sheetfu.getTableByName('people_named_range');
}

```

---

If you have a field that you know is a unique value for every item (like an ID, email, etc...), 
you can create a table index to have very fast lookup if you want to search by ID.


Let's take the following table as an example. We consider the email column to have unique values.

| email  | first_name | last_name | age |
| --- | ---------- | --------- | --- |
| philippe@gmail.com   | Philippe   | Oger      | 36  |
| guillem@gmail.com   | Guillem    | Orpinell  | 25  |
| john@gmail.com   | John       | Doe       | 32  |
| jane@gmail.com   | Jane       | Doe       | 32  |



```javascript

function lookingForPhilippe() {
  
    // THE OLD WAY (very slow)
    var table = Sheetfu.getTable('people', 1);
    var philippe = table.select({'email': 'philippe@gmail.com'}).first();
    
    // THE NEW WAY
    // we tell Sheetfu to create an index with the 'email' field
    var table = Sheetfu.getTable('people', 1, 'email');
    var philippe = table.getItemById('philippe@gmail.com');
    
    // Also work when you create a table with the Table Object
    var range = SpreadsheetApp().getSheetByName('people').getRange(1, 1, 20, 4);
    var indexField = 'email';
    var table = Sheetfu.getTable(range, indexField);
    var philippe = table.getItemById('philippe@gmail.com');
}

```

If you have a table of 20,000 lines, and you have to do make multiple lookups within the same process, performance will improve by orders of magnitude.


### Some comments/caveats:

* You must not have duplicate fields in your header (columns with same field name).
* The range used for creating a Table object must contain the header in the first row.
* The Table object takes all the sheet data in memory, you can then manipulate, query it as you wish, but this will not change the data on the sheet until you commit the data.
* You can commit Item or Table objects. No need to commit items if you plan on committing your table. You usually do one or the other.
 




### Installation


You can use this code in 2 ways:
* GIT clone this repo and create your own app script file using this code. Be aware that you will not need to precede function and object with 'Sheetfu' as shown in examples above.'
* Access it as an app script library from the app script editor (recommended).
    * Go to Resources > Libraries ...
    * In the 'Add a library' placeholder, add the following key: 1N8BGDNX4N64WP4HRjsnZJNwBx2UrAbc_DPZKYwFnVxqzeJdqEJQuCBSv
    * 'Sheetfu' should be prompted. Select the last version.
    * You can then access the library functions and objects by starting to type Sheetfu and the auto-completion should be triggered..

