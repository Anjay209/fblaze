console.log("control.js loaded");

// Define competitionNames first if not already defined
if (typeof competitionNames === 'undefined') {
  var competitionNames = [
    "Accounting",
    "Advanced Accounting",
    "Advertising",
    "Agribusiness",
    "Banking & Financial Systems",
    "Broadcast Journalism",
    "Business Communication",
    "Business Ethics",
    "Business Law",
    "Business Management",
    "Business Plan",
    "Career Portfolio",
    "Coding & Programming",
    "Community Service Project",
    "Computer Applications",
    "Computer Game & Simulation Programming",
    "Computer Problem Solving",
    "Customer Service",
    "Cybersecurity",
    "Data Analysis",
    "Data Science & AI",
    "Digital Animation",
    "Digital Video Production",
    "Economics",
    "Entrepreneurship",
    "Event Planning",
    "Financial Planning",
    "Financial Statement Analysis",
    "Future Business Educator",
    "Future Business Leader",
    "Graphic Design",
    "Healthcare Administration",
    "Hospitality & Event Management",
    "Human Resource Management",
    "Impromptu Speaking",
    "Insurance & Risk Management",
    "International Business",
    "Introduction to Business Communication",
    "Introduction to Business Concepts",
    "Introduction to Business Presentation",
    "Introduction to Business Procedures",
    "Introduction to FBLA",
    "Introduction to Information Technology",
    "Introduction to Marketing Concepts",
    "Introduction to Parliamentary Procedure",
    "Introduction to Programming",
    "Introduction to Public Speaking",
    "Introduction to Retail & Merchandising",
    "Introduction to Social Media Strategy",
    "Introduction to Supply Chain Management",
    "Job Interview",
    "Journalism",
    "Local Chapter Annual Business Report",
    "Management Information Systems",
    "Marketing",
    "Mobile Application Development",
    "Network Design",
    "Networking Infrastructures",
    "Organizational Leadership",
    "Parliamentary Procedure",
    "Personal Finance",
    "Project Management",
    "Public Administration & Management",
    "Public Service Announcement",
    "Public Speaking",
    "Real Estate",
    "Retail Management",
    "Sales Presentation",
    "Securities & Investments",
    "Social Media Strategies",
    "Sports & Entertainment Management",
    "Supply Chain Management",
    "Technology Support & Services",
    "Visual Design",
    "Website Coding & Development",
    "Website Design"
  ];
}

/* PDF.js worker */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/* Firebase init */
const db = firebase.firestore();

/* UI refs */
const grid = document.getElementById("competition-grid");
const modal = document.getElementById("upload-modal");
const modalTitle = document.getElementById("modal-title");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("pdf-input");
const notesInput = document.getElementById("change-notes");

let activeCompetition = null;

/* Render competitions */
competitionNames.forEach(function(name) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML =
    "<h3>" + name + "</h3>" +
    "<div class='meta'>Baseline Memory Enabled</div>" +
    "<div class='meta'>PDF Upload Enabled</div>";
  card.onclick = function() {
    openModal(name);
  };
  grid.appendChild(card);
});

/* Modal control */
window.openModal = function(name) {
  activeCompetition = name;
  modalTitle.textContent = "Upload Baseline PDF for " + name;
  modal.classList.remove("hidden");
};

window.closeModal = function() {
  modal.classList.add("hidden");
};

/* PDF extraction */
async function extractTextFromPDF(file) {
  console.log("extractTextFromPDF started");
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map(function(item) {
        return item.str;
      })
      .join(" ");
    text += "\n\n--- PAGE " + i + " ---\n\n" + pageText;
  }

  console.log("PDF extracted, length:", text.length);
  return text;
}

/* Handle PDF */
async function handlePDF(file) {
  console.log("handlePDF called", file);
  if (!file || !activeCompetition) return;

  try {
    const extractedText = await extractTextFromPDF(file);

    await setDoc(
      doc(db, "competitions", activeCompetition),
      {
        baseline: {
          text: extractedText,
          version: 1,
          notes: notesInput.value || "",
          updatedAt: serverTimestamp()
        }
      },
      { merge: true }
    );

    alert("Baseline PDF processed and saved.");
    closeModal();
  } catch (e) {
    console.error("Firestore write failed:", e);
    alert("ERROR - check console");
  }
}

/* Drag and drop */
dropZone.onclick = function() {
  fileInput.click();
};

dropZone.ondragover = function(e) {
  e.preventDefault();
  dropZone.style.borderColor = "#6a6fdc";
};

dropZone.ondragleave = function() {
  dropZone.style.borderColor = "#cfd3ff";
};

dropZone.ondrop = function(e) {
  e.preventDefault();
  dropZone.style.borderColor = "#cfd3ff";
  handlePDF(e.dataTransfer.files[0]);
};

fileInput.onchange = function(e) {
  handlePDF(e.target.files[0]);
};
