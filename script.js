const ORDERS_SHEET_NAME = 'Orders'; // MUST match the name in your sheet

// Function to handle GET requests (optional, but good practice)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ result: "error", message: "Method not supported. Use POST." }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Function to handle POST requests (This is what saves the order)
function doPost(e) {
  let lock;
  try {
    lock = LockService.getScriptLock();
    lock.waitLock(30000); // Wait 30 seconds for a lock

    // Get the active spreadsheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(ORDERS_SHEET_NAME);
    
    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(ORDERS_SHEET_NAME);
      // Add headers
      sheet.getRange(1, 1, 1, 6).setValues([['Timestamp', 'Name', 'Phone', 'Items', 'Total', 'Status']]);
    }

    // Validate input data
    if (!e.postData || !e.postData.contents) {
      throw new Error("No data received.");
    }

    const data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.userName || !data.userPhone || !data.itemsString || !data.total) {
      throw new Error("Missing required fields.");
    }

    const rowData = [
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), // Timestamp
      data.userName,               // Name
      data.userPhone,              // Phone
      data.itemsString,            // Items
      parseFloat(data.total),      // Total (ensure it's a number)
      "Pending Acceptance"         // Status
    ];

    sheet.appendRow(rowData);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Order saved successfully." }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    console.error('Apps Script Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (lock) {
      lock.releaseLock();
    }
  }
}
