/**
 * ============================================================================
 * PHOENIX 23 LEGAL OS — MULTI-ACCOUNT INGESTION & DISPATCH BRIDGE
 * Accounts: level23@gmail.com, level23consulting@gmail.com, adonisandrous@gmail.com
 * ============================================================================
 * 
 * Instructions for Google Apps Script Deployment:
 * 1. Open Google Drive -> New -> More -> Google Apps Script (or visit https://script.google.com).
 * 2. Replace all code in Code.gs with this entire file.
 * 3. Update STAGING_FOLDER_ID with your shared Google Drive folder ID.
 *    (If left blank or placeholder, the script will automatically create a "Phoenix23_Intake_Staging" folder in your Drive).
 * 4. Click "Deploy" -> "New deployment" -> Select type "Web app".
 * 5. Configuration:
 *    - Description: "Phoenix 23 Multi-Account Ingestion & Dispatch Bridge"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone" (allows webhook submissions from web forms and Phoenix 23 app)
 * 6. Click "Deploy", authorize permissions, and copy the Web App URL into your Phoenix 23 Legal OS settings!
 */

// Configuration Constants
const STAGING_FOLDER_ID = "1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH"; // Level 23 Drive Folder ID
const INBOX_FOLDER_NAME = "_inbox"; // Designated intake folder Phoenix works from
const AUTHORIZED_SENDERS = [
  "level23consulting@gmail.com",
  "level23@gmail.com",
  "adonisandrous@gmail.com"
];
const PHOENIX_WEBHOOK_URL = "https://ais-dev-tu43nr3iiqhbuewih2z7pa-536963766745.us-west2.run.app/api/phoenix/webhook-intake";

/**
 * Webhook receiver for HTTP POST requests (Forms, External Webhooks, Client Portal)
 */
function doPost(e) {
  return handleIncomingClientIntake(e);
}

/**
 * Health check and status endpoint for HTTP GET requests
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ONLINE",
    service: "Phoenix 23 Legal OS Multi-Account Ingestion & Dispatch Bridge",
    authorizedSenders: AUTHORIZED_SENDERS,
    stagingFolderConfigured: STAGING_FOLDER_ID !== "YOUR_GOOGLE_DRIVE_FOLDER_ID",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Main Intake Handler: Parses payload, saves to Google Drive, and triggers Phoenix AI Pipeline
 */
function handleIncomingClientIntake(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Empty intake payload received. Request body must contain valid JSON.");
    }

    const rawData = JSON.parse(e.postData.contents);
    const caseNumber = (rawData.case_info && rawData.case_info.case_number) || 
                       rawData.caseNumber || 
                       rawData.case_number || 
                       `CASE-${Date.now()}`;
    const clientName = (rawData.client_info && rawData.client_info.full_name) || 
                       rawData.clientName || 
                       rawData.name || 
                       "Confidential Client";

    // Resolve Google Drive Staging Folder
    const folder = getOrCreateStagingFolder();
    
    // Save intake payload to shared Google Drive repository
    const fileName = `Phoenix23_Intake_${caseNumber}_${Date.now()}.json`;
    const file = folder.createFile(
      fileName, 
      JSON.stringify(rawData, null, 2), 
      MimeType.JSON
    );

    // Multi-Account Permissions Sharing
    grantMultiAccountAccess(file, folder);

    // Trigger Phoenix AI Persona pipeline for automated form population
    const pipelineResult = triggerPhoenixPipeline(file.getId(), rawData);

    // Send email dispatch transmittal notification to all authorized accounts
    dispatchMultiAccountNotification(clientName, caseNumber, file.getUrl(), pipelineResult);

    return ContentService.createTextOutput(JSON.stringify({
      status: "SUCCESS",
      fileId: file.getId(),
      fileName: fileName,
      fileUrl: file.getUrl(),
      caseNumber: caseNumber,
      clientName: clientName,
      accountsSynchronized: AUTHORIZED_SENDERS,
      pipelineResult: pipelineResult,
      message: "Client intake synchronized across all accounts and queued for Phoenix 23 form population."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("[PHOENIX_ERROR] " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "ERROR",
      message: error.toString(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Triggers the Phoenix 23 AI Persona pipeline to parse legal facts and auto-populate court forms
 */
function triggerPhoenixPipeline(fileId, rawData) {
  try {
    // If rawData is not passed, retrieve it from the file
    let intakePayload = rawData;
    if (!intakePayload && fileId) {
      const file = DriveApp.getFileById(fileId);
      intakePayload = JSON.parse(file.getBlob().getDataAsString());
    }

    // Call Phoenix 23 Legal OS Webhook endpoint
    if (PHOENIX_WEBHOOK_URL && PHOENIX_WEBHOOK_URL.startsWith("http")) {
      const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          source: "Google_Apps_Script_MultiAccount_Bridge",
          fileId: fileId,
          accounts: AUTHORIZED_SENDERS,
          intakePayload: intakePayload,
          dispatchedAt: new Date().toISOString()
        }),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(PHOENIX_WEBHOOK_URL, options);
      const statusCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      Logger.log(`[PIPELINE_STATUS] HTTP ${statusCode}: ${responseText.substring(0, 150)}`);
      
      return {
        success: statusCode >= 200 && statusCode < 300,
        statusCode: statusCode,
        details: "Phoenix AI Persona pipeline dispatched to Legal OS server."
      };
    }

    return {
      success: true,
      details: "Intake registered locally in Drive repository."
    };
  } catch (err) {
    Logger.log("[PIPELINE_ERROR] " + err.toString());
    return {
      success: false,
      error: err.toString()
    };
  }
}

/**
 * Grants access to all authorized accounts (level23@gmail.com, level23consulting@gmail.com, adonisandrous@gmail.com)
 */
function grantMultiAccountAccess(file, folder) {
  AUTHORIZED_SENDERS.forEach(email => {
    try {
      if (email && email.indexOf("@") > 0) {
        file.addEditor(email);
        folder.addEditor(email);
      }
    } catch (e) {
      // Ignore if user already has access or external sharing policies apply
      Logger.log(`[SHARE_NOTICE] Sharing with ${email}: ${e.message}`);
    }
  });
}

/**
 * Sends notification emails to all authorized accounts
 */
function dispatchMultiAccountNotification(clientName, caseNumber, driveUrl, pipelineResult) {
  const recipients = AUTHORIZED_SENDERS.join(",");
  const subject = `⚖️ [Phoenix 23 Intake] Case ${caseNumber} — ${clientName} Synchronized`;
  
  const body = `Dear Phoenix 23 Legal OS Administrator,

A new client intake dossier has been successfully ingested through the Multi-Account Bridge:

• Client Name: ${clientName}
• Case Number: ${caseNumber}
• Google Drive Repository Link: ${driveUrl}
• Authorized Senders / Accounts: ${AUTHORIZED_SENDERS.join(", ")}
• Phoenix AI Persona Pipeline: ${pipelineResult && pipelineResult.success ? "ACTIVE / QUEUED FOR FORM POPULATION" : "RECORDED IN DRIVE"}
• Timestamp: ${new Date().toLocaleString()}

The intake payload has been indexed for automated legal form population (FL-100, FL-115, FL-140, FL-150, and Bankruptcy Petition Schedules).

You can review the generated court pleadings directly in the Phoenix 23 Legal OS workspace.

Sincerely,
Phoenix 23 Multi-Account Ingestion & Dispatch Bridge
Level 23 Legal AI Suite`;

  try {
    MailApp.sendEmail(recipients, subject, body);
  } catch (err) {
    Logger.log("[EMAIL_NOTICE] Unable to send notification email: " + err.message);
  }
}

/**
 * Helper to get existing Staging Folder (_inbox) or create one automatically
 */
function getOrCreateStagingFolder() {
  if (STAGING_FOLDER_ID) {
    try {
      const rootFolder = DriveApp.getFolderById(STAGING_FOLDER_ID);
      // Search for _inbox child folder
      const childFolders = rootFolder.getFoldersByName(INBOX_FOLDER_NAME);
      if (childFolders.hasNext()) {
        return childFolders.next();
      }
      // Create _inbox inside designated parent folder
      const inboxFolder = rootFolder.createFolder(INBOX_FOLDER_NAME);
      inboxFolder.setDescription("Designated _inbox staging repository for Phoenix 23 Legal OS client intakes.");
      return inboxFolder;
    } catch (e) {
      Logger.log("[DRIVE_NOTICE] Specified folder ID not found or permission check: " + e.toString());
    }
  }

  const folderName = INBOX_FOLDER_NAME;
  const existingFolders = DriveApp.getFoldersByName(folderName);
  if (existingFolders.hasNext()) {
    return existingFolders.next();
  }
  
  const newFolder = DriveApp.createFolder(folderName);
  newFolder.setDescription("Designated _inbox staging repository for Phoenix 23 Legal OS client intakes.");
  return newFolder;
}

/**
 * Built-In Test Runner for Google Apps Script:
 * Select this function in the dropdown and click "Run" to test without external forms!
 */
function testSimulateIntake() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        source: "TestRunner_Manual_Execution",
        case_info: {
          case_number: "FAM-2026-0891",
          jurisdiction: "California Superior Court, County of Los Angeles",
          matter_type: "Dissolution of Marriage with Minor Children"
        },
        client_info: {
          full_name: "Eleanor Vance",
          email: "eleanor.vance@example.com",
          phone: "(310) 555-0194",
          residence_county: "Los Angeles",
          length_of_residence_months: 48
        },
        respondent_info: {
          full_name: "Julian Vance",
          address: "4820 Wilshire Blvd, Los Angeles, CA 90010"
        },
        marriage_info: {
          marriage_date: "2016-04-12",
          separation_date: "2026-01-15",
          years_married: 9.8
        },
        children: [
          { name: "Chloe Vance", birthdate: "2018-09-22", age: 7 },
          { name: "Liam Vance", birthdate: "2021-03-14", age: 5 }
        ],
        assets_and_debts: {
          real_estate: "Single family residence in Pasadena, CA (approx equity $450,000)",
          vehicles: "2022 Tesla Model Y, 2020 Audi Q5",
          separate_property_claims: "Inherited brokerage account ($120,000 held by Eleanor)",
          community_liabilities: "Chase credit card balance $14,200, Solar loan $22,000"
        },
        relief_requested: [
          "Dissolution of Marriage (Divorce)",
          "Joint Legal Custody with Primary Physical Custody to Petitioner",
          "Child Support according to California Statewide Guideline",
          "Reservation of Jurisdiction over Spousal Support"
        ]
      })
    }
  };

  const response = handleIncomingClientIntake(mockEvent);
  Logger.log("Test Result Output: " + response.getContent());
}
