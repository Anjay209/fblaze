
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDGYp9sBwOWBdu9W46Q6XFp9zfLCrEsaO4",
    authDomain: "certquest-94959.firebaseapp.com",
    projectId: "certquest-94959",
    storageBucket: "certquest-94959.appspot.com",
    messagingSenderId: "323956529033",
    appId: "1:323956529033:web:e9c9c6a3c7668b8a72f358",
    measurementId: "G-F5JHTGGN6K"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();

  // Global variables
  let modal, backdrop, goalSubmitBtn, compsInput, goalCards, isMentorCheckbox, mentorCompDiv, mentorCompInput, selectedGoal;
  let cqSpeakingMediaRecorder = null;
  let cqSpeakingMediaStream = null;
  let cqSpeakingRecordedChunks = [];
  let isRecording = false;
  let quizTimer = null;  // Add this line
let quizTimeRemaining = 0;  // Add this line if you want timer functionality
let cameraStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingTimer = null;
let recordingSeconds = 0;
let cameraEnabled = true;
let micEnabled = true;
let selectedUploadFile = null;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

function showMentorCommentModal(assignmentName, comment, notificationId) {
  console.log("Showing mentor comment modal:", assignmentName, comment); // Debug log
  
  document.getElementById('mentorCommentAssignment').textContent = `Feedback for "${assignmentName}"`;
  document.getElementById('mentorCommentText').textContent = comment;
 document.getElementById('mentorCommentModal').style.display = 'flex';

  // When closed, mark notification as read
  window.closeMentorCommentModal = function() {
    document.getElementById('mentorCommentModal').style.display = 'none';
    if (notificationId) {
      db.collection('notifications').doc(notificationId).update({
        read: true
      }).catch(err => console.error("Error marking notification as read:", err));
    }
  };
}


let writtenQuestions = [];
let currentQuestionIndex = 0;
let writtenAnswers = {};
let writtenTimer = null;
let writtenTimeRemaining = 0;

const sampleWrittenQuestions = [
  {
    competency: "ACCOUNTING",
    question: "In accounting, what is the equation to calculate net income?",
    options: [
      "Assets = Liabilities + Equity",
      "Revenues - Expenses", 
      "Current Assets - Current Liabilities",
      "Gross Profit - Operating Expenses"
    ],
    correctAnswer: "Revenues - Expenses"
  },
  {
    competency: "FINANCE",
    question: "What is the primary purpose of a cash flow statement?",
    options: [
      "To show profitability over time",
      "To track cash receipts and payments",
      "To list all company assets",
      "To calculate tax obligations"
    ],
    correctAnswer: "To track cash receipts and payments"
  },
  {
    competency: "BUSINESS LAW",
    question: "Which type of business structure provides limited liability protection?",
    options: [
      "Sole Proprietorship",
      "Partnership",
      "Corporation",
      "None of the above"
    ],
    correctAnswer: "Corporation"
  },
  {
    competency: "MARKETING",
    question: "What are the 4 P's of marketing?",
    options: [
      "Product, Price, Place, Promotion",
      "People, Process, Physical, Promotion",
      "Product, Profit, Place, People",
      "Price, Profit, Promotion, People"
    ],
    correctAnswer: "Product, Price, Place, Promotion"
  },
  {
    competency: "ECONOMICS",
    question: "What happens to demand when the price of a good increases, all else being equal?",
    options: [
      "Demand increases",
      "Demand decreases",
      "Demand stays the same",
      "Demand becomes unpredictable"
    ],
    correctAnswer: "Demand decreases"
  },
  {
    competency: "MANAGEMENT",
    question: "Which leadership style involves making decisions without consulting team members?",
    options: [
      "Democratic",
      "Laissez-faire",
      "Autocratic",
      "Transformational"
    ],
    correctAnswer: "Autocratic"
  },
  {
    competency: "ENTREPRENEURSHIP",
    question: "What is a business plan primarily used for?",
    options: [
      "To impress investors only",
      "To outline business goals and strategies",
      "To calculate exact profits",
      "To hire employees"
    ],
    correctAnswer: "To outline business goals and strategies"
  },
  {
    competency: "BUSINESS ETHICS",
    question: "What is the main purpose of corporate social responsibility (CSR)?",
    options: [
      "To increase profits only",
      "To comply with legal requirements",
      "To contribute positively to society and environment",
      "To reduce employee wages"
    ],
    correctAnswer: "To contribute positively to society and environment"
  },
  {
    competency: "OPERATIONS",
    question: "What does 'Just-in-Time' inventory management aim to achieve?",
    options: [
      "Maximum inventory storage",
      "Minimum inventory while meeting demand",
      "Random inventory ordering",
      "Buying inventory in bulk always"
    ],
    correctAnswer: "Minimum inventory while meeting demand"
  },
  {
    competency: "HUMAN RESOURCES",
    question: "What is the primary purpose of performance appraisals?",
    options: [
      "To fire employees",
      "To evaluate and improve employee performance",
      "To reduce salaries",
      "To increase working hours"
    ],
    correctAnswer: "To evaluate and improve employee performance"
  }
];



  // Quiz answers
  let quizAnswers = {
    q1: "To make meetings more efficient",
    q2: "Adjourn", 
    q3: "Majority vote",
    q4: "Amend",
    q5: "\"I move to...\""
  };
  let userScore = 0;

  // Quiz Questions Array
// Replace your existing quizQuestions array with this
const quizQuestions = [
  {
    text: "What is the primary purpose of parliamentary procedure?",
    competency: "Meeting Management",
    correctAnswer: "To make meetings more efficient",
    options: [
      "To make meetings more efficient",
      "To give the president more power",
      "To eliminate debate",
      "To make meetings longer"
    ]
  },
  {
    text: "Which motion is used to end a meeting?",
    competency: "Meeting Management", 
    correctAnswer: "Adjourn",
    options: [
      "Adjourn",
      "Recess",
      "Postpone",
      "Table"
    ]
  },
  {
    text: "How many votes are typically needed to pass a motion?",
    competency: "Voting Procedures",
    correctAnswer: "Majority vote",
    options: [
      "Majority vote",
      "Unanimous vote",
      "Two-thirds vote",
      "Simple majority"
    ]
  },
  {
    text: "What motion is used to change a pending motion?",
    competency: "Amendment Process",
    correctAnswer: "Amend",
    options: [
      "Amend",
      "Substitute",
      "Withdraw",
      "Reconsider"
    ]
  },
  {
    text: "How should you properly introduce a motion?",
    competency: "Meeting Management",
    correctAnswer: "\"I move to...\"",
    options: [
      "\"I move to...\"",
      "\"I suggest that...\"",
      "\"I want to...\"",
      "\"I think we should...\""
    ]
  }
];

// Add this new function to analyze competency performance
function getQuizCompetencyBreakdown() {
  const competencyStats = {};

  document.querySelectorAll('.quiz-question').forEach((qDiv, idx) => {
    const competency = quizQuestions[idx].competency;
    const selectedOption = qDiv.querySelector('input[type="radio"]:checked');
    const isCorrect = selectedOption && 
                     selectedOption.value === quizQuestions[idx].correctAnswer;

    if (!competencyStats[competency]) {
      competencyStats[competency] = { total: 0, correct: 0 };
    }
    
    competencyStats[competency].total++;
    if (isCorrect) competencyStats[competency].correct++;
  });

  return competencyStats;
}

// Add this new function to show detailed results
function showCompetencyResults(score, totalQuestions, competencyStats) {
  const modal = document.getElementById('congratsModal');
  const content = modal.querySelector('.cq-modal-fields');
  
  let competencyHTML = Object.entries(competencyStats).map(([comp, stats]) => `
    <div class="competency-result">
      <span>${comp}:</span>
      <strong>${stats.correct}/${stats.total}</strong>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(stats.correct/stats.total)*100}%"></div>
      </div>
    </div>
  `).join('');

  content.innerHTML = `
    <h3 style="text-align:center">Quiz Results</h3>
    <div style="text-align:center; font-size:1.2rem; margin:1rem 0">
      Score: <strong>${score}/${totalQuestions}</strong>
    </div>
    <div style="margin-top:1.5rem">
      <h4>Competency Breakdown:</h4>
      ${competencyHTML}
    </div>
  `;

  modal.style.display = 'block';
}

function showNotification(title, description, onClick = null) {
    const list = document.getElementById("notificationList");
    const panel = document.getElementById("commentPanel");

    const item = document.createElement("div");
    item.className = "notification-item";
    item.innerHTML = `
        <div class="notification-header">
            <strong>${title}</strong>
            <span class="notification-time">Just now</span>
        </div>
        <div class="notification-body">${description}</div>
    `;

    if (onClick) {
        item.addEventListener("click", () => {
            onClick();
            // Don't remove the notification, just mark it as read
            item.classList.add("read");
        });
    }

    list.prepend(item);

    // Show a badge when new notifications arrive
    const notificationBadge = document.querySelector('.nav-icons li a[onclick="toggleCommentPanel()"] .notification-badge');
    if (notificationBadge) {
        notificationBadge.style.display = 'inline-block';
    }
}


function renderQuiz(questionsArr) {
  const quizContainer = document.getElementById('quizQuestions');
  quizContainer.innerHTML = questionsArr.map((q, idx) => `
    <div class="quiz-question" data-competency="${q.competency}">
      <h4>${idx + 1}. ${q.text}</h4>
      ${q.options.map(opt => `
        <label class="quiz-option">
          <input type="radio" name="q${idx+1}" value="${opt}"> ${opt}
        </label>
      `).join('')}
    </div>
  `).join('');
}

  function toggleAccordion(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('.chevron-icon');
    const isActive = button.classList.contains('active');
    if (isActive) {
      button.classList.remove('active');
      content.style.maxHeight = null;
      if (icon) icon.classList.remove('rotate');
    } else {
      button.classList.add('active');
      content.style.maxHeight = content.scrollHeight + "px";
      if (icon) icon.classList.add('rotate');
    }
  }

  // Check browser compatibility for recording
  function checkRecordingSupport() {
    const issues = [];
    
    if (!navigator.mediaDevices) {
      issues.push("mediaDevices not supported");
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      issues.push("getUserMedia not supported");
    }
    
    if (!window.MediaRecorder) {
      issues.push("MediaRecorder not supported");
    }
    
    if (issues.length > 0) {
      console.error("Recording not supported:", issues.join(", "));
      alert("Your browser does not support audio/video recording: " + issues.join(", "));
      return false;
    }
    
    return true;
  }

  // Fixed audio recording function
  function startAudioRecording() {
    document.getElementById('cq-speaking-downloadBtn').style.display = 'none';
    console.log("Starting audio recording...");
    
    if (!checkRecordingSupport()) return;
    
    // Stop any existing recording first
    cqSpeakingStopAllMedia();
    cqSpeakingRecordedChunks = [];
    
    navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    })
    .then(stream => {
      console.log("Audio stream obtained successfully");
      cqSpeakingMediaStream = stream;
      
      // Check MediaRecorder support and set up with best available format
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options.mimeType = 'audio/ogg';
      }
      
      cqSpeakingMediaRecorder = new MediaRecorder(stream, options);
      console.log("MediaRecorder created with mimeType:", cqSpeakingMediaRecorder.mimeType);
      
      cqSpeakingMediaRecorder.ondataavailable = (event) => {
        console.log("Audio data available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          cqSpeakingRecordedChunks.push(event.data);
        }
      };
      
      cqSpeakingMediaRecorder.onstop = () => {
  console.log("Audio recording stopped, processing...");
  if (cqSpeakingRecordedChunks.length === 0) {
    console.error("No audio data recorded");
    alert("No audio data was recorded. Please try again.");
    return;
  }
  const mimeType = cqSpeakingMediaRecorder.mimeType || 'audio/webm';
  const blob = new Blob(cqSpeakingRecordedChunks, { type: mimeType });
  console.log("Created audio blob:", blob.size, "bytes, type:", blob.type);

  const audioURL = URL.createObjectURL(blob);
  const audioElement = document.getElementById('cq-speaking-audioPlayback');
  if (audioElement) {
    audioElement.src = audioURL;
    audioElement.style.display = 'block';
    audioElement.controls = true;
    console.log("Audio playback element updated");
    audioElement.addEventListener('loadedmetadata', () => {
      console.log("Audio metadata loaded, duration:", audioElement.duration);
    });
    audioElement.addEventListener('error', (e) => {
      console.error("Audio playback error:", e);
    });
  } else {
    console.error("Audio playback element not found in DOM");
  }

  // Download & Upload section - THIS IS WHAT YOU WANT
  const downloadBtn = document.getElementById('cq-speaking-downloadBtn');
  if (downloadBtn && blob) {
    downloadBtn.style.display = 'inline-block';
    downloadBtn.onclick = function() {
      // Create a temporary link and trigger download
      const url = URL.createObjectURL(blob);
      const filename = `CertQuest_Response_${Date.now()}.mp4`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // Show the upload box immediately after download click
      document.getElementById('cq-speaking-uploadBox').style.display = 'block';
    };
  }

  isRecording = false;
};

      cqSpeakingMediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        alert("Recording error: " + event.error.message);
        isRecording = false;
      };
      
      // Start recording
      cqSpeakingMediaRecorder.start(1000); // Collect data every second
      isRecording = true;
      console.log("Audio recording started");
      
      // Show stop button
      const stopBtn = document.getElementById('cq-speaking-stopBtn');
      if (stopBtn) {
        stopBtn.style.display = 'inline-block';
        stopBtn.textContent = '⏹ Stop Audio Recording';
      }
      
      // Hide video preview if showing
      const videoPreview = document.getElementById('cq-speaking-videoPreview');
      if (videoPreview) {
        videoPreview.style.display = 'none';
      }
    })
    .catch(error => {
      console.error('Audio recording error:', error);
      let errorMessage = 'Failed to access microphone: ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Permission denied. Please allow microphone access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Microphone is already in use.';
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
      isRecording = false;
    });
  }

  // Fixed video recording function
  function startVideoRecording() {
    document.getElementById('cq-speaking-downloadBtn').style.display = 'none';

    console.log("Starting video recording...");
    
    if (!checkRecordingSupport()) return;
    
    // Stop any existing recording first
    cqSpeakingStopAllMedia();
    cqSpeakingRecordedChunks = [];
    
    navigator.mediaDevices.getUserMedia({ 
      video: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        frameRate: { min: 15, ideal: 30, max: 60 }
      }, 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    })
    .then(stream => {
      console.log("Video stream obtained successfully");
      cqSpeakingMediaStream = stream;
      
      const videoElement = document.getElementById('cq-speaking-videoPreview');
      if (!videoElement) {
        console.error("Video preview element not found in DOM");
        alert("Video preview element not found");
        return;
      }
      
      // Set up video preview
      videoElement.srcObject = stream;
      videoElement.muted = true; // Prevent feedback
      videoElement.autoplay = true;
      videoElement.playsInline = true; // Important for mobile
      videoElement.style.display = 'block';
      
      // Wait for video to be ready before starting recording
      videoElement.addEventListener('loadedmetadata', () => {
        videoElement.play().catch(e => {
          console.error("Error playing video preview:", e);
        });
      });
      
      // Hide audio playback if showing
      const audioPlayback = document.getElementById('cq-speaking-audioPlayback');
      if (audioPlayback) {
        audioPlayback.style.display = 'none';
      }
      
      // Set up MediaRecorder with best available format
      let options = {};
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options.mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        options.mimeType = 'video/webm;codecs=vp8';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options.mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options.mimeType = 'video/mp4';
      }
      
      cqSpeakingMediaRecorder = new MediaRecorder(stream, options);
      console.log("MediaRecorder created with mimeType:", cqSpeakingMediaRecorder.mimeType);
      
      cqSpeakingMediaRecorder.ondataavailable = (event) => {
        console.log("Video data available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          cqSpeakingRecordedChunks.push(event.data);
        }
      };
      
      cqSpeakingMediaRecorder.onstop = () => {
  console.log("Video recording stopped, processing...");
  if (cqSpeakingRecordedChunks.length === 0) {
    console.error("No video data recorded");
    alert("No video data was recorded. Please try again.");
    return;
  }
  const mimeType = cqSpeakingMediaRecorder.mimeType || 'video/webm';
  const blob = new Blob(cqSpeakingRecordedChunks, { type: mimeType });
  console.log("Created video blob:", blob.size, "bytes, type:", blob.type);

  const videoURL = URL.createObjectURL(blob);
  const videoElement = document.getElementById('cq-speaking-videoPreview');
  // Switch from live preview to recorded video
  if (videoElement) {
    videoElement.srcObject = null;
    videoElement.src = videoURL;
    videoElement.controls = true;
    videoElement.muted = false;
    videoElement.autoplay = false;
    videoElement.style.display = 'block';
    videoElement.addEventListener('loadedmetadata', () => {
      console.log("Recorded video metadata loaded, duration:", videoElement.duration);
    });
    videoElement.addEventListener('error', (e) => {
      console.error("Video playback error:", e);
    });
    videoElement.load();
  } else {
    console.error("Video preview element not found in DOM");
  }

  // Download & Upload section - THIS IS WHAT YOU WANT
  const downloadBtn = document.getElementById('cq-speaking-downloadBtn');
  if (downloadBtn && blob) {
    downloadBtn.style.display = 'inline-block';
    downloadBtn.onclick = function() {
      // Create a temporary link and trigger download
      const url = URL.createObjectURL(blob);
      const filename = `CertQuest_Response_${Date.now()}.webm`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // Show the upload box immediately after download click
      document.getElementById('cq-speaking-uploadBox').style.display = 'block';
    };
  }

  isRecording = false;
};

      cqSpeakingMediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        alert("Recording error: " + event.error.message);
        isRecording = false;
      };
      
      // Start recording
      cqSpeakingMediaRecorder.start(1000); // Collect data every second
      isRecording = true;
      console.log("Video recording started");
      
      // Show stop button
      const stopBtn = document.getElementById('cq-speaking-stopBtn');
      if (stopBtn) {
        stopBtn.style.display = 'inline-block';
        stopBtn.textContent = '⏹ Stop Video Recording';
      }
    })
    .catch(error => {
      console.error('Video recording error:', error);
      let errorMessage = 'Failed to access camera/microphone: ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Permission denied. Please allow camera and microphone access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera or microphone is already in use.';
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
      isRecording = false;
    });
  }

  
  function cqSpeakingStopAllMedia() {
    console.log("Stopping all media...");
    
    // Stop MediaRecorder
    if (cqSpeakingMediaRecorder && cqSpeakingMediaRecorder.state !== "inactive") {
      try {
        cqSpeakingMediaRecorder.stop();
      } catch (e) {
        console.error("Error stopping MediaRecorder:", e);
      }
    }
    
    // Stop all media tracks
    if (cqSpeakingMediaStream) {
      cqSpeakingMediaStream.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped track:", track.kind, track.label);
      });
      cqSpeakingMediaStream = null;
    }
    
    // Clear recorded data
    cqSpeakingRecordedChunks = [];
    
    // Hide stop button
    const stopBtn = document.getElementById('cq-speaking-stopBtn');
    if (stopBtn) {
      stopBtn.style.display = 'none';
    }
    
    // Reset video element
    const videoElement = document.getElementById('cq-speaking-videoPreview');
    if (videoElement) {
      videoElement.srcObject = null;
      videoElement.src = '';
      videoElement.controls = false;
    }
    
    isRecording = false;
    console.log("All media stopped and cleaned up");
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Check recording support on page load
    checkRecordingSupport();

    // Assign global variables
    modal = document.getElementById('goalModal');
    backdrop = document.querySelector('.modal-backdrop');
    goalSubmitBtn = document.getElementById('goalSubmitBtn');
    compsInput = document.getElementById('comps');
    goalCards = document.querySelectorAll('.goal-card');
    isMentorCheckbox = document.getElementById('isMentor');
    mentorCompDiv = document.getElementById('mentorCompDiv');
    mentorCompInput = document.getElementById('mentorComp');
    selectedGoal = null;

    // Set up recording button event listeners
    const audioBtn = document.getElementById('cq-speaking-audioBtn');
    const videoBtn = document.getElementById('cq-speaking-videoBtn');
    const stopBtn = document.getElementById('cq-speaking-stopBtn');
    const submitBtn = document.getElementById('cq-speaking-submitBtn');
    const closeBtn = document.querySelector('.cq-speaking-close');

    if (audioBtn) {
      audioBtn.addEventListener('click', startAudioRecording);
    }
    
    if (videoBtn) {
      videoBtn.addEventListener('click', startVideoRecording);
    }
    
    if (stopBtn) {
      stopBtn.addEventListener('click', stopRecording);
    }
    
    if (submitBtn) {
      submitBtn.addEventListener('click', submitSpeakingResponse);
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSpeakingAssignmentModal);
    }

    

    // === DRAG AND DROP UPLOAD FUNCTIONALITY ===
    let selectedUploadFile = null;

    function setupDragAndDrop() {
      const dropZone = document.getElementById('cq-speaking-dropZone');
      const uploadInput = document.getElementById('cq-speaking-uploadInput');
      const submitBtn = document.getElementById('cq-speaking-uploadSubmitBtn');
      const dropZoneText = document.getElementById('cq-speaking-dropZone-text');

      if (!dropZone || !uploadInput || !submitBtn || !dropZoneText) {
        return; // Elements don't exist yet
      }

      // Click on dropZone opens file dialog
      dropZone.addEventListener('click', (e) => {
        e.preventDefault();
        uploadInput.click();
      });

      // Drag over styling
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.background = '#e0ebff';
        dropZone.style.borderColor = '#1e40af';
        dropZone.style.transform = 'scale(1.02)';
      });

      // Drag enter
      dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      // Drag leave styling
      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only reset if we're leaving the dropZone itself
        if (!dropZone.contains(e.relatedTarget)) {
          dropZone.style.background = '#f3f6fd';
          dropZone.style.borderColor = '#2563eb';
          dropZone.style.transform = 'scale(1)';
        }
      });

      // Drop handler
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.background = '#f3f6fd';
        dropZone.style.borderColor = '#2563eb';
        dropZone.style.transform = 'scale(1)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          handleUploadFile(files[0]);
        }
      });

      // File input change handler
      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          handleUploadFile(file);
        }
      });

      function handleUploadFile(file) {
        console.log('File selected:', file.name, file.type, file.size);
        
        // Check file type
        if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
          dropZoneText.innerHTML = '❌ Please upload an audio or video file';
          submitBtn.disabled = true;
          
          selectedUploadFile = null;
          setTimeout(() => resetDropZone(), 3000);
          return;
        }

        // Check file size (limit to 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
          dropZoneText.innerHTML = '❌ File too large (max 100MB)';
          submitBtn.disabled = true;
          selectedUploadFile = null;
          setTimeout(() => resetDropZone(), 3000);
          return;
        }

        // File is valid
        selectedUploadFile = file;
        dropZoneText.innerHTML = `✅ Selected: ${file.name}`;
        submitBtn.disabled = false;
      }

      function resetDropZone() {
        selectedUploadFile = null;
        dropZoneText.textContent = 'Drop file here or click to select';
        submitBtn.disabled = true;
      }

      // Set up upload submit button
submitBtn.addEventListener('click', async () => {
  if (!selectedUploadFile) {
    alert('Please select a file first');
    return;
  }

  submitBtn.textContent = 'Uploading...';
  submitBtn.disabled = true;

  try {
    // Upload to GitHub
    const arrayBuffer = await selectedUploadFile.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    recordedChunks = [typedArray.buffer];

    await submitSpeakingResponse(); // this uploads to GitHub and updates Firestore

    // ✅ Mark assignment as completed in Firestore
    const user = firebase.auth().currentUser;
    const userId = user?.uid;
    const assignmentId = window.currentAssignment?.id;
    const filename = selectedUploadFile.name;
    const githubUrl = `https://${GITHUB_USERNAME.toLowerCase()}.github.io/${GITHUB_REPO}/docs/videos/${filename}`;

    if (userId && assignmentId) {
      await db
        .collection('users')
        .doc(userId)
        .collection('assignments')
        .doc(assignmentId)
        .update({
          status: 'completed',
          submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
          fileUrl: githubUrl,
          fileType: 'video',
        });
    }

    alert('Uploaded and marked as complete!');
    document.getElementById('cq-speaking-modal').style.display = 'none';
    markAllNotificationsRead();

  } catch (error) {
    console.error(error);
    alert('Upload failed: ' + (error?.message || error));
  }

  submitBtn.textContent = 'Send to Mentor';
  submitBtn.disabled = false;
});


  // --- Get mentee and assignment info ---
  const user = firebase.auth().currentUser;
  const menteeName = user?.displayName || user?.email || 'Anonymous';
  const assignmentTitle = window.currentAssignment?.title || "Assignment";
  
  // --- Get mentor email ---
    }

    // Call setup function
    setupDragAndDrop();

    function updateSaveState() {
      goalSubmitBtn.disabled = !(
        selectedGoal &&
        compsInput.value.trim() &&
        (!isMentorCheckbox.checked || mentorCompInput.value.trim())
      );
    }

    goalCards.forEach(card => {
      card.addEventListener('click', function() {
        goalCards.forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        selectedGoal = this.dataset.goal;
        updateSaveState();
      });
    });
    compsInput.addEventListener('input', updateSaveState);

    // Mentor logic
    if (isMentorCheckbox && mentorCompDiv && mentorCompInput) {
      isMentorCheckbox.addEventListener('change', function() {
        mentorCompDiv.style.display = isMentorCheckbox.checked ? 'block' : 'none';
        updateSaveState();
      });
      mentorCompInput.addEventListener('input', updateSaveState);
    }

    goalSubmitBtn.addEventListener('click', function() {
      if (
        selectedGoal &&
        compsInput.value.trim() &&
        (!isMentorCheckbox.checked || mentorCompInput.value.trim())
      ) {
        document.getElementById('userComps').textContent = compsInput.value.trim();
        const user = auth.currentUser;
        if (user) {
          // Parse competitions input as array, trim each, and remove blanks
          const competitionsArr = compsInput.value
            .split(',')
            .map(x => x.trim())
            .filter(Boolean);
          db.collection('users').doc(user.uid).set({
            competitions: competitionsArr,
            isMentor: isMentorCheckbox.checked,
            mentorCompetition: isMentorCheckbox.checked ? mentorCompInput.value.trim() : "",
            studyGoalSet: true
          }, { merge: true });
        }
        modal.style.display = 'none';
        backdrop.style.display = 'none';
      }
    });

    if (backdrop) {
      backdrop.addEventListener('click', function() {
        modal.style.display = 'none';
        backdrop.style.display = 'none';
      });
    }

    // ---- Show full name from Firestore and modal logic ----
    auth.onAuthStateChanged(function(user) {
      if (user) {
        db.collection('users').doc(user.uid).get()
          .then(function(doc) {
            let fullName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
            if (doc.exists && doc.data().name) {
              fullName = doc.data().name;
            }
            document.getElementById('userName').textContent = fullName;

            if (doc.exists && doc.data().competitions) {
              document.getElementById('userComps').textContent = doc.data().competitions;
            }

            // DEBUG: See exactly what Firestore returns!
            console.log("User doc.exists:", doc.exists);
            console.log("User doc.data:", doc.data());
            // Only show modal if not set (boolean false, undefined, or null)
            if (!doc.exists || !doc.data().studyGoalSet) {
              modal.style.display = 'block';
              backdrop.style.display = 'block';
            } else {
              modal.style.display = 'none';
              backdrop.style.display = 'none';
            }
          })
          .catch(function(error) {
            let fallbackName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
            document.getElementById('userName').textContent = fallbackName;
          });
          setupNotifications();
          // --- Mentor Comment Modal Check ---
(async function checkMentorComments() {
  try {
    const snapshot = await db.collection('notifications')
      .where('menteeId', '==', user.uid)
      .where('read', '==', false)
      .where('type', '==', 'mentorComment')  // Add this filter
      .get();

    snapshot.forEach(doc => {
      const notif = doc.data();
      console.log("Found mentor feedback notification:", notif); // Debug log
      showMentorCommentModal(
        notif.assignmentName || "Assignment",
        notif.comment || notif.message || "No feedback provided.", // Try both fields
        doc.id
      );
    });
  } catch (err) {
    console.error("Failed to check mentor comments:", err);
  }
})();

      } else {
        window.location.href = "/Public/index.html";
      }
    });

    // ============ MEILISEARCH INTEGRATION ============
    const client = new MeiliSearch({ host: 'http://127.0.0.1:7700' });
    const index = client.index('content');
    const searchBox = document.getElementById('navbarSearch');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchIcon = document.getElementById('navbarSearchIcon');

    if (searchBox && searchDropdown) {
      searchBox.addEventListener('input', async function(e) {
        const query = e.target.value.trim();
        if (!query) {
          searchDropdown.style.display = 'none';
          searchDropdown.innerHTML = '';
          return;
        }
        try {
          const result = await index.search(query, { limit: 5 });
          if (!result.hits.length) {
            searchDropdown.style.display = 'none';
            searchDropdown.innerHTML = '';
            return;
          }
          searchDropdown.style.display = 'block';
          searchDropdown.innerHTML = result.hits.map(doc => `
            <div class="dropdown-result" tabindex="0" data-url="${doc.url}">
              <b>${doc.title}</b><br>
              <span style="font-size:12px;color:#888;">${doc.category || ''}${doc.tags ? ' | ' + doc.tags.join(', ') : ''}</span>
            </div>
          `).join('');
        } catch (err) {
          searchDropdown.style.display = 'none';
          searchDropdown.innerHTML = '';
        }
      });

      // Handle result click
      searchDropdown.addEventListener('click', function(e) {
        const target = e.target.closest('.dropdown-result');
        if (target && target.dataset.url) {
          window.location = target.dataset.url;
        }
      });

      // Optional: Allow Enter key to open first result
      searchBox.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && searchDropdown.innerHTML) {
          const first = searchDropdown.querySelector('.dropdown-result');
          if (first && first.dataset.url) {
            window.location = first.dataset.url;
          }
        }
      });

      // Hide dropdown on outside click
      document.addEventListener('click', function(e) {
        if (!searchBox.contains(e.target) && !searchDropdown.contains(e.target)) {
          searchDropdown.style.display = 'none';
        }
      });

      // Click magnifier icon triggers search
      if (searchIcon) {
        searchIcon.addEventListener('click', () => {
          searchBox.dispatchEvent(new Event('input'));
        });
      }
    }

    // === REALTIME ASSIGNMENT LISTENER ===
    auth.onAuthStateChanged(function(user) {
      if (!user) return;
      
      
      console.log("Setting up assignment listener for user:", user.uid);
      
      db.collection('assignments')
        .where('to', '==', user.uid)
        .where('status', '==', 'assigned')
        .onSnapshot(snapshot => {
          console.log("Assignment snapshot received:", snapshot.size, "documents");
          
          snapshot.forEach(doc => {
            const data = doc.data();
            console.log("Assignment data:", data);
            
            if (data.status === "assigned") {
              showAssignmentModal(data, doc.id);
            }
          });
        }, error => {
          console.error("Assignment listener error:", error);
        });
    });
        document.head.insertAdjacentHTML('beforeend', uploadModalCSS);

  });

  // === ASSIGNMENT MODAL FUNCTIONS ===
function showAssignmentModal(assignment, docId) {
    console.log("showAssignmentModal called with:", assignment, docId);
    
    // Set the global assignment ID for later use
    window.latestAssignmentId = docId;
    window.currentAssignment = assignment;
    
    // Store notification in Firebase
    const user = firebase.auth().currentUser;
    if (user) {
        const notificationData = {
            menteeId: user.uid,
            type: 'assignment',
            assignmentId: docId,
            assignmentName: assignment.title || "New Assignment",
            message: `New Assignment: ${assignment.title || "Assignment"}`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            read: false,
            showModal: false, // Don't auto-show modal for assignments
            assignmentType: assignment.type || 'quiz',
            competencies: assignment.competencies || [],
            difficulty: assignment.difficulty || 'Medium',
            time: assignment.time || '10 mins'
        };
        
        // Add assignment-specific details
        if (assignment.type === "speaking" || assignment.type === "case") {
            notificationData.questions = assignment.questions || [];
            notificationData.description = assignment.description || '';
        } else if (assignment.type === "written") {
            notificationData.questionCount = assignment.writtenQuestions ? assignment.writtenQuestions.length : 10;
        } else {
            notificationData.questions = assignment.questions || 'n/a';
            notificationData.simulate = assignment.simulate || false;
        }
        
        // Store in Firebase
        db.collection('notifications').add(notificationData)
            .then(() => {
                console.log("Assignment notification stored in Firebase");
            })
            .catch(error => {
                console.error("Error storing assignment notification:", error);
            });
    }
    
    // Create in-app notification content
    const notificationTitle = "New Assignment: " + (assignment.title || "Assignment");
    let notificationContent = "";
    
    if (assignment.type === "speaking" || assignment.type === "case") {
        notificationContent = `Type: ${assignment.type === "speaking" ? "Speaking" : "Case"} Assignment\n`;
        notificationContent += `Competencies: ${assignment.competencies ? assignment.competencies.join(', ') : 'n/a'}\n`;
        notificationContent += `Questions:\n${assignment.questions ? assignment.questions.join('\n') : 'n/a'}`;
    } else {
        notificationContent = `
            Time: ${assignment.time || 'n/a'}
            Competencies: ${assignment.competencies ? assignment.competencies.join(', ') : 'n/a'}
            Questions: ${assignment.questions || 'n/a'}
            Difficulty: ${assignment.difficulty || 'n/a'}
        `;
    }
    
    // Show notification with full details
    showNotification(notificationTitle, notificationContent, () => {
        // When clicked, open the full modal with all details
        openFullAssignmentModal(assignment);
    });
    
    // Mark assignment as seen (but not completed)
    db.collection('assignments').doc(docId).update({
        status: "seen"
    }).catch(error => {
        console.error("Error updating assignment status:", error);
    });
}
function openFullAssignmentModal(assignment) {
    // Set the modal title
    document.getElementById('cq-assignment-title').innerText = assignment.title || "New Assignment";
    
    // Show info section, hide quiz section
    document.getElementById('cq-assignment-info').style.display = 'block';
    document.getElementById('cq-assignment-quiz').style.display = 'none';
    
    // Fill in all assignment details
    const fieldsElement = document.getElementById('cq-assignment-fields');
    if (fieldsElement) {
        if (assignment.type === "speaking" || assignment.type === "case") {
            // Speaking/Case assignment format
            const q1 = assignment.questions && assignment.questions[0] ? assignment.questions[0] : "No question provided";
            const q2 = assignment.questions && assignment.questions[1] ? assignment.questions[1] : "No question provided";
            
            fieldsElement.innerHTML = `
                <div><b>Type:</b> ${assignment.type === "speaking" ? "Speaking" : "Case"} Assignment</div>
                <div><b>Competencies:</b> ${assignment.competencies ? assignment.competencies.join(', ') : 'n/a'}</div>
                <div><b>Description:</b> ${assignment.description || 'n/a'}</div>
                <div><b>Questions:</b></div>
                <ul>
                    <li>${q1}</li>
                    <li>${q2}</li>
                </ul>
            `;
        } else {
            // Regular assignment format
            fieldsElement.innerHTML = `
                <div><b>Time:</b> ${assignment.time || 'n/a'}</div>
                <div><b>Competencies:</b> ${assignment.competencies ? assignment.competencies.join(', ') : 'n/a'}</div>
                <div><b>Questions:</b><br> <span style="font-weight:400; color:#333">${assignment.questions || 'n/a'}</span></div>
                <div><b>Difficulty:</b> ${assignment.difficulty || 'n/a'}</div>
                <div><b>Simulate:</b> ${assignment.simulate ? "Yes" : "No"}</div>
            `;
        }
    }
    
    // Show the modal
    document.getElementById('cq-assignment-modal').style.display = 'block';
}

  function showSpeakingAssignmentInfo(assignment, docId) {
    // Store for later use
    window.latestAssignmentId = docId;
    window.currentAssignment = assignment;
    
    // Set title
    document.getElementById('cq-assignment-title').innerText = assignment.title || "Speaking Assignment";
    
    // Hide quiz, show info
    document.getElementById('cq-assignment-info').style.display = 'block';
    document.getElementById('cq-assignment-quiz').style.display = 'none';
    
    // Fill in assignment fields for speaking
    document.getElementById('cq-assignment-fields').innerHTML = `
      <div><b>Type:</b> Speaking Assignment</div>
      <div><b>Time:</b> ${assignment.time || 'n/a'}</div>
      <div><b>Competencies:</b> ${assignment.competencies ? assignment.competencies.join(', ') : 'n/a'}</div>
      <div><b>Description:</b><br> <span style="font-weight:400; color:#333">${assignment.description || assignment.questions || 'Practice your speaking skills'}</span></div>
      <div><b>Question 1:</b> ${assignment.question1 || 'No question provided'}</div>
      <div><b>Question 2:</b> ${assignment.question2 || 'No question provided'}</div>
    `;
    
    // Show the assignment modal (same as regular assignments)
    document.getElementById('cq-assignment-modal').style.display = 'block';
  }

function acceptAssignmentNow() {
    console.log("🚀 acceptAssignmentNow() called");
    
    const assignment = window.currentAssignment;
    console.log("📋 Current assignment:", assignment);
    
    if (!assignment) {
        console.error("❌ No current assignment found");
        return;
    }
    
    // ✅ IMMEDIATELY mark assignment as complete when user clicks "I'll do it now"
    if (window.latestAssignmentId) {
        console.log("✅ Marking assignment as complete immediately");
        
        // Build update data conditionally to avoid undefined values
        const updateData = {
            status: "seen",
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
            autoCompleted: true
        };
        
        // Only add score fields for written assignments
        if (assignment.type === 'written') {
            updateData.score = 0;
            updateData.maxScore = assignment.writtenQuestions?.length || 10;
        }
        
        db.collection('assignments').doc(window.latestAssignmentId).update(updateData)
        .then(() => {
            console.log("✅ Assignment marked as complete successfully");
        }).catch(error => {
            console.error("❌ Error marking assignment as complete:", error);
        });
    }

    // Handle different assignment types but they're already marked complete above
    if (assignment.type === 'speaking' || assignment.type === 'case') {
        console.log("🎤 Opening camera modal for speaking/case assignment");
        document.getElementById('cq-assignment-modal').style.display = 'none';
        
        // Store assignment questions globally for the camera modal
        window.currentAssignmentQuestions = {
            q1: assignment.questions && assignment.questions[0] ? assignment.questions[0] : "No question provided",
            q2: assignment.questions && assignment.questions[1] ? assignment.questions[1] : "No question provided",
            title: assignment.title || "Speaking Assignment",
            description: assignment.description || ""
        };
        
        openCameraModal();
        return;
    }

    if (assignment.type === 'written') {
        console.log("✍️ Opening written assignment (already marked complete)");
        document.getElementById('cq-assignment-modal').style.display = 'none';
        openWrittenPracticeModal(assignment);
        return;
    }

    // Handle regular quiz assignments (already marked complete)
    console.log("📝 Setting up regular quiz assignment (already marked complete)");
    
    document.getElementById('cq-assignment-info').style.display = 'none';
    document.getElementById('cq-assignment-quiz').style.display = 'block';

    document.getElementById('quizDifficulty').textContent = 'Difficulty: ' + (assignment.difficulty || 'Medium');
    document.getElementById('quizTime').textContent = 'Time: ' + (assignment.time || '10 mins');

    console.log("🎯 Rendering quiz with questions:", quizQuestions);
    renderQuiz(quizQuestions);

    const radioInputs = document.querySelectorAll('#cq-assignment-quiz input[type="radio"]');
    const submitBtn = document.getElementById('submitQuizBtn');
    
    if (!submitBtn) {
        console.error("❌ Submit button not found!");
        return;
    }
    
    // Enable submit button immediately since assignment is already complete
    submitBtn.disabled = false;
    submitBtn.textContent = "Finish Practice"; // Change text since it's already "complete"
    
    console.log("🔓 Submit button enabled immediately");

    // Add event listeners for interactive feedback (optional)
    radioInputs.forEach((input, index) => {
        input.addEventListener('change', () => {
            console.log(`📡 Radio input ${index} changed to:`, input.value);
        });
    });

    // Set up the submit button click handler (for practice/feedback only)
    submitBtn.onclick = function() {
        console.log("🔥 FINISH PRACTICE CLICKED (assignment already complete)");
        
        // Show completion modal immediately
        closeAssignmentModal();
        
        showCongratsModal({
            message: `Assignment completed! Thanks for practicing.`,
            assignmentName: document.getElementById('cq-assignment-title').textContent
        });
        
        // Show confetti
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
        
        // Clear assignment data
        window.latestAssignmentId = null;
        window.currentAssignment = null;
    };
    
    console.log("✅ acceptAssignmentNow() completed - assignment marked complete immediately");
}

const downloadModalHTML = `
<div id="downloadModal" class="download-modal-overlay" style="display: none;">
    <div class="download-modal-container">
        <div class="download-modal-header">
            <h2>Recording Complete!</h2>
            <button onclick="closeDownloadModal()">&times;</button>
        </div>
        <div class="download-modal-body">
            <div style="font-size: 4rem; margin: 20px 0;">🎬</div>
            <p>Your recording is ready!</p>
            <div id="recordingPreview" style="margin: 20px 0;"></div>
        </div>
        <div class="download-modal-footer">
            <button id="downloadRecordingBtn" onclick="downloadRecording()">📥 Download MP4</button>
            <button onclick="closeDownloadModal()">Continue</button>
        </div>
    </div>
</div>`;

function addCameraModalHTML() {
    const cameraModalHTML = `
    <!-- Camera Recording Modal -->
    <div id="cameraModal" class="camera-modal-overlay">
        <div class="camera-container">
            <!-- Header -->
            <div class="camera-header">
                <h2 class="camera-title" id="cameraModalTitle">Record Your Response</h2>
                <button class="camera-close" onclick="closeCameraModal()">&times;</button>
            </div>
            
            <!-- Assignment Questions Display -->
            <div class="assignment-questions">
                <div class="question-card">
                    <strong>Question 1:</strong>
                    <p id="cameraQ1">What is your strategy for this scenario?</p>
                </div>
                <div class="question-card">
                    <strong>Question 2:</strong>
                    <p id="cameraQ2">How would you handle unexpected challenges?</p>
                </div>
            </div>
            
            <!-- Main Video Area -->
            <div class="camera-main">
                <div class="video-preview">
                    <video id="cameraPreview" autoplay muted playsinline></video>
                    <div id="recordingIndicator" class="recording-indicator">● RECORDING</div>
                    <div id="recordingTimer" class="recording-timer">00:00</div>
                    <div id="noCameraView" class="no-camera" style="display: none;">
                        <div class="no-camera-icon">🎤</div>
                        <div>Audio Only Mode</div>
                        <div class="audio-wave">
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Controls -->
            <div class="camera-controls">
                <button id="cameraToggle" class="camera-toggle" onclick="toggleCamera()" title="Toggle Camera">📹</button>
                <button id="recordButton" class="record-btn" onclick="toggleRecording()">●</button>
                <button id="micToggle" class="camera-toggle" onclick="toggleMic()" title="Toggle Microphone">🎤</button>
            </div>
            
            <!-- Actions -->
            <div class="camera-actions">
                <button id="submitRecording" class="action-btn" onclick="submitCameraRecording()" disabled>Submit Response</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', cameraModalHTML);
}

function openCameraModal() {
    // Add modal HTML if it doesn't exist
    if (!document.getElementById('cameraModal')) {
        addCameraModalHTML();
        addCameraModalCSS();
    }
    
    // Set assignment questions
    if (window.currentAssignmentQuestions) {
        document.getElementById('cameraModalTitle').textContent = window.currentAssignmentQuestions.title;
        document.getElementById('cameraQ1').textContent = window.currentAssignmentQuestions.q1;
        document.getElementById('cameraQ2').textContent = window.currentAssignmentQuestions.q2;
    }
    
    // Show modal with animation
    const modal = document.getElementById('cameraModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Initialize camera
    initializeCamera();
}

function closeCameraModal() {
    const modal = document.getElementById('cameraModal');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        stopAllMedia();
    }, 300);
    
    // Clear assignment data
    window.latestAssignmentId = null;
    window.currentAssignment = null;
    window.currentAssignmentQuestions = null;
}

async function initializeCamera() {
    try {
        const constraints = {
            video: cameraEnabled,
            audio: micEnabled
        };
        
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoElement = document.getElementById('cameraPreview');
        
        if (cameraEnabled) {
            videoElement.srcObject = cameraStream;
            videoElement.style.display = 'block';
            document.getElementById('noCameraView').style.display = 'none';
        } else {
            videoElement.style.display = 'none';
            document.getElementById('noCameraView').style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Could not access camera/microphone. Please ensure permissions are granted.');
    }
}

function toggleCamera() {
    cameraEnabled = !cameraEnabled;
    const toggleBtn = document.getElementById('cameraToggle');
    
    if (cameraEnabled) {
        toggleBtn.textContent = '📹';
        toggleBtn.classList.remove('camera-off');
    } else {
        toggleBtn.textContent = '📹';
        toggleBtn.classList.add('camera-off');
    }
    
    // Restart stream with new constraints
    stopAllMedia();
    initializeCamera();
}

function toggleMic() {
    micEnabled = !micEnabled;
    const toggleBtn = document.getElementById('micToggle');
    
    if (micEnabled) {
        toggleBtn.textContent = '🎤';
        toggleBtn.classList.remove('camera-off');
    } else {
        toggleBtn.textContent = '🎤';
        toggleBtn.classList.add('camera-off');
    }
    
    // Restart stream with new constraints
    stopAllMedia();
    initializeCamera();
}

function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    if (!cameraStream) {
        alert('Camera not initialized');
        return;
    }
    
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(cameraStream);
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/mp4' });
        console.log('Recording finished, blob size:', blob.size);
        document.getElementById('submitRecording').disabled = false;
    };
    
    mediaRecorder.start();
    isRecording = true;
    
    // Update UI
    document.getElementById('recordButton').textContent = '⏹';
    document.getElementById('recordButton').classList.add('recording');
    document.getElementById('recordingIndicator').classList.add('active');
    document.getElementById('recordingTimer').classList.add('active');
    
    // Start timer
    recordingSeconds = 0;
    recordingTimer = setInterval(() => {
        recordingSeconds++;
        const minutes = Math.floor(recordingSeconds / 60);
        const seconds = recordingSeconds % 60;
        document.getElementById('recordingTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopRecording() {
    if (!mediaRecorder || !isRecording) return;
    
    mediaRecorder.stop();
    isRecording = false;
    
    // Update UI
    document.getElementById('recordButton').textContent = '●';
    document.getElementById('recordButton').classList.remove('recording');
    document.getElementById('recordingIndicator').classList.remove('active');
    document.getElementById('recordingTimer').classList.remove('active');
    
    // Stop timer
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
    
    // Show download modal after a brief delay
    setTimeout(() => {
        showDownloadModal();
    }, 500);
}
function showDownloadModal() {
    // Add modal HTML if it doesn't exist
    if (!document.getElementById('downloadModal')) {
        document.body.insertAdjacentHTML('beforeend', downloadModalHTML);
        addDownloadModalCSS();
    }
    
    // Create blob and preview
    if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Store for download
        window.recordingBlob = blob;
        window.recordingURL = url;
        
        // Show preview
        const preview = document.getElementById('recordingPreview');
        if (cameraEnabled) {
            preview.innerHTML = `<video src="${url}" controls style="width:100%; max-height:200px; border-radius:10px;"></video>`;
        } else {
            preview.innerHTML = `<audio src="${url}" controls style="width:100%;"></audio>`;
        }
    }
    
    // Show modal
    const modal = document.getElementById('downloadModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function downloadRecording() {
    if (!window.recordingBlob) {
        alert('No recording available');
        return;
    }
    
    // Create download link
    const url = URL.createObjectURL(window.recordingBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CertQuest_Recording_${Date.now()}.${cameraEnabled ? 'webm' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    
    // MODIFIED: Close download modal and show upload modal
    closeDownloadModal();
    showUploadModal();
}

// 5. ADD THESE NEW FUNCTIONS
function showUploadModal() {
    // Add modal HTML if it doesn't exist
    if (!document.getElementById('uploadModal')) {
        document.body.insertAdjacentHTML('beforeend', uploadModalHTML);
        setupUploadModal(); // Make sure this is called
    }
    
    // Show modal with animation
    const modal = document.getElementById('uploadModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}


function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        resetUploadModal();
    }, 300);
}

function setupUploadModal() {
    const dropZone = document.getElementById('uploadDropZone');
    const fileInput = document.getElementById('uploadFileInput');
    const submitBtn = document.getElementById('uploadSubmitBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');

    if (!dropZone || !fileInput || !submitBtn) {
        console.error("Upload modal elements not found!");
        return;
    }

    // Click to browse
    dropZone.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });

    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('dragover');
        }
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelection(file);
        }
    });

    function handleFileSelection(file) {
        console.log('File selected:', file.name, file.type, file.size);
        
        // Validate file type
        const validTypes = ['video/webm', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'audio/webm', 'audio/mp4', 'audio/mpeg'];
        const validExtensions = ['.webm', '.mp4', '.mov', '.avi', '.mp3', '.wav'];
        
        const isValidType = validTypes.some(type => file.type.includes(type)) || 
                           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!isValidType) {
            alert('Please select a valid video or audio file (WebM, MP4, MOV, AVI, MP3, WAV)');
            resetUploadModal();
            return;
        }

        // Check file size (max 200MB)
        const maxSize = 200 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('File size too large. Maximum size is 200MB.');
            resetUploadModal();
            return;
        }

        // File is valid
        selectedUploadFile = file;
        
        // Update UI
        dropZone.classList.add('file-selected');
        dropZone.innerHTML = `
            <div class="upload-text">File Selected!</div>
            <div class="upload-subtext">Click to select a different file</div>
        `;
        
        // Show file info
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.style.display = 'flex';
        
        // Enable submit button
        submitBtn.disabled = false;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}


function resetUploadModal() {
    selectedUploadFile = null;
    const dropZone = document.getElementById('uploadDropZone');
    const fileInfo = document.getElementById('fileInfo');
    const submitBtn = document.getElementById('uploadSubmitBtn');
    
    if (dropZone) {
        dropZone.classList.remove('file-selected', 'dragover');
        dropZone.innerHTML = `
            <div class="upload-icon">🎬</div>
            <div class="upload-text">Drop your recording here</div>
            <div class="upload-subtext">or click to browse files</div>
            <div class="upload-subtext">Supports WebM, MP4, MOV, AVI</div>
            <input type="file" id="uploadFileInput" class="upload-file-input" accept=".webm,.mp4,.mov,.avi,video/*,audio/*">
        `;
    }
    
    if (fileInfo) {
        fileInfo.style.display = 'none';
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
    }
}

async function submitUploadedFile() {
  if (!selectedUploadFile) {
    alert('No file selected');
    return;
  }

  const submitBtn = document.getElementById('uploadSubmitBtn');
  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;

  try {
    // --- Setup variables ---
    const user = firebase.auth().currentUser;
    const uid = user?.uid;
    const menteeName = user?.displayName || user?.email || 'Anonymous';
    const assignmentTitle = window.currentAssignment?.title || "Assignment";
    const assignmentId = window.latestAssignmentId;

    // GitHub info
    const GITHUB_USERNAME = "Anjay209";
    const GITHUB_REPO = "video-storage";
    const GITHUB_TOKEN = "REDACTED_TOKEN";

    const filename = `${uid}-${Date.now()}-${selectedUploadFile.name}`;
    const githubApiUrl = `https://github-proxy.certquest.workers.dev/github/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/docs/videos/${filename}`;
    const githubPagesUrl = `https://${GITHUB_USERNAME.toLowerCase()}.github.io/${GITHUB_REPO}/docs/videos/${filename}`;

    // Convert file to base64
    const base64 = await blobToBase64(selectedUploadFile);

    // Upload to GitHub
    const uploadRes = await fetch(githubApiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Upload ${filename}`,
        content: base64,
        branch: 'main'
      })
    });

    if (!uploadRes.ok) throw new Error("GitHub upload failed");

    // Mark assignment as completed in Firestore
    await firebase.firestore()
      .collection('assignments')
      .doc(assignmentId)
      .update({
        status: "complete",
        completedAt: firebase.firestore.FieldValue.serverTimestamp(),
        recordingUrl: githubPagesUrl
      });

    // UI feedback
    alert('Successfully sent to mentor!');
    closeUploadModal();
    if (document.getElementById('cameraModal')) {
      closeCameraModal();
    }

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });

  } catch (error) {
    console.error('Upload error:', error);
    alert("Failed to send file: " + (error?.text || error?.message || error));
  }

  submitBtn.textContent = 'Send to Mentor';
  submitBtn.disabled = false;
}


function closeDownloadModal() {
    const modal = document.getElementById('downloadModal');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        // Cleanup URLs
        if (window.recordingURL) {
            URL.revokeObjectURL(window.recordingURL);
            window.recordingURL = null;
        }
        window.recordingBlob = null;
    }, 300);
}

// 4. Add basic CSS (add to your existing CSS or in a <style> tag)
function addDownloadModalCSS() {
    const style = document.createElement('style');
    style.textContent = `
        .download-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.8); z-index: 10001; display: flex;
            align-items: center; justify-content: center; opacity: 0;
            transition: opacity 0.3s ease;
        }
        .download-modal-overlay.active { opacity: 1; }
        .download-modal-container {
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 20px; max-width: 500px; width: 90%;
            color: white; transform: scale(0.9); transition: transform 0.3s ease;
        }
        .download-modal-overlay.active .download-modal-container { transform: scale(1); }
        .download-modal-header {
            padding: 25px 30px 15px; display: flex; justify-content: space-between;
            align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .download-modal-header button {
            background: rgba(255,255,255,0.1); border: none; color: white;
            width: 40px; height: 40px; border-radius: 50%; font-size: 24px;
            cursor: pointer;
        }
        .download-modal-body { padding: 30px; text-align: center; }
        .download-modal-footer {
            padding: 20px 30px 30px; display: flex; gap: 15px; justify-content: center;
        }
        .download-modal-footer button {
            padding: 12px 24px; border-radius: 25px; font-weight: 600;
            cursor: pointer; border: none;
        }
        #downloadRecordingBtn {
            background: linear-gradient(45deg, #4CAF50, #45a049); color: white;
        }
    `;
    document.head.appendChild(style);
}
// Fixed submitQuiz function
function submitQuiz() {
    console.log("🎯 submitQuiz() CALLED - STARTING SUBMISSION PROCESS");
    console.log("📊 Assignment ID:", window.latestAssignmentId);
    console.log("📋 Current assignment:", window.currentAssignment);
    
    // Clear timer if it exists (but don't error if it doesn't)
    if (typeof quizTimer !== 'undefined' && quizTimer) {
        console.log("⏱️ Clearing quiz timer");
        clearInterval(quizTimer);
        quizTimer = null;
    }
    
    // Verify all questions were answered BEFORE calculating results
    console.log("🔍 Checking if all questions are answered...");
    const unansweredQuestions = quizQuestions.filter((_, idx) => {
        const checked = document.querySelector(`input[name="q${idx+1}"]:checked`);
        console.log(`❓ Question ${idx+1}:`, checked ? `✅ ${checked.value}` : "❌ Not answered");
        return !checked;
    });
    
    if (unansweredQuestions.length > 0) {
        console.error(`❌ ${unansweredQuestions.length} questions not answered`);
        alert(`Please answer all questions. ${unansweredQuestions.length} questions remaining.`);
        return;
    }
    
    console.log("✅ All questions answered, calculating results...");
    
    // Calculate results
    const quizResults = calculateQuizResults();
    console.log("📊 Quiz Results calculated:", quizResults);
    
    // Verify we have a valid assignment ID
    if (!window.latestAssignmentId) {
        console.error("❌ No assignment ID found");
        alert("Error: No assignment ID found. Cannot save results.");
        return;
    }

    console.log("💾 Saving results to Firebase...");
    
    // Save to Firebase and show results
    saveQuizResultsToFirebase(quizResults)
        .then(() => {
            console.log("✅ Results saved successfully");
            
            // Close quiz modal and show results
            closeAssignmentModal();
            
            showCongratsModal({
                message: `Great job! You scored ${quizResults.correct}/${quizResults.total}`,
                assignmentName: document.getElementById('cq-assignment-title').textContent,
                score: quizResults.correct,
                totalQuestions: quizResults.total,
                competencyStats: quizResults.competencyStats,
                percentage: quizResults.percentage
            });
            
            // Show confetti celebration
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
            
            // Clear assignment data
            window.latestAssignmentId = null;
            window.currentAssignment = null;
            
            console.log("🎉 Quiz submission completed successfully!");
        })
        .catch(error => {
            console.error('❌ Error saving quiz results:', error);
            alert('Error saving results: ' + error.message);
        });
}


// 3. Test function to manually trigger quiz submission
function testQuizSubmission() {
    console.log("🧪 TESTING QUIZ SUBMISSION");
    
    // Set up fake assignment data
    window.latestAssignmentId = "test-assignment-123";
    window.currentAssignment = {
        title: "Test Quiz",
        type: "quiz",
        difficulty: "Easy",
        time: "10 mins"
    };
    
    console.log("🎯 Fake assignment set up:", window.currentAssignment);
    console.log("📊 Assignment ID:", window.latestAssignmentId);
    console.log("🔘 Submit button element:", document.getElementById('submitQuizBtn'));
    
    // Try to submit
    submitQuiz();
}

// Make test function available globally
window.testQuizSubmission = testQuizSubmission;


function openWrittenPracticeModal(assignment) {
    console.log("Opening written practice modal with assignment:", assignment);
    
    // Use assignment questions or fallback to sample questions
    writtenQuestions = assignment.writtenQuestions || sampleWrittenQuestions;
    currentQuestionIndex = 0;
    writtenAnswers = {};
    
    // Set up timer (convert minutes to seconds)
    const timeInMinutes = parseInt(assignment.time) || 15;
    writtenTimeRemaining = timeInMinutes * 60;
    
    // Show modal
    document.getElementById('cq-written-modal').style.display = 'flex';
    
    // Load first question
    loadWrittenQuestion();
    
    // Start timer
    startWrittenTimer();
    
    console.log("Written practice modal opened with", writtenQuestions.length, "questions");
}

function loadWrittenQuestion() {
    const question = writtenQuestions[currentQuestionIndex];
    if (!question) {
        console.error("No question found at index", currentQuestionIndex);
        return;
    }
    
    console.log("Loading question", currentQuestionIndex + 1, ":", question.question);
    
    // Update header
    document.getElementById('cq-written-title').textContent = window.currentAssignment?.title || 'Written Practice';
    document.getElementById('cq-written-question-count').textContent = 
        `Question ${currentQuestionIndex + 1} of ${writtenQuestions.length}`;
    
    // Update question content
    document.getElementById('cq-written-competency').textContent = question.competency;
    document.getElementById('cq-written-question').textContent = question.question;
    
    // Create options
    const optionsContainer = document.getElementById('cq-written-options');
    optionsContainer.innerHTML = question.options.map((option, index) => `
        <label class="cq-written-option" data-option="${option}">
            <input type="radio" name="written-q${currentQuestionIndex}" value="${option}">
            <span class="cq-written-option-text">${option}</span>
        </label>
    `).join('');
    
    // Restore previous answer if exists
    const previousAnswer = writtenAnswers[currentQuestionIndex];
    if (previousAnswer) {
        const radio = optionsContainer.querySelector(`input[value="${previousAnswer}"]`);
        if (radio) {
            radio.checked = true;
            radio.closest('.cq-written-option').classList.add('selected');
        }
    }
    
    // Add click handlers for options
    optionsContainer.querySelectorAll('.cq-written-option').forEach(option => {
        option.addEventListener('click', function(e) {
            // Prevent double-triggering if radio button itself was clicked
            if (e.target.type === 'radio') return;
            
            // Remove previous selection
            optionsContainer.querySelectorAll('.cq-written-option').forEach(opt => 
                opt.classList.remove('selected'));
            
            // Add selection to clicked option
            this.classList.add('selected');
            
            // Check the radio button
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            
            // Save answer
            writtenAnswers[currentQuestionIndex] = radio.value;
            console.log("Answer saved:", currentQuestionIndex, "->", radio.value);
        });
    });
    
    // Add change handlers for radio buttons (for keyboard navigation)
    optionsContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                // Remove previous selection
                optionsContainer.querySelectorAll('.cq-written-option').forEach(opt => 
                    opt.classList.remove('selected'));
                
                // Add selection to parent option
                this.closest('.cq-written-option').classList.add('selected');
                
                // Save answer
                writtenAnswers[currentQuestionIndex] = this.value;
                console.log("Answer saved via radio:", currentQuestionIndex, "->", this.value);
            }
        });
    });
    
    // Update progress bar
    updateWrittenProgress();
    
    // Update navigation buttons
    updateWrittenNavButtons();
}

function updateWrittenProgress() {
    const progress = ((currentQuestionIndex + 1) / writtenQuestions.length) * 100;
    document.getElementById('cq-written-progress-fill').style.width = `${progress}%`;
}


function updateWrittenNavButtons() {
    const prevBtn = document.getElementById('cq-written-prev');
    const nextBtn = document.getElementById('cq-written-next');
    
    // Update previous button
    prevBtn.disabled = currentQuestionIndex === 0;
    
    // Update next/submit button
    if (currentQuestionIndex === writtenQuestions.length - 1) {
        nextBtn.textContent = 'Submit';
        nextBtn.onclick = submitWrittenPractice; // ✅ Fixed: no parentheses
        nextBtn.classList.remove('cq-written-btn-primary');
        nextBtn.classList.add('cq-written-btn-primary');
        nextBtn.style.background = '#dc2626'; // Red color for submit
    } else {
        nextBtn.textContent = 'Next';
        nextBtn.onclick = nextQuestion;
        nextBtn.classList.add('cq-written-btn-primary');
        nextBtn.style.background = '#3b82f6'; // Blue color for next
    }
}

function previousQuestion() {
    console.log("Previous question clicked, current index:", currentQuestionIndex);
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadWrittenQuestion();
    }
}

function nextQuestion() {
    console.log("Next question clicked, current index:", currentQuestionIndex);
    if (currentQuestionIndex < writtenQuestions.length - 1) {
        currentQuestionIndex++;
        loadWrittenQuestion();
    }
}

function startWrittenTimer() {
    clearInterval(writtenTimer);
    
    console.log("Starting timer with", writtenTimeRemaining, "seconds");
    
    // Update initial display
    updateTimerDisplay();
    
    writtenTimer = setInterval(() => {
        writtenTimeRemaining--;
        updateTimerDisplay();
        
        if (writtenTimeRemaining <= 0) {
            console.log("Time's up! Auto-submitting...");
            clearInterval(writtenTimer);
            submitWrittenPractice();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(writtenTimeRemaining / 60);
    const seconds = writtenTimeRemaining % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('cq-written-timer').textContent = display;
    
    // Change color when time is running low (last 2 minutes)
    const timerElement = document.getElementById('cq-written-timer');
    if (writtenTimeRemaining <= 120) { // 2 minutes
        timerElement.style.color = '#dc2626'; // Red
        timerElement.style.fontWeight = '600';
    } else {
        timerElement.style.color = '#64748b'; // Default gray
        timerElement.style.fontWeight = '500';
    }
}

async function submitWrittenPractice() {
    try {
        console.log("=== SUBMITTING WRITTEN PRACTICE ===");
        console.log("Assignment ID:", window.latestAssignmentId);
        console.log("Current Assignment:", window.currentAssignment);
        console.log("Questions:", writtenQuestions.length);
        console.log("Answers:", writtenAnswers);

        clearInterval(writtenTimer);
        
        // CRITICAL: Check if we have an assignment ID
        if (!window.latestAssignmentId) {
            console.error("❌ CRITICAL ERROR: No assignment ID found!");
            alert("Error: No assignment ID found. Cannot submit written practice.");
            closeWrittenModal();
            return;
        }
        
        // Calculate score and competency stats
        let score = 0;
        const competencyStats = {};
        const detailedAnswers = [];
        const totalQuestions = writtenQuestions.length;
        
        writtenQuestions.forEach((question, index) => {
            const userAnswer = writtenAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            if (isCorrect) score++;
            
            // Track competency performance
            if (!competencyStats[question.competency]) {
                competencyStats[question.competency] = { 
                    total: 0, 
                    correct: 0,
                    questions: []
                };
            }
            competencyStats[question.competency].total++;
            if (isCorrect) competencyStats[question.competency].correct++;
            
            // Store detailed answer info
            detailedAnswers.push({
                questionIndex: index,
                question: question.question,
                competency: question.competency,
                userAnswer: userAnswer || "No answer",
                correctAnswer: question.correctAnswer,
                isCorrect: isCorrect
            });
        });
        
        // Calculate time spent and percentage
        const originalTime = parseInt(window.currentAssignment?.time) * 60 || 900;
        const timeSpent = originalTime - writtenTimeRemaining;
        const percentage = Math.round((score / totalQuestions) * 100);
        
        console.log("Final score:", score, "/", totalQuestions);
        console.log("Competency stats:", competencyStats);
        console.log("Time spent:", timeSpent, "seconds");
        
        // CRITICAL: This is the key update that marks it as complete for mentors
        const updateData = {
            status: "complete",  // CRITICAL: This is what mentors filter by
            completedAt: firebase.firestore.FieldValue.serverTimestamp(), // CRITICAL: This is what mentors sort by
            score: score,
            totalQuestions: totalQuestions,
            maxScore: totalQuestions,  // CRITICAL: Mentors expect this field
            competencyStats: competencyStats,
            timeSpent: timeSpent,
            detailedAnswers: detailedAnswers,
            competencies: Object.keys(competencyStats),
            correctCompetencies: Object.entries(competencyStats)
                .filter(([_, stats]) => stats.correct === stats.total)
                .map(([comp, _]) => comp),
            percentage: percentage,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log("=== FIREBASE UPDATE DATA ===");
        console.log("Document ID:", window.latestAssignmentId);
        console.log("Update Data:", updateData);
        
        // Update assignment in Firestore
        await db.collection('assignments').doc(window.latestAssignmentId).update(updateData);
        
        console.log("✅ Assignment updated successfully in Firestore");
        console.log("✅ Status set to 'complete'");
        console.log("✅ CompletedAt timestamp added");
        console.log("✅ MaxScore field added");
        
        // Prepare data for modal
        const resultsData = {
            message: `Excellent work! You scored ${score}/${totalQuestions}`,
            assignmentName: window.currentAssignment?.title || 'Written Practice',
            competencyStats: competencyStats,
            score: score,
            totalQuestions: totalQuestions,
            percentage: percentage,
            timeSpent: timeSpent
        };
        
        console.log("Congrats modal data:", resultsData);
        
        // Close modal first
        closeWrittenModal(true);
        
        // Show celebration
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#1d4ed8', '#1e40af']
        });
        
        // Show results modal
        showCongratsModal(resultsData);
        
        // Clear globals AFTER successful submission
        window.latestAssignmentId = null;
        window.currentAssignment = null;
        
        console.log("=== WRITTEN PRACTICE SUBMISSION COMPLETE ===");
        
    } catch (error) {
        console.error("❌ Written practice submission error:", error);
        console.error("❌ Assignment ID was:", window.latestAssignmentId);
        console.error("❌ Current assignment was:", window.currentAssignment);
        alert("Failed to submit practice: " + error.message);
    }
}


function calculateQuizResults() {
    console.log("🧮 Calculating quiz results...");
    
    const results = {
        correct: 0,
        total: quizQuestions.length,
        answers: {},
        competencyStats: {},
        percentage: 0
    };
    
    console.log("📝 Processing", quizQuestions.length, "questions");
    
    // Calculate correct answers and build competency stats
    quizQuestions.forEach((question, idx) => {
        const selectedAnswer = document.querySelector(`input[name="q${idx+1}"]:checked`);
        if (selectedAnswer) {
            const answerValue = selectedAnswer.value;
            results.answers[`q${idx+1}`] = answerValue;
            
            console.log(`Q${idx+1}: Selected "${answerValue}", Correct: "${question.correctAnswer}"`);
            
            // Check if correct
            const isCorrect = answerValue === question.correctAnswer;
            if (isCorrect) {
                results.correct++;
                console.log(`✅ Q${idx+1} CORRECT`);
            } else {
                console.log(`❌ Q${idx+1} WRONG`);
            }
            
            // Track competency performance
            const competency = question.competency;
            if (!results.competencyStats[competency]) {
                results.competencyStats[competency] = {
                    total: 0,
                    correct: 0
                };
            }
            results.competencyStats[competency].total++;
            if (isCorrect) {
                results.competencyStats[competency].correct++;
            }
        }
    });
    
    results.percentage = Math.round((results.correct / results.total) * 100);
    
    console.log("📊 Final results:", results);
    return results;
}


function saveQuizResultsToFirebase(quizResults) {
    console.log("💾 Saving quiz results to Firebase:", quizResults);
    
    if (!window.latestAssignmentId) {
        return Promise.reject(new Error("No assignment ID found"));
    }
    
    const db = firebase.firestore();
    const user = firebase.auth().currentUser;
    
    if (!user) {
        return Promise.reject(new Error("User not authenticated"));
    }
    
    // Prepare the update data
    const updateData = {
        status: "complete",  // CRITICAL: This is what the mentor code filters by
        completedAt: firebase.firestore.FieldValue.serverTimestamp(), // CRITICAL: This is what mentor code sorts by
        score: quizResults.correct,  // The score achieved
        maxScore: quizResults.total, // Total possible score (mentor code expects this)
        percentage: quizResults.percentage,
        competencyStats: quizResults.competencyStats || {},
        submittedAnswers: quizResults.answers || {},
        timeTaken: quizResults.timeTaken || null,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    console.log("🔥 Updating assignment document:", window.latestAssignmentId);
    console.log("📊 Update data:", updateData);
    
    return db.collection("assignments")
        .doc(window.latestAssignmentId)
        .update(updateData)
        .then(() => {
            console.log("✅ Assignment updated successfully!");
            console.log("✅ Status set to 'complete'");
            console.log("✅ CompletedAt timestamp added");
            console.log("✅ Score:", quizResults.correct, "/", quizResults.total);
            
            // Optional: Create a notification for the mentor
            if (window.currentAssignment?.from) {
                return db.collection('notifications').add({
                    mentorId: window.currentAssignment.from,
                    menteeId: user.uid,
                    message: `${user.displayName || 'A mentee'} completed an assignment with score ${quizResults.correct}/${quizResults.total}`,
                    assignmentId: window.latestAssignmentId,
                    assignmentName: window.currentAssignment?.title || "Assignment",
                    type: "completion",
                    read: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        })
        .then(() => {
            console.log("✅ All Firebase operations completed successfully");
        })
        .catch(error => {
            console.error("❌ Firebase update error:", error);
            throw error;
        });
}


// FIXED: closeWrittenModal function - add parameter to indicate if completed
function closeWrittenModal(wasCompleted = false) {
    console.log("Closing written modal, wasCompleted:", wasCompleted);
    
    // Clear timer
    clearInterval(writtenTimer);
    
    // Hide modal
    document.getElementById('cq-written-modal').style.display = 'none';
    
    // Reset state
    writtenQuestions = [];
    currentQuestionIndex = 0;
    writtenAnswers = {};
    writtenTimeRemaining = 0;
    writtenTimer = null;
    
    // ONLY mark as "seen" if the user closed without completing
    if (!wasCompleted && window.latestAssignmentId && window.currentAssignment) {
        console.log("User closed modal without completing - marking as seen");
        db.collection('assignments').doc(window.latestAssignmentId)
            .update({ status: "complete" })
            .then(() => {
                console.log("Assignment marked as seen (user closed without completing)");
                window.latestAssignmentId = null;
                window.currentAssignment = null;
            })
            .catch(error => {
                console.error("Error updating assignment status:", error);
            });
    } else if (wasCompleted) {
        console.log("Modal closed after completion - not changing status");
        // Don't update status - submitWrittenPractice already set it to "complete"
        // Don't clear globals here either - let submitWrittenPractice handle it
    }
}



window.previousQuestion = previousQuestion;
window.nextQuestion = nextQuestion;
window.openWrittenPracticeModal = openWrittenPracticeModal;

function testWrittenModal() {
    window.currentAssignment = {
        type: 'written',
        title: 'Business Fundamentals Practice',
        time: '15', // 15 minutes
        writtenQuestions: sampleWrittenQuestions
    };
    window.latestAssignmentId = 'test-assignment-id';
    openWrittenPracticeModal(window.currentAssignment);
}

// Make test function globally available
window.testWrittenModal = testWrittenModal;


  function closeAssignmentModal() {
    document.getElementById('cq-assignment-modal').style.display = 'none';
  }

  function snoozeAssignment() {
    closeAssignmentModal(); // Status remains "assigned"
  }

  // === SPEAKING ASSIGNMENT FUNCTIONS ===
function submitCameraRecording() {
    // Show success and close
    closeCameraModal();
    
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });
    
    showCongratsModal({
        message: `Great job completing the speaking assignment!`,
        assignmentName: window.currentAssignmentQuestions?.title || "Assignment"
    });
}

function stopAllMedia() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
    
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
    }
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    recordedChunks = [];
    recordingSeconds = 0;
}

// 1. ADD THIS CSS TO YOUR EXISTING STYLES
const uploadModalCSS = `
<style>
/* Upload Modal Styles */
.upload-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10002;
  display: none;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-modal-overlay.active {
  opacity: 1;
}

.upload-modal-container {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  max-width: 600px;
  width: 90%;
  color: white;
  transform: scale(0.9);
  transition: transform 0.3s ease;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.upload-modal-overlay.active .upload-modal-container {
  transform: scale(1);
}

.upload-modal-header {
  padding: 25px 30px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.upload-modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
}

.upload-modal-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.upload-modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.upload-modal-body {
  padding: 30px;
}

.upload-drop-zone {
  border: 3px dashed rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.upload-drop-zone:hover {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.upload-drop-zone.dragover {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  transform: scale(1.02);
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.7;
}

.upload-text {
  font-size: 1.1rem;
  margin-bottom: 10px;
  font-weight: 500;
}

.upload-subtext {
  font-size: 0.9rem;
  opacity: 0.7;
  margin-bottom: 20px;
}

.upload-file-input {
  display: none;
}

.upload-modal-footer {
  padding: 20px 30px 30px;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.upload-btn {
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 1rem;
  transition: all 0.3s ease;
  min-width: 120px;
}

.upload-btn-primary {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
}

.upload-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(76, 175, 80, 0.3);
}

.upload-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.upload-btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.upload-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.file-selected {
  background: rgba(76, 175, 80, 0.2);
  border-color: #4CAF50;
  padding: 20px;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.file-name {
  font-weight: 600;
  color: #4CAF50;
}

.file-size {
  opacity: 0.7;
  font-size: 0.9rem;
}
</style>
`;


// 2. ADD THIS HTML TO YOUR BODY (before closing </body> tag)
const uploadModalHTML = `
<div id="uploadModal" class="upload-modal-overlay">
  <div class="upload-modal-container">
    <div class="upload-modal-header">
      <h2>Upload Your Recording</h2>
      <button class="upload-modal-close" onclick="closeUploadModal()">&times;</button>
    </div>
    <div class="upload-modal-body">
      <div id="uploadDropZone" class="upload-drop-zone">
        <div class="upload-icon">🎬</div>
        <div class="upload-text">Drop your recording here</div>
        <div class="upload-subtext">or click to browse files</div>
        <div class="upload-subtext">Supports WebM, MP4, MOV, AVI</div>
        <input type="file" id="uploadFileInput" class="upload-file-input" accept=".webm,.mp4,.mov,.avi,video/*,audio/*">
      </div>
      <div id="fileInfo" class="file-info" style="display: none;">
        <span class="file-name" id="fileName"></span>
        <span class="file-size" id="fileSize"></span>
      </div>
    </div>
    <div class="upload-modal-footer">
      <button class="upload-btn upload-btn-secondary" onclick="closeUploadModal()">Cancel</button>
      <button id="uploadSubmitBtn" class="upload-btn upload-btn-primary" disabled onclick="submitUploadedFile()">Send to Mentor</button>
    </div>
  </div>
</div>
`;


// 4. Add CSS styles
function addCameraModalCSS() {
    const styles = `
    <style>
        .camera-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #1e1e2e 0%, #2d1b69 100%);
            z-index: 10000;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .camera-modal-overlay.active {
            opacity: 1;
        }
        
        .camera-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        
        .camera-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 30px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .camera-title {
            color: white;
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0;
        }
        
        .camera-close {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        
        .camera-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .assignment-questions {
            padding: 20px 30px;
            background: rgba(255, 255, 255, 0.03);
            display: flex;
            gap: 20px;
        }
        
        .question-card {
            flex: 1;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 15px;
            color: white;
        }
        
        .question-card strong {
            color: #64b5f6;
            display: block;
            margin-bottom: 8px;
        }
        
        .camera-main {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 30px;
        }
        
        .video-preview {
            width: 80%;
            max-width: 800px;
            height: 60vh;
            background: #000;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            position: relative;
        }
        
        .video-preview video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .recording-indicator {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            display: none;
            animation: pulse 1.5s infinite;
        }
        
        .recording-indicator.active {
            display: block;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        
        .recording-timer {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 1rem;
            font-family: monospace;
            display: none;
        }
        
        .recording-timer.active {
            display: block;
        }
        
        .camera-controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 30px;
            padding: 30px;
            background: rgba(255, 255, 255, 0.05);
        }
        
        .camera-toggle {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 12px 16px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .camera-toggle:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        
        .camera-toggle.camera-off {
            background: rgba(255, 71, 87, 0.2);
            border-color: #ff4757;
        }
        
        .record-btn {
            background: linear-gradient(45deg, #ff4757, #ff3742);
            border: none;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 25px rgba(255, 71, 87, 0.3);
            color: white;
        }
        
        .record-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 15px 35px rgba(255, 71, 87, 0.4);
        }
        
        .record-btn.recording {
            background: #2ecc71;
        }
        
        .camera-actions {
            display: flex;
            justify-content: center;
            gap: 20px;
            padding: 20px 30px;
            background: rgba(0, 0, 0, 0.1);
        }
        
        .action-btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 120px;
        }
        
        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
        
        .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .no-camera {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: rgba(255, 255, 255, 0.7);
            font-size: 1.1rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
        }
        
        .no-camera-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        
        .audio-wave {
            display: flex;
            gap: 4px;
            margin: 20px 0;
        }
        
        .wave-bar {
            width: 4px;
            height: 20px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 2px;
            animation: wave 1s infinite ease-in-out;
        }
        
        .wave-bar:nth-child(2) { animation-delay: 0.1s; }
        .wave-bar:nth-child(3) { animation-delay: 0.2s; }
        .wave-bar:nth-child(4) { animation-delay: 0.3s; }
        .wave-bar:nth-child(5) { animation-delay: 0.4s; }
        
        @keyframes wave {
            0%, 40%, 100% { transform: scaleY(0.4); }
            20% { transform: scaleY(1); }
        }
    </style>`;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

// 5. Remove old speaking modal functions and replace with simple redirect
function openSpeakingAssignmentModal(q1, q2) {
    // This is now just a redirect to the camera modal
    window.currentAssignmentQuestions = {
        q1: q1 || "Question 1 here",
        q2: q2 || "Question 2 here", 
        title: "Speaking Assignment"
    };
    openCameraModal();
}
  function closeSpeakingAssignmentModal() {
    document.getElementById('cq-speaking-downloadBtn').style.display = 'none';

    // Stop any active recordings
    cqSpeakingStopAllMedia();
    
    // Hide modal
    document.getElementById('cq-speaking-modal').style.display = 'none';
    
    // Mark as seen (if assignment exists)
    if (window.latestAssignmentId) {
      db.collection('assignments').doc(window.latestAssignmentId)
        .update({ status: "complete" })
        .then(() => {
          window.latestAssignmentId = null;
          window.currentAssignment = null;
        })
        .catch(error => {
          console.error("Error updating assignment status:", error);
        });
    }
  }


async function submitSpeakingResponse() {
  if (!window.latestAssignmentId || recordedChunks.length === 0) {
    alert("Recording not found or assignment ID missing.");
    return;
  }

  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const filename = `${firebase.auth().currentUser.uid}-${Date.now()}.webm`;

  const GITHUB_USERNAME = "Anjay209";
  const GITHUB_REPO = "video-storage";
  const GITHUB_TOKEN = "REDACTED_TOKEN"; // 🔐 Rotate in production

  const githubApiUrl = `https://github-proxy.certquest.workers.dev/github/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/docs/videos/${filename}`;
  const githubPagesUrl = `https://${GITHUB_USERNAME.toLowerCase()}.github.io/${GITHUB_REPO}/docs/videos/${filename}`;

  try {
    const base64 = await blobToBase64(blob);

    const uploadRes = await fetch(githubApiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Upload ${filename}`,
        content: base64,
        branch: 'main'
      })
    });

    if (!uploadRes.ok) {
      const errData = await uploadRes.json();
      throw new Error(errData?.message || "GitHub upload failed");
    }

    // Firestore update - setting status to "complete"
    await firebase.firestore()
      .collection('assignments')
      .doc(window.latestAssignmentId)
      .update({
        status: "complete", // Changed from "seen" to "complete"
        completedAt: firebase.firestore.FieldValue.serverTimestamp(),
        recordingUrl: githubPagesUrl
      });

    // Optional UI feedback
    showCongratsModal({
      message: "Assignment submitted successfully!",
      assignmentName: window.currentAssignment?.title || "Assignment"
    });

    // Close the modal after submission
    closeSpeakingAssignmentModal();

  } catch (err) {
    console.error("Upload Error:", err);
    alert("Something went wrong while uploading your recording.");
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}




  // === NOTIFICATION FUNCTIONS ===
 function setupNotifications() {
  const user = auth.currentUser;
  if (!user) {
    console.log("No user logged in");
    return;
  }

  console.log("Setting up notifications for user:", user.uid);

  db.collection('notifications')
    .where('menteeId', '==', user.uid)
    .where('showModal', '==', true)
    .where('read', '==', false)
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
      console.log("Received notifications snapshot with", snapshot.size, "items");
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          console.log("New notification received:", change.doc.data());
          showCongratsModal(change.doc.data());
          
          // ONLY mark showModal as false to prevent re-showing
          // DON'T mark as read - let user dismiss manually
          setTimeout(() => {
            change.doc.ref.update({
              showModal: false  // Remove this line: read: true,
            });
          }, 1000);
        }
      });
    }, (error) => {
      console.error("Notifications error:", error);
    });

  // NEW: Load ALL notifications (read and unread) for the notification panel
  // REMOVED the showModal filter so notifications persist after reload
  // Load ALL notifications (read and unread) for the notification panel
db.collection('notifications')
    .where('menteeId', '==', user.uid)
    .orderBy('timestamp', 'desc')
    .limit(20) // Show last 20 notifications
    .onSnapshot((snapshot) => {
      const notificationList = document.getElementById("notificationList");
      if (!notificationList) return;
      
      notificationList.innerHTML = ''; // Clear existing
      
      snapshot.forEach((doc) => {
        const notif = doc.data();
        const item = document.createElement("div");
        item.className = `notification-item ${notif.read ? 'read' : ''}`;
        
        // Format timestamp
        let timeText = "Just now";
        if (notif.timestamp && notif.timestamp.toDate) {
          const date = notif.timestamp.toDate();
          const now = new Date();
          const diffMs = now - date;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);
          
          if (diffMins < 1) timeText = "Just now";
          else if (diffMins < 60) timeText = `${diffMins}m ago`;
          else if (diffHours < 24) timeText = `${diffHours}h ago`;
          else timeText = `${diffDays}d ago`;
        }
        
        // Different content based on notification type
        let bodyContent = '';
        if (notif.type === 'assignment') {
          bodyContent = `
            <div class="notification-body">
              Type: ${notif.assignmentType || 'Quiz'}<br>
              Competencies: ${notif.competencies ? notif.competencies.join(', ') : 'n/a'}<br>
              ${notif.time ? `Time: ${notif.time}<br>` : ''}
              ${notif.difficulty ? `Difficulty: ${notif.difficulty}` : ''}
            </div>
          `;
        } else {
          bodyContent = `
            <div class="notification-body">
              Assignment: ${notif.assignmentName || 'Unknown'}
              ${notif.score !== undefined ? `<br>Score: ${notif.score}/${notif.totalQuestions}` : ''}
            </div>
          `;
        }
        
        item.innerHTML = `
          <div class="notification-header">
            <strong>${notif.message || 'Notification'}</strong>
            <span class="notification-time">${timeText}</span>
          </div>
          ${bodyContent}
        `;
        
        // Add click handler based on notification type
        if (notif.type === 'assignment' && notif.assignmentId) {
          item.addEventListener("click", () => {
            // Mark as read
            if (!notif.read) {
              doc.ref.update({ read: true });
            }
            item.classList.add("read");
            
            // Fetch and show assignment details
            db.collection('assignments').doc(notif.assignmentId).get()
              .then(assignmentDoc => {
                if (assignmentDoc.exists) {
                  window.currentAssignment = assignmentDoc.data();
                  window.latestAssignmentId = notif.assignmentId;
                  openFullAssignmentModal(assignmentDoc.data());
                }
              })
              .catch(error => {
                console.error("Error fetching assignment:", error);
                alert("Could not load assignment details");
              });
          });
        } else {
          // Regular notification click handler
          item.addEventListener("click", () => {
            if (!notif.read) {
              doc.ref.update({ read: true });
            }
            item.classList.add("read");
          });
        }
        
        notificationList.appendChild(item);
      });
      
      // Update notification badge count
      const unreadCount = snapshot.docs.filter(doc => !doc.data().read).length;
      const notificationBadge = document.querySelector('.nav-icons li a[onclick="toggleCommentPanel()"] .notification-badge');
      if (notificationBadge) {
        if (unreadCount > 0) {
          notificationBadge.style.display = 'inline-block';
          notificationBadge.textContent = unreadCount;
        } else {
          notificationBadge.style.display = 'none';
        }
      }
    });
}

// ADD this new function to mark all notifications as read:
function markAllNotificationsRead() {
  const user = auth.currentUser;
  if (!user) return;
  
  db.collection('notifications')
    .where('menteeId', '==', user.uid)
    .where('read', '==', false)
    .get()
    .then((snapshot) => {
      const batch = db.batch();
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      return batch.commit();
    })
    .then(() => {
      console.log("All notifications marked as read");
      // Hide the badge
      const notificationBadge = document.querySelector('.nav-icons li a[onclick="toggleCommentPanel()"] .notification-badge');
      if (notificationBadge) {
        notificationBadge.style.display = 'none';
      }
    })
    .catch((error) => {
      console.error("Error marking notifications as read:", error);
    });
}

// Make the function globally available
window.markAllNotificationsRead = markAllNotificationsRead;

function showCongratsModal(results) {
  const modal = document.getElementById('congratsModal');
  const content = modal.querySelector('.cq-modal-fields');
  
  // Calculate percentage if not provided
  const percentage = results.percentage || Math.round((results.score / results.totalQuestions) * 100);
  
  // Build competency breakdown HTML
  let competenciesHTML = '';
  if (results.competencyStats) {
    competenciesHTML = `
      <div style="margin-top:1.25rem;">
        <b>Competency Breakdown:</b>
        ${Object.entries(results.competencyStats).map(([comp, stats]) => `
          <div style="margin-top:0.5rem;">
            <div>${comp}: ${stats.correct}/${stats.total} correct</div>
            <div style="height:6px; background:#e2e8f0; border-radius:3px; margin-top:2px;">
              <div style="height:100%; width:${(stats.correct/stats.total)*100}%; background:#4ade80; border-radius:3px;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  content.innerHTML = `
    <div style="text-align:center; padding:1rem;">
      <div style="font-size:1.25rem; margin-bottom:1rem;">
        ${results.message || 'Quiz Completed!'}
      </div>
      <div style="font-size:0.9rem; color:#666; margin-bottom:0.5rem;">
        For completing: <strong>${results.assignmentName || 'the quiz'}</strong>
      </div>
      
      ${competenciesHTML}
    </div>
  `;
  
  modal.style.display = 'block';
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 }
  });
}


function closeCongratsModal(docId) {
  document.getElementById('congratsModal').style.display = 'none';
  db.collection('assignments').doc(docId).update({
        status: "complete"
    }).catch(error => {
        console.error("Error updating assignment status:", error);
    });
}

// ... rest of your code ...

  console.log("🔥 Firebase initialized and script loaded successfully");

 function toggleCommentPanel() {
  document.getElementById("commentPanel").classList.toggle("active");
}

window.toggleCommentPanel = toggleCommentPanel;

 
// Add these functions to your existing comprehensive script

// ============ NOTIFICATION LOADING SYSTEM ============

// Add this after your Firebase initialization
let notificationSystem = {
  notifications: [],
  initialized: false
};

// Add this function to load notifications when user is authenticated
async function loadUserNotifications(userId) {
  if (!userId || !db) return;
  
  try {
    // Load from Firestore
    const notificationsRef = db.collection(`users/${userId}/notifications`);
    const snapshot = await notificationsRef
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    
    const list = document.getElementById("notificationList");
    if (!list) {
      console.log("Notification list element not found");
      return;
    }
    
    // Clear existing notifications
    list.innerHTML = '';
    notificationSystem.notifications = [];
    
    if (snapshot.empty) {
      // Show a default message if no notifications
      list.innerHTML = `
        <div class="notification-item">
          <div class="notification-body" style="text-align: center; color: #666;">
            No notifications yet
          </div>
        </div>
      `;
      return;
    }
    
    // Render notifications
    snapshot.forEach(doc => {
      const data = doc.data();
      const notification = {
        id: doc.id,
        title: data.title || 'Notification',
        description: data.description || data.message || '',
        timestamp: data.timestamp?.toDate() || new Date(),
        read: data.read || false,
        onClick: data.clickAction || null
      };
      
      notificationSystem.notifications.push(notification);
      renderNotificationItem(notification);
    });
    
    updateNotificationBadge();
    console.log(`Loaded ${notificationSystem.notifications.length} notifications`);
    
  } catch (error) {
    console.error("Error loading notifications:", error);
    const list = document.getElementById("notificationList");
    if (list) {
      list.innerHTML = `
        <div class="notification-item">
          <div class="notification-body" style="text-align: center; color: #dc3545;">
            Error loading notifications
          </div>
        </div>
      `;
    }
  }
}

// Function to render a single notification item
function renderNotificationItem(notification) {
  const list = document.getElementById("notificationList");
  if (!list) return;
  
  const item = document.createElement("div");
  item.className = `notification-item ${notification.read ? 'read' : ''}`;
  item.dataset.notificationId = notification.id;
  
  item.innerHTML = `
    <div class="notification-header">
      <strong>${notification.title}</strong>
      <span class="notification-time">${formatNotificationTime(notification.timestamp)}</span>
    </div>
    <div class="notification-body">${notification.description}</div>
  `;
  
  if (notification.onClick) {
    item.addEventListener("click", () => {
      eval(notification.onClick); // Be careful with this - better to use a function registry
      markNotificationAsRead(notification.id);
    });
    item.style.cursor = 'pointer';
  }
  
  list.appendChild(item);
}

// Function to format notification timestamp
function formatNotificationTime(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now - time;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return time.toLocaleDateString();
}

// Function to update notification badge
function updateNotificationBadge() {
  const unreadCount = notificationSystem.notifications.filter(n => !n.read).length;
  const badges = document.querySelectorAll('.notification-badge');
  
  badges.forEach(badge => {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  });
}

// Function to mark notification as read
async function markNotificationAsRead(notificationId) {
  const userId = await getCurrentUserId();
  if (!userId || !db) return;
  
  try {
    await db.doc(`users/${userId}/notifications/${notificationId}`).update({
      read: true
    });
    
    // Update local state
    const notification = notificationSystem.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
    
    // Update UI
    const item = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (item) {
      item.classList.add('read');
    }
    
    updateNotificationBadge();
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

// Enhanced showNotification function that saves to Firebase
async function showNotification(title, description, onClick = null) {
  const userId = await getCurrentUserId();
  
  // Show immediately in UI
  const list = document.getElementById("notificationList");
  if (list) {
    const item = document.createElement("div");
    item.className = "notification-item";
    item.innerHTML = `
      <div class="notification-header">
        <strong>${title}</strong>
        <span class="notification-time">Just now</span>
      </div>
      <div class="notification-body">${description}</div>
    `;

    if (onClick) {
      item.addEventListener("click", () => {
        onClick();
        item.classList.add("read");
      });
      item.style.cursor = 'pointer';
    }

    list.prepend(item);
  }
  
  // Save to Firebase if user is authenticated
  if (userId && db) {
    try {
      await db.collection(`users/${userId}/notifications`).add({
        title,
        description,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        read: false,
        clickAction: onClick ? onClick.toString() : null
      });
      console.log("Notification saved to Firebase");
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  }
  
  updateNotificationBadge();
}

// Add this to your startAppWithUserId function
async function startAppWithUserId(userId) {
  mentorId = userId;
  console.log("Starting app with Firebase Auth UID:", userId);

  // Load notifications first
  await loadUserNotifications(userId);

  // Your existing code...
  db.collection(`users/${userId}/trainingProgress`).onSnapshot((snap) => {
    const progress = {};
    snap.forEach(doc => progress[doc.id] = doc.data().status);
    lastProgress = progress;
    
    const activeTab = document.querySelector(".tab.active");
    if (activeTab && tabs.length >= 2 && activeTab === tabs[1]) {
      renderTrainingGrid(progress, true);
    } else {
      renderTrainingGrid(progress, false);
    }
  });

  // Set up real-time notification listener
  db.collection(`users/${userId}/notifications`)
    .orderBy('timestamp', 'desc')
    .limit(20)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          // Only add if it's a new notification (not from initial load)
          if (notificationSystem.initialized) {
            const data = change.doc.data();
            const notification = {
              id: change.doc.id,
              title: data.title || 'Notification',
              description: data.description || data.message || '',
              timestamp: data.timestamp?.toDate() || new Date(),
              read: data.read || false
            };
            
            // Add to beginning of array and render
            notificationSystem.notifications.unshift(notification);
            const list = document.getElementById("notificationList");
            if (list && list.children.length > 0 && list.children[0].textContent.includes("No notifications")) {
              list.innerHTML = ''; // Clear the "no notifications" message
            }
            renderNotificationItem(notification);
            updateNotificationBadge();
          }
        }
      });
      notificationSystem.initialized = true;
    });

  showGridView();
}

// Test function to create sample notifications (remove in production)
async function createTestNotifications() {
  const userId = await getCurrentUserId();
  if (!userId) return;
  
  await showNotification("Welcome to CertQuest!", "Your dashboard is ready to use");
  await showNotification("Training Available", "New business management modules are available");
  await showNotification("XP Earned", "You earned 10 XP for completing a module!");
}
