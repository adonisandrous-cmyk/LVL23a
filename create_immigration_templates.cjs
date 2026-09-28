/**
 * Generates official vector PDF templates for EOIR-33 and I-589
 */
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function createEoir33Template() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // Standard 8.5 x 11
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const darkGray = rgb(0.2, 0.2, 0.2);

  // Header Box
  page.drawText('U.S. Department of Justice', { x: 50, y: 745, size: 9, font: fontBold, color: black });
  page.drawText('Executive Office for Immigration Review', { x: 50, y: 733, size: 8, font, color: black });
  page.drawText('Board of Immigration Appeals / Immigration Court', { x: 50, y: 721, size: 8, font, color: black });

  page.drawText('ALIEN\'S CHANGE OF ADDRESS FORM', { x: 190, y: 690, size: 13, font: fontBold, color: black });
  page.drawText('FORM EOIR-33 / BIA / IMMIGRATION COURT', { x: 185, y: 675, size: 9, font: fontBold, color: darkGray });

  // Outer form box
  page.drawRectangle({
    x: 45,
    y: 100,
    width: 522,
    height: 560,
    borderColor: black,
    borderWidth: 1.5,
  });

  // Section 1: Alien Registration Number (A-Number)
  page.drawText('1. Name and Alien Registration Number:', { x: 55, y: 640, size: 10, font: fontBold, color: black });
  page.drawText('Full Legal Name: ________________________________________________________________', { x: 65, y: 620, size: 9, font, color: darkGray });
  page.drawText('Alien Registration Number ("A" Number): A _______________________________________', { x: 65, y: 595, size: 9, font, color: darkGray });

  // Section 2: New Address
  page.drawText('2. My NEW Address is:', { x: 55, y: 565, size: 10, font: fontBold, color: black });
  page.drawText('Number and Street: ______________________________________________________________', { x: 65, y: 545, size: 9, font, color: darkGray });
  page.drawText('City, State, and Zip Code: ________________________________________________________', { x: 65, y: 520, size: 9, font, color: darkGray });
  page.drawText('Telephone Number: _________________________   Email: ____________________________', { x: 65, y: 495, size: 9, font, color: darkGray });

  // Section 3: Old Address
  page.drawText('3. My FORMER Address was:', { x: 55, y: 465, size: 10, font: fontBold, color: black });
  page.drawText('Former Street Address: __________________________________________________________', { x: 65, y: 445, size: 9, font, color: darkGray });
  page.drawText('Former City, State, and Zip: ______________________________________________________', { x: 65, y: 420, size: 9, font, color: darkGray });

  // Warning & Proof of Service
  page.drawText('PROOF OF SERVICE (You must mail a copy to ICE Office of the Principal Legal Advisor)', { x: 55, y: 385, size: 9, font: fontBold, color: black });
  page.drawText('I served a copy of this Change of Address Form on the Office of the Chief Counsel, ICE at:', { x: 55, y: 365, size: 8, font, color: darkGray });
  page.drawText('Address: ________________________________________________________________________', { x: 65, y: 345, size: 8, font, color: darkGray });
  page.drawText('Date Served: ___________________________   Method: [ ] First Class Mail   [ ] Personal', { x: 65, y: 320, size: 8, font, color: darkGray });

  // Signature Block
  page.drawText('SIGNATURE: _________________________________________   DATE: ___________________', { x: 65, y: 250, size: 9, font: fontBold, color: black });

  // Footer OMB
  page.drawText('Form EOIR-33 (Rev. 01/2024)                                                        OMB# 1125-0004', { x: 50, y: 40, size: 8, font, color: darkGray });

  const bytes = await doc.save();
  fs.mkdirSync('templates', { recursive: true });
  fs.writeFileSync('templates/EOIR-33.pdf', bytes);
  console.log('Created templates/EOIR-33.pdf');
}

async function createI589Template() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const darkGray = rgb(0.2, 0.2, 0.2);

  // Top Title
  page.drawText('U.S. Department of Homeland Security / U.S. Department of Justice', { x: 50, y: 745, size: 8, font: fontBold, color: black });
  page.drawText('USCIS / Executive Office for Immigration Review (EOIR)', { x: 50, y: 733, size: 8, font, color: black });

  page.drawText('APPLICATION FOR ASYLUM AND FOR WITHHOLDING OF REMOVAL', { x: 95, y: 695, size: 12, font: fontBold, color: black });
  page.drawText('Form I-589 • OMB No. 1615-0067', { x: 230, y: 680, size: 9, font: fontBold, color: darkGray });

  // Border Box Part A.I.
  page.drawRectangle({
    x: 45,
    y: 120,
    width: 522,
    height: 540,
    borderColor: black,
    borderWidth: 1.5,
  });

  page.drawText('Part A.I. Information About You', { x: 55, y: 642, size: 10, font: fontBold, color: black });

  page.drawText('1. Alien Registration Number (A-Number): A _______________________________________', { x: 65, y: 620, size: 9, font, color: darkGray });
  page.drawText('2. U.S. Social Security Number: __________________________________________________', { x: 65, y: 595, size: 9, font, color: darkGray });
  page.drawText('3. Complete Last Name: __________________________ First Name: ___________________', { x: 65, y: 570, size: 9, font, color: darkGray });
  page.drawText('4. What other names have you used? ______________________________________________', { x: 65, y: 545, size: 9, font, color: darkGray });
  page.drawText('5. Residence in the U.S. (Street Number and Name): _______________________________', { x: 65, y: 520, size: 9, font, color: darkGray });
  page.drawText('   City: _________________________ State: __________ Zip Code: __________________', { x: 65, y: 495, size: 9, font, color: darkGray });
  page.drawText('6. Telephone Number: _________________________ Email Address: ___________________', { x: 65, y: 470, size: 9, font, color: darkGray });
  page.drawText('7. Gender: [ ] Male   [ ] Female   8. Marital Status: [ ] Married   [ ] Single', { x: 65, y: 445, size: 9, font, color: darkGray });
  page.drawText('9. Date of Birth (mm/dd/yyyy): _________________ 10. City and Country of Birth: __', { x: 65, y: 420, size: 9, font, color: darkGray });
  page.drawText('11. Present Nationality (Citizenship): ___________________________________________', { x: 65, y: 395, size: 9, font, color: darkGray });
  page.drawText('12. Race, Ethnic, or Tribal Group: _______________________________________________', { x: 65, y: 370, size: 9, font, color: darkGray });
  page.drawText('13. Religion: ___________________________________________________________________', { x: 65, y: 345, size: 9, font, color: darkGray });

  page.drawText('14. Check the box indicating basis of application:', { x: 65, y: 310, size: 9, font: fontBold, color: black });
  page.drawText('[X] Political Opinion   [ ] Race   [ ] Religion   [ ] Nationality   [ ] Membership in PSG', { x: 75, y: 290, size: 8, font, color: darkGray });

  page.drawText('SIGNATURE OF APPLICANT: _____________________________   DATE: _________________', { x: 65, y: 200, size: 9, font: fontBold, color: black });

  page.drawText('Form I-589 (Edition 03/01/23)                                                       Page 1 of 12', { x: 50, y: 40, size: 8, font, color: darkGray });

  const bytes = await doc.save();
  fs.mkdirSync('templates', { recursive: true });
  fs.writeFileSync('templates/I-589.pdf', bytes);
  console.log('Created templates/I-589.pdf');
}

(async () => {
  await createEoir33Template();
  await createI589Template();
})();
