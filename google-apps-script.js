/**
 * Google Apps Script Backend for Job Request Platform
 * Paste this code into Extensions > Apps Script in your Google Sheet
 */

// Helper to set up CORS response
function corsResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET Requests: Read jobs from the sheet
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Jobs");
    if (!sheet) {
      return corsResponse({ success: false, error: "Sheet 'Jobs' not found. Please create it." });
    }
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return corsResponse({ success: true, data: [] }); // Only header or empty
    }
    
    var headers = data[0];
    var jobs = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var job = {};
      for (var j = 0; j < headers.length; j++) {
        var val = row[j];
        // Parse parsed images array if saved as JSON string
        if (headers[j] === "photos" && typeof val === "string" && val.length > 0) {
          try {
            val = JSON.parse(val);
          } catch (err) {
            val = val.split(","); // Fallback
          }
        }
        job[headers[j]] = val;
      }
      jobs.push(job);
    }
    
    // Sort jobs so that newest are first
    jobs.sort(function(a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return corsResponse({ success: true, data: jobs });
  } catch (error) {
    return corsResponse({ success: false, error: error.toString() });
  }
}

// POST Requests: Create or Update jobs
function doPost(e) {
  try {
    var payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }
    
    var action = payload.action || "create";
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Jobs");
    if (!sheet) {
      // Auto-create sheet if missing
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      sheet = ss.insertSheet("Jobs");
      var defaultHeaders = [
        "id", "category", "priority", "clientName", "businessName", 
        "phoneNumber", "email", "jobDescription", "address", 
        "preferredDateTime", "photos", "status", "isNew", "createdAt"
      ];
      sheet.appendRow(defaultHeaders);
    }
    
    if (action === "create") {
      // 1. Prepare new job entry
      var id = payload.id || "JOB-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      var category = payload.category || "Other";
      var priority = payload.priority || "Normal";
      var clientName = payload.clientName || "";
      var businessName = payload.businessName || "";
      var phoneNumber = payload.phoneNumber || "";
      var email = payload.email || "";
      var jobDescription = payload.jobDescription || "";
      var address = payload.address || "";
      var preferredDateTime = payload.preferredDateTime || "";
      
      // Photos can be array of base64 strings or images
      var photosString = "";
      if (payload.photos) {
        photosString = JSON.stringify(payload.photos);
      }
      
      var status = "Pending";
      var isNew = true;
      var createdAt = new Date().toISOString();
      
      // Row mapped to: id, category, priority, clientName, businessName, phoneNumber, email, jobDescription, address, preferredDateTime, photos, status, isNew, createdAt
      var rowData = [
        id, category, priority, clientName, businessName, 
        phoneNumber, email, jobDescription, address, 
        preferredDateTime, photosString, status, isNew, createdAt
      ];
      
      sheet.appendRow(rowData);
      
      return corsResponse({ 
        success: true, 
        message: "Job requested successfully!", 
        data: { id: id, status: status } 
      });
      
    } else if (action === "update") {
      // 2. Update existing job (Accept / Decline / Read status)
      var jobId = payload.id;
      if (!jobId) {
        return corsResponse({ success: false, error: "Missing job ID for update action" });
      }
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var idColIndex = headers.indexOf("id");
      var statusColIndex = headers.indexOf("status");
      var isNewColIndex = headers.indexOf("isNew");
      
      var rowIndex = -1;
      for (var r = 1; r < data.length; r++) {
        if (data[r][idColIndex] === jobId) {
          rowIndex = r + 1; // row is 1-indexed and header counts
          break;
        }
      }
      
      if (rowIndex === -1) {
        return corsResponse({ success: false, error: "Job with ID " + jobId + " not found." });
      }
      
      // Update fields if provided in payload
      if (payload.status && statusColIndex !== -1) {
        sheet.getCell(rowIndex, statusColIndex + 1).setValue(payload.status);
      }
      
      if (payload.isNew !== undefined && isNewColIndex !== -1) {
        sheet.getCell(rowIndex, isNewColIndex + 1).setValue(payload.isNew);
      }
      
      return corsResponse({ 
        success: true, 
        message: "Job status updated successfully!", 
        data: { id: jobId, status: payload.status }
      });
      
    } else {
      return corsResponse({ success: false, error: "Unknown action: " + action });
    }
    
  } catch (error) {
    return corsResponse({ success: false, error: error.toString() });
  }
}
